import os
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from typing import Optional
from app.common.minio import minio_client
from .models import Attachment
from app.events.event_bus import publish_event
from app.auth.models import User

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.zip'}
MAX_FILE_SIZE = 25 * 1024 * 1024 # 25 MB
BUCKET_NAME = "forgeflow-attachments"

class AttachmentService:

    def _get_actor_name(self, db: Session, user_id: int) -> str:
        if not user_id:
            return "System"
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return user.full_name or user.email
        return "System"

    def upload_file(
        self,
        db: Session,
        org_id: int,
        upload_file: UploadFile,
        user_id: int = None,
        project_id: int = None,
        task_id: int = None
    ) -> Attachment:
        filename = upload_file.filename
        # Validate extension
        _, ext = os.path.splitext(filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
            
        # Read data and validate size
        file_bytes = upload_file.file.read()
        file_size = len(file_bytes)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File exceeds maximum allowed size of 25MB"
            )
            
        file_uuid = str(uuid.uuid4())
        quarantine_path = f"quarantine/{org_id}/{file_uuid}/{filename}"
        
        # Upload to MinIO quarantine path
        success = minio_client.upload_bytes(
            bucket_name=BUCKET_NAME,
            object_name=quarantine_path,
            data=file_bytes,
            content_type=upload_file.content_type
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to storage"
            )
            
        # Create Attachment record in DB (initially quarantined)
        attachment = Attachment(
            organization_id=org_id,
            user_id=user_id,
            project_id=project_id,
            task_id=task_id,
            filename=filename,
            file_size=file_size,
            content_type=upload_file.content_type,
            storage_path=quarantine_path,
            status='quarantined'
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        
        # Publish upload event
        actor_name = self._get_actor_name(db, user_id)
        publish_event(
            db,
            event_type="attachment:uploaded",
            organization_id=org_id,
            user_id=user_id,
            entity_type="Attachment",
            entity_id=attachment.id,
            payload={"target_name": filename, "actor_name": actor_name}
        )
        db.commit()
        
        # Trigger scanning task
        from .tasks import scan_and_promote_attachment_task
        scan_and_promote_attachment_task.delay(attachment.id)
        
        return attachment

    def get_download_url(self, db: Session, attachment_id: int, org_id: int, user_id: int = None) -> str:
        attachment = db.query(Attachment).filter(
            Attachment.id == attachment_id,
            Attachment.organization_id == org_id
        ).first()
        if not attachment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found"
            )
            
        if attachment.status != 'active':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File is unavailable (Status: {attachment.status})"
            )
            
        # Generate presigned URL with no-cache Cache-Control headers
        from datetime import timedelta
        try:
            url = minio_client.client.presigned_get_object(
                bucket_name=BUCKET_NAME,
                object_name=attachment.storage_path,
                expires=timedelta(minutes=15),
                response_headers={
                    'response-cache-control': 'no-store, no-cache, must-revalidate, max-age=0'
                }
            )
            return url
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate download link: {e}"
            )

    def delete_attachment(self, db: Session, attachment_id: int, org_id: int, user_id: int = None) -> None:
        attachment = db.query(Attachment).filter(
            Attachment.id == attachment_id,
            Attachment.organization_id == org_id
        ).first()
        if not attachment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found"
            )
            
        filename = attachment.filename
        storage_path = attachment.storage_path
        
        # Delete from MinIO
        minio_client.delete_file(BUCKET_NAME, storage_path)
        
        # Delete from DB
        db.delete(attachment)
        
        actor_name = self._get_actor_name(db, user_id)
        publish_event(
            db,
            event_type="attachment:deleted",
            organization_id=org_id,
            user_id=user_id,
            entity_type="Attachment",
            entity_id=attachment_id,
            payload={"target_name": filename, "actor_name": actor_name}
        )
        db.commit()
