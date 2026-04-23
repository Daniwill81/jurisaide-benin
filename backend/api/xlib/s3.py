"""
AWS S3.

AWS S3 is a service to store and retrieve files from a remote storage.
"""

import boto3
from botocore.exceptions import NoCredentialsError

from AppMain.settings import AppSettings

# Configure the Boto3 client with your MinIO endpoint, access key, and secret key
s3 = boto3.client(
    "s3",
    endpoint_url=AppSettings.AWS_ENDPOINT,
    aws_access_key_id=AppSettings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AppSettings.AWS_ACCESS_KEY_SECRET,
    region_name=AppSettings.AWS_REGION,
    use_ssl=AppSettings.AWS_USE_SSL,
)


async def s3_upload(contents: bytes, key: str, bucket: str) -> str | None:
    """Upload a file to AWS S3."""
    try:
        s3.put_object(Bucket=bucket, Key=key, Body=contents, ContentType="application/pdf")
    except NoCredentialsError:
        return None
    
    # Construct the public URL
    # If using MinIO, it might be different, but this is a standard way
    return f"{AppSettings.AWS_ENDPOINT.rstrip('/')}/{bucket}/{key}"
