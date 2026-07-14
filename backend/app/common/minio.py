import os
import pybreaker
from minio import Minio
from datetime import timedelta
from typing import Optional
from .config import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_SECURE
from .metrics import PrometheusBreakerListener, CB_STATE

minio_breaker = pybreaker.CircuitBreaker(
    fail_max=int(os.getenv("MINIO_CB_FAIL_MAX", "5")),
    reset_timeout=int(os.getenv("MINIO_CB_RESET_TIMEOUT", "60")),
    name="minio",
    listeners=[PrometheusBreakerListener()]
)

# Initialize status to closed (healthy)
CB_STATE.labels(name="minio").set(0)

class MinioClient:

    def __init__(self):
        self._client: Optional[Minio] = None

    @property
    def client(self) -> Minio:
        if self._client is None:
            import urllib3
            timeout = urllib3.Timeout(connect=5.0, read=10.0)
            http_client = urllib3.PoolManager(timeout=timeout)
            self._client = Minio(
                endpoint=MINIO_ENDPOINT, 
                access_key=MINIO_ACCESS_KEY, 
                secret_key=MINIO_SECRET_KEY, 
                secure=MINIO_SECURE,
                http_client=http_client
            )
        return self._client

    @minio_breaker
    def ensure_bucket(self, bucket_name: str) -> None:
        if not self.client.bucket_exists(bucket_name):
            self.client.make_bucket(bucket_name)

    @minio_breaker
    def upload_file(self, bucket_name: str, object_name: str, file_path: str, content_type: str) -> bool:
        self.ensure_bucket(bucket_name)
        self.client.fput_object(bucket_name, object_name, file_path, content_type=content_type)
        return True

    @minio_breaker
    def upload_bytes(self, bucket_name: str, object_name: str, data: bytes, content_type: str) -> bool:
        from io import BytesIO
        self.ensure_bucket(bucket_name)
        stream = BytesIO(data)
        self.client.put_object(bucket_name, object_name, stream, length=len(data), content_type=content_type)
        return True

    @minio_breaker
    def download_file(self, bucket_name: str, object_name: str) -> bytes:
        response = self.client.get_object(bucket_name, object_name)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    @minio_breaker
    def get_presigned_url(self, bucket_name: str, object_name: str, expires_minutes: int=60) -> Optional[str]:
        return self.client.presigned_get_object(bucket_name, object_name, expires=timedelta(minutes=expires_minutes))

    @minio_breaker
    def delete_file(self, bucket_name: str, object_name: str) -> bool:
        self.client.remove_object(bucket_name, object_name)
        return True

minio_client = MinioClient()