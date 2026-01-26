# Feature: Sidebar Filters for Document Browser

## Summary

Add a collapsible sidebar to the document browser page (`/`) with category and document type filter dropdowns. The sidebar sits to the left of the main content area, allowing users to narrow visible documents by selecting a document category and/or document type. Sidebar collapse state persists via localStorage. Filter selections trigger re-fetching documents from the API. This requires adding a `document_category_id` query parameter to the backend `GET /api/documents` endpoint (currently only supports `platform_id`, `generation_id`, and `document_type_id`), and extending the frontend `fetchFilteredDocuments()` function accordingly.

## User Story

As an aircraft owner browsing technical publications
I want to filter documents by category and document type using a sidebar
So that I can quickly narrow down to the specific type of documentation I need

## Problem Statement

The document browser at `/` displays all documents with no way to filter them. Users must scroll through all documents to find what they need. The wizard provides guided discovery but requires multi-step navigation. A sidebar with dropdowns allows instant, persistent filtering without leaving the browse context.

## Solution Statement

Create a `Sidebar` component in `src/components/browser/` with collapsible behavior, category dropdown (populated from `GET /api/document-categories`), and document type dropdown (populated from `GET /api/document-categories/{id}/types`, dependent on selected category). Wire filter state in the page component to call `fetchFilteredDocuments()` with the selected filters. Add `document_category_id` support to the backend document listing endpoint. Persist sidebar collapse state in localStorage.

## Metadata

| Field            | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| Type             | NEW_CAPABILITY                                                |
| Complexity       | MEDIUM                                                        |
| Systems Affected | app/ui (page.tsx, new Sidebar component), app/api (documents) |
| Dependencies     | None (existing API endpoints cover most needs)                |
| Estimated Tasks  | 7                                                             |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ TOP BAR: [Logo] Cirrus Technical Publications                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                         ║
║  Technical Publications                                                 ║
║  42 documents                           [Cards|Table] [Newest First ▼]  ║
║                                                                         ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐                              ║
║  │ Doc Card │  │ Doc Card │  │ Doc Card │   (3-column grid, all docs)   ║
║  └──────────┘  └──────────┘  └──────────┘                              ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐                              ║
║  │ Doc Card │  │ Doc Card │  │ Doc Card │                              ║
║  └──────────┘  └──────────┘  └──────────┘                              ║
║                                                                         ║
║  [< 1 2 3 ... 4 >]                                                     ║
║                                                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝

USER_FLOW: Land on / → See all documents → Scroll to find what you need
PAIN_POINT: No filtering — users must browse/scroll all documents
DATA_FLOW: fetchDocuments() → all documents → client-side sort → paginate
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ TOP BAR: [Logo] Cirrus Technical Publications                           ║
╠════════════════╦══════════════════════════════════════════════════════════╣
║ SIDEBAR    [«] ║  Technical Publications                                ║
║                ║  12 documents                   [Cards|Table] [Sort ▼] ║
║ Category       ║                                                        ║
║ [Maintenance▼] ║  ┌──────────┐  ┌──────────┐  ┌──────────┐            ║
║                ║  │ Doc Card │  │ Doc Card │  │ Doc Card │             ║
║ Document Type  ║  └──────────┘  └──────────┘  └──────────┘            ║
║ [Service B. ▼] ║  ┌──────────┐  ┌──────────┐  ┌──────────┐            ║
║                ║  │ Doc Card │  │ Doc Card │  │ Doc Card │             ║
║ ── ── ── ── ──║  └──────────┘  └──────────┘  └──────────┘            ║
║ [Clear Filters]║                                                        ║
║                ║  [< 1 2 >]                                             ║
╚════════════════╩══════════════════════════════════════════════════════════╝

USER_FLOW: Land on / → Select category in sidebar → Optionally select doc type
           → See filtered documents → Click to view
