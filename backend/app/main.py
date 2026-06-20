from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
from .common.middleware import SecurityHeadersMiddleware, LoggingAndTimingMiddleware, CSRFMiddleware
from .common.config import CORS_ORIGINS
app = FastAPI(title='ForgeFlow Backend', version='0.2.0')
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingAndTimingMiddleware)
app.add_middleware(CSRFMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.include_router(auth_router, prefix='/api/auth', tags=['auth'])
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

@app.get('/health')
async def health_check():
    return {'status': 'ok'}