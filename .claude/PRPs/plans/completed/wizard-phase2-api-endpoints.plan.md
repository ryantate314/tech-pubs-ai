# Feature: Document Filter Wizard - Phase 2: API Endpoints

## Summary

Create FastAPI endpoints to expose wizard reference data (platforms, generations, document categories, document types) and enhance the existing documents endpoint with filter parameters. This enables the wizard UI to fetch options at each step and retrieve filtered document results.

## User Story

As a frontend developer building the wizard UI
I want REST API endpoints that return platforms, generations, categories, and document types
So that I can populate each wizard step with the correct options and filter documents

## Problem Statement

The wizard UI needs to fetch:
1. List of platforms (step 1)
2. Generations for a selected platform (step 2)
3. Document categories (step 3)
4. Document types for a selected category (step 4)
5. Documents filtered by all selections (results)

Currently no API endpoints exist for this data.

## Solution Statement

Create 4 new router files following existing patterns (aircraft_models.py, categories.py), plus enhance the existing documents router with optional filter query parameters. All endpoints return JSON with Pydantic validation.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | app/api/routers, app/api/schemas |
| Dependencies | FastAPI, Pydantic, SQLAlchemy, techpubs-core |
| Estimated Tasks | 8 |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   Frontend                        API                          Database       ║
║   ┌─────────┐                 ┌─────────┐                   ┌─────────┐      ║
║   │ Wizard  │ ───── ? ─────► │ No      │ ────── X ───────► │platforms│      ║
║   │   UI    │                │endpoints│                    │genera...|      ║
║   └─────────┘                │ exist   │                    │doc_cat..|      ║
║                              └─────────┘                    │doc_type.|      ║
║                                                             └─────────┘      ║
║                                                                               ║
║   DATA_FLOW: No way to fetch wizard reference data                           ║
║   PAIN_POINT: Cannot build wizard without API endpoints                       ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   Frontend                        API                          Database       ║
║   ┌─────────┐                 ┌─────────┐                   ┌─────────┐      ║
║   │ Step 1  │ ─── GET ──────►│/platforms│ ─── query ──────►│platforms│      ║
║   │Platform │◄─── JSON ──────│         │◄─── results ──────│         │      ║
║   └────┬────┘                └─────────┘                   └─────────┘      ║
║        │                                                                      ║
║        ▼                                                                      ║
║   ┌─────────┐                 ┌─────────┐                   ┌─────────┐      ║
║   │ Step 2  │ ─── GET ──────►│/platforms│ ─── query ──────►│generatio│      ║
║   │ Gener.  │◄─── JSON ──────│/{id}/gen │◄─── filtered ────│ns       │      ║
║   └────┬────┘                └─────────┘                   └─────────┘      ║
║        │                                                                      ║
║        ▼                                                                      ║
║   ┌─────────┐                 ┌─────────┐                   ┌─────────┐      ║
║   │ Step 3  │ ─── GET ──────►│/document-│ ─── query ──────►│document_│      ║
║   │Category │◄─── JSON ──────│categories│◄─── results ──────│categories│     ║
║   └────┬────┘                └─────────┘                   └─────────┘      ║
║        │                                                                      ║
║        ▼                                                                      ║
║   ┌─────────┐                 ┌─────────┐                   ┌─────────┐      ║
║   │ Step 4  │ ─── GET ──────►│/document-│ ─── query ──────►│document_│      ║
║   │  Type   │◄─── JSON ──────│cat/{id}/ │◄─── filtered ────│types    │      ║
║   └────┬────┘                │types     │                   └─────────┘      ║
║        │                     └─────────┘                                      ║
║        ▼                                                                      ║
║   ┌─────────┐                 ┌─────────┐                   ┌─────────┐      ║
║   │ Results │ ─── GET ──────►│/documents│ ─── filtered ───►│documents│      ║
║   │  List   │◄─── JSON ──────│?filters  │◄─── query ───────│         │      ║
║   └─────────┘                └─────────┘                   └─────────┘      ║
║                                                                               ║
║   DATA_FLOW: Each step fetches options → user selects → next step loads      ║
║   VALUE_ADD: Complete API for wizard implementation                          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### API Endpoints Summary
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/platforms` | GET | List all platforms (SR2X, SF50) |
| `/api/platforms/{id}/generations` | GET | List generations for a platform |
| `/api/document-categories` | GET | List all document categories |
| `/api/document-categories/{id}/types` | GET | List document types for a category |
| `/api/documents` | GET | Enhanced with filter query params |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/api/routers/aircraft_models.py` | all | Simple list endpoint pattern to MIRROR |
| P0 | `app/api/routers/categories.py` | all | List with soft-delete filter pattern |
| P0 | `app/api/schemas/aircraft_models.py` | all | Pydantic response model pattern |
| P1 | `app/api/routers/documents.py` | 99-154 | Nested resource with path param pattern |
| P1 | `app/api/routers/jobs.py` | 31-75 | Optional query parameters pattern |
| P1 | `app/api/main.py` | all | Router registration pattern |
| P2 | `packages/techpubs-core/src/techpubs_core/models.py` | 25-79 | Platform, Generation, DocumentCategory, DocumentType models |

