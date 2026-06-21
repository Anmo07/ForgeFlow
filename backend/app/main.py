from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import prometheus_client

from .auth.router import router as auth_router
from .organizations.router import router as org_router
from .memberships.router import router as memberships_router
from .roles.router import router as roles_router
from .permissions.router import router as permissions_router
from .sessions.router import router as sessions_router
from .activity_logs.router import router as activity_logs_router
from .api_keys.router import router as api_keys_router
from .projects.router import router as projects_router
from .crm.router import router as crm_router
from .invoices.router import router as invoices_router
from .auth.sso_router import router as sso_router

# New routers for Phase 6
from .attachments.router import router as attachments_router
from .notifications.router import router as notifications_router
from .security.router import router as security_router
from .ingress.router import router as ingress_router

from .common.middleware import SecurityHeadersMiddleware, LoggingAndTimingMiddleware, CSRFMiddleware
from .common.config import CORS_ORIGINS
from .common.dependencies import get_db
from .attachments.models import Attachment

app = FastAPI(title='ForgeFlow Backend', version='0.4.0')
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingAndTimingMiddleware)
app.add_middleware(CSRFMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

# Legacy routes
app.include_router(auth_router, prefix='/api/auth', tags=['auth'])
app.include_router(sso_router, prefix='/api/auth/sso', tags=['sso'])
app.include_router(org_router, prefix='/api/organizations', tags=['organizations'])
app.include_router(memberships_router, prefix='/api/memberships', tags=['memberships'])
app.include_router(roles_router, prefix='/api/roles', tags=['roles'])
app.include_router(permissions_router, prefix='/api/permissions', tags=['permissions'])
app.include_router(sessions_router, prefix='/api/sessions', tags=['sessions'])
app.include_router(activity_logs_router, prefix='/api/activity-logs', tags=['activity-logs'])
app.include_router(api_keys_router, prefix='/api/api-keys', tags=['api-keys'])
app.include_router(projects_router, prefix='/api/projects', tags=['projects'])
app.include_router(crm_router, prefix='/api/crm', tags=['crm'])
app.include_router(invoices_router, prefix='/api/invoices', tags=['invoices'])

# V1 routes
app.include_router(projects_router, prefix='/api/v1/projects', tags=['projects-v1'])
app.include_router(attachments_router, prefix='/api/v1/attachments', tags=['attachments-v1'])
app.include_router(notifications_router, prefix='/api/v1/notifications', tags=['notifications-v1'])
app.include_router(security_router, prefix='/api/v1/security', tags=['security-v1'])
app.include_router(ingress_router, prefix='/api/v1/ingress', tags=['ingress-v1'])

@app.get('/metrics')
def metrics(db: Session = Depends(get_db)):
    """Exposes system-wide Prometheus metrics.
    Gathers active attachment database sizes on scape.
    """
    from .common.metrics import STORAGE_USAGE
    total_size = db.query(func.sum(Attachment.file_size)).filter(Attachment.status == 'active').scalar() or 0
    STORAGE_USAGE.set(total_size)
    return Response(
        content=prometheus_client.generate_latest(),
        media_type=prometheus_client.CONTENT_TYPE_LATEST
    )

@app.get('/health')
async def health_check():
    return {'status': 'ok'}