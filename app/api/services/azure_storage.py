import logging
import re
import uuid
from datetime import datetime, timedelta, timezone

from azure.identity import DefaultAzureCredential
from azure.storage.blob import (
    BlobSasPermissions,
    BlobServiceClient,
    generate_blob_sas,
)

from config import settings
from techpubs_core import DOCUMENTS_CONTAINER

logger = logging.getLogger(__name__)


def sanitize_path_segment(segment: str) -> str:
    """Sanitize a path segment for use in blob paths."""
    # Replace spaces and special chars with hyphens, lowercase
    sanitized = re.sub(r"[^a-zA-Z0-9-]", "-", segment.lower())
    # Remove consecutive hyphens
    sanitized = re.sub(r"-+", "-", sanitized)
    return sanitized.strip("-")


class AzureStorageService:
    def __init__(self) -> None:
        self._credential = DefaultAzureCredential()
        self._blob_service_client = BlobServiceClient(
            account_url=settings.storage_account_url,
            credential=self._credential,
        )

    def generate_upload_url(
        self,
        model: str,
        category_name: str,
        filename: str,
        content_type: str,
    ) -> tuple[str, str]:
        """Generate a SAS URL for uploading a blob.

        Returns:
            tuple[str, str]: (upload_url, blob_path)
        """
        extension = filename.rsplit(".", 1)[-1] if "." in filename else ""
        blob_name = f"{uuid.uuid4()}.{extension}" if extension else str(uuid.uuid4())

        # Sanitize path segments
        safe_model = sanitize_path_segment(model)
        safe_category = sanitize_path_segment(category_name)
        blob_path = f"{safe_model}/{safe_category}/{blob_name}"

        logger.info(f"Generating SAS URL for blob: {blob_path}")

        user_delegation_key = self._blob_service_client.get_user_delegation_key(
            key_start_time=datetime.now(timezone.utc),
            key_expiry_time=datetime.now(timezone.utc) + timedelta(hours=1),
        )

        account_name = settings.storage_account_url.split("//")[1].split(".")[0]

        # Don't enforce content_type in SAS to avoid mismatch issues
        sas_token = generate_blob_sas(
            account_name=account_name,
            container_name=DOCUMENTS_CONTAINER,
            blob_name=blob_path,
            user_delegation_key=user_delegation_key,
            permission=BlobSasPermissions(write=True, create=True),
            expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        )

        upload_url = f"{settings.storage_account_url}/{DOCUMENTS_CONTAINER}/{blob_path}?{sas_token}"

        logger.info(f"Generated SAS URL for container: {DOCUMENTS_CONTAINER}, blob: {blob_path}")

        return upload_url, blob_path

    def generate_download_url(self, blob_path: str) -> str:
        """Generate a SAS URL for downloading/reading a blob.

        Args:
            blob_path: The path to the blob within the documents container.

        Returns:
            str: The SAS URL for reading the blob.
        """
        logger.info(f"Generating download SAS URL for blob: {blob_path}")

        user_delegation_key = self._blob_service_client.get_user_delegation_key(
            key_start_time=datetime.now(timezone.utc),
            key_expiry_time=datetime.now(timezone.utc) + timedelta(hours=1),
        )

        account_name = settings.storage_account_url.split("//")[1].split(".")[0]

        sas_token = generate_blob_sas(
            account_name=account_name,
            container_name=DOCUMENTS_CONTAINER,
            blob_name=blob_path,
            user_delegation_key=user_delegation_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        )

        download_url = f"{settings.storage_account_url}/{DOCUMENTS_CONTAINER}/{blob_path}?{sas_token}"

        logger.info(f"Generated download SAS URL for container: {DOCUMENTS_CONTAINER}, blob: {blob_path}")

        return download_url


azure_storage_service = AzureStorageService()
