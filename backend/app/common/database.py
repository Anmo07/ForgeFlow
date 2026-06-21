from sqlalchemy import create_engine, Column, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL
engine = create_engine(DATABASE_URL, echo=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SoftDeleteMixin:
    deleted_at = Column(DateTime(timezone=True), nullable=True)