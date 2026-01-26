# Feature: Wizard Results - Chip Filter + Pagination

## Summary

Add a horizontal chip filter for document types and client-side pagination to WizardResults. Users see all documents for their platform/generation/category, with optional type chips to narrow results. Pagination limits the visible list to 10 documents per page. The type filter selection persists in the URL as `&type=X` for shareability. A critical prerequisite is fixing the Next.js `/api/documents` proxy route to forward query parameters to the backend, without which filtering doesn't work.

## User Story

As a Cirrus aircraft owner
I want to optionally filter results by document type and page through them
So that I can quickly find the specific document I need from a large list

## Problem Statement

After Phase 1 removed the mandatory Type step, the results page now shows ALL documents for a platform/generation combination. With 10-50+ documents this can be overwhelming. Users need a way to optionally narrow by document type, and pagination prevents excessively long lists.

## Solution Statement

1. Fix the Next.js `/api/documents` proxy to forward query params (prerequisite for any filtering)
2. Add document type chip filter to WizardResults that loads types for the selected category
3. When a chip is selected, re-fetch documents with `documentTypeId` filter
4. Add client-side pagination (10 per page) since backend doesn't support pagination params
5. Persist selected type in URL as `&type=X` for shareability

## Metadata

| Field            | Value |
| ---------------- | ----- |
| Type             | ENHANCEMENT |
| Complexity       | MEDIUM |
| Systems Affected | `WizardResults.tsx`, `WizardContainer.tsx`, `/api/documents/route.ts` |
| Dependencies     | None (all APIs already exist) |
| Estimated Tasks  | 5 |

---

## UX Design

### Before State

```
  Results Page (post-Phase 1):
  ┌─────────────────────────────────────────────┐
  │  Results                    [← Back] [Start Over] │
  │  SR22 G6 - Maintenance                      │
  │                                              │
  │  42 documents found                          │
  │  ┌──────────────────────────────────────┐   │
  │  │ Document A                    [View] │   │
  │  │ Document B                    [View] │   │
  │  │ Document C                    [View] │   │
  │  │ ... (all 42 shown at once)          │   │
  │  │ Document Z                    [View] │   │
  │  └──────────────────────────────────────┘   │
  └─────────────────────────────────────────────┘

  URL: /wizard?platform=1&generation=2&category=3
  Pain: Long unfiltered list, no way to narrow by type
  Note: Filtering is also broken - proxy doesn't forward query params
```

### After State

```
  Results Page:
  ┌─────────────────────────────────────────────┐
  │  Results                    [← Back] [Start Over] │
  │  SR22 G6 - Maintenance                      │
  │                                              │
  │  [All] [IPC] [AMM] [SRM] [WDM] [POH]       │  ← Type chip filter
  │                                              │
  │  42 documents found                          │
  │  ┌──────────────────────────────────────┐   │
  │  │ Document A                    [View] │   │
  │  │ Document B                    [View] │   │
  │  │ ...                                  │   │
  │  │ Document J                    [View] │   │
  │  └──────────────────────────────────────┘   │
  │                                              │
  │  ◀ Previous  Page 1 of 5  Next ▶            │  ← Pagination
  └─────────────────────────────────────────────┘

  URL: /wizard?platform=1&generation=2&category=3         (All types)
  URL: /wizard?platform=1&generation=2&category=3&type=5  (Filtered)
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Results header area | No filter | Horizontal chip buttons for document types | Can narrow by type without navigating away |
| Document list | All docs shown at once | Paginated (10 per page) | Less overwhelming, faster page loads |
| URL | No type param | Optional `&type=X` param | Shareable filtered links |
| Empty state | Generic message | Type-specific message when filtered | Better guidance on what to do |
| Document count | Shows total | Shows "X of Y documents" when filtered | Clear how many match filter |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/components/wizard/WizardResults.tsx` | all | Component being heavily modified |
| P0 | `app/ui/src/components/wizard/WizardContainer.tsx` | all | URL state management to extend |
| P0 | `app/ui/src/app/api/documents/route.ts` | all | Broken proxy that must be fixed |
| P0 | `app/ui/src/app/api/jobs/route.ts` | all | Pattern to MIRROR for proxy fix |
| P1 | `app/ui/src/lib/api/wizard.ts` | all | API functions: fetchDocumentTypes, fetchFilteredDocuments |
| P1 | `app/ui/src/types/wizard.ts` | all | DocumentType, DocumentCategory interfaces |
| P1 | `app/ui/src/types/documents.ts` | all | DocumentListItem, DocumentListResponse |

