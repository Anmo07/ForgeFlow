from celery import Celery
from app.common.config import REDIS_URL
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
    worker_cancel_long_running_tasks_on_connection_loss=True
)

@celery_app.task
def debug_task():
    print('Celery debug task executed successfully!')
    return 'ok'