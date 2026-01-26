# Feature: Search + Sort for Document Browser

## Summary

Add a search bar to the TopBar and a sort dropdown to the ContentHeader so users can search documents by name or aircraft model code and sort results by date or name. The search is implemented server-side with an ILIKE query on the backend `GET /api/documents` endpoint (new `search` query parameter). The sort remains client-side (already implemented in `page.tsx` via `useMemo`). The search input is debounced (300ms) and triggers re-fetching of documents through the existing `fetchFilteredDocuments` flow.

## User Story

As an aircraft owner or service center technician
I want to search documents by name or aircraft model and sort results by date or name
So that I can quickly find specific technical publications without manually browsing through all documents

## Problem Statement

Users can only browse documents by navigating sidebar filters (platform, generation, category, document type). There is no way to type a document name or part number to find it directly. The sort dropdown already exists in ContentHeader but is purely cosmetic context — it works client-side on already-loaded data. A text search capability is the most requested missing feature for document discovery.

## Solution Statement

1. Add a `search` query parameter to the backend `GET /api/documents` endpoint that performs case-insensitive search on `Document.name` and `AircraftModel.code`
2. Add a search input to the `TopBar` component with a magnifying glass icon
3. Wire search state through `page.tsx` into `fetchFilteredDocuments` API call
4. Debounce search input (300ms) to avoid excessive API calls
5. Sort remains client-side (already works) — no backend changes needed for sort

## Metadata

| Field            | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| Type             | ENHANCEMENT                                                 |
| Complexity       | LOW                                                         |
| Systems Affected | FastAPI backend (documents router), NextJS frontend (TopBar, page.tsx, wizard API) |
| Dependencies     | FastAPI, SQLAlchemy, React 19, Next.js 16                   |
| Estimated Tasks  | 5                                                           |

---

## UX Design

### Before State

```
┌──────────────────────────────────────────────────────────────────────┐
│  TopBar: [Cirrus Logo]  Technical Publications                       │
│  (no search input — logo and title only)                             │
└──────────────────────────────────────────────────────────────────────┘
│                                                                      │
│  ┌─────────┐   ┌───────────────────────────────────────────────────┐ │
│  │ Sidebar │   │ ContentHeader: "Technical Publications" | N docs  │ │
│  │ Filters │   │ [Cards|Table] [Sort: Newest First v]              │ │
│  │         │   ├───────────────────────────────────────────────────┤ │
│  │ Platform│   │                                                   │ │
│  │ Gen     │   │  Document cards / table (all docs loaded)         │ │
│  │ Cat     │   │                                                   │ │
│  │ DocType │   │  No way to search by text — must use filters      │ │
│  │         │   │                                                   │ │
│  └─────────┘   └───────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

USER_FLOW: User must navigate sidebar filters to narrow results
PAIN_POINT: No text search — can't type a document name to find it
DATA_FLOW: page.tsx -> fetchFilteredDocuments(filterParams) -> GET /api/documents?platform_id=X -> docs
```

### After State