VALUE_ADD: Instant filtering by category and document type without multi-step wizard
DATA_FLOW: Select filter → fetchFilteredDocuments({documentCategoryId, documentTypeId})
           → filtered documents → client-side sort → paginate
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `/` page layout | Full-width content area | Sidebar + content area side-by-side | Documents area slightly narrower but filterable |
| Sidebar (new) | Does not exist | Collapsible sidebar with category & type dropdowns | Can filter documents instantly |
| Category dropdown | N/A | Select from document categories | Narrows documents to a category |
| Document Type dropdown | N/A | Select from types within chosen category (cascading) | Further narrows to specific doc type |
| Collapse toggle | N/A | Button to collapse sidebar, persisted in localStorage | Power users can maximize content area |
| Clear Filters button | N/A | Resets both dropdowns to "All" | Quick way to remove all filters |
| Document count | Shows total docs | Shows filtered count | User knows how many docs match filters |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/app/page.tsx` | all | Main page that sidebar integrates into — layout must change |
| P0 | `app/ui/src/components/browser/TopBar.tsx` | all | Neighbor component — sidebar sits below this |
| P0 | `app/ui/src/components/browser/ContentHeader.tsx` | all | Document count display needs to reflect filtered count |
| P1 | `app/ui/src/lib/api/wizard.ts` | 13-46 | `fetchDocumentCategories()`, `fetchDocumentTypes()`, `fetchFilteredDocuments()` — reuse these |
| P1 | `app/ui/src/types/wizard.ts` | all | `DocumentCategory`, `DocumentType` type definitions |
| P1 | `app/api/routers/documents.py` | 23-113 | Backend list endpoint — needs `document_category_id` filter added |
| P2 | `app/ui/src/components/wizard/CategorySelector.tsx` | 20-40 | Data loading pattern with useCallback to mirror |
| P2 | `app/ui/src/components/browser/DocumentCard.tsx` | all | Styling patterns (zinc/blue-600, dark mode) |
| P2 | `design/aerodocs-ui-reference.md` | 215-294 | Design reference for sidebar layout |

---

## Patterns to Mirror

**NAMING_CONVENTION:**
```tsx
// SOURCE: app/ui/src/components/browser/ContentHeader.tsx:3-9
interface ContentHeaderProps {
  documentCount: number;
  viewMode: "card" | "table";
  onViewModeChange: (mode: "card" | "table") => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}
