from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL

engine_args = {"echo": True, "future": True}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SoftDeleteMixin:
    deleted_at = Column(DateTime(timezone=True), nullable=True)