from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import joinedload

from techpubs_core.database import get_session
from techpubs_core.models import Document, DocumentJob, DocumentVersion

from schemas.jobs import (
    ChildJobCounts,
    ChildJobResponse,
    JobActionResponse,
    JobDetailResponse,
    JobListResponse,
    JobResponse,
    ParentJobListResponse,
    ParentJobResponse,
    QueueActionResponse,
)
from services.queue_service import queue_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def job_to_response(job: DocumentJob) -> JobResponse:
    """Convert a DocumentJob model to a JobResponse schema."""
    return JobResponse(
        id=job.id,
        document_version_id=job.document_version_id,
        document_name=job.document_version.document.name,
        job_type=job.job_type,
        status=job.status,
        error_message=job.error_message,
        started_at=job.started_at,
        completed_at=job.completed_at,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


def parent_job_to_response(job: DocumentJob) -> ParentJobResponse:
    """Convert a parent DocumentJob model to a ParentJobResponse schema."""
    child_jobs = job.child_jobs or []
    completed_count = sum(1 for j in child_jobs if j.status == "completed")
    failed_count = sum(1 for j in child_jobs if j.status == "failed")

    return ParentJobResponse(
        id=job.id,
        document_version_id=job.document_version_id,
        document_name=job.document_version.document.name,
        document_version=job.document_version.name,
        job_type=job.job_type,
        status=job.status,
        error_message=job.error_message,
        started_at=job.started_at,
        completed_at=job.completed_at,
        created_at=job.created_at,
        updated_at=job.updated_at,
        child_job_counts=ChildJobCounts(
            total=len(child_jobs),
            completed=completed_count,
            failed=failed_count,
        ),
    )


def child_job_to_response(job: DocumentJob) -> ChildJobResponse:
    """Convert a child DocumentJob model to a ChildJobResponse schema."""
    return ChildJobResponse(
        id=job.id,
        job_type=job.job_type,
        status=job.status,
        error_message=job.error_message,
        chunk_start_index=job.chunk_start_index,
        chunk_end_index=job.chunk_end_index,
        started_at=job.started_at,
        completed_at=job.completed_at,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.get("", response_model=ParentJobListResponse)
def list_jobs(
    status: Optional[str] = Query(None, description="Filter by job status"),
    start_date: Optional[datetime] = Query(
        None, description="Only show jobs created after this date (ISO timestamp)"
    ),
) -> ParentJobListResponse:
    """List parent document ingestion jobs with optional filters.

    Returns only parent jobs (chunking jobs where parent_job_id IS NULL)
    with aggregated child job counts.
    """
    with get_session() as session:
        query = (
            session.query(DocumentJob)
            .join(DocumentVersion)
            .join(Document)
            .options(joinedload(DocumentJob.child_jobs))
            .filter(DocumentJob.parent_job_id.is_(None))
        )

        # Default to 2 days ago if no start_date provided
        if start_date is None:
            start_date = datetime.now(timezone.utc) - timedelta(days=2)

        query = query.filter(DocumentJob.created_at >= start_date)

        if status:
            query = query.filter(DocumentJob.status == status)

        query = query.order_by(DocumentJob.created_at.desc())

        jobs = query.all()

        # Count parent jobs by status (from the filtered results for totals, all recent for counts)
        count_query = (
            session.query(DocumentJob)
            .filter(DocumentJob.parent_job_id.is_(None))
            .filter(DocumentJob.created_at >= start_date)
        )
        all_jobs_for_counts = count_query.all()

        pending_count = sum(1 for j in all_jobs_for_counts if j.status == "pending")
        running_count = sum(1 for j in all_jobs_for_counts if j.status == "running")
        completed_count = sum(1 for j in all_jobs_for_counts if j.status == "completed")
        failed_count = sum(1 for j in all_jobs_for_counts if j.status == "failed")
        cancelled_count = sum(1 for j in all_jobs_for_counts if j.status == "cancelled")

        return ParentJobListResponse(
            jobs=[parent_job_to_response(job) for job in jobs],
            total=len(jobs),
            pending_count=pending_count,
            running_count=running_count,
            completed_count=completed_count,
            failed_count=failed_count,
            cancelled_count=cancelled_count,
        )


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job_detail(job_id: int) -> JobDetailResponse:
    """Get a parent job with all its child jobs."""
    with get_session() as session:
        job = (
            session.query(DocumentJob)
            .join(DocumentVersion)
            .join(Document)
            .options(joinedload(DocumentJob.child_jobs))
            .filter(DocumentJob.id == job_id)
            .filter(DocumentJob.parent_job_id.is_(None))
            .first()
        )

        if not job:
            raise HTTPException(status_code=404, detail="Parent job not found")

        # Sort child jobs by chunk_start_index
        child_jobs = sorted(
            job.child_jobs or [],
            key=lambda j: j.chunk_start_index if j.chunk_start_index is not None else 0,
        )

        return JobDetailResponse(
            parent_job=parent_job_to_response(job),
            child_jobs=[child_job_to_response(j) for j in child_jobs],
        )


@router.post("/{job_id}/cancel", response_model=JobActionResponse)
def cancel_job(job_id: int) -> JobActionResponse:
    """Cancel a pending job."""
    with get_session() as session:
        job = (
            session.query(DocumentJob)
            .join(DocumentVersion)
            .join(Document)
            .filter(DocumentJob.id == job_id)
            .first()
        )

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.status != "pending" and job.status != "running":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel job with status '{job.status}'. Only pending jobs can be cancelled.",
            )

        job.status = "cancelled"
        session.commit()
        session.refresh(job)

        return JobActionResponse(
            success=True,
            message="Job cancelled successfully",
            job=job_to_response(job),
        )


@router.post("/{job_id}/requeue", response_model=JobActionResponse)
def requeue_job(job_id: int) -> JobActionResponse:
    """Re-queue a failed or cancelled job."""
    with get_session() as session:
        job = (
            session.query(DocumentJob)
            .join(DocumentVersion)
            .join(Document)
            .filter(DocumentJob.id == job_id)
            .first()
        )

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.status not in ("failed", "cancelled"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot re-queue job with status '{job.status}'. Only failed or cancelled jobs can be re-queued.",
            )

        # Reset job state
        job.status = "pending"
        job.error_message = None
        job.started_at = None
        job.completed_at = None
        session.commit()
        session.refresh(job)

        # Send message to queue
        queue_service.send_chunking_job_message(job.id)

        return JobActionResponse(
            success=True,
            message="Job re-queued successfully",
            job=job_to_response(job),
        )


@router.post("/queues/chunking/clear", response_model=QueueActionResponse)
def clear_chunking_queue() -> QueueActionResponse:
    """Clear all messages from the document-chunking queue."""
    messages_cleared = queue_service.clear_chunking_queue()
    return QueueActionResponse(
        success=True,
        message=f"Cleared {messages_cleared} message(s) from chunking queue",
        messages_cleared=messages_cleared,
    )


@router.post("/queues/embedding/clear", response_model=QueueActionResponse)
def clear_embedding_queue() -> QueueActionResponse:
    """Clear all messages from the document-embedding queue."""
    messages_cleared = queue_service.clear_embedding_queue()
    return QueueActionResponse(
        success=True,
        message=f"Cleared {messages_cleared} message(s) from embedding queue",
        messages_cleared=messages_cleared,
    )
