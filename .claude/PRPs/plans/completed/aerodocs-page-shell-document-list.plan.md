# Feature: AeroDocs Page Shell + Document List (Phase 1)

## Summary

Replace the default Next.js homepage at `/` with a working document browser that displays all documents in card and table views. This builds the foundational page shell: a top bar with logo and placeholder elements, a content header with document count, view toggle, and sort dropdown, a document card grid, a document table, and client-side pagination. Documents are fetched using the existing `fetchDocuments()` API function. No sidebar, no filters, no wizard, no search -- those are subsequent phases.

## User Story

As an aircraft owner
I want to browse all available technical publications on the homepage
So that I can find and open documents without needing admin access

## Problem Statement

The homepage (`/`) is the default Next.js boilerplate template. Aircraft owners have no way to browse documents -- the only document interface is `/admin/documents`, which is an admin management table not designed for end users.

## Solution Statement

Build a `DocumentBrowserPage` at `/` with a `TopBar` (Cirrus logo + placeholder slots for future search/wizard), a `ContentHeader` (title, document count, card/table view toggle, sort dropdown), a `DocumentCardGrid` for card view, a `DocumentTable` for table view, and client-side pagination. State is managed via React `useState` hooks. View mode preference is persisted in `localStorage`. Documents link to the existing viewer at `/admin/documents/{guid}`.

## Metadata

| Field            | Value                                               |
| ---------------- | --------------------------------------------------- |
| Type             | NEW_CAPABILITY                                      |
| Complexity       | MEDIUM                                              |
| Systems Affected | app/ui (Next.js frontend only)                      |
| Dependencies     | None -- uses existing API endpoints and types        |
| Estimated Tasks  | 8                                                   |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════╗
║                           BEFORE STATE                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                     ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │                    Homepage at /                             │   ║
║   │                                                             │   ║
║   │              [Next.js logo]                                 │   ║
║   │              "To get started, edit page.tsx"                 │   ║
║   │              [Deploy Now] [Documentation]                   │   ║
║   │                                                             │   ║
║   │              (Default boilerplate template)                 │   ║
║   └─────────────────────────────────────────────────────────────┘   ║
║                                                                     ║
║   USER_FLOW: User lands on / → sees boilerplate → has no way        ║
║              to browse documents → must know /admin URL              ║
║   PAIN_POINT: Zero document discovery for end users                 ║
║   DATA_FLOW: None -- page is static template                        ║
║                                                                     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════╗
║                            AFTER STATE                              ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                     ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │ [Cirrus Logo]  AeroDocs              [placeholder slots]    │   ║
║   ├─────────────────────────────────────────────────────────────┤   ║
║   │ Technical Publications    47 documents    [Cards][Table] ▼  │   ║
║   ├─────────────────────────────────────────────────────────────┤   ║
║   │                                                             │   ║
║   │  CARD VIEW (default):                                       │   ║
║   │  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   ║
║   │  │ PDF      │ │ PDF      │ │ PDF      │                   │   ║
║   │  │ AMM G5   │ │ IPC G3   │ │ POH G6   │                   │   ║
║   │  │ SR22     │ │ SR20     │ │ SR22     │                   │   ║
║   │  │ Service  │ │ Service  │ │ Pilot    │                   │   ║
║   │  │ Jan 2025 │ │ Mar 2025 │ │ Jun 2025 │                   │   ║
║   │  │ [View →] │ │ [View →] │ │ [View →] │                   │   ║
║   │  └──────────┘ └──────────┘ └──────────┘                   │   ║
║   │                                                             │   ║
║   │  TABLE VIEW (toggle):                                       │   ║
║   │  Document Name | Aircraft | Category | Created | Status     │   ║
║   │  ─────────────────────────────────────────────────────      │   ║
║   │  AMM G5 SR22   | SR22    | Service  | Jan 25  | Ready      │   ║
║   │  IPC G3 SR20   | SR20    | Service  | Mar 25  | Ready      │   ║
║   │                                                             │   ║
║   │  ◄ 1 2 3 ... 5 ►                                           │   ║
║   └─────────────────────────────────────────────────────────────┘   ║
║                                                                     ║
║   USER_FLOW: Land on / → see all docs in card grid → toggle to     ║
║              table → sort by name/date → click doc → opens viewer   ║
║   VALUE_ADD: End users can browse all documents without /admin      ║
║   DATA_FLOW: GET /api/documents → DocumentListResponse →            ║
║              client-side sort/paginate → render cards or table       ║
║                                                                     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `/` (homepage) | Default Next.js template | Document browser with card/table views | Users can browse all documents |
| Top bar | None | Cirrus logo + "AeroDocs" text + placeholder slots | Consistent branding, future extensibility |
| Content header | None | Title, doc count, view toggle, sort dropdown | Users can switch views and sort |
| Document card | None | PDF icon, name, aircraft model, category, date, "View" button | Visual document browsing |
| Document table | Only at `/admin/documents` | Also at `/` with user-friendly styling | Alternative list view |
| Pagination | None (admin shows all) | Client-side pagination (12 per page for cards, 20 for table) | Manageable document browsing |
| Document click | N/A | Navigate to `/admin/documents/{guid}` | Opens existing PDF viewer |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/components/documents/DocumentsList.tsx` | all | Pattern to MIRROR: client component, useCallback data fetching, loading/error states |
| P0 | `app/ui/src/components/documents/DocumentsTable.tsx` | all | Existing table pattern to ADAPT for user-facing table |
| P0 | `app/ui/src/types/documents.ts` | all | Types to IMPORT: DocumentListItem, DocumentListResponse |
| P0 | `app/ui/src/lib/api/documents.ts` | all | API functions to USE: fetchDocuments |
| P0 | `app/ui/src/lib/api/client.ts` | all | Base API client pattern to understand |
| P1 | `app/ui/src/components/admin/AdminNavbar.tsx` | all | TopBar pattern to MIRROR (dark header, Cirrus logo, layout) |
| P1 | `app/ui/src/components/documents/DocumentStatusIndicator.tsx` | all | Status badge pattern to REUSE |
| P1 | `app/ui/src/app/layout.tsx` | all | Root layout structure |
| P2 | `app/ui/src/components/wizard/WizardResults.tsx` | all | Pagination pattern to MIRROR (if exists) |
| P2 | `design/aerodocs-component-template.tsx` | 689-805 | Design reference for ContentHeader, DocumentCardGrid, DocumentTable |
| P2 | `design/aerodocs-ui-reference.md` | all | Full design specification |

---

## Patterns to Mirror

**CLIENT_COMPONENT_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/documents/DocumentsList.tsx:1-23
"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentListItem } from "@/types/documents";
import { fetchDocuments } from "@/lib/api/documents";

export function DocumentsList() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchDocuments();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);
```