---

## Patterns to Mirror

**PROXY_ROUTE_WITH_QUERY_PARAMS:**
```typescript
// SOURCE: app/ui/src/app/api/jobs/route.ts:1-18
// COPY THIS PATTERN for /api/documents/route.ts:
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { JobListResponse } from "@/types/jobs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const endpoint = `/api/jobs${queryString ? `?${queryString}` : ""}`;

    const data = await serverFetch<JobListResponse>(endpoint);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**BUTTON_SECONDARY_STYLE:**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardResults.tsx:93
className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
```

**SELECTED_STATE_STYLE:**
```typescript
// SOURCE: app/ui/src/components/wizard/StepIndicator.tsx:42-46
// Active/completed: blue-600 bg with white text
// Current: blue-100 bg with blue-600 text + ring
// Inactive: zinc-100 bg with zinc-400 text
isCompleted ? "bg-blue-600 text-white"
  : isCurrent ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600 dark:bg-blue-950 dark:text-blue-400"
  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
```

**DATA_FETCHING_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardResults.tsx:28-42
const loadDocuments = useCallback(async () => {
  try {
    setError(null);
    setLoading(true);
    const data = await fetchFilteredDocuments({
      platformId: platform.id,
      generationId: generation.id,
    });
    setDocuments(data.documents);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load documents");
  } finally {
    setLoading(false);
  }
}, [platform.id, generation.id]);
```

**URL_STATE_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardContainer.tsx:21-24
const platformId = searchParams.get("platform");
const generationId = searchParams.get("generation");
const categoryId = searchParams.get("category");
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/ui/src/app/api/documents/route.ts` | UPDATE | Fix proxy to forward query params (BLOCKER) |
| `app/ui/src/components/wizard/WizardResults.tsx` | UPDATE | Add chip filter UI, pagination, type filter state |
| `app/ui/src/components/wizard/WizardContainer.tsx` | UPDATE | Add optional `type` URL param handling, pass to WizardResults |

---

## NOT Building (Scope Limits)

- **Backend pagination** - Backend doesn't support `limit`/`offset`; we do client-side pagination by slicing the full results array. Adding backend pagination is a separate task.
- **Full faceted search** - Only type filter, not multi-dimensional facets
- **Type-ahead / search within results** - Deferred to v2 per PRD
- **Saved filters** - No persisting user's last filter selection per PRD
- **Separate ChipFilter component file** - The chip filter is simple enough to inline in WizardResults. No need for a separate component file.
- **Category-level API filtering** - Backend doesn't support `category_id` filter param. Documents are filtered by platform+generation+optional type only.

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: FIX `app/ui/src/app/api/documents/route.ts` - Forward query params

- **ACTION**: Update the Next.js API proxy route to forward query parameters to the backend
- **IMPLEMENT**:
  - Change function signature from `GET()` to `GET(request: NextRequest)`
  - Add `import { NextRequest }` to imports
  - Extract `request.nextUrl.searchParams`, build query string
  - Append query string to backend endpoint URL
- **MIRROR**: `app/ui/src/app/api/jobs/route.ts:1-18` - follow exact same pattern
- **IMPORTS**: `import { NextRequest, NextResponse } from "next/server"`
- **GOTCHA**: The existing `GET()` has no `request` parameter - must add it
- **VALIDATE**: `npm run build` from `app/ui/` - build passes

### Task 2: UPDATE `app/ui/src/components/wizard/WizardContainer.tsx` - Add optional type URL param

- **ACTION**: Parse optional `type` URL param, pass `selectedTypeId` to WizardResults
- **IMPLEMENT**:
  - Parse `typeId` from `searchParams.get("type")` (line ~24 area)
  - Pass `selectedTypeId={typeId ? Number(typeId) : null}` to WizardResults
  - Add `onTypeFilterChange` callback that updates URL with `&type=X` or removes it
  - The callback should build the URL: `/wizard?platform=X&generation=Y&category=Z&type=T` (or without `&type=` for "All")
  - Use `router.push()` for URL updates (consistent with existing pattern)
  - DO NOT hydrate a full DocumentType object - just pass the numeric ID down. WizardResults will handle display.
- **MIRROR**: Existing URL param pattern at `WizardContainer.tsx:21-24`
- **GOTCHA**: Don't add type to the hydration `useEffect` dependency array since it's not needed for step determination. Type is only relevant when on the results step.
- **VALIDATE**: `npm run build` from `app/ui/`

