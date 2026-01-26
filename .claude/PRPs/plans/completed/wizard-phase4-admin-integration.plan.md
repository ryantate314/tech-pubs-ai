# Feature: Document Filter Wizard - Phase 4: Admin Integration

## Summary

Add platform, generation, and document type classification fields to the FileUploader component and upload API, allowing admins to classify documents during upload so they appear in wizard search results.

## User Story

As an admin uploading documents
I want to classify them by platform, generation, and document type
So that aircraft owners can find them through the wizard filter

## Problem Statement

Documents uploaded through the admin interface are not classified with the new wizard metadata (platform, generation, document_type), which means they don't appear in wizard search results. The Document model already supports these fields (added in Phase 1), but the upload flow doesn't populate them.

## Solution Statement

Extend the FileUploader component with three cascading dropdowns (Platform -> Generation, DocumentCategory -> DocumentType) and update the upload API to validate and persist these fields when creating Document records.

## Metadata

| Field            | Value                                             |
| ---------------- | ------------------------------------------------- |
| Type             | ENHANCEMENT                                       |
| Complexity       | MEDIUM                                            |
| Systems Affected | app/ui (FileUploader), app/api (uploads router)   |
| Dependencies     | Existing wizard API endpoints (Phase 2)           |
| Estimated Tasks  | 6                                                 |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           ADMIN UPLOAD FORM (BEFORE)                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────────────────┐   ┌─────────────────────────────┐           ║
║   │    Aircraft Model     [▼]   │   │       Category        [▼]   │           ║
║   │    (SR20, SR22, SF50)       │   │    (existing legacy)        │           ║
║   └─────────────────────────────┘   └─────────────────────────────┘           ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────┐             ║
║   │  Document Name: [________________________]                  │             ║
║   └─────────────────────────────────────────────────────────────┘             ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────┐             ║
║   │                    [Drop PDF here]                          │             ║
║   └─────────────────────────────────────────────────────────────┘             ║
║                                                                               ║
║   USER_FLOW: Admin selects model, category, enters name, uploads file         ║
║   PAIN_POINT: No wizard classification fields - documents don't appear        ║
║               in wizard results, only in legacy flat list                     ║
║   DATA_FLOW: Upload -> Document created with aircraft_model_id, category_id   ║
║              platform_id, generation_id, document_type_id = NULL              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           ADMIN UPLOAD FORM (AFTER)                           ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ROW 1: Legacy Fields (existing)                                             ║
║   ┌─────────────────────────────┐   ┌─────────────────────────────┐           ║
║   │    Aircraft Model     [▼]   │   │       Category        [▼]   │           ║
║   └─────────────────────────────┘   └─────────────────────────────┘           ║
║                                                                               ║
║   ROW 2: Wizard Classification (NEW)                                          ║
║   ┌─────────────────────────────┐   ┌─────────────────────────────┐           ║
║   │      Platform         [▼]   │───│      Generation       [▼]   │           ║
║   │    (SR2X or SF50)           │   │  (depends on platform)      │           ║
║   └─────────────────────────────┘   └─────────────────────────────┘           ║
║                                           │ resets when platform changes      ║
║   ROW 3: Document Type Classification     ▼                                   ║
║   ┌─────────────────────────────┐   ┌─────────────────────────────┐           ║
║   │  Document Category    [▼]   │───│   Document Type       [▼]   │           ║
║   │ (Maintenance, Ops, etc)     │   │  (depends on category)      │           ║
║   └─────────────────────────────┘   └─────────────────────────────┘           ║
║                                           │ resets when category changes      ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────┐             ║
║   │  Document Name: [________________________]                  │             ║
║   └─────────────────────────────────────────────────────────────┘             ║
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────┐             ║
║   │                    [Drop PDF here]                          │             ║
║   └─────────────────────────────────────────────────────────────┘             ║
║                                                                               ║
║   USER_FLOW: Admin selects platform -> generation loads -> selects gen        ║
║              Admin selects doc category -> types load -> selects type         ║
║              Admin enters name, uploads file                                  ║
║   VALUE_ADD: Documents now appear in wizard search results                    ║
║   DATA_FLOW: Upload -> Document created with ALL fields populated:            ║
║              aircraft_model_id, category_id, platform_id, generation_id,      ║
║              document_type_id                                                 ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| FileUploader.tsx | 2 dropdowns (model, category) | 6 dropdowns (model, category, platform, generation, docCategory, docType) | Admin can classify documents for wizard |
| Upload validation | Requires model, category | Requires model, category, platform, generation, docCategory, docType | More fields required to upload |
| Document creation | platform_id, generation_id, document_type_id = NULL | All IDs populated from form | Documents appear in wizard results |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/components/upload/FileUploader.tsx` | 1-309 | Component to MODIFY - understand existing state pattern |
| P0 | `app/ui/src/lib/api/wizard.ts` | 1-75 | API functions to REUSE (fetchPlatforms, fetchGenerations, etc.) |
| P0 | `app/ui/src/types/wizard.ts` | 1-33 | Types to IMPORT (Platform, Generation, DocumentCategory, DocumentType) |
| P1 | `app/ui/src/types/uploads.ts` | 1-43 | Types to MODIFY |
| P1 | `app/api/schemas/uploads.py` | 1-31 | Schemas to MODIFY |
| P1 | `app/api/routers/uploads.py` | 1-119 | Router to MODIFY |
| P2 | `packages/techpubs-core/src/techpubs_core/models.py` | 93-113 | Document model reference - note existing fields |

**External Documentation:**

None required - all patterns exist in codebase.

---

## Patterns to Mirror

**DATA_LOADING_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/upload/FileUploader.tsx:47-64
// COPY THIS PATTERN for loading platforms, generations, docCategories, docTypes:
useEffect(() => {
  async function loadAircraftModels() {
    try {
      const data = await fetchAircraftModels();
      setAircraftModels(data);
      if (data.length > 0) {
        setSelectedAircraftModelId(data[0].id);
      }
    } catch (err) {
      setAircraftModelsError(
        err instanceof Error ? err.message : "Failed to load aircraft models"
      );
    } finally {
      setAircraftModelsLoading(false);
    }
  }
  loadAircraftModels();
}, []);
```