**TABLE_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/documents/DocumentsTable.tsx:28-81
<div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Document Name
        </th>
        ...
      </tr>
    </thead>
    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {documents.map((doc) => (
        <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
          ...
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**NAV_BAR_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/admin/AdminNavbar.tsx:13-54
<nav className="bg-zinc-900 border-b border-zinc-800">
  <div className="mx-auto max-w-7xl px-4">
    <div className="flex h-16 items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/admin" className="flex-shrink-0">
          <Image
            src="/Cirrus-Horizontal-White.svg"
            alt="Cirrus"
            width={120}
            height={28}
            priority
          />
        </Link>
```

**BUTTON_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/documents/DocumentsList.tsx:51-56
<button
  onClick={loadDocuments}
  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
>
  Refresh
</button>
```

**ERROR_DISPLAY_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/documents/DocumentsList.tsx:41-45
{error && (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
  </div>
)}
```

**STATUS_BADGE_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/documents/DocumentStatusIndicator.tsx:37-50
<div className="flex items-center gap-2">
  <span className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`} />
  <span className="text-sm text-zinc-600 dark:text-zinc-400">
    {config.label}
  </span>
</div>
```

**DATE_FORMAT_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/documents/DocumentsTable.tsx:9-15
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
```

**API_PROXY_ROUTE_PATTERN:**
```typescript
// SOURCE: app/ui/src/app/api/documents/route.ts:1-18
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { DocumentListResponse } from "@/types/documents";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const endpoint = `/api/documents${queryString ? `?${queryString}` : ""}`;
    const data = await serverFetch<DocumentListResponse>(endpoint);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**LOADING_STATE_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/documents/DocumentsList.tsx:29-37
if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading documents...
      </p>
    </div>
  );
}
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/ui/src/app/page.tsx` | REPLACE | Replace default template with DocumentBrowserPage |
| `app/ui/src/app/layout.tsx` | UPDATE | Update metadata title/description |
| `app/ui/src/components/browser/TopBar.tsx` | CREATE | Top bar with Cirrus logo and placeholder slots |
| `app/ui/src/components/browser/ContentHeader.tsx` | CREATE | Title, doc count, view toggle, sort dropdown |
| `app/ui/src/components/browser/DocumentCardGrid.tsx` | CREATE | Card grid view for documents |
| `app/ui/src/components/browser/DocumentCard.tsx` | CREATE | Individual document card component |
| `app/ui/src/components/browser/BrowseDocumentTable.tsx` | CREATE | User-facing document table (not admin table) |
| `app/ui/src/components/browser/Pagination.tsx` | CREATE | Reusable pagination controls |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Sidebar with filters** -- Phase 2 scope. Phase 1 has no sidebar.
- **Embedded wizard panel** -- Phase 3 scope. TopBar has placeholder slot only.
- **Search bar** -- Phase 4 scope. TopBar has placeholder slot only.
- **Sort dropdown wired to backend** -- Sort is client-side only in Phase 1 (all documents already fetched).
- **Server-side pagination** -- Not needed yet. Client-side pagination over the existing `fetchDocuments()` response which returns all documents.
- **Backend API changes** -- No changes to FastAPI backend. All features use existing endpoints.
- **Authentication/user system** -- Phase 5.
- **"My Aircraft" / pinning / stats** -- Phase 5.
- **Dark mode toggle button** -- Existing `prefers-color-scheme` media query handles this automatically via Tailwind.
- **New user-facing document viewer route** -- Reuse existing `/admin/documents/{guid}` for now.

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `app/ui/src/app/layout.tsx` (metadata)

- **ACTION**: Update the page metadata to reflect AeroDocs branding
- **IMPLEMENT**: Change `title` to `"AeroDocs - Technical Publications"` and `description` to `"Browse and search aircraft technical publications"`
- **MIRROR**: Existing layout pattern at `app/ui/src/app/layout.tsx:15-18`
- **CHANGES**:
  ```typescript
  export const metadata: Metadata = {
    title: "AeroDocs - Technical Publications",
    description: "Browse and search aircraft technical publications",
  };
  ```
- **VALIDATE**: `npm run build` in `app/ui/` -- build must succeed

### Task 2: CREATE `app/ui/src/components/browser/TopBar.tsx`

- **ACTION**: Create the top navigation bar component
- **IMPLEMENT**: Client component with Cirrus logo on left, "AeroDocs" text, and placeholder div slots on right for future search/wizard/user-menu buttons. Dark background matching AdminNavbar styling.
- **MIRROR**: `app/ui/src/components/admin/AdminNavbar.tsx:13-54` for layout pattern
- **IMPORTS**: `import Link from "next/link"`, `import Image from "next/image"`
- **STRUCTURE**:
  - `<nav>` with `bg-zinc-900 border-b border-zinc-800`
  - Inner container with `mx-auto max-w-7xl px-4` (match AdminNavbar)
  - Left side: Cirrus logo image + "AeroDocs" text in white
  - Right side: `children` prop slot (empty for now, Phase 3/4 will add search/wizard buttons)
- **GOTCHA**: Use the existing `/Cirrus-Horizontal-White.svg` logo from public folder. Logo links to `/` not `/admin`.
- **VALIDATE**: `npm run lint && npm run build` in `app/ui/`

### Task 3: CREATE `app/ui/src/components/browser/ContentHeader.tsx`

- **ACTION**: Create content header with title, doc count, view toggle, and sort dropdown
- **IMPLEMENT**: Client component accepting props: `documentCount`, `viewMode`, `onViewModeChange`, `sortBy`, `onSortChange`
- **MIRROR**: `design/aerodocs-component-template.tsx:693-752` for structure reference
- **STRUCTURE**:
  - Container with `flex items-center justify-between` layout
  - Left side: "Technical Publications" title + `{count} documents` text
  - Right side: View toggle buttons (Cards/Table) + Sort dropdown
  - View toggle: two buttons with active state (blue-600 bg when active, zinc border when inactive)
  - Sort options: "Newest First", "Oldest First", "Name (A-Z)", "Name (Z-A)"
- **PROPS INTERFACE**:
  ```typescript
  interface ContentHeaderProps {
    documentCount: number;
    viewMode: "card" | "table";
    onViewModeChange: (mode: "card" | "table") => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
  }
  ```
- **GOTCHA**: Use `"use client"` directive since it uses event handlers. Match zinc/blue-600 color scheme from existing components.
- **VALIDATE**: `npm run lint && npm run build` in `app/ui/`

### Task 4: CREATE `app/ui/src/components/browser/DocumentCard.tsx`

- **ACTION**: Create individual document card component
- **IMPLEMENT**: A card showing document info: PDF icon, document name, aircraft model, category, date, and "View" link
- **MIRROR**: `design/aerodocs-component-template.tsx:764-805` for structure, `app/ui/src/components/documents/DocumentsTable.tsx:9-15` for date formatting
- **IMPORTS**: `import Link from "next/link"`, `import type { DocumentListItem } from "@/types/documents"`
- **STRUCTURE**:
  - Card container: `rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900`
  - Top: PDF file icon (inline SVG or text) in blue-100/blue-600
  - Document name as title (font-medium, truncate if long)
  - Aircraft model code + category name as subtitle
  - Bottom: formatted date + "View" link pointing to `/admin/documents/{guid}`
- **PROPS**: `{ document: DocumentListItem }`
- **GOTCHA**: `aircraft_model_code` and `category_name` can be null -- show dash or omit. Use the same `formatDate` helper pattern from DocumentsTable.
- **VALIDATE**: `npm run lint && npm run build` in `app/ui/`

### Task 5: CREATE `app/ui/src/components/browser/DocumentCardGrid.tsx`

- **ACTION**: Create the card grid layout component
- **IMPLEMENT**: Grid container that renders `DocumentCard` for each document
- **MIRROR**: Wizard component grid patterns (e.g. `PlatformSelector` uses `grid sm:grid-cols-2 gap-4`)
- **STRUCTURE**:
  - Grid: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
  - Maps documents to `DocumentCard` components
  - Empty state: "No documents found" message matching existing empty state pattern
- **PROPS**: `{ documents: DocumentListItem[] }`
- **VALIDATE**: `npm run lint && npm run build` in `app/ui/`

### Task 6: CREATE `app/ui/src/components/browser/BrowseDocumentTable.tsx`

- **ACTION**: Create user-facing document table (separate from admin DocumentsTable)
- **IMPLEMENT**: Table with columns: Document Name, Aircraft Model, Category, Created, Status. Document name links to `/admin/documents/{guid}`.
- **MIRROR**: `app/ui/src/components/documents/DocumentsTable.tsx:17-82` -- very similar but in `browser/` namespace and linking from user perspective
- **IMPORTS**: `import Link from "next/link"`, `import type { DocumentListItem } from "@/types/documents"`, `import { DocumentStatusIndicator } from "@/components/documents/DocumentStatusIndicator"`
- **STRUCTURE**: Match existing DocumentsTable structure exactly (same columns, same Tailwind classes)
- **GOTCHA**: Reuse `DocumentStatusIndicator` from `components/documents/` -- don't duplicate it. Link href is `/admin/documents/${doc.guid}` (same route, will be updated to user-facing route later).
- **VALIDATE**: `npm run lint && npm run build` in `app/ui/`

### Task 7: CREATE `app/ui/src/components/browser/Pagination.tsx`

- **ACTION**: Create a reusable pagination component
- **IMPLEMENT**: Previous/Next buttons, page numbers, current page indicator
- **PROPS INTERFACE**:
  ```typescript
  interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }
  ```
- **STRUCTURE**:
  - Container: `flex items-center justify-center gap-2`
  - Previous button: disabled on page 1
  - Page number buttons: show first, last, current, and neighbors (with ellipsis for gaps)
  - Next button: disabled on last page
  - Active page: `bg-blue-600 text-white` button
  - Inactive page: `bg-white text-zinc-700 border border-zinc-300` button (matching existing button styles)
  - Dark mode variants for all states
- **GOTCHA**: Handle edge cases: 1 page (hide pagination), 2-3 pages (no ellipsis needed), many pages (show ellipsis). Use `"use client"` directive.
- **VALIDATE**: `npm run lint && npm run build` in `app/ui/`

### Task 8: REPLACE `app/ui/src/app/page.tsx` (main page)

- **ACTION**: Replace the default homepage with the document browser page
- **IMPLEMENT**: Client component that orchestrates all browser components. Fetches documents, manages view mode, sort, pagination state.
- **MIRROR**: `app/ui/src/components/documents/DocumentsList.tsx:1-62` for data fetching pattern
- **STATE MANAGEMENT**:
  ```typescript
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      return (localStorage.getItem("aerodocs-view-mode") as "card" | "table") || "card";
    }
    return "card";
  });
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  ```
- **LOGIC**:
  - Fetch documents on mount using `fetchDocuments()` (same as DocumentsList)
  - Client-side sort: `date-desc` (default, by created_at desc), `date-asc`, `name-asc`, `name-desc`
  - Client-side pagination: 12 per page for card view, 20 for table view
  - When viewMode changes: persist to localStorage, reset to page 1
  - When sort changes: reset to page 1
  - Compute `sortedDocuments`, `paginatedDocuments`, `totalPages` with useMemo
- **LAYOUT**:
  ```
  <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
    <TopBar />
    <main className="mx-auto max-w-7xl px-4 py-6">
      {error && <ErrorBanner />}
      {loading ? <LoadingSkeleton /> : (
        <>
          <ContentHeader ... />
          {viewMode === "card" ? <DocumentCardGrid ... /> : <BrowseDocumentTable ... />}
          <Pagination ... />
        </>
      )}
    </main>
  </div>
  ```
- **GOTCHA**: Must use `"use client"` directive. Initialize localStorage-backed state carefully to avoid hydration mismatch -- use lazy initializer in useState or useEffect to read from localStorage. Reset currentPage when sort or items-per-page changes.
- **GOTCHA**: `fetchDocuments()` calls `/api/documents` (the Next.js API proxy route) which proxies to the FastAPI backend. This returns ALL documents. The existing proxy already passes through query params, so this will work as-is.
- **VALIDATE**: `npm run lint && npm run build` in `app/ui/`

---

## Testing Strategy

### Manual Testing Checklist

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Homepage loads | Navigate to `/` | See TopBar with Cirrus logo, document cards loading |
| Documents display | Wait for load | All documents shown in card grid (first page) |
| Card view content | Inspect cards | Each card shows: PDF icon, name, aircraft model, category, date |
| Switch to table | Click "Table" toggle | Documents shown in table format with same columns as admin |
| Switch back to cards | Click "Cards" toggle | Returns to card grid view |
| View persistence | Toggle to table, refresh page | Table view persists (localStorage) |
| Sort newest first | Select "Newest First" | Documents ordered by created_at descending |
| Sort oldest first | Select "Oldest First" | Documents ordered by created_at ascending |
| Sort name A-Z | Select "Name (A-Z)" | Documents ordered alphabetically |
| Sort name Z-A | Select "Name (Z-A)" | Documents ordered reverse alphabetically |
| Pagination (cards) | Check with >12 docs | Shows pagination controls, 12 per page |
| Pagination (table) | Check with >20 docs | Shows pagination controls, 20 per page |
| Page navigation | Click page 2, Next, Previous | Navigates between pages correctly |
| Document link | Click "View" on card | Navigates to `/admin/documents/{guid}` |
| Document link (table) | Click document name in table | Navigates to `/admin/documents/{guid}` |
| Loading state | Observe initial load | Shows loading indicator while fetching |
| Error state | Disconnect API | Shows error message with retry option |
| Empty state | No documents in DB | Shows "No documents found" message |
| Dark mode | Use dark color scheme | All components render with dark theme |
| Responsive (mobile) | Resize to mobile width | Cards stack single column, table scrolls horizontally |

### Edge Cases Checklist

- [ ] Zero documents -- empty state displays correctly
- [ ] One document -- no pagination shown, card/table both work
- [ ] Exactly 12 documents (card page boundary) -- no second page
- [ ] 13 documents -- second page with 1 card
- [ ] Document with null aircraft_model_code -- shows dash
- [ ] Document with null category_name -- shows dash
- [ ] Very long document name -- truncates with ellipsis
- [ ] API error on load -- error banner shown, can retry
- [ ] localStorage not available -- defaults to card view without error

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && npm run lint
```

**EXPECT**: Exit 0, no ESLint errors

### Level 2: TYPE_CHECK

```bash
cd app/ui && npx tsc --noEmit
```

**EXPECT**: Exit 0, no TypeScript errors

### Level 3: BUILD

```bash
cd app/ui && npm run build
```

**EXPECT**: Exit 0, production build succeeds

### Level 6: MANUAL_VALIDATION

1. Start the API: `cd app/api && uv run uvicorn main:app --reload`
2. Start the UI: `cd app/ui && npm run dev`
3. Navigate to `http://localhost:3000/`
4. Verify: TopBar shows Cirrus logo + "AeroDocs"
5. Verify: Documents load in card grid
6. Verify: Toggle between card/table views
7. Verify: Sort dropdown works
8. Verify: Pagination works with sufficient documents
9. Verify: Clicking a document navigates to viewer
10. Verify: Dark mode renders correctly
11. Verify: Admin pages still work at `/admin/documents`

---

## Acceptance Criteria

- [ ] Homepage at `/` shows the document browser (not boilerplate)
- [ ] TopBar displays Cirrus logo and "AeroDocs" text
- [ ] Documents load and display in card grid by default
- [ ] Card view shows: PDF icon, name, aircraft model, category, date, "View" link
- [ ] Table view shows: Document Name, Aircraft Model, Category, Created, Status
- [ ] View toggle switches between card and table views
- [ ] View mode persists in localStorage across page reloads
- [ ] Sort dropdown orders documents by date (newest/oldest) and name (A-Z/Z-A)
- [ ] Pagination displays correct number of pages and navigates properly
- [ ] Clicking a document navigates to `/admin/documents/{guid}`
- [ ] Loading, error, and empty states all display correctly
- [ ] Dark mode works across all new components
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] Existing admin pages continue to work unchanged

---

## Completion Checklist

- [ ] All 8 tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Lint passes
- [ ] Level 2: TypeScript compiles
- [ ] Level 3: Production build succeeds
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| localStorage hydration mismatch in Next.js | MEDIUM | LOW | Use lazy useState initializer or useEffect to read localStorage after mount; default to "card" on server |
| `fetchDocuments()` returns too many documents for client-side operations | LOW | MEDIUM | Current dataset is small enough. Phase 4 will add server-side pagination if needed |
| Admin document viewer route (`/admin/documents/{guid}`) feels wrong for end users | LOW | LOW | Acceptable for Phase 1. Future phase can create `/documents/{guid}` user-facing route |
| Card grid performance with many documents | LOW | LOW | Pagination limits visible items to 12; virtualization can be added later if needed |

---

## Notes

- The document browser is intentionally simple for Phase 1 -- no sidebar, no filters, no search. These are added incrementally in Phases 2-4.
- The existing `fetchDocuments()` function calls `/api/documents` which proxies through Next.js API routes to the FastAPI backend. No backend changes needed.
- The design reference files (`design/aerodocs-ui-reference.md`, `design/aerodocs-component-template.tsx`) contain the full vision including Phase 5 features (auth, pinning, etc.). Phase 1 implements only the page shell and document list subset.
- Sort is client-side only -- all documents are fetched, then sorted in-memory. This is fine for the current dataset size and avoids backend changes.
- View mode is the only localStorage-persisted preference in Phase 1. Sidebar collapse state is Phase 2.
- Components are placed in `src/components/browser/` namespace to avoid collision with admin document components in `src/components/documents/`.