```
┌──────────────────────────────────────────────────────────────────────┐
│  TopBar: [Cirrus Logo]  Technical Publications  [🔍 Search docs...] │
│  (search input added to right side of TopBar)                        │
└──────────────────────────────────────────────────────────────────────┘
│                                                                      │
│  ┌─────────┐   ┌───────────────────────────────────────────────────┐ │
│  │ Sidebar │   │ ContentHeader: "Technical Publications" | N docs  │ │
│  │ Filters │   │ [Cards|Table] [Sort: Newest First v]              │ │
│  │         │   ├───────────────────────────────────────────────────┤ │
│  │ Platform│   │                                                   │ │
│  │ Gen     │   │  Filtered results (search + sidebar combined)     │ │
│  │ Cat     │   │                                                   │ │
│  │ DocType │   │  User typed "maintenance" → only matching docs    │ │
│  │         │   │                                                   │ │
│  └─────────┘   └───────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

USER_FLOW: User types in search bar → debounced API call → filtered results shown
VALUE_ADD: Text search works alongside sidebar filters for precise document discovery
DATA_FLOW: page.tsx -> fetchFilteredDocuments({...filterParams, search}) -> GET /api/documents?search=X&platform_id=Y -> docs
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| TopBar | Logo + title only | Logo + title + search input | Users can type to search documents |
| `GET /api/documents` | Filters by IDs only | Also accepts `?search=` parameter | Backend performs ILIKE on name + aircraft model code |
| page.tsx | Fetches with filter IDs only | Also passes search query to API | Search + filters combine for precise results |
| ContentHeader | Sort dropdown (already works) | No change (sort is already implemented) | Sort continues to work client-side |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/app/page.tsx` | all | Main state management — search state goes here |
| P0 | `app/api/routers/documents.py` | 23-119 | Backend endpoint to add `search` param to |
| P0 | `app/ui/src/components/browser/TopBar.tsx` | all | Component to add search input to |
| P1 | `app/ui/src/lib/api/wizard.ts` | 21-50 | `FetchFilteredDocumentsParams` and `fetchFilteredDocuments` — add search param |
| P1 | `app/ui/src/components/browser/ContentHeader.tsx` | all | Sort dropdown already exists — understand pattern |
| P2 | `app/ui/src/components/browser/Sidebar.tsx` | 89-220 | Styling patterns for form inputs |
| P2 | `app/api/schemas/documents.py` | all | Response schemas (no changes needed) |
| P2 | `app/ui/src/lib/api/client.ts` | all | API client pattern |

---

## Patterns to Mirror

**FORM_INPUT_STYLING:**
```tsx
// SOURCE: app/ui/src/components/browser/Sidebar.tsx:108
// COPY THIS PATTERN for the search input:
className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
```

**STATE_MANAGEMENT_PATTERN:**
```tsx
// SOURCE: app/ui/src/app/page.tsx:29
// COPY THIS PATTERN for search state:
const [sortBy, setSortBy] = useState("date-desc");
// Add similarly:
const [searchQuery, setSearchQuery] = useState("");
```

**CALLBACK_PATTERN:**
```tsx
// SOURCE: app/ui/src/app/page.tsx:204-207
// COPY THIS PATTERN for search handler:
const handleSortChange = useCallback((sort: string) => {
  setSortBy(sort);
  setCurrentPage(1);
}, []);
```

**API_PARAM_PATTERN:**
```tsx
// SOURCE: app/ui/src/lib/api/wizard.ts:33-44
// COPY THIS PATTERN for adding search to URL params:
if (params.platformId) {
  searchParams.set("platform_id", String(params.platformId));
}
// Add similarly:
if (params.search) {
  searchParams.set("search", params.search);
}
```

**BACKEND_QUERY_FILTER_PATTERN:**
```python
# SOURCE: app/api/routers/documents.py:85-97
# COPY THIS PATTERN for adding search filter:
if platform_id is not None:
    query = query.filter(Document.platform_id == platform_id)
# Add similarly for search using or_() + ilike()
```

**TOPBAR_CHILDREN_PATTERN:**
```tsx
// SOURCE: app/ui/src/components/browser/TopBar.tsx:25
// TopBar already accepts children prop for right-side content:
{children && <div className="flex items-center gap-4">{children}</div>}
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/api/routers/documents.py` | UPDATE | Add `search` query parameter with ILIKE filter on Document.name and AircraftModel.code |
| `app/ui/src/lib/api/wizard.ts` | UPDATE | Add `search` field to `FetchFilteredDocumentsParams` and pass it as query param |
| `app/ui/src/app/page.tsx` | UPDATE | Add search state, debounce logic, pass search to API call and to TopBar |
| `app/ui/src/components/browser/TopBar.tsx` | UPDATE | Add search input with magnifying glass icon |

---

## NOT Building (Scope Limits)