### Task 3: UPDATE `app/ui/src/components/wizard/WizardResults.tsx` - Add type chip filter

- **ACTION**: Add document type chip filter UI to results page
- **IMPLEMENT**:
  - Add new props: `selectedTypeId: number | null`, `onTypeFilterChange: (typeId: number | null) => void`
  - Add state: `documentTypes` (loaded from `fetchDocumentTypes(category.id)`)
  - Add state: `typesLoading` for the chip loading state
  - Add `useEffect` to load document types on mount using `fetchDocumentTypes(category.id)`
  - Add imports: `import type { DocumentType } from "@/types/wizard"` and `import { fetchDocumentTypes } from "@/lib/api/wizard"`
  - Update `loadDocuments` to pass `documentTypeId: selectedTypeId ?? undefined` to `fetchFilteredDocuments`
  - Add `selectedTypeId` to `loadDocuments` dependency array
  - Re-fetch documents when `selectedTypeId` changes (automatic via useCallback/useEffect deps)
  - **Chip UI** (render between header and document list):
    - A `<div>` with `role="group"` and `aria-label="Filter by document type"`
    - Flex row: `flex flex-wrap gap-2`
    - "All" chip: always first, selected when `selectedTypeId === null`
    - One chip per document type, sorted by `display_order`
    - Each chip is a `<button>`:
      - Selected: `bg-blue-600 text-white hover:bg-blue-700`
      - Unselected: `bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600`
      - Common: `rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`
      - `aria-pressed={isSelected}` for accessibility
    - Clicking a chip calls `onTypeFilterChange(type.id)` or `onTypeFilterChange(null)` for "All"
    - Show skeleton chips while `typesLoading` (3-4 rounded-full pulse elements)
  - Update document count to show "X of Y" when filtered: `{documents.length} of {totalUnfiltered} documents` vs `{documents.length} document(s) found` when unfiltered. Actually simpler: just show `{documents.length} document{s} found` - the count naturally reflects the filter.
  - Update empty state message when filtered: "No documents found for this type. Try selecting a different type or 'All'."
- **VALIDATE**: `npm run build` from `app/ui/`

### Task 4: UPDATE `app/ui/src/components/wizard/WizardResults.tsx` - Add client-side pagination

- **ACTION**: Add pagination controls to limit visible documents to 10 per page
- **IMPLEMENT**:
  - Add state: `currentPage` (number, default 1)
  - Define constant: `PAGE_SIZE = 10`
  - Calculate: `totalPages = Math.ceil(documents.length / PAGE_SIZE)`
  - Calculate: `paginatedDocuments = documents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)`
  - Render `paginatedDocuments` instead of `documents` in the list
  - Reset `currentPage` to 1 when `selectedTypeId` changes (add useEffect or handle in the chip click)
  - **Pagination UI** (render after document list, only if `totalPages > 1`):
    - `<nav aria-label="Pagination">` wrapper
    - Flex row: `flex items-center justify-center gap-2 pt-4`
    - Previous button: `&larr; Previous` - disabled when `currentPage === 1`
    - Page indicator: `Page {currentPage} of {totalPages}` as text
    - Next button: `Next &rarr;` - disabled when `currentPage === totalPages`
    - Button styling (enabled): same secondary button style used elsewhere
    - Button styling (disabled): `opacity-50 cursor-not-allowed`
    - Scroll to top of results on page change (optional enhancement)
  - Update document count to show range: `Showing {start}-{end} of {total} documents`
- **VALIDATE**: `npm run build` from `app/ui/`

### Task 5: Validate full flow and lint

- **ACTION**: Run lint and build to verify all changes work together
- **VALIDATE**: `npm run lint && npm run build` from `app/ui/`
- **MANUAL_CHECK**: Verify the flow works:
  1. Navigate to `/wizard`
  2. Select Platform > Generation > Category
  3. Results show with chip filter and pagination
  4. Clicking a chip re-fetches documents
  5. URL updates with `&type=X` when chip selected
  6. Pagination controls appear when > 10 results
  7. Back and Start Over still work

---

## Testing Strategy