---

## Patterns to Mirror

**SIMPLE_LIST_ROUTER** (aircraft_models.py:1-18):
```python
# SOURCE: app/api/routers/aircraft_models.py:1-18
from fastapi import APIRouter

from techpubs_core.database import get_session
from techpubs_core.models import AircraftModel

from schemas.aircraft_models import AircraftModelResponse

router = APIRouter(prefix="/api/aircraft-models", tags=["aircraft-models"])

@router.get("", response_model=list[AircraftModelResponse])
def list_aircraft_models() -> list[AircraftModelResponse]:
    """List all aircraft models."""
    with get_session() as session:
        models = session.query(AircraftModel).all()
        return [
            AircraftModelResponse(id=m.id, code=m.code, name=m.name) for m in models
        ]
```

**PYDANTIC_RESPONSE** (schemas/aircraft_models.py):
```python
# SOURCE: app/api/schemas/aircraft_models.py
from pydantic import BaseModel

class AircraftModelResponse(BaseModel):
    id: int
    code: str
    name: str
```

**PATH_PARAMETER_ENDPOINT** (documents.py:99-111):
```python
# SOURCE: app/api/routers/documents.py:99-111
@router.get("/{guid}", response_model=DocumentDetailResponse)
def get_document(guid: str) -> DocumentDetailResponse:
    """Get document details by GUID."""
    with get_session() as session:
        document = (
            session.query(Document)
            .filter(Document.guid == guid, Document.deleted_at.is_(None))
            .first()
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
```

**OPTIONAL_QUERY_PARAMS** (jobs.py:31-51):
```python
# SOURCE: app/api/routers/jobs.py:31-51
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

@router.get("", response_model=JobListResponse)
def list_jobs(
    status: Optional[str] = Query(None, description="Filter by job status"),
) -> JobListResponse:
    """List document ingestion jobs with optional filters."""
    with get_session() as session:
        query = session.query(DocumentJob)

        if status:
            query = query.filter(DocumentJob.status == status)

        jobs = query.all()
```

**ROUTER_REGISTRATION** (main.py:21-25):
```python
# SOURCE: app/api/main.py:21-25
app.include_router(aircraft_models.router)
app.include_router(categories.router)
app.include_router(documents.router)
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/api/schemas/platforms.py` | CREATE | Pydantic response models for platforms |
| `app/api/schemas/generations.py` | CREATE | Pydantic response models for generations |
| `app/api/schemas/document_categories.py` | CREATE | Pydantic response models for document categories |
| `app/api/schemas/document_types.py` | CREATE | Pydantic response models for document types |
| `app/api/routers/platforms.py` | CREATE | Platforms and nested generations endpoints |
| `app/api/routers/document_categories.py` | CREATE | Document categories and nested types endpoints |
| `app/api/routers/documents.py` | UPDATE | Add filter query parameters |
| `app/api/main.py` | UPDATE | Register new routers |

---

## NOT Building (Scope Limits)

- **Authentication/Authorization** - All endpoints are public (like existing endpoints)
- **Pagination** - Reference data is small, not needed
- **Caching** - Can be added later if performance requires
- **Document creation with new fields** - Phase 4 (Admin Integration) handles this

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `app/api/schemas/platforms.py`

