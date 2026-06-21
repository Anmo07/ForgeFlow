from contextvars import ContextVar
from typing import Optional
import sys

if not hasattr(sys, "_forgeflow_context_vars"):
    sys._forgeflow_context_vars = {
        'current_org_id': ContextVar('current_org_id', default=None),
        'current_is_external': ContextVar('current_is_external', default=False),
        'show_deleted': ContextVar('show_deleted', default=False)
    }

current_org_id = sys._forgeflow_context_vars['current_org_id']
current_is_external = sys._forgeflow_context_vars['current_is_external']
show_deleted = sys._forgeflow_context_vars['show_deleted']

def set_tenant_context(org_id: Optional[int]) -> None:
    current_org_id.set(org_id)

def get_tenant_context() -> Optional[int]:
    return current_org_id.get()