- **Full-text search on document content** — This phase only searches document name and aircraft model code. Semantic search across document chunk content is a separate feature
- **Server-side sorting** — Sort is already working client-side in `page.tsx` via `useMemo`. Moving it server-side adds complexity for no user-facing benefit at current data volumes
- **Server-side pagination** — Pagination is already client-side. Backend returns all matching results. This is fine for current data volumes
- **Search suggestions/autocomplete** — No typeahead dropdown. Just filter results as user types
- **Search history** — No localStorage persistence of past searches
- **Advanced search syntax** — No boolean operators, field-specific search, regex, etc.

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `app/api/routers/documents.py` — Add `search` query parameter

- **ACTION**: Add optional `search: str` query parameter to `list_documents` endpoint
- **IMPLEMENT**:
  1. Add parameter: `search: Optional[str] = Query(None, description="Search by document name or aircraft model code")`
  2. After existing filter block (line 97), add search filter:
     ```python
     if search is not None and search.strip():
         search_term = f"%{search.strip()}%"
         query = query.filter(
             or_(
                 Document.name.ilike(search_term),
                 AircraftModel.code.ilike(search_term),
             )
         )
     ```
  3. Add `or_` to the sqlalchemy import: `from sqlalchemy import func, or_`
- **MIRROR**: `app/api/routers/documents.py:84-97` — follow existing filter pattern
- **GOTCHA**: The `AircraftModel` is already outer-joined (line 67), so `ilike` on `AircraftModel.code` will work. Documents without an aircraft_model will still match on `Document.name`
- **GOTCHA**: Strip whitespace and skip empty search strings to avoid matching everything
- **VALIDATE**: `cd app/api && uv run python -c "from routers.documents import router; print('OK')"` — imports must succeed

### Task 2: UPDATE `app/ui/src/lib/api/wizard.ts` — Add `search` to API params

- **ACTION**: Add `search` field to `FetchFilteredDocumentsParams` and wire it into the URL query string
- **IMPLEMENT**:
  1. Add to interface: `search?: string;`
  2. Add to `fetchFilteredDocuments` function body:
     ```typescript
     if (params.search) {
       searchParams.set("search", params.search);
     }
     ```
- **MIRROR**: `app/ui/src/lib/api/wizard.ts:33-44` — follow existing param pattern
- **GOTCHA**: Use `if (params.search)` (truthy check) — this correctly skips empty string `""` and `undefined`
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 3: UPDATE `app/ui/src/components/browser/TopBar.tsx` — Add search input

- **ACTION**: Add a search input with magnifying glass SVG icon to the TopBar
- **IMPLEMENT**:
  1. Add props to `TopBarProps`: `searchQuery: string; onSearchChange: (query: string) => void;`
  2. Add a search input between the title and `{children}` section (or replace `{children}` with the search input if children are not used elsewhere):
     ```tsx
     <div className="relative">
       <svg
         xmlns="http://www.w3.org/2000/svg"
         width="16"
         height="16"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         strokeWidth="2"
         strokeLinecap="round"
         strokeLinejoin="round"
         className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
       >
         <circle cx="11" cy="11" r="8" />
         <path d="m21 21-4.3-4.3" />
       </svg>
       <input
         type="text"
         placeholder="Search documents..."
         value={searchQuery}
         onChange={(e) => onSearchChange(e.target.value)}
         className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
       />
     </div>
     ```
  3. Place the search input in the right area of the TopBar (where `{children}` currently renders)
- **MIRROR**: `app/ui/src/components/browser/Sidebar.tsx:108` for input styling pattern, but adapted for dark TopBar background (zinc-800 bg, zinc-700 border)
- **GOTCHA**: TopBar has `bg-zinc-900` background — use dark-themed input styling (zinc-800 bg, zinc-700 border, zinc-200 text) without light/dark variants since TopBar is always dark
- **GOTCHA**: Keep `children` prop for future extensibility (My Aircraft button will go there in Phase 5)
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 4: UPDATE `app/ui/src/app/page.tsx` — Add search state with debounce

