# Feature: Model Sidebar Filter

## Summary

Add an aircraft model dropdown filter to the existing sidebar (SR20, SR22, SR22T, SF50) and a corresponding `aircraft_model_id` query parameter to the backend `GET /api/documents` endpoint. The model dropdown is independent (not cascading from platform) since `AircraftModel` has no `platform_id` foreign key in the database. This gives users a fifth filter dimension and is a prerequisite for Phase 6 (My Aircraft) which needs model selection.

## User Story

As a service center technician or aircraft owner
I want to filter documents by aircraft model in the sidebar
So that I can see only documents for a specific model (e.g., SR22) without manually searching

## Problem Statement

The sidebar currently filters by platform, generation, category, and document type. There is no way to filter by specific aircraft model (SR20, SR22, SR22T, SF50). The `Document` table has an `aircraft_model_id` foreign key, and the backend already joins `AircraftModel` for the `aircraft_model_code` display field, but no filter parameter exists. Users must rely on the search bar to type model codes, which is imprecise.

## Solution Statement

Add `aircraft_model_id` as a query parameter to `GET /api/documents` on the backend, following the exact same filter pattern as `platform_id` and `generation_id`. On the frontend, add a model dropdown to the sidebar between Platform and Generation, load models on mount using the existing `fetchAircraftModels()` API function, and wire the selection through `page.tsx` state into `fetchFilteredDocuments()`. The model dropdown is always enabled (independent filter, no cascading dependency).

## Metadata

| Field            | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| Type             | ENHANCEMENT                                                |
| Complexity       | LOW                                                        |
| Systems Affected | `app/api/routers/documents.py`, `app/ui/src/components/browser/Sidebar.tsx`, `app/ui/src/app/page.tsx`, `app/ui/src/lib/api/wizard.ts` |
| Dependencies     | None new (reuses existing `fetchAircraftModels`, `AircraftModel` type, backend model) |
| Estimated Tasks  | 5                                                          |

---

## UX Design

### Before State

```
┌─────────────────────────────────────────────────────────────────────┐
│ TopBar: [Logo] [Technical Publications]          [Search...]        │
├──────────┬──────────────────────────────────────────────────────────┤
│ Sidebar  │ Main Content                                             │
│          │                                                          │
│ Filters: │ ContentHeader + DocumentCardGrid/Table + Pagination      │
│ Platform │                                                          │
│ Generat. │  (filtered by 4 dimensions)                              │
│ Category │                                                          │
│ Doc Type │                                                          │
│          │                                                          │
│ [Clear]  │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘

- 4 filter dimensions: Platform, Generation, Category, Document Type
- No way to filter by specific aircraft model (SR20, SR22, SR22T, SF50)
- Users must type model codes into search bar to find model-specific docs
- Backend has no aircraft_model_id filter parameter
```

### After State

```
┌─────────────────────────────────────────────────────────────────────┐
│ TopBar: [Logo] [Technical Publications]          [Search...]        │
├──────────┬──────────────────────────────────────────────────────────┤
│ Sidebar  │ Main Content                                             │
│          │                                                          │
│ Filters: │ ContentHeader + DocumentCardGrid/Table + Pagination      │
│ Platform │                                                          │
│ Model    │  (filtered by 5 dimensions)                              │
│ Generat. │                                                          │
│ Category │                                                          │
│ Doc Type │                                                          │
│          │                                                          │
│ [Clear]  │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘

- 5 filter dimensions: Platform, Model, Generation, Category, Document Type
- Model dropdown shows SR20, SR22, SR22T, SF50 (always enabled, not cascading)
- Backend supports aircraft_model_id filter parameter
- Model filter combines with all other filters
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Sidebar | 4 filters (platform, generation, category, doc type) | 5 filters (platform, model, generation, category, doc type) | Users can filter by specific aircraft model directly |
| Backend `GET /api/documents` | No `aircraft_model_id` param | Accepts `aircraft_model_id` query param | Precise server-side model filtering |
| Clear Filters | Clears 4 filters | Clears 5 filters (includes model) | Single action resets all filters |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/components/browser/Sidebar.tsx` | 1-227 | Pattern to EXTEND: add model dropdown between Platform (line 91) and Generation (line 121) |
| P0 | `app/ui/src/app/page.tsx` | 1-361 | Integration point: all state management, filter loading patterns, handler patterns |
| P0 | `app/api/routers/documents.py` | 23-108 | Backend filter pattern: add `aircraft_model_id` parameter and filter clause |
| P1 | `app/ui/src/lib/api/wizard.ts` | 21-54 | `FetchFilteredDocumentsParams` interface and `fetchFilteredDocuments()` — add `aircraftModelId` |
| P1 | `app/ui/src/lib/api/aircraft-models.ts` | 1-6 | Existing `fetchAircraftModels()` function to IMPORT in page.tsx |
| P1 | `app/ui/src/types/aircraft-models.ts` | 1-5 | Existing `AircraftModel` type to IMPORT |