### Manual Testing Checklist

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Chips load | Navigate to results | Type chips appear below header |
| All chip default | Land on results | "All" chip selected (blue) |
| Filter by type | Click a type chip | Documents re-fetched, chip turns blue, others turn gray |
| Clear filter | Click "All" chip | All documents shown again |
| URL updates | Click type chip | URL shows `&type=X` |
| URL restoration | Navigate to `/wizard?platform=1&generation=2&category=3&type=5` | Results load with type chip pre-selected |
| Pagination | Have >10 results | Pagination controls shown |
| Pagination nav | Click Next/Previous | Page changes, correct documents shown |
| Page reset on filter | Change type filter | Page resets to 1 |
| Empty filtered results | Select type with no docs | Empty state with type-specific message |
| Back button | Click Back | Returns to category selection, filter state cleared |
| Proxy fix | Any filtered request | Documents actually filter (not all returned) |

### Edge Cases Checklist

- [ ] Category with 0 document types - chips section should still show "All" or be hidden
- [ ] Category with 1 document type - show single chip + "All"
- [ ] Exactly 10 documents - no pagination shown (10 is the limit, not 11)
- [ ] 11 documents - pagination shown (2 pages)
- [ ] 0 documents (filtered) - empty state with filter-aware message
- [ ] 0 documents (unfiltered) - generic empty state
- [ ] Invalid type ID in URL - treat as "All" (no crash)
- [ ] Type filter chips still loading while documents already loaded - show skeleton chips
- [ ] Network error loading types - show documents without chips (graceful degradation)

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20 && npm run lint
```

**EXPECT**: Exit 0, 0 errors

### Level 2: TYPE_CHECK + BUILD

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20 && npm run build
```

**EXPECT**: Exit 0, all pages compile

### Level 3: MANUAL_VALIDATION

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/wizard`
3. Walk through: Platform > Generation > Category
4. Verify type chips appear on results page
5. Click a type chip - verify documents filter and URL updates
6. Click "All" - verify documents return to full list
7. Navigate to a URL with `&type=X` - verify chip is pre-selected
8. Verify pagination shows when >10 documents
9. Verify Back and Start Over work

---

## Acceptance Criteria

- [ ] Next.js `/api/documents` proxy forwards query params to backend
- [ ] Type chips load from `fetchDocumentTypes(category.id)` and display below header
- [ ] "All" chip selected by default (shows all documents)
- [ ] Clicking a type chip filters documents via API and highlights chip
- [ ] URL updates with `&type=X` when type chip selected (omitted for "All")
- [ ] Navigating to URL with `&type=X` pre-selects the chip
- [ ] Client-side pagination with 10 items per page
- [ ] Pagination controls (Previous/Next) appear only when >1 page
- [ ] Page resets to 1 when type filter changes
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` passes
- [ ] Accessible: chips have `aria-pressed`, pagination has `aria-label`, disabled states

---

## Completion Checklist

- [ ] Task 1: Proxy fix deployed
- [ ] Task 2: WizardContainer URL param support
- [ ] Task 3: Chip filter UI
- [ ] Task 4: Pagination
- [ ] Task 5: Full validation
- [ ] Level 1: `npm run lint` passes
- [ ] Level 2: `npm run build` passes
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backend returns all docs (no server-side pagination) | HIGH | LOW | Client-side pagination is acceptable; lists are typically <100 docs per platform/generation |
| fetchDocumentTypes returns empty for a category | LOW | LOW | Show no chips (just document list); "All" behavior is default |
| Type chip loading slower than documents | LOW | LOW | Show skeleton chips while loading; documents render immediately |
| URL with invalid type ID | LOW | LOW | Treat as "All" - selectedTypeId won't match any chip, default to showing all docs |

---

## Notes

- **Client-side pagination decision**: The backend `list_documents()` endpoint doesn't support `limit`/`offset` params. Adding server-side pagination requires backend changes and is out of scope for Phase 2. Client-side pagination (slicing the full array) is acceptable because the document count per platform/generation is typically <100. If performance becomes an issue, server-side pagination can be added later.
- **Proxy fix is a pre-existing bug**: The `/api/documents` proxy never forwarded query params. This means the wizard's document filtering was broken since inception. Fixing it in Phase 2 is necessary but is technically a bug fix, not a new feature.
- **Type filter is in WizardResults, not WizardContainer**: The chip filter state (which type is selected) is managed via URL params in WizardContainer, but the chip UI rendering and document type loading happens inside WizardResults. This keeps the concerns separated - WizardContainer owns URL state, WizardResults owns display.
- **NVM setup**: The dev environment requires `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20` before running npm commands (WSL environment).