- **ACTION**: CREATE Pydantic response model for platforms
- **IMPLEMENT**:

```python
from typing import Optional
from pydantic import BaseModel


class PlatformResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True
```

- **MIRROR**: `app/api/schemas/aircraft_models.py`
- **VALIDATE**: `cd app/api && uv run python -c "from schemas.platforms import PlatformResponse; print('OK')"`

### Task 2: CREATE `app/api/schemas/generations.py`

- **ACTION**: CREATE Pydantic response model for generations
- **IMPLEMENT**:

```python
from pydantic import BaseModel


class GenerationResponse(BaseModel):
    id: int
    code: str
    name: str
    display_order: int

    class Config:
        from_attributes = True
```

- **MIRROR**: `app/api/schemas/aircraft_models.py`
- **VALIDATE**: `cd app/api && uv run python -c "from schemas.generations import GenerationResponse; print('OK')"`

### Task 3: CREATE `app/api/schemas/document_categories.py`

- **ACTION**: CREATE Pydantic response model for document categories
- **IMPLEMENT**:

```python
from typing import Optional
from pydantic import BaseModel


class DocumentCategoryResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True
```

- **MIRROR**: `app/api/schemas/aircraft_models.py`
- **VALIDATE**: `cd app/api && uv run python -c "from schemas.document_categories import DocumentCategoryResponse; print('OK')"`

### Task 4: CREATE `app/api/schemas/document_types.py`

- **ACTION**: CREATE Pydantic response model for document types
- **IMPLEMENT**:

```python
from typing import Optional
from pydantic import BaseModel


class DocumentTypeResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True
```

- **MIRROR**: `app/api/schemas/aircraft_models.py`
- **VALIDATE**: `cd app/api && uv run python -c "from schemas.document_types import DocumentTypeResponse; print('OK')"`

### Task 5: CREATE `app/api/routers/platforms.py`

- **ACTION**: CREATE router with two endpoints: list platforms, list generations for platform
- **IMPLEMENT**:

```python
from fastapi import APIRouter, HTTPException

from techpubs_core.database import get_session
from techpubs_core.models import Platform, Generation

from schemas.platforms import PlatformResponse
from schemas.generations import GenerationResponse

router = APIRouter(prefix="/api/platforms", tags=["platforms"])


@router.get("", response_model=list[PlatformResponse])
def list_platforms() -> list[PlatformResponse]:
    """List all aircraft platforms."""
    with get_session() as session:
        platforms = session.query(Platform).order_by(Platform.display_order).all()
        return [
            PlatformResponse(
                id=p.id,
                code=p.code,
                name=p.name,
                description=p.description,
                display_order=p.display_order,
            )
            for p in platforms
        ]


@router.get("/{platform_id}/generations", response_model=list[GenerationResponse])
def list_generations_for_platform(platform_id: int) -> list[GenerationResponse]:
    """List generations for a specific platform."""
    with get_session() as session:
        # Verify platform exists
        platform = session.query(Platform).filter(Platform.id == platform_id).first()
        if not platform:
            raise HTTPException(status_code=404, detail="Platform not found")

        generations = (
            session.query(Generation)
            .filter(Generation.platform_id == platform_id)
            .order_by(Generation.display_order)
            .all()
        )
        return [
            GenerationResponse(
                id=g.id,
                code=g.code,
                name=g.name,
                display_order=g.display_order,
            )
            for g in generations
        ]
```

- **MIRROR**: `app/api/routers/aircraft_models.py` and `app/api/routers/documents.py:99-111`
- **GOTCHA**: Use `order_by(display_order)` for consistent ordering
- **VALIDATE**: `cd app/api && uv run python -c "from routers.platforms import router; print('OK')"`

### Task 6: CREATE `app/api/routers/document_categories.py`

- **ACTION**: CREATE router with two endpoints: list categories, list types for category
- **IMPLEMENT**:

```python
from fastapi import APIRouter, HTTPException

from techpubs_core.database import get_session
from techpubs_core.models import DocumentCategory, DocumentType

from schemas.document_categories import DocumentCategoryResponse
from schemas.document_types import DocumentTypeResponse

router = APIRouter(prefix="/api/document-categories", tags=["document-categories"])


@router.get("", response_model=list[DocumentCategoryResponse])
def list_document_categories() -> list[DocumentCategoryResponse]:
    """List all document categories."""
    with get_session() as session:
        categories = (
            session.query(DocumentCategory)
            .order_by(DocumentCategory.display_order)
            .all()
        )
        return [
            DocumentCategoryResponse(
                id=c.id,
                code=c.code,
                name=c.name,
                description=c.description,
                display_order=c.display_order,
            )
            for c in categories
        ]


@router.get("/{category_id}/types", response_model=list[DocumentTypeResponse])
def list_types_for_category(category_id: int) -> list[DocumentTypeResponse]:
    """List document types for a specific category."""
    with get_session() as session:
        # Verify category exists
        category = (
            session.query(DocumentCategory)
            .filter(DocumentCategory.id == category_id)
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Document category not found")

        types = (
            session.query(DocumentType)
            .filter(DocumentType.document_category_id == category_id)
            .order_by(DocumentType.display_order)
            .all()
        )
        return [
            DocumentTypeResponse(
                id=t.id,
                code=t.code,
                name=t.name,
                description=t.description,
                display_order=t.display_order,
            )
            for t in types
        ]
```

- **MIRROR**: `app/api/routers/platforms.py` (Task 5)
- **VALIDATE**: `cd app/api && uv run python -c "from routers.document_categories import router; print('OK')"`

### Task 7: UPDATE `app/api/routers/documents.py` - Add filter query parameters

- **ACTION**: ADD optional query parameters to the list_documents endpoint
- **IMPLEMENT**: Add these parameters to the existing `list_documents` function and filter logic:

```python
# Add these imports at the top
from typing import Optional
from fastapi import Query

# Add to techpubs_core.models import:
from techpubs_core.models import (
    AircraftModel,
    Category,
    Document,
    DocumentJob,
    DocumentVersion,
    DocumentType,  # ADD THIS
)

# Modify the list_documents function signature and add filter logic:
@router.get("", response_model=DocumentListResponse)
def list_documents(
    platform_id: Optional[int] = Query(None, description="Filter by platform ID"),
    generation_id: Optional[int] = Query(None, description="Filter by generation ID"),
    document_type_id: Optional[int] = Query(None, description="Filter by document type ID"),
) -> DocumentListResponse:
    """List all documents with optional filters."""
    with get_session() as session:
        # ... existing subquery setup ...

        # Add to the main query after existing filters
        # (before .order_by)

        if platform_id is not None:
            query = query.filter(Document.platform_id == platform_id)

        if generation_id is not None:
            query = query.filter(Document.generation_id == generation_id)

        if document_type_id is not None:
            query = query.filter(Document.document_type_id == document_type_id)

        # ... rest of existing code ...
```

- **MIRROR**: `app/api/routers/jobs.py:31-51` for query parameter pattern
- **GOTCHA**: Add filter conditions BEFORE the `.order_by()` call
- **VALIDATE**: `cd app/api && uv run python -c "from routers.documents import router; print('OK')"`

### Task 8: UPDATE `app/api/main.py` - Register new routers

- **ACTION**: ADD imports and include_router calls for platforms and document_categories
- **IMPLEMENT**:

```python
# Add to imports
from routers import aircraft_models, categories, document_categories, documents, jobs, platforms, uploads

# Add after existing include_router calls
app.include_router(platforms.router)
app.include_router(document_categories.router)
```

- **MIRROR**: Existing `app.include_router()` calls
- **VALIDATE**: `cd app/api && uv run python -c "from main import app; print('Routers registered:', len(app.routes))"`

---

## Testing Strategy

### Manual API Testing

After starting the server with `uv run uvicorn main:app --reload`:

| Endpoint | Expected Result |
|----------|-----------------|
| `GET /api/platforms` | Returns 2 platforms (SR2X, SF50) |
| `GET /api/platforms/1/generations` | Returns 7 generations for SR2X |
| `GET /api/platforms/2/generations` | Returns 3 generations for SF50 |
| `GET /api/platforms/999/generations` | Returns 404 |
| `GET /api/document-categories` | Returns 4 categories |
| `GET /api/document-categories/1/types` | Returns 8 service publication types |
| `GET /api/document-categories/999/types` | Returns 404 |
| `GET /api/documents?platform_id=1` | Returns only SR2X documents |
| `GET /api/documents?document_type_id=1` | Returns only AMM documents |

