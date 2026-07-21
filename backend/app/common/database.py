import os
from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL

engine_args = {"echo": os.getenv("DB_ECHO", "False").lower() in ("true", "1"), "future": True}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args.update({
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
        "pool_timeout": float(os.getenv("DB_POOL_TIMEOUT", "30.0")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),
        "pool_pre_ping": os.getenv("DB_POOL_PRE_PING", "True").lower() in ("true", "1", "yes")
    })
    engine_args["connect_args"] = {
        "options": f"-c statement_timeout={int(os.getenv('DB_STATEMENT_TIMEOUT', '10')) * 1000}"
    }

engine = create_engine(DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SoftDeleteMixin:
    deleted_at = Column(DateTime(timezone=True), nullable=True)


from sqlalchemy import event, text
from sqlalchemy.orm import Session

@event.listens_for(Session, 'after_begin')
def set_postgresql_rls_context(session, transaction, connection):
    if connection.dialect.name == 'postgresql':
        from .tenant_filtering import current_org_id
        org_id = current_org_id.get()
        if org_id is not None:
            connection.execute(text("SET LOCAL app.current_org_id = :org_id"), {"org_id": str(org_id)})