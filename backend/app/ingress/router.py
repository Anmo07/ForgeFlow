import hmac
import hashlib
import os
import json
import logging
from fastapi import APIRouter, Request, HTTPException, status, Depends
from .tasks import process_inbound_email_task

logger = logging.getLogger("forgeflow.ingress")
router = APIRouter()

async def verify_signature(request: Request):
    signature = request.headers.get("X-Signature")
    if not signature:
        logger.warning("Rejecting webhook: Missing X-Signature header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Signature header"
        )
    
    secret = os.getenv("INGRESS_EMAIL_SECRET")
    if not secret:
        logger.error("Inbound email ingress failed: INGRESS_EMAIL_SECRET env var is not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ingress email secret not configured"
        )
        
    body = await request.body()
    computed = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(computed, signature):
        logger.warning("Rejecting webhook: Invalid cryptographic signature")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )

@router.post("/email", status_code=status.HTTP_202_ACCEPTED, dependencies=[Depends(verify_signature)])
async def inbound_email(request: Request):
    body = await request.body()
    try:
        payload = json.loads(body.decode())
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")
    
    process_inbound_email_task.delay(payload)
    return {"status": "accepted"}