### Edge Cases Checklist

- [x] Non-existent platform_id returns 404
- [x] Non-existent category_id returns 404
- [x] Empty filter returns all documents (existing behavior)
- [x] Multiple filters combine with AND logic
- [x] Results ordered by display_order

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/api && uv run python -c "
from schemas.platforms import PlatformResponse
from schemas.generations import GenerationResponse
from schemas.document_categories import DocumentCategoryResponse
from schemas.document_types import DocumentTypeResponse
from routers.platforms import router as platforms_router
from routers.document_categories import router as doc_cat_router
from main import app
print('All imports OK')
"
```

**EXPECT**: Exit 0, prints "All imports OK"

### Level 2: SERVER_STARTUP

```bash
cd app/api && timeout 5 uv run uvicorn main:app --host 0.0.0.0 --port 8000 || true
```

**EXPECT**: Server starts without import errors (will timeout after 5s which is fine)

### Level 3: API_VALIDATION (requires DB connection)

```bash
# Start server in background
cd app/api && uv run uvicorn main:app --host 0.0.0.0 --port 8000 &
sleep 3

# Test endpoints
curl -s http://localhost:8000/api/platforms | python -m json.tool
curl -s http://localhost:8000/api/platforms/1/generations | python -m json.tool
curl -s http://localhost:8000/api/document-categories | python -m json.tool
curl -s http://localhost:8000/api/document-categories/1/types | python -m json.tool

# Kill server
pkill -f "uvicorn main:app"
```

**EXPECT**: JSON responses with correct data

### Level 4: SWAGGER_VALIDATION

Navigate to `http://localhost:8000/docs` and verify:
- [ ] Platforms endpoints appear under "platforms" tag
- [ ] Document Categories endpoints appear under "document-categories" tag
- [ ] Documents endpoint shows new query parameters

---

## Acceptance Criteria

- [ ] `GET /api/platforms` returns list of platforms ordered by display_order
- [ ] `GET /api/platforms/{id}/generations` returns generations for platform
- [ ] `GET /api/platforms/{id}/generations` returns 404 for non-existent platform
- [ ] `GET /api/document-categories` returns list of categories
- [ ] `GET /api/document-categories/{id}/types` returns types for category
- [ ] `GET /api/document-categories/{id}/types` returns 404 for non-existent category
- [ ] `GET /api/documents?platform_id=X` filters by platform
- [ ] `GET /api/documents?generation_id=X` filters by generation
- [ ] `GET /api/documents?document_type_id=X` filters by document type
- [ ] Multiple filter params combine with AND logic
- [ ] All endpoints appear in Swagger docs (`/docs`)
- [ ] Server starts without errors

---

## Completion Checklist

- [ ] Task 1: PlatformResponse schema created
- [ ] Task 2: GenerationResponse schema created
- [ ] Task 3: DocumentCategoryResponse schema created
- [ ] Task 4: DocumentTypeResponse schema created
- [ ] Task 5: platforms.py router created
- [ ] Task 6: document_categories.py router created
- [ ] Task 7: documents.py updated with filter params
- [ ] Task 8: main.py updated to register routers
- [ ] Level 1 validation passes (imports)
- [ ] Level 2 validation passes (server startup)
- [ ] Level 3 validation passes (API responses)
- [ ] Level 4 validation passes (Swagger docs)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Import errors from techpubs-core | LOW | MEDIUM | Models already exported in __init__.py |
| Circular imports between routers/schemas | LOW | MEDIUM | Schemas don't import from routers |
| Missing database connection | MEDIUM | HIGH | Ensure .env is configured with DATABASE_URL |

---

## Notes

- All new endpoints follow existing patterns exactly (aircraft_models.py, categories.py)
- No authentication required (matching existing public endpoints)
- display_order column ensures consistent UI ordering across requests
- Filter parameters use simple equality - no complex queries needed
- 404 errors include descriptive messages for debugging