---

## Patterns to Mirror

**INDEPENDENT_DROPDOWN (platform dropdown — model follows same pattern, always enabled):**
```typescript
// SOURCE: app/ui/src/components/browser/Sidebar.tsx:91-118
<div>
  <label
    htmlFor="sidebar-platform"
    className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
  >
    Platform
  </label>
  {platformsLoading ? (
    <div className="h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
  ) : (
    <select
      id="sidebar-platform"
      value={selectedPlatformId ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        onPlatformChange(val ? Number(val) : null);
      }}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    >
      <option value="">All Platforms</option>
      {platforms.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  )}
</div>
```

**LOAD_ON_MOUNT_PATTERN (platforms loaded on mount — model follows same pattern):**
```typescript
// SOURCE: app/ui/src/app/page.tsx:70-84
const loadPlatforms = useCallback(async () => {
  try {
    setPlatformsLoading(true);
    const data = await fetchPlatforms();
    setPlatforms(data);
  } catch {
    // non-critical
  } finally {
    setPlatformsLoading(false);
  }
}, []);

useEffect(() => {
  loadPlatforms();
}, [loadPlatforms]);
```

**SIMPLE_HANDLER (generation handler — model follows same pattern, no dependent reset):**
```typescript
// SOURCE: app/ui/src/app/page.tsx:205-207
const handleGenerationChange = useCallback((id: number | null) => {
  setSelectedGenerationId(id);
}, []);
```

**BACKEND_FILTER_PATTERN (adding a filter clause):**
```python
# SOURCE: app/api/routers/documents.py:86-90
# Apply optional filters
if platform_id is not None:
    query = query.filter(Document.platform_id == platform_id)

if generation_id is not None:
    query = query.filter(Document.generation_id == generation_id)
```

**FRONTEND_FILTER_PARAM_PATTERN (adding a param to fetchFilteredDocuments):**
```typescript
// SOURCE: app/ui/src/lib/api/wizard.ts:34-39
if (params.platformId) {
  searchParams.set("platform_id", String(params.platformId));
}
if (params.generationId) {
  searchParams.set("generation_id", String(params.generationId));
}
```

---

## Files to Change

| File | Action | Justification |
| ---- | ------ | ------------- |
| `app/api/routers/documents.py` | UPDATE | Add `aircraft_model_id` query parameter and filter clause to `list_documents()` |
| `app/ui/src/lib/api/wizard.ts` | UPDATE | Add `aircraftModelId` to `FetchFilteredDocumentsParams` and the query string builder |
| `app/ui/src/app/page.tsx` | UPDATE | Add model state, loading effect, handler. Wire to sidebar and `fetchFilteredDocuments`. Update `hasActiveFilters` and `handleClearFilters` |
| `app/ui/src/components/browser/Sidebar.tsx` | UPDATE | Add model dropdown props and render the dropdown between Platform and Generation |

---

## NOT Building (Scope Limits)

