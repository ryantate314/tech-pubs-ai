from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import aircraft_models, categories, chunks, document_categories, documents, jobs, platforms, search, uploads
from services.cache_service import SearchCacheService
from techpubs_core.database import get_session


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown tasks."""
    # Startup: clean up expired cache entries
    if settings.cache_enabled:
        try:
            with get_session() as session:
                cache_service = SearchCacheService(session)
                embedding_deleted, search_deleted = cache_service.cleanup_expired()
                if embedding_deleted or search_deleted:
                    print(f"Cache cleanup: removed {embedding_deleted} expired embeddings, {search_deleted} expired search results")
        except Exception as e:
            print(f"Cache cleanup on startup failed (non-fatal): {e}")

    yield

    # Shutdown: nothing needed


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(aircraft_models.router)
app.include_router(categories.router)
app.include_router(chunks.router)
app.include_router(documents.router)
app.include_router(document_categories.router)
app.include_router(jobs.router)
app.include_router(platforms.router)
app.include_router(search.router)
app.include_router(uploads.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}