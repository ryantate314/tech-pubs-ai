import uuid

from fastapi import APIRouter, HTTPException

from techpubs_core.database import get_session
from techpubs_core.models import (
    AircraftModel,
    Document,
    DocumentCategory,
    DocumentJob,
    DocumentType,
    DocumentSerialRange,
    DocumentVersion,
    Generation,
    Platform,
)

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

        # Validate platform
        platform = session.query(Platform).filter(
            Platform.id == request.platform_id,
        ).first()
        if not platform:
            raise HTTPException(status_code=404, detail="Platform not found")

        # Validate generation
        generation = session.query(Generation).filter(
            Generation.id == request.generation_id,
        ).first()
        if not generation:
            raise HTTPException(status_code=404, detail="Generation not found")
        if generation.platform_id != request.platform_id:
            raise HTTPException(status_code=400, detail="Generation does not belong to selected platform")

        # Validate document_type and get its category for blob path
        document_type = session.query(DocumentType).filter(
            DocumentType.id == request.document_type_id,
        ).first()
        if not document_type:
            raise HTTPException(status_code=404, detail="Document type not found")

        document_category = session.query(DocumentCategory).filter(
            DocumentCategory.id == document_type.document_category_id,
        ).first()
        if not document_category:
            raise HTTPException(status_code=404, detail="Document category not found")

        upload_url, blob_path = azure_storage_service.generate_upload_url(
            model=aircraft_model.code,
            category_name=document_category.name,
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

        # Validate platform
        platform = session.query(Platform).filter(
            Platform.id == request.platform_id,
        ).first()
        if not platform:
            raise HTTPException(status_code=404, detail="Platform not found")

        # Validate generation
        generation = session.query(Generation).filter(
            Generation.id == request.generation_id,
        ).first()
        if not generation:
            raise HTTPException(status_code=404, detail="Generation not found")
        if generation.platform_id != request.platform_id:
            raise HTTPException(status_code=400, detail="Generation does not belong to selected platform")

        # Validate document_type
        document_type = session.query(DocumentType).filter(
            DocumentType.id == request.document_type_id,
        ).first()
        if not document_type:
            raise HTTPException(status_code=404, detail="Document type not found")

        # If document_guid provided, add version to existing document
        if request.document_guid:
            document = session.query(Document).filter(
                Document.guid == request.document_guid,
                Document.deleted_at.is_(None),
            ).first()

            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
        else:
            # Create new document
            document = Document(
                guid=uuid.uuid4(),
                name=request.document_name,
                aircraft_model_id=request.aircraft_model_id,
                platform_id=request.platform_id,
                generation_id=request.generation_id,
                document_type_id=request.document_type_id,
            )
            session.add(document)
            session.flush()

            # Create serial ranges for new document
            if request.serial_ranges:
                for sr in request.serial_ranges:
                    serial_range = DocumentSerialRange(
                        document_id=document.id,
                        range_type=sr.range_type,
                        serial_start=sr.serial_start,
                        serial_end=sr.serial_end,
                    )
                    session.add(serial_range)

        document_version = DocumentVersion(
            guid=uuid.uuid4(),
            name=request.version_name,
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
            job_type="chunking",
            status="pending",
        )
        session.add(document_job)
        session.flush()

        queue_service.send_chunking_job_message(document_job.id)

        return UploadCompleteResponse(
            document_id=document.id,
            job_id=document_job.id,
        )