- **"My Aircraft" configurator** — Phase 6 scope. We add the model filter to the sidebar, but the TopBar "My Aircraft" feature is separate
- **Match indicators on documents** — Phase 6 scope. Requires "My Aircraft" first
- **Model cascading from platform** — The `AircraftModel` table has no `platform_id` FK, so the model dropdown is independent. Logically SR20/SR22/SR22T belong to SR2X and SF50 belongs to SF50, but we don't enforce this in the UI
- **Model-generation cascading** — No relationship between models and generations in the DB schema. Both are independent filters
- **Adding model name to document cards/table** — The `aircraft_model_code` is already displayed. No new display changes

---

## Step-by-Step Tasks

### Task 1: UPDATE `app/api/routers/documents.py` — Add `aircraft_model_id` filter parameter

- **ACTION**: Add `aircraft_model_id` query parameter to the `list_documents` endpoint and a corresponding filter clause
- **IMPLEMENT**:
  - Add parameter to function signature (after `document_category_id`):
    ```python
    aircraft_model_id: Optional[int] = Query(None, description="Filter by aircraft model ID"),
    ```
  - Add filter clause (after the `document_category_id` filter block, before the `search` block):
    ```python
    if aircraft_model_id is not None:
        query = query.filter(Document.aircraft_model_id == aircraft_model_id)
    ```
- **MIRROR**: `app/api/routers/documents.py:86-90` — follows identical pattern to `platform_id` and `generation_id` filters
- **GOTCHA**: The query already has `outerjoin(AircraftModel, Document.aircraft_model_id == AircraftModel.id)` at line 68, so filtering by `Document.aircraft_model_id` directly works without additional joins
- **VALIDATE**: Start the API server and test: `curl "http://localhost:8000/api/documents?aircraft_model_id=1"` should return only documents for that model

### Task 2: UPDATE `app/ui/src/lib/api/wizard.ts` — Add `aircraftModelId` to fetch params

- **ACTION**: Add the new filter parameter to the `FetchFilteredDocumentsParams` interface and the query string builder
- **IMPLEMENT**:
  - Add to interface (after `documentCategoryId`):
    ```typescript
    aircraftModelId?: number;
    ```
  - Add to query string builder (after the `documentCategoryId` block):
    ```typescript
    if (params.aircraftModelId) {
      searchParams.set("aircraft_model_id", String(params.aircraftModelId));
    }
    ```
- **MIRROR**: `app/ui/src/lib/api/wizard.ts:34-45` — identical pattern to existing params
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 3: UPDATE `app/ui/src/app/page.tsx` — Add model state, loading, handler, and wire to Sidebar + fetch

- **ACTION**: Add aircraft model state management, on-mount loading, handler, and pass props to Sidebar. Wire model filter to `fetchFilteredDocuments`. Update `hasActiveFilters`, `handleClearFilters`, and page reset.
- **IMPLEMENT**:
  - Add imports:
    ```typescript
    import type { AircraftModel } from "@/types/aircraft-models";
    import { fetchAircraftModels } from "@/lib/api/aircraft-models";
    ```
  - Add state (after `selectedGenerationId` state, around line 41):
    ```typescript
    const [aircraftModels, setAircraftModels] = useState<AircraftModel[]>([]);
    const [aircraftModelsLoading, setAircraftModelsLoading] = useState(true);
    const [selectedAircraftModelId, setSelectedAircraftModelId] = useState<number | null>(null);
    ```
  - Add loading effect (after `loadPlatforms` effect, around line 84):
    ```typescript
    const loadAircraftModels = useCallback(async () => {
      try {
        setAircraftModelsLoading(true);
        const data = await fetchAircraftModels();
        setAircraftModels(data);
      } catch {
        // non-critical
      } finally {
        setAircraftModelsLoading(false);
      }
    }, []);

    useEffect(() => {
      loadAircraftModels();
    }, [loadAircraftModels]);
    ```
  - Add handler (after `handleGenerationChange`, around line 207):
    ```typescript
    const handleAircraftModelChange = useCallback((id: number | null) => {
      setSelectedAircraftModelId(id);
    }, []);
    ```
  - Update `loadDocuments` to pass `aircraftModelId`:
    ```typescript
    aircraftModelId: selectedAircraftModelId ?? undefined,
    ```
    And add `selectedAircraftModelId` to the dependency array.
  - Update page reset effect to include `selectedAircraftModelId` in dependency array.
  - Update `handleClearFilters` to include:
    ```typescript
    setSelectedAircraftModelId(null);
    ```
  - Update `hasActiveFilters` to include:
    ```typescript
    || selectedAircraftModelId !== null
    ```
  - Pass new props to `<Sidebar>`:
    ```typescript
    aircraftModels={aircraftModels}
    aircraftModelsLoading={aircraftModelsLoading}
    selectedAircraftModelId={selectedAircraftModelId}
    onAircraftModelChange={handleAircraftModelChange}
    ```