- **ACTION**: Add search state, debounce the search input, wire it to the API call and TopBar
- **IMPLEMENT**:
  1. Add state:
     ```tsx
     const [searchQuery, setSearchQuery] = useState("");
     const [debouncedSearch, setDebouncedSearch] = useState("");
     ```
  2. Add debounce effect:
     ```tsx
     useEffect(() => {
       const timer = setTimeout(() => {
         setDebouncedSearch(searchQuery);
       }, 300);
       return () => clearTimeout(timer);
     }, [searchQuery]);
     ```
  3. Add `debouncedSearch` to the `loadDocuments` dependency and pass to `fetchFilteredDocuments`:
     ```tsx
     const loadDocuments = useCallback(async () => {
       try {
         setError(null);
         setLoading(true);
         const data = await fetchFilteredDocuments({
           platformId: selectedPlatformId ?? undefined,
           generationId: selectedGenerationId ?? undefined,
           documentCategoryId: selectedCategoryId ?? undefined,
           documentTypeId: selectedDocumentTypeId ?? undefined,
           search: debouncedSearch || undefined,
         });
         setDocuments(data.documents);
       } catch (err) {
         setError(err instanceof Error ? err.message : "Failed to load documents");
       } finally {
         setLoading(false);
       }
     }, [selectedPlatformId, selectedGenerationId, selectedCategoryId, selectedDocumentTypeId, debouncedSearch]);
     ```
  4. Add `debouncedSearch` to the page-reset effect:
     ```tsx
     useEffect(() => {
       setCurrentPage(1);
     }, [selectedPlatformId, selectedGenerationId, selectedCategoryId, selectedDocumentTypeId, debouncedSearch]);
     ```
  5. Add search handler:
     ```tsx
     const handleSearchChange = useCallback((query: string) => {
       setSearchQuery(query);
     }, []);
     ```
  6. Pass search props to TopBar:
     ```tsx
     <TopBar searchQuery={searchQuery} onSearchChange={handleSearchChange} />
     ```
  7. Update `hasActiveFilters` to include search:
     ```tsx
     const hasActiveFilters = selectedPlatformId !== null || selectedGenerationId !== null || selectedCategoryId !== null || selectedDocumentTypeId !== null || debouncedSearch !== "";
     ```
  8. Update `handleClearFilters` to also clear search:
     ```tsx
     const handleClearFilters = useCallback(() => {
       setSelectedPlatformId(null);
       setSelectedGenerationId(null);
       setSelectedCategoryId(null);
       setSelectedDocumentTypeId(null);
       setSearchQuery("");
     }, []);
     ```
- **MIRROR**: `app/ui/src/app/page.tsx:162-178` for loadDocuments pattern, lines 184-187 for reset pattern
- **GOTCHA**: Use two state variables (`searchQuery` for the input value, `debouncedSearch` for the API call) to avoid the input feeling laggy
- **GOTCHA**: Use `debouncedSearch || undefined` (not just `debouncedSearch`) so empty string doesn't get sent as a query param
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 5: UPDATE `app/ui/src/app/page.tsx` — Update document count display

- **ACTION**: Update ContentHeader `documentCount` to show count of sorted (not just loaded) documents for consistency when search is active
- **IMPLEMENT**: The `documentCount` prop already uses `documents.length` which is the full result set from the API. When search is active, this will already be the filtered count from the server. No change needed — just verify this is correct.
- **ACTUALLY**: This task is a verification step. Read the ContentHeader usage and confirm `documents.length` shows the correct count after search. If it does, mark as complete with no changes.
- **VALIDATE**: `cd app/ui && npm run build` — full build must succeed

---

## Testing Strategy

### Manual Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Search by name | Type document name in search bar | Only matching documents appear |
| Search by aircraft model | Type aircraft model code (e.g., "SR22") | Documents with matching aircraft model appear |
| Search + filter | Select platform filter, then search | Results filtered by both platform AND search term |
| Empty search | Clear search input | All documents (with current filters) appear |
| Debounce | Type quickly | Only one API call after 300ms pause |
| Case insensitive | Search "maintenance" vs "MAINTENANCE" | Same results for both |
| Partial match | Search "maint" (partial word) | Documents containing "maint" in name appear |
| No results | Search "zzzznonexistent" | Empty state shown, "0 documents" count |
| Sort + search | Search for term, then change sort | Results re-sort correctly |
| Clear filters button | Search for term, click "Clear Filters" | Search input clears, all docs shown |

