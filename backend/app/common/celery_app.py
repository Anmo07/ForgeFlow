from celery import Celery
from celery.signals import before_task_publish, task_prerun, task_postrun
from app.common.config import REDIS_URL
from app.common.logging_context import request_id_ctx, user_id_ctx, org_id_ctx

celery_app = Celery('forgeflow', broker=REDIS_URL, backend=REDIS_URL, include=['app.common.celery_tasks', 'app.events.tasks', 'app.attachments.tasks'])
celery_app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_cancel_long_running_tasks_on_connection_loss=True,
    worker_prefetch_multiplier=1,  # Fair dispatch: one task at a time per worker
)

@before_task_publish.connect
def before_task_publish_handler(headers=None, body=None, **kwargs):
    if headers:
        req_id = request_id_ctx.get()
        u_id = user_id_ctx.get()
        o_id = org_id_ctx.get()
        if req_id:
            headers["request_id"] = req_id
        if u_id:
            headers["user_id"] = u_id
        if o_id:
            headers["org_id"] = o_id

@task_prerun.connect
def task_prerun_handler(task, task_id, args, kwargs, **kwargs_extra):
    req_id = None
    u_id = None
    o_id = None
    if task.request:
        headers = getattr(task.request, "headers", {}) or {}
        req_id = headers.get("request_id")
        u_id = headers.get("user_id")
        o_id = headers.get("org_id")
        if not req_id:
            req_id = getattr(task.request, "request_id", None)
            
    if req_id:
        request_id_ctx.set(str(req_id))
    if u_id:
        user_id_ctx.set(str(u_id))
    if o_id:
        org_id_ctx.set(str(o_id))

@task_postrun.connect
def task_postrun_handler(task, task_id, args, kwargs, retval, state, **kwargs_extra):
    request_id_ctx.set(None)
    user_id_ctx.set(None)
    org_id_ctx.set(None)

@celery_app.task
def debug_task():
    print('Celery debug task executed successfully!')
    return 'ok'