- **MIRROR**: `app/ui/src/app/page.tsx:70-84` for load-on-mount pattern; lines 205-207 for simple handler pattern
- **GOTCHA**: Must add `selectedAircraftModelId` to the dependency array of `loadDocuments` (line 189) AND the page-reset effect (line 198). Missing either causes stale data or no page reset on filter change.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit` (will fail until Sidebar.tsx accepts new props — that's expected if done before Task 4)

### Task 4: UPDATE `app/ui/src/components/browser/Sidebar.tsx` — Add model dropdown

- **ACTION**: Expand the Sidebar props interface and add a model dropdown between Platform and Generation
- **IMPLEMENT**:
  - Add import at top:
    ```typescript
    import type { AircraftModel } from "@/types/aircraft-models";
    ```
  - Add new props to `SidebarProps` (after `onPlatformChange`):
    ```typescript
    aircraftModels: AircraftModel[];
    aircraftModelsLoading: boolean;
    selectedAircraftModelId: number | null;
    onAircraftModelChange: (id: number | null) => void;
    ```
  - Destructure new props in function signature.
  - Add model dropdown JSX between Platform dropdown (line 118) and Generation dropdown (line 120):
    ```typescript
    {/* Model dropdown */}
    <div>
      <label
        htmlFor="sidebar-model"
        className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
      >
        Model
      </label>
      {aircraftModelsLoading ? (
        <div className="h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      ) : (
        <select
          id="sidebar-model"
          value={selectedAircraftModelId ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onAircraftModelChange(val ? Number(val) : null);
          }}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <option value="">All Models</option>
          {aircraftModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      )}
    </div>
    ```
  - The dropdown order should be: Platform → Model → Generation → Category → Document Type → Clear Filters
- **MIRROR**: `app/ui/src/components/browser/Sidebar.tsx:91-118` — identical to platform dropdown (no `disabled` attribute since model is independent)
- **GOTCHA**: Model dropdown does NOT have `disabled` prop — it's always enabled regardless of platform selection. This differs from Generation (disabled when platform is null) and Document Type (disabled when category is null).
- **VALIDATE**: `cd app/ui && npx tsc --noEmit && npm run lint`

### Task 5: BUILD verification

- **ACTION**: Run production build and lint to ensure no errors
- **IMPLEMENT**: Run `cd app/ui && npm run build`
- **VALIDATE**: Build completes with exit 0, no errors. The `/` route compiles successfully.

---

## Testing Strategy

### Manual Test Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Model dropdown loads | Open page, expand sidebar | Model dropdown shows SR20, SR22, SR22T, SF50 |
| Model filter works | Select "SR22" from model dropdown | Document list filters to only SR22 documents |
| Model + platform combine | Select platform "SR2X" + model "SR22" | Documents filtered by both platform and model |
| Model + all filters | Select platform + model + generation + category + doc type | Documents filtered by all 5 dimensions |
| Clear filters includes model | Select a model, click "Clear Filters" | Model dropdown resets to "All Models" |
| Model independent of platform | Select model without selecting platform | Model filter works independently |
| Backend filter works | `GET /api/documents?aircraft_model_id=X` | Returns only documents for that model |
| Model + search combine | Select model + type search query | Both filters applied |

### Edge Cases Checklist

- [ ] No documents match selected model (empty state shown)
- [ ] Model + conflicting platform (e.g., SR22 model + SF50 platform = 0 results)
- [ ] Network error loading models (dropdown shows empty list, non-critical)
- [ ] Rapid model switching (no stale data since it's a simple state change, no async cascade)
- [ ] Backend: `aircraft_model_id=999` (nonexistent ID returns 0 documents, no error)

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && npx tsc --noEmit && npm run lint
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD

```bash
cd app/ui && npm run build
```

**EXPECT**: Build succeeds with exit 0.

### Level 3: BACKEND_VALIDATION

```bash
# Test new filter parameter (requires API server running)
curl "http://localhost:8000/api/documents?aircraft_model_id=1"
curl "http://localhost:8000/api/documents?aircraft_model_id=1&platform_id=1"
curl "http://localhost:8000/api/documents"  # still works without new param
```

**EXPECT**: Filtered results when `aircraft_model_id` provided; all documents when omitted; combinations work.

### Level 4: MANUAL_VALIDATION

1. Start dev servers: API (`cd app/api && uv run uvicorn main:app --reload`) + UI (`cd app/ui && npm run dev`)
2. Open `http://localhost:3000`
3. Expand sidebar — verify Model dropdown appears between Platform and Generation
4. Select a model — verify document list updates
5. Combine model with other filters — verify all work together
6. Click "Clear Filters" — verify model resets
7. Verify no console errors

