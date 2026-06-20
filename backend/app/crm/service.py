from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from .repository import ClientRepository, LeadRepository, DealRepository
from .schema import ClientCreate, ClientUpdate, ClientResponse, LeadCreate, LeadUpdate, LeadResponse, DealCreate, DealUpdate, DealResponse, CRMMetrics

class CRMService:

    def __init__(self):
        self.client_repo = ClientRepository()
        self.lead_repo = LeadRepository()
        self.deal_repo = DealRepository()

    def list_clients(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[ClientResponse]:
        clients = self.client_repo.list_by_org(db, org_id, limit=limit, offset=offset)
        return [ClientResponse.model_validate(c) for c in clients]

    def get_client(self, db: Session, client_id: int, org_id: int) -> ClientResponse:
        client = self.client_repo.get_by_id(db, client_id, org_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Client not found')
        return ClientResponse.model_validate(client)

    def create_client(self, db: Session, org_id: int, data: ClientCreate) -> ClientResponse:
        client = self.client_repo.create(db, org_id, name=data.name, email=data.email, phone=data.phone, company=data.company)
        return ClientResponse.model_validate(client)

    def update_client(self, db: Session, client_id: int, org_id: int, data: ClientUpdate) -> ClientResponse:
        client = self.client_repo.get_by_id(db, client_id, org_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Client not found')
        updates = data.model_dump(exclude_unset=True)
        client = self.client_repo.update(db, client, **updates)
        return ClientResponse.model_validate(client)

    def delete_client(self, db: Session, client_id: int, org_id: int) -> None:
        client = self.client_repo.get_by_id(db, client_id, org_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Client not found')
        self.client_repo.delete(db, client)

    def list_leads(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[LeadResponse]:
        leads = self.lead_repo.list_by_org(db, org_id, limit=limit, offset=offset)
        results = []
        for lead in leads:
            data = {c.name: getattr(lead, c.name) for c in lead.__table__.columns}
            if lead.client:
                data['client_name'] = lead.client.name
                data['client_company'] = lead.client.company
                data['client_email'] = lead.client.email
                data['client_phone'] = lead.client.phone
            results.append(LeadResponse(**data))
        return results

    def create_lead(self, db: Session, org_id: int, data: LeadCreate) -> LeadResponse:
        client = self.client_repo.get_by_id(db, data.client_id, org_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Client not found in this organization')
        lead = self.lead_repo.create(db, org_id, client_id=data.client_id, status=data.status, value=data.value, source=data.source, assigned_to=data.assigned_to)
        lead_data = {c.name: getattr(lead, c.name) for c in lead.__table__.columns}
        lead_data['client_name'] = client.name
        lead_data['client_company'] = client.company
        lead_data['client_email'] = client.email
        lead_data['client_phone'] = client.phone
        return LeadResponse(**lead_data)

    def update_lead(self, db: Session, lead_id: int, org_id: int, data: LeadUpdate) -> LeadResponse:
        lead = self.lead_repo.get_by_id(db, lead_id, org_id)
        if not lead:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Lead not found')
        updates = data.model_dump(exclude_unset=True)
        lead = self.lead_repo.update(db, lead, **updates)
        lead_data = {c.name: getattr(lead, c.name) for c in lead.__table__.columns}
        if lead.client:
            lead_data['client_name'] = lead.client.name
            lead_data['client_company'] = lead.client.company
            lead_data['client_email'] = lead.client.email
            lead_data['client_phone'] = lead.client.phone
        return LeadResponse(**lead_data)

    def list_deals(self, db: Session, org_id: int, limit: int=100, offset: int=0) -> List[DealResponse]:
        deals = self.deal_repo.list_by_org(db, org_id, limit=limit, offset=offset)
        return [DealResponse.model_validate(d) for d in deals]

    def create_deal(self, db: Session, org_id: int, data: DealCreate) -> DealResponse:
        lead = self.lead_repo.get_by_id(db, data.lead_id, org_id)
        if not lead:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Lead not found in this organization')
        deal = self.deal_repo.create(db, org_id, lead_id=data.lead_id, name=data.name, value=data.value, status=data.status, assigned_to=data.assigned_to)
        return DealResponse.model_validate(deal)

    def update_deal(self, db: Session, deal_id: int, org_id: int, data: DealUpdate) -> DealResponse:
        deal = self.deal_repo.get_by_id(db, deal_id, org_id)
        if not deal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Deal not found')
        updates = data.model_dump(exclude_unset=True)
        new_status = updates.get('status')
        if new_status:
            from datetime import datetime, timezone
            if new_status in ('closed_won', 'closed_lost'):
                updates['closed_at'] = datetime.now(timezone.utc)
                lead = self.lead_repo.get_by_id(db, deal.lead_id, org_id)
                if lead:
                    lead_status = 'won' if new_status == 'closed_won' else 'lost'
                    self.lead_repo.update(db, lead, status=lead_status)
            elif deal.status in ('closed_won', 'closed_lost') and new_status not in ('closed_won', 'closed_lost'):
                updates['closed_at'] = None
                lead = self.lead_repo.get_by_id(db, deal.lead_id, org_id)
                if lead and lead.status in ('won', 'lost'):
                    self.lead_repo.update(db, lead, status='negotiation')
        deal = self.deal_repo.update(db, deal, **updates)
        return DealResponse.model_validate(deal)

    def get_metrics(self, db: Session, org_id: int) -> CRMMetrics:
        clients = self.client_repo.list_by_org(db, org_id)
        leads = self.lead_repo.list_by_org(db, org_id)
        deals = self.deal_repo.list_by_org(db, org_id)
        active_leads = sum((1 for l in leads if l.status not in ('won', 'lost')))
        pipeline_value = sum((l.value for l in leads if l.status not in ('won', 'lost')))
        deals_won_value = sum((d.value for d in deals if d.status == 'closed_won'))
        total_leads = len(leads)
        won_leads = sum((1 for l in leads if l.status == 'won'))
        conversion_rate = round(won_leads / total_leads * 100, 1) if total_leads > 0 else 0.0
        return CRMMetrics(active_leads=active_leads, pipeline_value=pipeline_value, deals_won_value=deals_won_value, conversion_rate=conversion_rate, total_clients=len(clients))