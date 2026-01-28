from sqlalchemy import text

from fastapi import APIRouter
from pydantic_ai import UsageLimits

from techpubs_core.database import get_session
from techpubs_core.embeddings import generate_embedding

from config import settings
from schemas.search import ChunkResult, SearchRequest, SearchResponse
from services.search_agent import (
    get_search_agent,
    SearchAgentDeps,
)

router = APIRouter(prefix="/api/search", tags=["search"])


async def _fallback_search(
    query: str,
    limit: int,
    min_similarity: float,
    aircraft_model_id: int | None,
) -> list[ChunkResult]:
    """Fallback to simple vector search if agent fails."""
    query_embedding = generate_embedding(query)

    with get_session() as session:
        sql = """
            SELECT
                dc.id,
                dc.content,
                dc.page_number,
                dc.chapter_title,
                d.guid::text as document_guid,
                d.name as document_name,
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
            "min_similarity": min_similarity,
            "limit": limit,
        }

        if aircraft_model_id is not None:
            sql += " AND d.aircraft_model_id = :aircraft_model_id"
            params["aircraft_model_id"] = aircraft_model_id

        sql += " ORDER BY similarity DESC LIMIT :limit"

        result = session.execute(text(sql), params)
        rows = result.fetchall()

        return [
            ChunkResult(
                id=row.id,
                content=row.content,
                summary=row.content,
                page_number=row.page_number,
                chapter_title=row.chapter_title,
                document_guid=row.document_guid,
                document_name=row.document_name,
                aircraft_model_name=row.aircraft_model_name,
                similarity=float(row.similarity),
            )
            for row in rows
        ]


@router.post("", response_model=SearchResponse)
async def search_documents(request: SearchRequest) -> SearchResponse:
    """
    Search for document chunks using an AI agent with semantic similarity.

    The agent:
    - Executes vector searches (potentially with reformulated queries)
    - Evaluates and filters results for relevance
    - Returns clean, human-readable passages
    """
    agent = get_search_agent()

    try:
        with get_session() as session:
            deps = SearchAgentDeps(
                session=session,
                original_query=request.query,
                aircraft_model_id=request.aircraft_model_id,
                min_similarity=request.min_similarity,
                max_results=request.limit,
            )

            # Run the agent with usage limits to prevent runaway iterations
            # request_limit of max_iterations + 1 allows for the final response
            result = await agent.run(
                f"Find relevant passages for: {request.query}",
                deps=deps,
                usage_limits=UsageLimits(
                    request_limit=settings.agent_search_max_iterations + 1
                ),
            )

            print(f"Agent returned {len(result.output.results)} results")

            # Sort by similarity descending and limit results
            sorted_results = sorted(
                result.output.results,
                key=lambda p: p.similarity,
                reverse=True,
            )[: request.limit]

            # Map agent output to existing response schema
            chunk_results = [
                ChunkResult(
                    id=p.chunk_id,
                    content=p.content,
                    summary=p.content,  # Agent returns cleaned content
                    page_number=p.page_number,
                    chapter_title=p.chapter_title,
                    document_guid=p.document_guid,
                    document_name=p.document_name,
                    aircraft_model_name=p.aircraft_model_name,
                    similarity=p.similarity,
                )
                for p in sorted_results
            ]

            return SearchResponse(
                query=request.query,
                results=chunk_results,
                total_found=len(chunk_results),
            )

    except Exception as e:
        print(f"Agent search failed, falling back to simple search: {e}")
        # Fall back to simple vector search
        results = await _fallback_search(
            request.query,
            request.limit,
            request.min_similarity,
            request.aircraft_model_id,
        )
        return SearchResponse(
            query=request.query,
            results=results,
            total_found=len(results),
        )
