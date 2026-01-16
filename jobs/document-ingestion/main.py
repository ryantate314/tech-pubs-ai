import json
import os
import sys

from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient


def get_blob_event_data() -> dict:
    """
    Parse blob event data from environment variables.

    Azure Container App Jobs triggered by Event Grid receive event data
    via the BLOB_EVENT_DATA environment variable.
    """
    event_data_raw = os.environ.get("BLOB_EVENT_DATA")
    if not event_data_raw:
        raise ValueError("BLOB_EVENT_DATA environment variable not set")

    return json.loads(event_data_raw)


def download_blob(storage_account_url: str, container_name: str, blob_name: str) -> bytes:
    """Download blob content from Azure Blob Storage."""
    credential = DefaultAzureCredential()
    blob_service_client = BlobServiceClient(storage_account_url, credential=credential)
    blob_client = blob_service_client.get_blob_client(container_name, blob_name)

    return blob_client.download_blob().readall()


def process_document(blob_name: str, content: bytes) -> None:
    """
    Process the ingested document.

    This is a sample implementation - replace with actual processing logic.
    """
    print(f"Processing document: {blob_name}")
    print(f"Document size: {len(content)} bytes")

    # TODO: Add actual document processing logic here
    # Examples:
    # - Extract text from PDF
    # - Parse document metadata
    # - Index document for search
    # - Store processed data in database


def main():
    print("Document ingestion job started")

    try:
        event_data = get_blob_event_data()
        print(f"Received event: {json.dumps(event_data, indent=2)}")

        # Extract blob information from Event Grid event
        subject = event_data.get("subject", "")
        # Subject format: /blobServices/default/containers/{container}/blobs/{blob}
        parts = subject.split("/")
        container_name = parts[4] if len(parts) > 4 else ""
        blob_name = "/".join(parts[6:]) if len(parts) > 6 else ""

        # Get storage account URL from event data or environment
        storage_account_url = os.environ.get("STORAGE_ACCOUNT_URL")
        if not storage_account_url:
            # Extract from event source
            source = event_data.get("source", "")
            # Source format: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Storage/storageAccounts/{account}
            account_name = source.split("/")[-1] if source else ""
            storage_account_url = f"https://{account_name}.blob.core.windows.net"

        print(f"Container: {container_name}")
        print(f"Blob: {blob_name}")
        print(f"Storage URL: {storage_account_url}")

        # Download and process the blob
        content = download_blob(storage_account_url, container_name, blob_name)
        process_document(blob_name, content)

        print("Document ingestion completed successfully")

    except Exception as e:
        print(f"Error processing document: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
