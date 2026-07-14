"""
Enterprise SSO router.

Exposes two endpoints per organisation:
- ``GET /api/auth/sso/{org_slug}/login``  — Initiates the SSO flow by
  returning the IdP redirect URL.
- ``POST /api/auth/sso/{org_slug}/callback`` — Receives the IdP assertion,
  maps it to a ForgeFlow user/tenant, and returns access + refresh tokens.
"""

import secrets
from typing import Dict, Any, Optional

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


@router.get('/google/init')
def google_sso_init(
    request: Request,
    org_slug: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Initiates Google OIDC SSO flow, setting CSRF-safe state."""
    from ..common.config import GOOGLE_OIDC_CLIENT_ID, OIDC_REDIRECT_URI
    from ..organizations.models import Organization
    from urllib.parse import urlencode
    from fastapi.responses import RedirectResponse

    client_id = GOOGLE_OIDC_CLIENT_ID
    org_id = None

    if org_slug:
        org = db.query(Organization).filter(Organization.slug == org_slug, Organization.is_active == True).first()
        if org and org.sso_enabled and org.sso_client_id:
            client_id = org.sso_client_id
            org_id = org.id

    state = secrets.token_urlsafe(32)
    
    params = {
        "client_id": client_id,
        "response_type": "code",
        "scope": "openid email profile",
        "redirect_uri": OIDC_REDIRECT_URI,
        "state": state,
        "prompt": "select_account"
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    response = RedirectResponse(url=auth_url)
    
    # Set state check cookies
    response.set_cookie(
        key="sso_state",
        value=state,
        httponly=True,
        samesite="lax",
        secure=request.url.scheme == "https",
        max_age=300
    )
    if org_id:
        response.set_cookie(
            key="sso_org_id",
            value=str(org_id),
            httponly=True,
            samesite="lax",
            secure=request.url.scheme == "https",
            max_age=300
        )
    else:
        response.delete_cookie("sso_org_id")
        
    return response


@router.get('/google/callback')
async def google_sso_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handles Google OIDC redirect callback, verifies id_token, and logs the user in."""
    from ..common.config import GOOGLE_OIDC_CLIENT_ID, GOOGLE_OIDC_CLIENT_SECRET, OIDC_REDIRECT_URI
    from ..organizations.models import Organization
    from ..common.encryption import decrypt_field
    from fastapi.responses import RedirectResponse
    from fastapi import HTTPException
    import httpx
    import jwt
    import os

    code = request.query_params.get("code")
    state = request.query_params.get("state")
    cookie_state = request.cookies.get("sso_state")
    org_id_cookie = request.cookies.get("sso_org_id")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing authorization code or state parameter")
        
    if not cookie_state or state != cookie_state:
        raise HTTPException(status_code=400, detail="Invalid state token (CSRF failure)")

    client_id = GOOGLE_OIDC_CLIENT_ID
    client_secret = GOOGLE_OIDC_CLIENT_SECRET
    org = None

    if org_id_cookie:
        org_id = int(org_id_cookie)
        org = db.query(Organization).filter(Organization.id == org_id, Organization.is_active == True).first()
        if org and org.sso_enabled and org.sso_client_id and org.sso_client_secret:
            client_id = org.sso_client_id
            client_secret = decrypt_field(org.sso_client_secret)

    # Exchange authorization code for ID token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": OIDC_REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    async with httpx.AsyncClient() as http_client:
        token_resp = await http_client.post(token_url, data=token_data)
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange authorization code: {token_resp.text}")
        token_json = token_resp.json()

    id_token = token_json.get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="Identity provider did not return an id_token")

    # Fetch Google JWKS and verify signature of ID token
    try:
        jwks_client = jwt.PyJWKClient("https://www.googleapis.com/oauth2/v3/certs")
        signing_key = jwks_client.get_signing_key_from_jwt(id_token)
        claims = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer="https://accounts.google.com"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ID token validation failed: {str(e)}")

    email = claims.get("email")
    sub = claims.get("sub")
    name = claims.get("name") or email.split("@")[0]

    if not email:
        raise HTTPException(status_code=400, detail="Email claim missing from OIDC response")

    domain = email.split("@")[-1]

    # Resolve Organization
    if not org:
        from .sso_models import SSOConfiguration
        sso_config = db.query(SSOConfiguration).filter(
            SSOConfiguration.email_domain == domain,
            SSOConfiguration.is_active == True
        ).first()
        
        if sso_config:
            org = db.query(Organization).filter(Organization.id == sso_config.organization_id, Organization.is_active == True).first()
        else:
            org = db.query(Organization).filter(Organization.slug == domain.split(".")[0], Organization.is_active == True).first()

    if not org:
        org = db.query(Organization).filter(Organization.sso_issuer_url.contains(domain), Organization.is_active == True).first()

    if not org:
        raise HTTPException(status_code=400, detail=f"No organization matches email domain '{domain}' configured for SSO.")

    from .sso import SSOUserAssertion
    assertion = SSOUserAssertion(
        email=email,
        name=name,
        external_id=sub,
        domain=domain
    )

    # Retrieve or create custom SSO Configuration in SSO table for backward compatibility
    from .sso_models import SSOConfiguration
    sso_config = db.query(SSOConfiguration).filter(
        SSOConfiguration.organization_id == org.id,
        SSOConfiguration.is_active == True
    ).first()
    
    if not sso_config:
        from ..roles.models import Role
        default_role = db.query(Role).filter(Role.name == 'member', Role.is_system == True).first()
        default_role_id = default_role.id if default_role else None
        
        sso_config = SSOConfiguration(
            organization_id=org.id,
            provider_type='oidc',
            entity_id=client_id,
            sso_url='https://accounts.google.com/o/oauth2/v2/auth',
            email_domain=domain,
            default_role_id=default_role_id,
            is_active=True
        )
        db.add(sso_config)
        db.commit()
        db.refresh(sso_config)

    # Perform user provisioning and session token generation
    token_resp = sso_service.process_sso_login(db, assertion, sso_config)

    # Always redirect to the frontend application dashboard
    response = RedirectResponse(url="http://localhost:3000/dashboard")
    
    # Establish HttpOnly secure auth sessions
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

    response.delete_cookie("sso_state")
    response.delete_cookie("sso_org_id")

    return response