**DEPENDENT_DATA_LOADING_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/TypeSelector.tsx:26-37
// COPY THIS PATTERN for loading generations (depends on platform) and types (depends on category):
const loadTypes = useCallback(async () => {
  try {
    setError(null);
    setLoading(true);
    const data = await fetchDocumentTypes(category.id);
    setTypes(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load document types");
  } finally {
    setLoading(false);
  }
}, [category.id]);

useEffect(() => {
  loadTypes();
}, [loadTypes]);
```

**SELECT_DROPDOWN_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/upload/FileUploader.tsx:192-207
// COPY THIS PATTERN for all new dropdowns:
<select
  id="aircraftModel"
  value={selectedAircraftModelId ?? ""}
  onChange={(e) => setSelectedAircraftModelId(Number(e.target.value))}
  disabled={isUploading || aircraftModels.length === 0}
  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
>
  {aircraftModels.map((model) => (
    <option key={model.id} value={model.id}>
      {model.name}
    </option>
  ))}
</select>
```

**LOADING_STATE_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/upload/FileUploader.tsx:183-191
// COPY THIS PATTERN for loading/error states:
{aircraftModelsLoading ? (
  <div className="flex h-10 items-center text-sm text-zinc-500">
    Loading aircraft models...
  </div>
) : aircraftModelsError ? (
  <div className="flex h-10 items-center text-sm text-red-500">
    {aircraftModelsError}
  </div>
) : (
  // ... select element
)}
```

**API_VALIDATION_PATTERN:**
```python
# SOURCE: app/api/routers/uploads.py:40-53
# COPY THIS PATTERN for validating platform, generation, document_type:
aircraft_model = session.query(AircraftModel).filter(
    AircraftModel.id == request.aircraft_model_id,
).first()

if not aircraft_model:
    raise HTTPException(status_code=404, detail="Aircraft model not found")
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/ui/src/types/uploads.ts` | UPDATE | Add platform_id, generation_id, document_type_id to request types |
| `app/api/schemas/uploads.py` | UPDATE | Add platform_id, generation_id, document_type_id to Pydantic schemas |
| `app/api/routers/uploads.py` | UPDATE | Add validation and pass new fields to Document creation |
| `app/ui/src/components/upload/FileUploader.tsx` | UPDATE | Add 4 new dropdowns with cascading dependencies |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Optional fields** - All new fields are required; making them optional adds complexity and reduces data quality
- **Intelligent defaults** - No auto-selection based on aircraft model; keep platform/generation independent
- **Form validation feedback** - Beyond disabling upload button when fields empty; no inline validation messages
- **localStorage persistence** - Not saving form state between sessions
- **Bulk upload** - Single document at a time only

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `app/ui/src/types/uploads.ts`

- **ACTION**: ADD new optional fields to UploadUrlRequest and UploadCompleteRequest
- **IMPLEMENT**:
  - Add `platform_id?: number` to UploadUrlRequest
  - Add `generation_id?: number` to UploadUrlRequest
  - Add `document_type_id?: number` to UploadUrlRequest
  - Add same three fields to UploadCompleteRequest
- **MIRROR**: Lines 1-26 - follow existing field pattern
- **GOTCHA**: Use optional (`?:`) in TypeScript since validation happens on backend; this matches how frontend sends the data
- **VALIDATE**: `cd app/ui && npm run lint`

### Task 2: UPDATE `app/api/schemas/uploads.py`

- **ACTION**: ADD new Optional fields to Pydantic schemas
- **IMPLEMENT**:
  ```python
  from typing import Optional

  class UploadUrlRequest(BaseModel):
      # ... existing fields ...
      platform_id: Optional[int] = None
      generation_id: Optional[int] = None
      document_type_id: Optional[int] = None

  class UploadCompleteRequest(BaseModel):
      # ... existing fields ...
      platform_id: Optional[int] = None
      generation_id: Optional[int] = None
      document_type_id: Optional[int] = None
  ```
- **MIRROR**: Lines 1-26 - follow existing field pattern
- **IMPORTS**: Add `from typing import Optional`
- **GOTCHA**: Fields are Optional so existing uploads without wizard fields still work
- **VALIDATE**: `cd app/api && uv run python -c "from schemas.uploads import UploadUrlRequest, UploadCompleteRequest; print('OK')"`

### Task 3: UPDATE `app/api/routers/uploads.py` - request_upload_url

- **ACTION**: ADD validation for new fields in request_upload_url endpoint
- **IMPLEMENT**: After existing aircraft_model and category validation, add:
  ```python
  from techpubs_core.models import Platform, Generation, DocumentType

  # Validate platform if provided
  if request.platform_id is not None:
      platform = session.query(Platform).filter(
          Platform.id == request.platform_id,
      ).first()
      if not platform:
          raise HTTPException(status_code=404, detail="Platform not found")

  # Validate generation if provided
  if request.generation_id is not None:
      generation = session.query(Generation).filter(
          Generation.id == request.generation_id,
      ).first()
      if not generation:
          raise HTTPException(status_code=404, detail="Generation not found")
      # Verify generation belongs to selected platform
      if request.platform_id is not None and generation.platform_id != request.platform_id:
          raise HTTPException(status_code=400, detail="Generation does not belong to selected platform")

  # Validate document_type if provided
  if request.document_type_id is not None:
      document_type = session.query(DocumentType).filter(
          DocumentType.id == request.document_type_id,
      ).first()
      if not document_type:
          raise HTTPException(status_code=404, detail="Document type not found")
  ```
- **MIRROR**: Lines 40-53 - follow existing validation pattern
- **IMPORTS**: Update line 6 to include Platform, Generation, DocumentType
- **GOTCHA**: Need cross-validation that generation belongs to the selected platform
- **VALIDATE**: `cd app/api && uv run python -c "from routers.uploads import router; print('OK')"`

### Task 4: UPDATE `app/api/routers/uploads.py` - complete_upload

- **ACTION**: ADD validation + Document creation fields in complete_upload endpoint
- **IMPLEMENT**:
  1. Copy same validation from Task 3 into complete_upload (after existing validations)
  2. Update Document creation to include new fields:
  ```python
  document = Document(
      guid=uuid.uuid4(),
      name=request.document_name,
      aircraft_model_id=request.aircraft_model_id,
      category_id=request.category_id,
      platform_id=request.platform_id,
      generation_id=request.generation_id,
      document_type_id=request.document_type_id,
  )
  ```
- **MIRROR**: Lines 84-89 - follow existing Document creation pattern
- **GOTCHA**: New fields are already nullable in Document model so passing None works
- **VALIDATE**: `cd app/api && uv run python -c "from routers.uploads import router; print('OK')"`

### Task 5: UPDATE `app/ui/src/components/upload/FileUploader.tsx` - State & Effects

- **ACTION**: ADD state variables and useEffect hooks for new dropdowns
- **IMPLEMENT**:
  1. Add imports at top:
  ```typescript
  import type { Platform, Generation, DocumentCategory, DocumentType } from "@/types/wizard";
  import { fetchPlatforms, fetchGenerations, fetchDocumentCategories, fetchDocumentTypes } from "@/lib/api/wizard";
  ```

  2. Add state variables after existing state (around line 35):
  ```typescript
  // Wizard classification state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [platformsError, setPlatformsError] = useState<string | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null);

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [generationsLoading, setGenerationsLoading] = useState(false);
  const [generationsError, setGenerationsError] = useState<string | null>(null);
  const [selectedGenerationId, setSelectedGenerationId] = useState<number | null>(null);

  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [documentCategoriesLoading, setDocumentCategoriesLoading] = useState(true);
  const [documentCategoriesError, setDocumentCategoriesError] = useState<string | null>(null);
  const [selectedDocumentCategoryId, setSelectedDocumentCategoryId] = useState<number | null>(null);

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentTypesLoading, setDocumentTypesLoading] = useState(false);
  const [documentTypesError, setDocumentTypesError] = useState<string | null>(null);
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState<number | null>(null);
  ```

  3. Add useEffect for platforms (load on mount):
  ```typescript
  useEffect(() => {
    async function loadPlatforms() {
      try {
        const data = await fetchPlatforms();
        setPlatforms(data);
        if (data.length > 0) {
          setSelectedPlatformId(data[0].id);
        }
      } catch (err) {
        setPlatformsError(
          err instanceof Error ? err.message : "Failed to load platforms"
        );
      } finally {
        setPlatformsLoading(false);
      }
    }
    loadPlatforms();
  }, []);
  ```

  4. Add useEffect for generations (load when platform changes):
  ```typescript
  useEffect(() => {
    if (!selectedPlatformId) {
      setGenerations([]);
      setSelectedGenerationId(null);
      return;
    }

    async function loadGenerations() {
      setGenerationsLoading(true);
      setGenerationsError(null);
      try {
        const data = await fetchGenerations(selectedPlatformId);
        setGenerations(data);
        if (data.length > 0) {
          setSelectedGenerationId(data[0].id);
        } else {
          setSelectedGenerationId(null);
        }
      } catch (err) {
        setGenerationsError(
          err instanceof Error ? err.message : "Failed to load generations"
        );
        setSelectedGenerationId(null);
      } finally {
        setGenerationsLoading(false);
      }
    }
    loadGenerations();
  }, [selectedPlatformId]);
  ```

  5. Add useEffect for document categories (load on mount):
  ```typescript
  useEffect(() => {
    async function loadDocumentCategories() {
      try {
        const data = await fetchDocumentCategories();
        setDocumentCategories(data);
        if (data.length > 0) {
          setSelectedDocumentCategoryId(data[0].id);
        }
      } catch (err) {
        setDocumentCategoriesError(
          err instanceof Error ? err.message : "Failed to load document categories"
        );
      } finally {
        setDocumentCategoriesLoading(false);
      }
    }
    loadDocumentCategories();
  }, []);
  ```

  6. Add useEffect for document types (load when category changes):
  ```typescript
  useEffect(() => {
    if (!selectedDocumentCategoryId) {
      setDocumentTypes([]);
      setSelectedDocumentTypeId(null);
      return;
    }

    async function loadDocumentTypes() {
      setDocumentTypesLoading(true);
      setDocumentTypesError(null);
      try {
        const data = await fetchDocumentTypes(selectedDocumentCategoryId);
        setDocumentTypes(data);
        if (data.length > 0) {
          setSelectedDocumentTypeId(data[0].id);
        } else {
          setSelectedDocumentTypeId(null);
        }
      } catch (err) {
        setDocumentTypesError(
          err instanceof Error ? err.message : "Failed to load document types"
        );
        setSelectedDocumentTypeId(null);
      } finally {
        setDocumentTypesLoading(false);
      }
    }
    loadDocumentTypes();
  }, [selectedDocumentCategoryId]);
  ```

- **MIRROR**: Lines 47-83 for data loading, Lines 66-83 for dependent data loading
- **GOTCHA**: Generations must reset when platform changes; Types must reset when category changes
- **VALIDATE**: `cd app/ui && npm run lint`

### Task 6: UPDATE `app/ui/src/components/upload/FileUploader.tsx` - UI & Handlers

- **ACTION**: UPDATE validation, upload handlers, reset function, and add dropdown JSX
- **IMPLEMENT**:
  1. Update handleReset to reset wizard selections to first item (around line 151):
  ```typescript
  const handleReset = () => {
    setSelectedFile(null);
    setDocumentName("");
    setUploadStatus("idle");
    setUploadProgress(null);
    setUploadError(null);
    setUploadResult(null);
    // Reset wizard selections to first item in each list
    if (platforms.length > 0) {
      setSelectedPlatformId(platforms[0].id);
    }
    if (documentCategories.length > 0) {
      setSelectedDocumentCategoryId(documentCategories[0].id);
    }
    // Note: generations and documentTypes will auto-reset via useEffect
    // when platform/category change triggers re-fetch
  };
  ```

  2. Update handleUpload validation (around line 94):
  ```typescript
  const handleUpload = async () => {
    if (
      !selectedFile ||
      !selectedAircraftModelId ||
      !selectedCategoryId ||
      !selectedPlatformId ||
      !selectedGenerationId ||
      !selectedDocumentCategoryId ||
      !selectedDocumentTypeId ||
      !documentName.trim()
    ) {
      return;
    }
  ```

  3. Update requestUploadUrl call (around line 109):
  ```typescript
  const urlResponse = await requestUploadUrl({
    filename: selectedFile.name,
    content_type: selectedFile.type || "application/octet-stream",
    file_size: selectedFile.size,
    document_name: documentName.trim(),
    aircraft_model_id: selectedAircraftModelId,
    category_id: selectedCategoryId,
    platform_id: selectedPlatformId,
    generation_id: selectedGenerationId,
    document_type_id: selectedDocumentTypeId,
  });
  ```

  4. Update completeUpload call (around line 128):
  ```typescript
  const completeResponse = await completeUpload({
    blob_path: urlResponse.blob_path,
    document_name: documentName.trim(),
    filename: selectedFile.name,
    content_type: selectedFile.type || "application/octet-stream",
    file_size: selectedFile.size,
    aircraft_model_id: selectedAircraftModelId,
    category_id: selectedCategoryId,
    platform_id: selectedPlatformId,
    generation_id: selectedGenerationId,
    document_type_id: selectedDocumentTypeId,
  });
  ```

  5. Update canUpload check (around line 165):
  ```typescript
  const canUpload =
    selectedFile &&
    selectedAircraftModelId &&
    selectedCategoryId &&
    selectedPlatformId &&
    selectedGenerationId &&
    selectedDocumentCategoryId &&
    selectedDocumentTypeId &&
    documentName.trim() &&
    !isUploading &&
    uploadStatus !== "success";
  ```

  6. Add new dropdowns in JSX after the existing Category dropdown (after line 240, before Document Name input). Add these two new rows:

  **Platform/Generation row:**
  ```tsx
  {/* Wizard Classification: Platform & Generation */}
  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <label
        htmlFor="platform"
        className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Platform
      </label>
      {platformsLoading ? (
        <div className="flex h-10 items-center text-sm text-zinc-500">
          Loading platforms...
        </div>
      ) : platformsError ? (
        <div className="flex h-10 items-center text-sm text-red-500">
          {platformsError}
        </div>
      ) : (
        <select
          id="platform"
          value={selectedPlatformId ?? ""}
          onChange={(e) => setSelectedPlatformId(Number(e.target.value))}
          disabled={isUploading || platforms.length === 0}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        >
          {platforms.map((platform) => (
            <option key={platform.id} value={platform.id}>
              {platform.name}
            </option>
          ))}
        </select>
      )}
    </div>

    <div>
      <label
        htmlFor="generation"
        className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Generation
      </label>
      {generationsLoading ? (
        <div className="flex h-10 items-center text-sm text-zinc-500">
          Loading generations...
        </div>
      ) : generationsError ? (
        <div className="flex h-10 items-center text-sm text-red-500">
          {generationsError}
        </div>
      ) : !selectedPlatformId ? (
        <div className="flex h-10 items-center text-sm text-zinc-500">
          Select a platform first
        </div>
      ) : generations.length === 0 ? (
        <div className="flex h-10 items-center text-sm text-zinc-500">
          No generations available
        </div>
      ) : (
        <select
          id="generation"
          value={selectedGenerationId ?? ""}
          onChange={(e) => setSelectedGenerationId(Number(e.target.value))}
          disabled={isUploading || generations.length === 0}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        >
          {generations.map((gen) => (
            <option key={gen.id} value={gen.id}>
              {gen.name}
            </option>
          ))}
        </select>
      )}
    </div>
  </div>
  ```

  **Document Category/Type row:**
  ```tsx
  {/* Wizard Classification: Document Category & Type */}
  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <label
        htmlFor="documentCategory"
        className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Document Category
      </label>
      {documentCategoriesLoading ? (
        <div className="flex h-10 items-center text-sm text-zinc-500">
          Loading document categories...
        </div>
      ) : documentCategoriesError ? (
        <div className="flex h-10 items-center text-sm text-red-500">
          {documentCategoriesError}
        </div>
      ) : (
        <select
          id="documentCategory"
          value={selectedDocumentCategoryId ?? ""}
          onChange={(e) => setSelectedDocumentCategoryId(Number(e.target.value))}
          disabled={isUploading || documentCategories.length === 0}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        >
          {documentCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      )}
    </div>

    <div>
      <label
        htmlFor="documentType"
        className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Document Type
      </label>
      {documentTypesLoading ? (
        <div className="flex h-10 items-center text-sm text-zinc-500">
          Loading document types...
        </div>
      ) : documentTypesError ? (
        <div className="flex h-10 items-center text-sm text-red-500">
          {documentTypesError}
        </div>
      ) : !selectedDocumentCategoryId ? (
        <div className="flex h-10 items-center text-sm text-zinc-500">
          Select a document category first
        </div>
      ) : documentTypes.length === 0 ? (
        <div className="flex h-10 items-center text-sm text-zinc-500">
          No document types available
        </div>
      ) : (
        <select
          id="documentType"
          value={selectedDocumentTypeId ?? ""}
          onChange={(e) => setSelectedDocumentTypeId(Number(e.target.value))}
          disabled={isUploading || documentTypes.length === 0}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        >
          {documentTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      )}
    </div>
  </div>
  ```

- **MIRROR**: Lines 175-240 for dropdown structure and classes
- **GOTCHA**: Generation dropdown shows "Select a platform first" when no platform selected; same pattern for document type
- **VALIDATE**: `cd app/ui && npm run lint && npm run build`

---

## Testing Strategy

### Manual Testing Steps

1. **Start API and UI servers**
   - `cd app/api && uv run uvicorn main:app --reload`
   - `cd app/ui && npm run dev`

2. **Navigate to upload page**
   - Go to `http://localhost:3000/admin/upload` (or wherever FileUploader is mounted)

3. **Verify dropdowns load**
   - Platform dropdown loads SR2X, SF50
   - Document Category dropdown loads Maintenance, Operations, etc.
   - Generation dropdown shows "Select a platform first"
   - Document Type dropdown shows "Select a document category first"

4. **Test cascading behavior**
   - Select SR2X platform -> Generations dropdown loads G1-G7
   - Select SF50 platform -> Generations dropdown loads different generations
   - Change platform -> Generation selection resets
   - Select Maintenance category -> Types dropdown loads AMM, IPC, etc.
   - Change category -> Type selection resets

5. **Test upload validation**
   - Try to upload without all fields -> Button should be disabled
   - Fill all fields -> Button enabled

6. **Test full upload flow**
   - Fill all fields, select file, upload
   - Verify document appears in wizard results at `/wizard`

### Edge Cases Checklist

- [ ] Platform with no generations defined
- [ ] Document category with no types defined
- [ ] API returns error loading platforms/generations
- [ ] Upload succeeds with all wizard fields populated
- [ ] Uploaded document appears in wizard filter results
- [ ] handleReset resets wizard selections when uploading another document

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && npm run lint
cd app/api && uv run ruff check .
```

**EXPECT**: Exit 0, no errors

### Level 2: TYPE_CHECK

```bash
cd app/ui && npm run build
```

**EXPECT**: Build succeeds with no TypeScript errors

### Level 3: IMPORT_VERIFICATION

```bash
cd app/api && uv run python -c "from routers.uploads import router; from schemas.uploads import UploadUrlRequest, UploadCompleteRequest; print('OK')"
```

**EXPECT**: Prints "OK" with no import errors

### Level 4: MANUAL_VALIDATION

See "Manual Testing Steps" above.

---

## Acceptance Criteria

- [ ] All 4 wizard classification dropdowns appear in FileUploader
- [ ] Platform -> Generation cascading works (generations load when platform selected, reset when platform changes)
- [ ] DocumentCategory -> DocumentType cascading works (types load when category selected, reset when category changes)
- [ ] Upload button disabled until all fields populated
- [ ] Upload API validates all new fields
- [ ] Document created with platform_id, generation_id, document_type_id populated
- [ ] Newly uploaded documents appear in wizard search results

---

## Completion Checklist

- [ ] Task 1: Upload types updated with new fields
- [ ] Task 2: Pydantic schemas updated with new fields
- [ ] Task 3: request_upload_url validation added
- [ ] Task 4: complete_upload validation + Document creation updated
- [ ] Task 5: FileUploader state + effects added
- [ ] Task 6: FileUploader UI + handlers updated
- [ ] Level 1: Lint passes (UI + API)
- [ ] Level 2: UI build succeeds
- [ ] Level 3: API imports work
- [ ] Level 4: Manual testing passes
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Existing uploads break | LOW | HIGH | New fields are Optional with None defaults; existing code paths unchanged |
| UI becomes cluttered with 6 dropdowns | MEDIUM | MEDIUM | Use 3 rows of 2 columns; group by purpose |
| User confusion about which fields to select | MEDIUM | LOW | Labels are clear; cascading behavior guides selection |

---

## Notes

- The Document model already has platform_id, generation_id, document_type_id fields (added in Phase 1), so no database migration needed
- Existing wizard API endpoints (Phase 2) are reused - no new API endpoints required
- The legacy aircraft_model and category fields are kept for backward compatibility; they serve different purposes than the wizard fields
- Consider Phase 5 to add form persistence with localStorage so admins don't lose selections when navigating away
- handleReset must reset wizard selections so "Upload Another" flow works correctly with pre-populated dropdowns

**Confidence: 10/10** - All patterns exist in codebase with exact code snippets to mirror; Document model has required fields; wizard API endpoints tested in Phase 2/3; all edge cases (cascading resets, handleReset) explicitly addressed.
