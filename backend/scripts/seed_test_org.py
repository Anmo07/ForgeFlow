"""Script to dynamically seed an isolated test organization and user for E2E tests."""
import os
import sys
import json

# Add backend directory or parent directory to Python path
script_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(script_dir, ".."))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from app.common.database import SessionLocal
from app.organizations.models import Organization
from app.auth.models import User
from app.memberships.models import Membership
from app.roles.models import Role
from app.common.security import get_password_hash


def seed_test_org(org_name, admin_email, admin_password):
    db = SessionLocal()
    try:
        # Create Org
        slug = org_name.lower().replace(" ", "-")
        # Ensure unique slug
        import random
        slug_suffix = str(random.randint(1000, 9999))
        slug = f"{slug}-{slug_suffix}"
        
        org = Organization(name=f"{org_name} {slug_suffix}", slug=slug, sso_enabled=False)
        db.add(org)
        db.flush()
        
        # Create User
        hashed_password = get_password_hash(admin_password)
        user = User(
            email=admin_email,
            hashed_password=hashed_password,
            full_name="Test Admin",
            is_active=True,
            is_verified=True,
            is_external=False
        )
        db.add(user)
        db.flush()
        
        # Get or create Role (system Admin role)
        role = db.query(Role).filter(Role.name == "Admin", Role.is_system == True).first()
        if not role:
            # Fallback to get any role or create it
            role = Role(name="Admin", is_system=True)
            db.add(role)
            db.flush()
            
        # Create Membership
        mem = Membership(
            user_id=user.id,
            organization_id=org.id,
            role_id=role.id,
            status="active",
            is_external=False
        )
        db.add(mem)
        db.commit()
        
        print(json.dumps({"org_id": org.id, "user_id": user.id, "org_name": org.name, "email": user.email}))
    except Exception as e:
        db.rollback()
        print(json.dumps({"error": str(e)}))
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(1)
    seed_test_org(sys.argv[1], sys.argv[2], sys.argv[3])
