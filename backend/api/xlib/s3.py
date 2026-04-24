"""
MinIO Client (S3-compatible).

Provides async upload/download/delete for PDFs stored on MinIO.
Uses aioboto3 with a custom endpoint_url pointing to a local MinIO instance.
"""

import logging
from typing import Optional

from AppMain.settings import AppSettings, boto3_session

logger = logging.getLogger(__name__)


class MinIOClient:
    """
    Async MinIO client wrapping aioboto3.

    Configure via environment variables:
        APP_SETTINGS_MINIO_ENDPOINT   — e.g. http://localhost:9000
        APP_SETTINGS_AWS_ACCESS_KEY_ID
        APP_SETTINGS_AWS_ACCESS_KEY_SECRET
        APP_SETTINGS_MINIO_BUCKET     — default: jurisaide-documents
    """

    def __init__(self) -> None:
        self.endpoint_url: str = getattr(AppSettings, "MINIO_ENDPOINT", "http://localhost:9000")
        self.bucket: str = getattr(AppSettings, "MINIO_BUCKET", "jurisaide-documents")

    async def _get_client(self):
        """Return an aioboto3 S3 client pointed at MinIO."""
        return boto3_session.client(
            "s3",
            endpoint_url=self.endpoint_url,
        )

    async def ensure_bucket(self) -> None:
        """Create the bucket if it does not exist yet."""
        async with await self._get_client() as client:
            try:
                await client.head_bucket(Bucket=self.bucket)
            except Exception:
                await client.create_bucket(Bucket=self.bucket)
                logger.info(f"MinIO bucket '{self.bucket}' created.")

    async def upload_pdf(self, key: str, data: bytes) -> str:
        """
        Upload a PDF to MinIO and return its public URL.

        Args:
            key:  Object key, e.g. 'documents/dossier_id/lettre.pdf'
            data: Raw PDF bytes.

        Returns:
            The URL to access the file, e.g. http://localhost:9000/bucket/key
        """
        await self.ensure_bucket()
        async with await self._get_client() as client:
            await client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType="application/pdf",
            )
        url = f"{self.endpoint_url}/{self.bucket}/{key}"
        logger.info(f"PDF uploaded to MinIO: {url}")
        return url

    async def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """
        Generate a pre-signed download URL (valid for `expires_in` seconds).

        Args:
            key:        Object key in MinIO.
            expires_in: URL validity in seconds (default 1h).

        Returns:
            A pre-signed URL string.
        """
        async with await self._get_client() as client:
            url: str = await client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        return url

    async def delete_object(self, key: str) -> None:
        """Delete an object from MinIO."""
        async with await self._get_client() as client:
            await client.delete_object(Bucket=self.bucket, Key=key)
        logger.info(f"MinIO object deleted: {key}")

    async def list_objects(self, prefix: str) -> list[str]:
        """Return a list of object keys matching a given prefix."""
        async with await self._get_client() as client:
            response = await client.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        return [obj["Key"] for obj in response.get("Contents", [])]


# Singleton used across the app
minio_client = MinIOClient()