### Edge Cases Checklist

- [ ] Empty string search does not trigger API call with empty `search=` param
- [ ] Whitespace-only search is treated as empty (backend strips whitespace)
- [ ] Special characters in search (e.g., quotes, ampersands) are URL-encoded by `URLSearchParams`
- [ ] Search combined with all 4 sidebar filters simultaneously
- [ ] Rapid typing triggers only one API call (debounce works)
- [ ] Navigating away and back preserves search state (or correctly resets — verify behavior)
- [ ] Pagination resets to page 1 when search changes

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && npx tsc --noEmit && npm run lint
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BACKEND_VALIDATION

```bash
cd app/api && uv run python -c "from routers.documents import router; print('Router imports OK')"
```

**EXPECT**: Exit 0, no import errors

### Level 3: FULL_BUILD

```bash
cd app/ui && npm run build
```

**EXPECT**: Build succeeds with no errors

### Level 5: BROWSER_VALIDATION

Manual testing in browser:
- [ ] Search input renders in TopBar
- [ ] Typing in search filters documents after debounce
- [ ] Search works alongside sidebar filters
- [ ] Sort dropdown continues to work
- [ ] Pagination resets on search
- [ ] "Clear Filters" clears search

---

## Acceptance Criteria

- [ ] Search input visible in TopBar with magnifying glass icon
- [ ] Typing a query filters documents by name or aircraft model code (server-side ILIKE)
- [ ] Search is debounced (300ms) to avoid excessive API calls
- [ ] Search works alongside all 4 sidebar filters
- [ ] Sort dropdown continues to work (client-side, no changes)
- [ ] Pagination resets to page 1 when search query changes
- [ ] "Clear Filters" also clears the search input
- [ ] Empty/whitespace search is treated as "no search" (shows all documents)
- [ ] Build passes (`npm run build`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Backend endpoint accepts `?search=` parameter

---

## Completion Checklist

- [ ] Task 1: Backend `search` parameter added and tested
- [ ] Task 2: Frontend API params updated
- [ ] Task 3: TopBar search input implemented
- [ ] Task 4: Page state + debounce wired up
- [ ] Task 5: Document count verification
- [ ] Level 1: `npx tsc --noEmit && npm run lint` passes
- [ ] Level 3: `npm run build` passes
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ILIKE on large dataset is slow | LOW | MED | Document count is small (hundreds, not millions). Add index on `documents.name` if perf degrades |
| Search + filter combination returns unexpected results | LOW | LOW | Backend applies all filters with AND logic — test combinations |
| Debounce feels too slow/fast | LOW | LOW | 300ms is standard; easy to adjust if needed |
| TopBar search input looks out of place | LOW | LOW | Match existing zinc-800/zinc-700 dark theme styling from TopBar |

---

## Notes

- The sort feature is **already fully implemented** in the current codebase — `ContentHeader` has a sort dropdown and `page.tsx` has client-side sorting via `useMemo`. This phase only needs to add the search functionality.
- The PRD mentions "Search bar in top bar" which maps to adding an input to the `TopBar` component.
- The PRD mentions "May require backend endpoint changes to support `?search=`" — confirmed: the backend currently has no search parameter, so we add one.
- The PRD's sort scope ("sort dropdown in ContentHeader") is **already complete** from Phase 1 implementation. The sort dropdown exists with 4 options (Newest/Oldest/Name A-Z/Z-A) and works client-side.
- No new files need to be created — all changes are to existing files.
- The `TopBar` already has a `children` prop mechanism for injecting right-side content, but since search is a core feature, it's better to make it a first-class prop (`searchQuery` + `onSearchChange`) rather than passing it as children.
