"""
Enterprise SSO router.

Exposes two endpoints per organisation:
- ``GET /api/auth/sso/{org_slug}/login``  — Initiates the SSO flow by
  returning the IdP redirect URL.
- ``POST /api/auth/sso/{org_slug}/callback`` — Receives the IdP assertion,
  maps it to a ForgeFlow user/tenant, and returns access + refresh tokens.
"""

import secrets
from typing import Dict, Any

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..common.dependencies import get_db
from .sso import SSOService

router = APIRouter()
sso_service = SSOService()


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class SSOLoginRedirect(BaseModel):
    login_url: str
    state: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get('/{org_slug}/login', response_model=SSOLoginRedirect)
def sso_login(org_slug: str, db: Session = Depends(get_db)):
    """Initiate SSO login for the given organisation.

    Returns the IdP redirect URL and a CSRF-safe state token.
    """
    config = sso_service.get_config_by_org_slug(db, org_slug)
    provider = sso_service.get_provider(config)
    state = secrets.token_urlsafe(32)
    login_url = provider.get_login_url(state=state)
    return SSOLoginRedirect(login_url=login_url, state=state)


@router.post('/{org_slug}/callback')
def sso_callback(
    org_slug: str,
    request: Request,
    response: Response,
    payload: Dict[str, Any] = None,
    db: Session = Depends(get_db),
):
    """Handle the IdP callback after SSO authentication.

    Accepts the raw IdP assertion payload (form data or JSON), validates it,
    maps the user to the correct ForgeFlow tenant, and returns tokens.
    """
    config = sso_service.get_config_by_org_slug(db, org_slug)
    provider = sso_service.get_provider(config)

    # Accept both JSON body and form-encoded data
    callback_data = payload or {}

    assertion = provider.process_callback(callback_data)
    token_resp = sso_service.process_sso_login(db, assertion, config)

    # Set auth cookies (same pattern as regular login)
    response.set_cookie(
        key='access_token',
        value=token_resp.access_token,
        httponly=True,
        samesite='strict',
        max_age=30 * 60,
        path='/',
    )
    response.set_cookie(
        key='refresh_token',
        value=token_resp.refresh_token,
        httponly=True,
        samesite='strict',
        max_age=30 * 24 * 60 * 60,
        path='/',
    )

    return token_resp