// PATTERN: PascalCase component, ComponentNameProps interface, on* callback naming
```

**DATA_LOADING_PATTERN:**
```tsx
// SOURCE: app/ui/src/app/page.tsx:31-46
const loadDocuments = useCallback(async () => {
  try {
    setError(null);
    setLoading(true);
    const data = await fetchDocuments();
    setDocuments(data.documents);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load documents");
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  loadDocuments();
}, [loadDocuments]);
// PATTERN: useCallback async wrapper, try/catch/finally, useEffect trigger
```

**LOCALSTORAGE_PATTERN:**
```tsx
// SOURCE: app/ui/src/app/page.tsx:24-29
// Read localStorage after mount to avoid hydration mismatch
useEffect(() => {
  const stored = localStorage.getItem("aerodocs-view-mode");
  if (stored === "card" || stored === "table") {
    setViewMode(stored);
  }
}, []);
// PATTERN: Post-mount read to avoid SSR hydration mismatch, "aerodocs-" key prefix
```

**API_FUNCTION_PATTERN:**
```tsx
// SOURCE: app/ui/src/lib/api/wizard.ts:27-46
export async function fetchFilteredDocuments(
  params: FetchFilteredDocumentsParams
): Promise<DocumentListResponse> {
  const searchParams = new URLSearchParams();
  if (params.platformId) {
    searchParams.set("platform_id", String(params.platformId));
  }
  // ...
  const queryString = searchParams.toString();
  const endpoint = `/api/documents${queryString ? `?${queryString}` : ""}`;
  return apiRequest<DocumentListResponse>(endpoint);
}
// PATTERN: URLSearchParams builder, optional params, generic apiRequest<T>
```

**SELECT_INPUT_STYLING:**
```tsx
// SOURCE: app/ui/src/components/browser/ContentHeader.tsx:58-68
<select
  value={sortBy}
  onChange={(e) => onSortChange(e.target.value)}
  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
>
  {sortOptions.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
// PATTERN: Tailwind zinc/blue color scheme, dark mode support, focus ring
```

**BACKEND_FILTER_PATTERN:**
```python
# SOURCE: app/api/routers/documents.py:84-91
# Apply optional filters
if platform_id is not None:
    query = query.filter(Document.platform_id == platform_id)

if generation_id is not None:
    query = query.filter(Document.generation_id == generation_id)

if document_type_id is not None:
    query = query.filter(Document.document_type_id == document_type_id)
# PATTERN: Optional Query param, None check, direct SQLAlchemy filter
```

**ERROR_DISPLAY_PATTERN:**
```tsx
// SOURCE: app/ui/src/app/page.tsx:97-108
{error && (
  <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
    <div className="flex items-center justify-between">
      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      <button
        onClick={loadDocuments}
        className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 ..."
      >
        Retry
      </button>
    </div>
  </div>
)}
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/api/routers/documents.py` | UPDATE | Add `document_category_id` query parameter to `list_documents` |
| `app/ui/src/lib/api/wizard.ts` | UPDATE | Add `documentCategoryId` to `FetchFilteredDocumentsParams` and URL builder |
| `app/ui/src/components/browser/Sidebar.tsx` | CREATE | Sidebar component with collapse toggle, category dropdown, doc type dropdown |
| `app/ui/src/app/page.tsx` | UPDATE | Add sidebar to layout, add filter state, wire filters to document fetching |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **My Docs / All Docs tabs** — requires auth system (Phase 5)
- **Aircraft filter** — requires user aircraft registration (Phase 5)
- **Quick Stats panel** — requires new API endpoint, deferred to Phase 5
- **Search bar** — Phase 4 scope, not Phase 2
- **Sort dropdown changes** — already working from Phase 1
- **Document pinning** — requires user system (Phase 5)
- **Mobile-specific sidebar behavior** — sidebar collapses below `lg` breakpoint; hidden on mobile for now (full responsive handling is a follow-up)

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `app/api/routers/documents.py` — Add `document_category_id` filter

- **ACTION**: Add optional `document_category_id` query parameter to `list_documents` endpoint
- **IMPLEMENT**:
  - Add `document_category_id: Optional[int] = Query(None, description="Filter by document category ID")` parameter
  - Import `DocumentCategory` and `DocumentType` models (DocumentType already available via document_type_id)
  - Add filter: When `document_category_id` is provided, join `DocumentType` table and filter where `DocumentType.document_category_id == document_category_id`. This filters documents whose `document_type_id` belongs to the given category.
  - The join is needed because `Document` has `document_type_id` (FK to `document_types`) but NOT a direct `document_category_id` column. `DocumentType` has `document_category_id`.
- **MIRROR**: `app/api/routers/documents.py:84-91` — follow existing filter pattern
- **GOTCHA**: The `Document` model does NOT have a `document_category_id` column. Must join through `DocumentType` table: `Document.document_type_id → DocumentType.id` where `DocumentType.document_category_id == value`. Use an outerjoin to `DocumentType` (may already be implicit through existing joins) and filter.
- **VALIDATE**: `cd app/api && uv run python -c "from routers.documents import router; print('OK')"` — import succeeds

### Task 2: UPDATE `app/ui/src/lib/api/wizard.ts` — Add `documentCategoryId` to filter params

- **ACTION**: Extend `FetchFilteredDocumentsParams` interface and `fetchFilteredDocuments()` function
- **IMPLEMENT**:
  - Add `documentCategoryId?: number` to `FetchFilteredDocumentsParams`
  - Add URL param builder: `if (params.documentCategoryId) { searchParams.set("document_category_id", String(params.documentCategoryId)); }`
- **MIRROR**: `app/ui/src/lib/api/wizard.ts:21-46` — follow existing param pattern exactly
- **VALIDATE**: `cd app/ui && npx tsc --noEmit` — types compile

### Task 3: CREATE `app/ui/src/components/browser/Sidebar.tsx` — Sidebar component

- **ACTION**: Create the sidebar component with collapsible behavior and filter dropdowns
- **IMPLEMENT**:
  ```
  Props:
    collapsed: boolean
    onToggleCollapse: () => void
    categories: DocumentCategory[]
    categoriesLoading: boolean
    selectedCategoryId: number | null
    onCategoryChange: (id: number | null) => void
    documentTypes: DocumentType[]
    documentTypesLoading: boolean
    selectedDocumentTypeId: number | null
    onDocumentTypeChange: (id: number | null) => void
    onClearFilters: () => void
    hasActiveFilters: boolean
  ```
  - Collapsed state: Show only a thin bar with expand button (chevron right icon)
  - Expanded state: Show section label "Filters", category `<select>` dropdown, document type `<select>` dropdown (disabled when no category selected), clear filters button
  - Category dropdown: "All Categories" default option + categories from props
  - Document Type dropdown: "All Types" default option + document types (loaded when category is selected)
  - Clear Filters button: Visible only when `hasActiveFilters` is true
  - Use `aside` semantic HTML element
  - Follow zinc/blue-600 color scheme with dark mode variants
  - Width: `w-64` expanded, `w-12` collapsed, with smooth transition
  - Use `role="complementary"` and `aria-label="Document filters"` for accessibility
- **MIRROR**: `app/ui/src/components/browser/ContentHeader.tsx` — select styling pattern
- **MIRROR**: `design/aerodocs-ui-reference.md:217-294` — sidebar structure reference
- **GOTCHA**: Component must be `"use client"` since parent is client component. No data fetching inside sidebar — data passed as props from page.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 4: UPDATE `app/ui/src/app/page.tsx` — Integrate sidebar and filter state

- **ACTION**: Add sidebar to layout, add filter state management, wire filters to document fetching
- **IMPLEMENT**:
  - **New imports**: `Sidebar` component, `fetchDocumentCategories`, `fetchDocumentTypes`, `fetchFilteredDocuments` from wizard API, `DocumentCategory`, `DocumentType` types
  - **New state variables**:
    ```tsx
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [categories, setCategories] = useState<DocumentCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [documentTypesLoading, setDocumentTypesLoading] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState<number | null>(null);
    ```
  - **localStorage hydration for sidebar**: Read `localStorage.getItem("aerodocs-sidebar-collapsed")` post-mount (same pattern as view mode). Write on toggle.
  - **Load categories on mount**: `useCallback` + `useEffect` pattern fetching `fetchDocumentCategories()` → `setCategories()`
  - **Load document types when category changes**: `useEffect` watching `selectedCategoryId` — when set, call `fetchDocumentTypes(selectedCategoryId)` → `setDocumentTypes()`. When null, clear types.
  - **Category change handler**: When category changes, reset `selectedDocumentTypeId` to null (cascading reset)
  - **Document fetching**: Replace `fetchDocuments()` with `fetchFilteredDocuments()` using the selected filters. The `loadDocuments` callback should check if any filters are active:
    ```tsx
    const loadDocuments = useCallback(async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await fetchFilteredDocuments({
          documentCategoryId: selectedCategoryId ?? undefined,
          documentTypeId: selectedDocumentTypeId ?? undefined,
        });
        setDocuments(data.documents);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }, [selectedCategoryId, selectedDocumentTypeId]);
    ```
  - **Clear filters handler**: Reset `selectedCategoryId` and `selectedDocumentTypeId` to null
  - **Layout change**: Wrap main content in a flex container with sidebar:
    ```tsx
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex gap-6">
        <Sidebar ... />
        <main className="min-w-0 flex-1">
          {/* existing content */}
        </main>
      </div>
    </div>
    ```
  - **Document count**: Update `ContentHeader` to show filtered count (already shows `documents.length` which will be the filtered count from the API response)
  - **Page reset**: When filters change (via the `loadDocuments` dependency changes), reset `currentPage` to 1
- **MIRROR**: `app/ui/src/app/page.tsx:24-29` — localStorage hydration pattern
- **MIRROR**: `app/ui/src/app/page.tsx:31-46` — data loading pattern
- **GOTCHA**: `fetchFilteredDocuments` with no params set should return all documents (same as current behavior). The existing `fetchDocuments()` import can be removed.
- **GOTCHA**: Must reset `currentPage` to 1 when filters change. Add `selectedCategoryId` and `selectedDocumentTypeId` as dependencies to the `loadDocuments` useCallback, and add a useEffect to reset page on filter change.
- **GOTCHA**: The `<main>` tag is currently outside the sidebar layout. It needs to become a `<div>` or keep `<main>` but be wrapped correctly. The outer `<main>` becomes the flex container's child.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit && npm run lint`

### Task 5: UPDATE `app/ui/src/app/page.tsx` — Handle sidebar collapse toggle with localStorage

- **ACTION**: Wire collapse toggle to localStorage (may be combined with Task 4 if simpler)
- **IMPLEMENT**:
  - `handleToggleSidebar` callback that toggles `sidebarCollapsed` and saves to localStorage:
    ```tsx
    const handleToggleSidebar = useCallback(() => {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem("aerodocs-sidebar-collapsed", String(next));
        return next;
      });
    }, []);
    ```
  - Post-mount hydration:
    ```tsx
    useEffect(() => {
      const stored = localStorage.getItem("aerodocs-sidebar-collapsed");
      if (stored === "true") {
        setSidebarCollapsed(true);
      }
    }, []);
    ```
- **MIRROR**: `app/ui/src/app/page.tsx:24-29` — existing localStorage hydration pattern
- **NOTE**: This task can be merged into Task 4 during implementation. Listed separately for clarity.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 6: Build and lint verification

- **ACTION**: Run full build and lint to catch any issues
- **VALIDATE**: `cd app/ui && npm run lint && npm run build`
- **EXPECT**: Zero errors, zero warnings, build succeeds

### Task 7: Manual functional verification

- **ACTION**: Verify the complete feature works end-to-end
- **VALIDATE**:
  1. Start API: `cd app/api && uv run uvicorn main:app --reload`
  2. Start UI: `cd app/ui && npm run dev`
  3. Navigate to `http://localhost:3000`
  4. Verify sidebar appears on the left with category and document type dropdowns
  5. Select a category → verify documents filter and count updates
  6. Select a document type → verify further filtering
  7. Click "Clear Filters" → verify all documents return
  8. Collapse sidebar → verify it collapses to thin bar
  9. Refresh page → verify sidebar collapse state persists
  10. Toggle between card and table views → verify both work with filtered results

---

## Testing Strategy

### Edge Cases Checklist

- [ ] No categories exist in database — sidebar shows "All Categories" only, no filtering possible
- [ ] No document types exist for a selected category — type dropdown shows "All Types" only
- [ ] Category selected then deselected (set back to "All") — document type resets, all docs shown
- [ ] Category selected, type selected, then category changed — document type resets to null
- [ ] API error loading categories — sidebar shows error state or gracefully degrades
- [ ] API error loading document types — type dropdown shows error or stays disabled
- [ ] API error loading filtered documents — error banner with retry (existing pattern)
- [ ] Zero documents match filter combination — empty state message shown
- [ ] Sidebar collapsed on page load from localStorage — sidebar renders collapsed
- [ ] Rapid filter changes — no race conditions (latest fetch wins)

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && npm run lint
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: TYPE_CHECK

```bash
cd app/ui && npx tsc --noEmit
```

**EXPECT**: Exit 0, no type errors

### Level 3: BUILD

```bash
cd app/ui && npm run build
```

**EXPECT**: Build succeeds, exit 0

### Level 4: BACKEND_IMPORT_CHECK

```bash
cd app/api && uv run python -c "from routers.documents import router; print('OK')"
```

**EXPECT**: Prints "OK", no import errors

### Level 5: MANUAL_VALIDATION

See Task 7 for step-by-step manual testing.

---

## Acceptance Criteria

- [ ] Sidebar renders on `/` page to the left of document content area
- [ ] Category dropdown populated from `GET /api/document-categories`
- [ ] Selecting a category filters visible documents
- [ ] Document type dropdown populates when a category is selected (cascading)
- [ ] Selecting a document type further filters documents
- [ ] "Clear Filters" button resets all filters
- [ ] Sidebar collapses/expands with toggle button
- [ ] Sidebar collapse state persists via localStorage across page loads
- [ ] Document count in ContentHeader reflects filtered count
- [ ] Page resets to 1 when filters change
- [ ] Dark mode renders correctly
- [ ] `npm run lint` and `npm run build` pass
- [ ] Backend `GET /api/documents?document_category_id=X` works correctly

---

## Completion Checklist

- [ ] Task 1: Backend `document_category_id` filter added
- [ ] Task 2: Frontend API function extended
- [ ] Task 3: Sidebar component created
- [ ] Task 4: Page layout updated with sidebar integration
- [ ] Task 5: localStorage persistence for sidebar collapse
- [ ] Task 6: Build and lint pass
- [ ] Task 7: Manual verification complete
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `document_category_id` filter requires join through `DocumentType` — may be complex | MEDIUM | LOW | The join is straightforward: filter on `DocumentType.document_category_id` via the existing `Document.document_type_id` FK. If a document has no `document_type_id`, it won't match category filters (correct behavior). |
| Race condition: rapid filter changes cause stale data display | LOW | MEDIUM | The `useCallback` + dependency array pattern re-triggers `loadDocuments` on filter change. React's state batching ensures the latest call wins. Could add abort controller if needed later. |
| Sidebar takes too much horizontal space on smaller screens | LOW | LOW | Sidebar is hidden on `<lg` breakpoints initially. Collapsed state uses only `w-12`. Full responsive mobile sidebar can be added later. |
| `fetchDocumentTypes()` requires `categoryId` param — what if user picks "All Categories" then picks a specific type? | LOW | LOW | Document type dropdown is disabled/cleared when no category is selected. Cascading: category selection clears type selection. |

---

## Notes

- **Two "Category" concepts exist**: `DocumentCategory` (document_categories table — used in wizard, has code/description/display_order) and `Category` (categories table — used in admin upload, simpler model with soft delete). The sidebar uses `DocumentCategory` since it maps to `DocumentType` via the `document_category_id` FK, matching the wizard's data model. The PRD's "category dropdown" refers to `DocumentCategory`.
- **No new API endpoints needed for the frontend**: `fetchDocumentCategories()` and `fetchDocumentTypes()` already exist in `src/lib/api/wizard.ts`. Only the backend `list_documents` endpoint needs the new filter parameter.
- **Design reference**: The `design/aerodocs-ui-reference.md` sidebar spec includes My Docs/All Docs tabs, Aircraft filter, and Stats panel — all of these are Phase 5 concerns. Only the Category and Document Type filters are in Phase 2 scope.
- **The `fetchFilteredDocuments()` function already passes `documentTypeId`** — so when the user selects a specific type, it works immediately. Adding `documentCategoryId` enables filtering to an entire category without picking a specific type.
