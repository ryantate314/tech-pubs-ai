import uuid

from fastapi import APIRouter, HTTPException

from techpubs_core.database import get_session
from techpubs_core.models import AircraftModel, Category, Document, DocumentJob, DocumentVersion

from schemas.uploads import (
    UploadCompleteRequest,
    UploadCompleteResponse,
    UploadUrlRequest,
    UploadUrlResponse,
)
from services.azure_storage import azure_storage_service
from services.queue_service import queue_service

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.get("/debug-sas")
def debug_sas():
    """Debug endpoint to test SAS URL generation."""
    upload_url, blob_path = azure_storage_service.generate_upload_url(
        model="test",
        category_name="debug",
        filename="test.txt",
        content_type="text/plain",
    )
    return {
        "upload_url": upload_url,
        "blob_path": blob_path,
        "instructions": "Use curl to test: curl -X PUT -H 'x-ms-blob-type: BlockBlob' -H 'Content-Type: text/plain' -d 'hello' '<upload_url>'"
    }


@router.post("/request-url", response_model=UploadUrlResponse)
def request_upload_url(request: UploadUrlRequest) -> UploadUrlResponse:
    """Request a presigned URL for uploading a file to Azure Blob Storage."""
    with get_session() as session:
        aircraft_model = session.query(AircraftModel).filter(
            AircraftModel.id == request.aircraft_model_id,
        ).first()

        if not aircraft_model:
            raise HTTPException(status_code=404, detail="Aircraft model not found")

        category = session.query(Category).filter(
            Category.id == request.category_id,
            Category.deleted_at.is_(None),
        ).first()

        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        upload_url, blob_path = azure_storage_service.generate_upload_url(
            model=aircraft_model.code,
            category_name=category.name,
            filename=request.filename,
            content_type=request.content_type,
        )

        return UploadUrlResponse(upload_url=upload_url, blob_path=blob_path)


@router.post("/complete", response_model=UploadCompleteResponse)
def complete_upload(request: UploadCompleteRequest) -> UploadCompleteResponse:
    """Complete the upload by creating database records and queueing the ingestion job."""
    with get_session() as session:
        aircraft_model = session.query(AircraftModel).filter(
            AircraftModel.id == request.aircraft_model_id,
        ).first()

        if not aircraft_model:
            raise HTTPException(status_code=404, detail="Aircraft model not found")

        category = session.query(Category).filter(
            Category.id == request.category_id,
            Category.deleted_at.is_(None),
        ).first()

        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        document = Document(
            guid=uuid.uuid4(),
            name=request.document_name,
            aircraft_model_id=request.aircraft_model_id,
            category_id=request.category_id,
        )
        session.add(document)
        session.flush()

        document_version = DocumentVersion(
            guid=uuid.uuid4(),
            name=request.document_name,
            file_name=request.filename,
            document_id=document.id,
            content_type=request.content_type,
            file_size=request.file_size,
            blob_path=request.blob_path,
        )
        session.add(document_version)
        session.flush()

        document_job = DocumentJob(
            document_version_id=document_version.id,
            job_type="ingestion",
            status="pending",
        )
        session.add(document_job)
        session.flush()

        queue_service.send_job_message(document_job.id)

        return UploadCompleteResponse(
            document_id=document.id,
            job_id=document_job.id,
        )
