import re
import uuid
import base64
import logging
from sqlalchemy.orm import Session
from app.common.celery_app import celery_app
from app.common.database import SessionLocal
from app.common.minio import minio_client
from app.organizations.models import Organization
from app.projects.models import Project, Task
from app.attachments.models import Attachment
from app.auth.sso_models import SSOConfiguration
from app.billing.models import BillingContract

logger = logging.getLogger("forgeflow.ingress")
BUCKET_NAME = "forgeflow-attachments"
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.zip'}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

@celery_app.task
def process_inbound_email_task(payload: dict):
    """Processes inbound email webhook payloads, maps them to client organizations,
    creates Tasks, and streams attachments through the quarantine scanning pipeline.
    """
    db = SessionLocal()
    try:
        from_value = payload.get("from", "")
        # Extract email from e.g. "John Doe <john@client.com>"
        email_match = re.search(r'[\w\.-]+@[\w\.-]+', from_value)
        sender_email = email_match.group(0) if email_match else from_value
        domain = sender_email.split("@")[-1].lower() if "@" in sender_email else ""
        
        if not domain:
            logger.error("Could not extract email domain from payload.")
            return "missing_domain"

        # 1. Lookup matching tenant client organization
        sso_config = db.query(SSOConfiguration).filter(
            SSOConfiguration.email_domain == domain,
            SSOConfiguration.is_active == True
        ).first()
        
        client_org = None
        if sso_config:
            client_org = db.query(Organization).filter(Organization.id == sso_config.organization_id).first()
            
        if not client_org:
            domain_slug = domain.split(".")[0]
            client_org = db.query(Organization).filter(
                (Organization.slug == domain_slug) |
                (Organization.slug == domain) |
                (Organization.website.contains(domain))
            ).first()
            
        if not client_org:
            # Provision a new client organization for this domain
            domain_slug = domain.split(".")[0]
            client_org = Organization(
                name=domain_slug.capitalize(),
                slug=domain_slug,
                website=f"https://{domain}",
                is_active=True
            )
            db.add(client_org)
            db.commit()
            db.refresh(client_org)
            logger.info(f"Provisioned new client organization: {client_org.name} (ID: {client_org.id})")

        client_org_id = client_org.id

        # 2. Determine the MSP organization ID (organization_id)
        # Search active contracts for this client first
        contract = db.query(BillingContract).filter(
            BillingContract.client_organization_id == client_org_id,
            BillingContract.is_active == True
        ).first()
        
        if contract:
            msp_org_id = contract.organization_id
        else:
            # Fallback to the first organization (MSP owner) in the database
            first_org = db.query(Organization).order_by(Organization.id.asc()).first()
            msp_org_id = first_org.id if first_org else client_org_id

        # 3. Identify or provision the default target project
        project = db.query(Project).filter(
            Project.organization_id == msp_org_id,
            Project.client_organization_id == client_org_id,
            Project.name == "Inbound Support"
        ).first()
        
        if not project:
            project = Project(
                organization_id=msp_org_id,
                client_organization_id=client_org_id,
                name="Inbound Support",
                description="Auto-generated support project for inbound emails",
                project_type="Retainer_SLA",
                status="active"
            )
            db.add(project)
            db.commit()
            db.refresh(project)
            logger.info(f"Provisioned default target project 'Inbound Support' for organization {client_org.name}")

        # 4. Construct a new Task
        task = Task(
            project_id=project.id,
            client_organization_id=client_org_id,
            title=payload.get("subject", "Inbound Support Task"),
            description=payload.get("text") or payload.get("body") or payload.get("html", ""),
            status="todo",
            priority="medium"
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        logger.info(f"Created task '{task.title}' (ID: {task.id}) in project '{project.name}'")

        # 5. Process attachments
        attachments = payload.get("attachments", [])
        for att in attachments:
            filename = att.get("filename", "")
            if not filename:
                continue
                
            content_str = att.get("content", "")
            content_type = att.get("content_type") or "application/octet-stream"
            
            # Decode file bytes
            try:
                file_bytes = base64.b64decode(content_str)
            except Exception:
                file_bytes = content_str.encode("utf-8") if isinstance(content_str, str) else b""
                
            file_size = len(file_bytes)
            if file_size > MAX_FILE_SIZE:
                logger.warning(f"Attachment {filename} exceeds maximum size limit. Skipping.")
                continue
                
            # Verify file extension
            import os
            _, ext = os.path.splitext(filename.lower())
            if ext not in ALLOWED_EXTENSIONS:
                logger.warning(f"Attachment {filename} has an unsupported file extension. Skipping.")
                continue
                
            file_uuid = str(uuid.uuid4())
            quarantine_path = f"quarantine/{client_org_id}/{file_uuid}/{filename}"
            
            # Stream/upload to MinIO quarantine path
            success = minio_client.upload_bytes(
                bucket_name=BUCKET_NAME,
                object_name=quarantine_path,
                data=file_bytes,
                content_type=content_type
            )
            
            if success:
                # Save attachment record in DB (status quarantined)
                attachment = Attachment(
                    organization_id=msp_org_id,  # MSP owner organization
                    project_id=project.id,
                    task_id=task.id,
                    filename=filename,
                    file_size=file_size,
                    content_type=content_type,
                    storage_path=quarantine_path,
                    status='quarantined'
                )
                db.add(attachment)
                db.commit()
                db.refresh(attachment)
                
                # Trigger the virus scanning/promotion Celery task
                from app.attachments.tasks import scan_and_promote_attachment_task
                scan_and_promote_attachment_task.delay(attachment.id)
                logger.info(f"Uploaded attachment {filename} to quarantine (Attachment ID: {attachment.id})")
            else:
                logger.error(f"Failed to upload attachment {filename} to MinIO.")
                
        return f"task_created_{task.id}"
    except Exception as e:
        logger.error(f"Error in process_inbound_email_task: {e}", exc_info=True)
        db.rollback()
        raise e
    finally:
        db.close()
