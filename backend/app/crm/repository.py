from sqlalchemy.orm import Session
from typing import List, Optional
from .models import Client, Lead, Deal

class ClientRepository:

    def list_by_org(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[Client]:
        return db.query(Client).filter(Client.organization_id == org_id).order_by(Client.created_at.desc()).offset(offset).limit(limit).all()

    def get_by_id(self, db: Session, client_id: int, org_id: int) -> Optional[Client]:
        return db.query(Client).filter(Client.id == client_id, Client.organization_id == org_id).first()

    def create(self, db: Session, org_id: int, **kwargs) -> Client:
        client = Client(organization_id=org_id, **kwargs)
        db.add(client)
        db.commit()
        db.refresh(client)
        return client

    def update(self, db: Session, client: Client, **kwargs) -> Client:
        for key, value in kwargs.items():
            if value is not None:
                setattr(client, key, value)
        db.commit()
        db.refresh(client)
        return client

    def delete(self, db: Session, client: Client) -> None:
        db.delete(client)
        db.commit()

class LeadRepository:

    def list_by_org(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[Lead]:
        return db.query(Lead).filter(Lead.organization_id == org_id).order_by(Lead.created_at.desc()).offset(offset).limit(limit).all()

    def get_by_id(self, db: Session, lead_id: int, org_id: int) -> Optional[Lead]:
        return db.query(Lead).filter(Lead.id == lead_id, Lead.organization_id == org_id).first()

    def create(self, db: Session, org_id: int, **kwargs) -> Lead:
        lead = Lead(organization_id=org_id, **kwargs)
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead

    def update(self, db: Session, lead: Lead, **kwargs) -> Lead:
        for key, value in kwargs.items():
            if value is not None:
                setattr(lead, key, value)
        db.commit()
        db.refresh(lead)
        return lead

    def delete(self, db: Session, lead: Lead) -> None:
        db.delete(lead)
        db.commit()

class DealRepository:

    def list_by_org(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[Deal]:
        return db.query(Deal).filter(Deal.organization_id == org_id).order_by(Deal.created_at.desc()).offset(offset).limit(limit).all()

    def get_by_id(self, db: Session, deal_id: int, org_id: int) -> Optional[Deal]:
        return db.query(Deal).filter(Deal.id == deal_id, Deal.organization_id == org_id).first()

    def create(self, db: Session, org_id: int, **kwargs) -> Deal:
        deal = Deal(organization_id=org_id, **kwargs)
        db.add(deal)
        db.commit()
        db.refresh(deal)
        return deal

    def update(self, db: Session, deal: Deal, **kwargs) -> Deal:
        for key, value in kwargs.items():
            setattr(deal, key, value)
        db.commit()
        db.refresh(deal)
        return deal

    def delete(self, db: Session, deal: Deal) -> None:
        db.delete(deal)
        db.commit()