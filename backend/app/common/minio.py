from minio import Minio
from datetime import timedelta
from typing import Optional
from .config import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_SECURE

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

    def ensure_bucket(self, bucket_name: str) -> None:
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
        except Exception as e:
            print(f'Error checking/creating MinIO bucket {bucket_name}: {e}')

    def upload_file(self, bucket_name: str, object_name: str, file_path: str, content_type: str) -> bool:
        try:
            self.ensure_bucket(bucket_name)
            self.client.fput_object(bucket_name, object_name, file_path, content_type=content_type)
            return True
        except Exception as e:
            print(f'Error uploading file {file_path} to {bucket_name}/{object_name}: {e}')
            return False

    def upload_bytes(self, bucket_name: str, object_name: str, data: bytes, content_type: str) -> bool:
        from io import BytesIO
        try:
            self.ensure_bucket(bucket_name)
            stream = BytesIO(data)
            self.client.put_object(bucket_name, object_name, stream, length=len(data), content_type=content_type)
            return True
        except Exception as e:
            print(f'Error uploading bytes to {bucket_name}/{object_name}: {e}')
            return False

    def download_file(self, bucket_name: str, object_name: str) -> Optional[bytes]:
        try:
            response = self.client.get_object(bucket_name, object_name)
            try:
                return response.read()
            finally:
                response.close()
                response.release_conn()
        except Exception as e:
            print(f'Error downloading file {bucket_name}/{object_name}: {e}')
            return None

    def get_presigned_url(self, bucket_name: str, object_name: str, expires_minutes: int=60) -> Optional[str]:
        try:
            return self.client.presigned_get_object(bucket_name, object_name, expires=timedelta(minutes=expires_minutes))
        except Exception as e:
            print(f'Error generating presigned URL for {bucket_name}/{object_name}: {e}')
            return None

    def delete_file(self, bucket_name: str, object_name: str) -> bool:
        try:
            self.client.remove_object(bucket_name, object_name)
            return True
        except Exception as e:
            print(f'Error deleting file {bucket_name}/{object_name}: {e}')
            return False
minio_client = MinioClient()