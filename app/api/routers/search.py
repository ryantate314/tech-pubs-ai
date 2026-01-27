import asyncio

from sqlalchemy import text

from fastapi import APIRouter

from techpubs_core.database import get_session
from techpubs_core.embeddings import generate_embedding

from schemas.search import ChunkResult, SearchRequest, SearchResponse
from services.summarization_service import get_summarization_service

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def search_documents(request: SearchRequest) -> SearchResponse:
    """
    Search for document chunks using semantic similarity.

    Generates an embedding for the query and performs cosine similarity
    search against document chunks using pgvector.
    """
    # Generate embedding for the query
    query_embedding = generate_embedding(request.query)

    with get_session() as session:
        # Build the SQL query with optional filters
        sql = """
            SELECT
                dc.id,
                dc.content,
                dc.page_number,
                dc.chapter_title,
                d.guid::text as document_guid,
                d.name as document_name,
                am.code as aircraft_model_code,
                am.name as aircraft_model_name,
                1 - (dc.embedding <=> CAST(:query_embedding AS vector)) as similarity
            FROM document_chunks dc
            JOIN document_versions dv ON dc.document_version_id = dv.id
            JOIN documents d ON dv.document_id = d.id
            LEFT JOIN aircraft_models am ON d.aircraft_model_id = am.id
            WHERE dc.embedding IS NOT NULL
              AND dv.deleted_at IS NULL
              AND d.deleted_at IS NULL
              AND 1 - (dc.embedding <=> CAST(:query_embedding AS vector)) >= :min_similarity
        """

        params = {
            "query_embedding": str(query_embedding),
            "min_similarity": request.min_similarity,
            "limit": request.limit,
        }

        # Add optional filters
        if request.aircraft_model_id is not None:
            sql += " AND d.aircraft_model_id = :aircraft_model_id"
            params["aircraft_model_id"] = request.aircraft_model_id

        sql += " ORDER BY similarity DESC LIMIT :limit"

        result = session.execute(text(sql), params)
        rows = result.fetchall()

        print(f"Found {len(rows)} vector results")

        # Summarize chunks using Azure OpenAI
        summarization_service = get_summarization_service()
        chunk_contents = [row.content for row in rows]
        summaries = await summarization_service.summarize_chunks(chunk_contents, request.query)

        results = [
            ChunkResult(
                id=row.id,
                content=row.content,
                summary=summaries[i],
                page_number=row.page_number,
                chapter_title=row.chapter_title,
                document_guid=row.document_guid,
                document_name=row.document_name,
                aircraft_model_name=row.aircraft_model_name,
                similarity=float(row.similarity),
            )
            for i, row in enumerate(rows)
        ]

        return SearchResponse(
            query=request.query,
            results=results,
            total_found=len(results),
        )
