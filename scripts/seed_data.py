import os
import sys
import random
from datetime import datetime, timedelta
import hashlib
from faker import Faker

# Add backend directory or parent directory to Python path
script_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(script_dir, ".."))
backend_dir = os.path.abspath(os.path.join(script_dir, "..", "backend"))

if parent_dir not in sys.path:
    sys.path.append(parent_dir)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.common.database import SessionLocal, Base, engine

from app.auth.models import User
from app.organizations.models import Organization
from app.roles.models import Role
from app.permissions.models import Permission
from app.memberships.models import Membership
from app.sessions.models import Session
from app.activity_logs.models import ActivityLog
from app.api_keys.models import APIKey
from app.projects.models import Project, Task
from app.crm.models import Client, Lead, Deal
from app.invoices.models import Invoice, InvoiceLineItem
from app.common.security import get_password_hash

fake = Faker()

def seed():
    print("Initializing Database...")
    # Drop all and recreate to ensure a fresh clean seed state
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Create Permissions
        print("Seeding Permissions...")
        perm_names = [
            "project:create", "project:update", "project:delete", "project:view",
            "client:create", "client:update", "client:delete",
            "invoice:create", "invoice:view", "invoice:delete",
            "user:invite", "user:remove", "settings:update", "analytics:view"
        ]
        permissions = []
        for name in perm_names:
            perm = Permission(name=name, description=f"Allows {name.replace(':', ' ')}")
            db.add(perm)
            permissions.append(perm)
        db.commit()

        # 2. Create Default Roles
        print("Seeding Roles...")
        role_definitions = {
            "Owner": perm_names,  # All permissions
            "Admin": ["project:create", "project:update", "project:view", "client:create", "client:update", "invoice:create", "invoice:view", "user:invite", "settings:update", "analytics:view"],
            "Manager": ["project:create", "project:update", "project:view", "client:create", "client:update", "invoice:create", "invoice:view", "analytics:view"],
            "Member": ["project:create", "project:update", "project:view", "client:create", "invoice:view"],
            "Client": ["project:view", "invoice:view"],
            "Viewer": ["project:view", "invoice:view", "analytics:view"]
        }
        roles = {}
        for role_name, allowed_perms in role_definitions.items():
            role = Role(name=role_name, description=f"System {role_name} role", is_system=True)
            # Link permissions
            role_perms = [p for p in permissions if p.name in allowed_perms]
            role.permissions = role_perms
            db.add(role)
            roles[role_name] = role
        db.commit()

        # 3. Create Organizations
        print("Seeding Organizations...")
        org_names = [
            ("Acme Digital Agency", "acme-digital", "Marketing"),
            ("NovaTech Solutions", "novatech", "Technology"),
            ("Vertex Consulting", "vertex-consulting", "Professional Services"),
            ("BrightScale Marketing", "brightscale", "Marketing"),
            ("Apex Systems", "apex-systems", "Technology")
        ]
        organizations = []
        for name, slug, industry in org_names:
            org = Organization(
                name=name,
                slug=slug,
                industry=industry,
                company_size=random.choice(["1-10", "11-50", "51-200", "201-500"]),
                website=f"https://{slug}.com",
                description=f"Seeded {name} business profile."
            )
            db.add(org)
            organizations.append(org)
        db.commit()

        # 4. Create 50 Users
        print("Seeding Users...")
        users = []
        # Pre-seed one admin user
        admin_pwd_hash = get_password_hash("password123")
        admin_user = User(
            email="admin@forgeflow.com",
            hashed_password=admin_pwd_hash,
            full_name="System Admin",
            is_active=True
        )
        db.add(admin_user)
        users.append(admin_user)

        for _ in range(49):
            user = User(
                email=fake.unique.email(),
                hashed_password=admin_pwd_hash,  # Reuse hash to speed up seeding
                full_name=fake.name(),
                is_active=True
            )
            db.add(user)
            users.append(user)
        db.commit()

        # 5. Create Memberships
        print("Seeding Memberships...")
        # Add admin to all organizations as Owner
        for org in organizations:
            mem = Membership(
                user_id=admin_user.id,
                organization_id=org.id,
                role_id=roles["Owner"].id,
                status="active"
            )
            db.add(mem)

        # Distribute remaining users to organizations
        role_list = list(roles.values())
        for user in users[1:]:
            # Assign user to 1 or 2 random organizations
            assigned_orgs = random.sample(organizations, k=random.choice([1, 2]))
            for org in assigned_orgs:
                mem = Membership(
                    user_id=user.id,
                    organization_id=org.id,
                    role_id=random.choice(role_list).id,
                    status=random.choice(["active", "active", "active", "invited", "suspended"])
                )
                db.add(mem)
        db.commit()

        # 6. Create Projects (100) & Tasks (500)
        print("Seeding Projects & Tasks...")
        projects = []
        for i in range(100):
            org = random.choice(organizations)
            proj = Project(
                organization_id=org.id,
                name=f"Project {fake.catch_phrase()}",
                description=fake.paragraph(nb_sentences=3)
            )
            db.add(proj)
            projects.append(proj)
        db.commit()

        for _ in range(500):
            proj = random.choice(projects)
            task = Task(
                project_id=proj.id,
                title=f"Task: {fake.bs().capitalize()}",
                description=fake.sentence(),
                status=random.choice(["todo", "in_progress", "done"])
            )
            db.add(task)
        db.commit()

        # 7. Create Clients (75), Leads (50), & Deals (25)
        print("Seeding CRM Records...")
        clients = []
        for _ in range(75):
            org = random.choice(organizations)
            client = Client(
                organization_id=org.id,
                name=fake.company(),
                email=fake.company_email(),
                phone=fake.phone_number(),
                company=fake.company()
            )
            db.add(client)
            clients.append(client)
        db.commit()

        leads = []
        for _ in range(50):
            client = random.choice(clients)
            lead = Lead(
                organization_id=client.organization_id,
                client_id=client.id,
                status=random.choice(["new", "contacted", "qualified", "lost"]),
                value=round(random.uniform(500, 50000), 2)
            )
            db.add(lead)
            leads.append(lead)
        db.commit()

        for _ in range(25):
            lead = random.choice(leads)
            deal = Deal(
                organization_id=lead.organization_id,
                lead_id=lead.id,
                value=lead.value,
                status=random.choice(["won", "lost", "open"]),
                closed_at=datetime.utcnow() - timedelta(days=random.randint(1, 60))
            )
            db.add(deal)
        db.commit()

        # 8. Create Invoices (30) with Line Items
        print("Seeding Invoices...")
        invoices = []
        for idx in range(1, 31):
            client = random.choice(clients)
            created_by = admin_user.id
            org_id = client.organization_id
            year = datetime.utcnow().year
            invoice_num = f"INV-{year}-{org_id:02d}-{idx:03d}"
            
            issue_date = (datetime.utcnow() - timedelta(days=random.randint(1, 60))).date()
            due_date = issue_date + timedelta(days=random.randint(7, 30))
            status = random.choice(["draft", "sent", "paid", "overdue", "cancelled"])
            
            invoice = Invoice(
                organization_id=org_id,
                client_id=client.id,
                invoice_number=invoice_num,
                issue_date=issue_date,
                due_date=due_date,
                status=status,
                notes=fake.sentence(),
                created_by=created_by
            )
            
            subtotal = 0.0
            for _ in range(random.randint(1, 4)):
                qty = float(random.randint(1, 10))
                price = round(random.uniform(50, 1500), 2)
                amt = qty * price
                subtotal += amt
                line_item = InvoiceLineItem(
                    description=fake.catch_phrase(),
                    quantity=qty,
                    unit_price=price,
                    amount=amt
                )
                invoice.line_items.append(line_item)
            
            tax_rate = random.choice([0.0, 5.0, 10.0, 15.0, 18.0])
            tax_amt = round(subtotal * (tax_rate / 100.0), 2)
            total = round(subtotal + tax_amt, 2)
            
            invoice.subtotal = round(subtotal, 2)
            invoice.tax_rate = tax_rate
            invoice.tax_amount = tax_amt
            invoice.total = total
            
            db.add(invoice)
            invoices.append(invoice)
        db.commit()

        # 9. Create Sessions (active user sessions)
        print("Seeding Sessions...")
        for user in random.sample(users, k=30):
            token_val = f"token_{fake.uuid4()}"
            token_hash = hashlib.sha256(token_val.encode()).hexdigest()
            session = Session(
                user_id=user.id,
                refresh_token_hash=token_hash,
                device_name=random.choice(["MacBook Pro", "Dell XPS", "ThinkPad T14", "iPhone 15", "Galaxy S24"]),
                browser=random.choice(["Chrome", "Safari", "Firefox", "Edge"]),
                operating_system=random.choice(["macOS", "Windows", "Linux", "iOS", "Android"]),
                ip_address=fake.ipv4(),
                expires_at=datetime.utcnow() + timedelta(days=30),
                revoked=False
            )
            db.add(session)
        db.commit()

        # 9. Create API Keys (audit items)
        print("Seeding API Keys...")
        for org in organizations:
            secrets_token = fake.uuid4().replace("-", "")
            hashed_key = hashlib.sha256(f"ff_live_{secrets_token}".encode()).hexdigest()
            api_key = APIKey(
                organization_id=org.id,
                name="Production Server Access",
                key_prefix="ff_live_",
                hashed_key=hashed_key,
                permissions=["project:view", "client:view"],
                created_by=admin_user.id,
                revoked=False
            )
            db.add(api_key)
        db.commit()

        # 10. Create Activity Logs
        print("Seeding Activity Logs...")
        actions = [
            ("User Registered", "user", 1),
            ("Organization Created", "organization", 1),
            ("Member Invited", "membership", 1),
            ("Role Updated", "role", 1),
            ("Permission Assigned", "permission", 1),
            ("Session Revoked", "session", 1)
        ]
        for _ in range(150):
            org = random.choice(organizations)
            user = random.choice(users)
            action, entity_type, entity_id = random.choice(actions)
            log = ActivityLog(
                organization_id=org.id,
                user_id=user.id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                metadata_json={"ip": fake.ipv4(), "details": f"Logged action '{action}' on {entity_type} {entity_id}"},
                ip_address=fake.ipv4(),
                user_agent=fake.user_agent()
            )
            db.add(log)
        db.commit()

        print("\nDatabase Seeding Completed Successfully! Summary:")
        print(f" - Permissions: {len(perm_names)}")
        print(f" - Roles: {len(role_definitions)}")
        print(f" - Organizations: {len(organizations)}")
        print(f" - Users: {len(users)}")
        print(f" - Projects: 100")
        print(f" - Tasks: 500")
        print(f" - CRM Clients: 75")
        print(f" - CRM Leads: 50")
        print(f" - CRM Deals: 25")
        print(f" - Invoices: 30")
        print(f" - Active Sessions, API Keys, and Activity Logs fully seeded.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
