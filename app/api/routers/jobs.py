from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from techpubs_core.database import get_session
from techpubs_core.models import Document, DocumentJob, DocumentVersion

from schemas.jobs import JobActionResponse, JobListResponse, JobResponse
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


@router.get("", response_model=JobListResponse)
def list_jobs(
    status: Optional[str] = Query(None, description="Filter by job status"),
    start_date: Optional[datetime] = Query(
        None, description="Only show jobs created after this date (ISO timestamp)"
    ),
) -> JobListResponse:
    """List document ingestion jobs with optional filters."""
    with get_session() as session:
        query = session.query(DocumentJob).join(DocumentVersion).join(Document)

        # Default to 2 days ago if no start_date provided
        if start_date is None:
            start_date = datetime.now(timezone.utc) - timedelta(days=2)

        query = query.filter(DocumentJob.created_at >= start_date)

        if status:
            query = query.filter(DocumentJob.status == status)

        query = query.order_by(DocumentJob.created_at.desc())

        jobs = query.all()

        # Count jobs by status (from the filtered results for totals, all recent for counts)
        count_query = session.query(DocumentJob).filter(
            DocumentJob.created_at >= start_date
        )
        all_jobs_for_counts = count_query.all()

        pending_count = sum(1 for j in all_jobs_for_counts if j.status == "pending")
        running_count = sum(1 for j in all_jobs_for_counts if j.status == "running")
        completed_count = sum(1 for j in all_jobs_for_counts if j.status == "completed")
        failed_count = sum(1 for j in all_jobs_for_counts if j.status == "failed")
        cancelled_count = sum(1 for j in all_jobs_for_counts if j.status == "cancelled")

        return JobListResponse(
            jobs=[job_to_response(job) for job in jobs],
            total=len(jobs),
            pending_count=pending_count,
            running_count=running_count,
            completed_count=completed_count,
            failed_count=failed_count,
            cancelled_count=cancelled_count,
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