---

## Acceptance Criteria

- [ ] `GET /api/documents` accepts `aircraft_model_id` query parameter
- [ ] Model dropdown visible in sidebar between Platform and Generation
- [ ] Model dropdown always enabled (not cascading)
- [ ] Model dropdown shows all aircraft models (SR20, SR22, SR22T, SF50)
- [ ] Selecting a model filters the document list
- [ ] Model filter combines with all other filters (platform, generation, category, doc type, search)
- [ ] Clear Filters resets the model dropdown
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Production build succeeds

---

## Completion Checklist

- [ ] Task 1 completed: Backend `aircraft_model_id` filter parameter added
- [ ] Task 2 completed: Frontend `FetchFilteredDocumentsParams` updated
- [ ] Task 3 completed: page.tsx state, loading, handler, and wiring
- [ ] Task 4 completed: Sidebar model dropdown rendered
- [ ] Task 5 completed: Production build succeeds
- [ ] Level 1: Static analysis passes
- [ ] Level 2: Build passes
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Model filter returns no results when combined with conflicting platform | LOW | LOW | Expected behavior — user sees empty state message. No special handling needed |
| `fetchAircraftModels()` fails on load | LOW | LOW | Non-critical failure. Dropdown shows empty list. Same pattern as platforms/categories |
| Models list changes in future | LOW | LOW | Fetched dynamically from API, not hardcoded. Any new models appear automatically |

---

## Notes

- This is a minimal-scope enhancement. The exact same pattern is already established four times (platform, generation, category, document type). Model is a fifth filter following the identical pattern, with the only difference being that it's independent (no cascading dependency).
- The model dropdown is placed between Platform and Generation because it's logically a more specific filter than platform but independent of generation. The order mirrors the data hierarchy: Platform (broadest) → Model (specific aircraft) → Generation (revision) → Category → Document Type.
- The backend change is a single line: `Document.aircraft_model_id` is already a column on the `Document` model, and the `AircraftModel` table is already joined in the query. No new joins needed.
- The `fetchAircraftModels()` function and `AircraftModel` type already exist — they were created for the wizard but are reusable here.
- This phase is a prerequisite for Phase 6 (My Aircraft), which will reuse the model concept for the "My Aircraft" configurator. Having model as a sidebar filter also means Phase 6 can reference the same `AircraftModel` data.
