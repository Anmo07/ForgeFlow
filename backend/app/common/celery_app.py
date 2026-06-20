from celery import Celery
from app.common.config import REDIS_URL
celery_app = Celery('forgeflow', broker=REDIS_URL, backend=REDIS_URL, include=['app.common.celery_tasks'])
celery_app.conf.update(task_serializer='json', result_serializer='json', accept_content=['json'], timezone='UTC', enable_utc=True, task_track_started=True)

@celery_app.task
def debug_task():
    print('Celery debug task executed successfully!')
    return 'ok'