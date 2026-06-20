from sqlalchemy.orm import Query
from sqlalchemy.event import listens_for
from contextvars import ContextVar
from typing import Optional
current_org_id: ContextVar[Optional[int]] = ContextVar('current_org_id', default=None)
TENANT_SCOPED_TABLES = {'projects', 'tasks', 'clients', 'leads', 'deals', 'invoices', 'invoice_line_items', 'api_keys', 'memberships'}

@listens_for(Query, 'before_all_clauses')
def receive_before_all_clauses(query_context):
    org_id = current_org_id.get()
    if org_id is None:
        return
    for mapper in query_context.mappers:
        table = mapper.persist_selectable
        if hasattr(mapper.class_, 'organization_id'):
            query_context.append_criterion(mapper.class_.organization_id == org_id)

def set_tenant_context(org_id: Optional[int]) -> None:
    current_org_id.set(org_id)

def get_tenant_context() -> Optional[int]:
    return current_org_id.get()