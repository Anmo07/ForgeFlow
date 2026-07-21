"""Script to dynamically teardown test organization data for E2E tests."""
import os
import sys

# Add backend directory or parent directory to Python path
script_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(script_dir, ".."))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from dotenv import load_dotenv
for env_file in [os.path.join(parent_dir, "..", ".env"), os.path.join(parent_dir, ".env")]:
    if os.path.exists(env_file):
        load_dotenv(env_file, override=True)

from app.common.database import SessionLocal
from sqlalchemy import text


def teardown_test_org(org_id, user_id):
    db = SessionLocal()
    try:
        # Delete child records
        db.execute(text("DELETE FROM memberships WHERE organization_id = :org_id"), {"org_id": org_id})
        db.execute(text("DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE organization_id = :org_id)"), {"org_id": org_id})
        db.execute(text("DELETE FROM projects WHERE organization_id = :org_id"), {"org_id": org_id})
        db.execute(text("DELETE FROM invoice_line_items WHERE invoice_id IN (SELECT id FROM invoices WHERE organization_id = :org_id)"), {"org_id": org_id})
        db.execute(text("DELETE FROM invoices WHERE organization_id = :org_id"), {"org_id": org_id})
        db.execute(text("DELETE FROM deals WHERE organization_id = :org_id"), {"org_id": org_id})
        db.execute(text("DELETE FROM leads WHERE organization_id = :org_id"), {"org_id": org_id})
        db.execute(text("DELETE FROM clients WHERE organization_id = :org_id"), {"org_id": org_id})
        db.execute(text("DELETE FROM security_events WHERE organization_id = :org_id"), {"org_id": org_id})
        db.execute(text("DELETE FROM activity_logs WHERE organization_id = :org_id"), {"org_id": org_id})
        db.execute(text("DELETE FROM organizations WHERE id = :org_id"), {"org_id": org_id})
        db.execute(text("DELETE FROM users WHERE id = :user_id"), {"user_id": user_id})
        db.commit()
        print("Teardown completed successfully")
    except Exception as e:
        db.rollback()
        print(f"Error during teardown: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)
    teardown_test_org(int(sys.argv[1]), int(sys.argv[2]))
