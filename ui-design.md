# User-Facing Document Browser (AeroDocs)

## Problem

The app only has an admin dashboard (`/admin`). There is no user-facing page where aircraft owners can browse, search, and find their technical publications. The homepage (`/`) is still the default Next.js template. Aircraft owners currently have no way to interact with the system — only admins can see documents via the admin table.

## Solution

Build a user-facing document browser at the root route (`/`) that lets aircraft owners find and view their technical publications. The design follows the reference files in `/design/` — a top bar with search and wizard trigger, a collapsible sidebar with filters, and a main content area with card/table view toggle.

The existing wizard (Platform > Generation > Category > Results) should be embedded as a collapsible panel that slides down from the top bar — not a separate page. Existing components, API functions, and types should be reused wherever possible.

## Design References

- **UI structure & component hierarchy**: `design/aerodocs-ui-reference.md`
- **Component template with types & state**: `design/aerodocs-component-template.tsx`

These files describe the complete page layout, component props, state management, data flow, and API endpoints. They are the source of truth for UI behavior and should be followed closely.

---

## Page Layout

```
+-----------------------------------------------------------------------+
| TOP BAR (fixed)                                                        |
| [Logo] [Search Bar] [Find My Document] [Add Aircraft v] [User Menu]   |
+-----------------------------------------------------------------------+
| WIZARD PANEL (collapsible, slides down when "Find My Document" clicked)|
| Reuses existing wizard: Platform > Generation > Category > Results     |
+----------------+------------------------------------------------------+
| SIDEBAR        | MAIN CONTENT                                         |
|                |                                                      |
| [My Docs]      | Header: Title, doc count, [Cards|Table] [Sort v]     |
| [All Docs]     |                                                      |
|                | Document list (card grid or table rows)               |
| Aircraft v     |                                                      |
| Category v     |                                                      |
| Doc Type v     |                                                      |
|                |                                                      |
| Quick Stats    |                                                      |
+----------------+------------------------------------------------------+
```

---

## Core Features

### 1. Top Bar
- **Logo**: Cirrus branding (reuse `Cirrus-Horizontal-White.svg` from admin navbar)
- **Search bar**: Text search across document names, part numbers, ADs. Placeholder: "Search documents, part numbers, ADs..."
- **"Find My Document" button**: Opens/closes the wizard panel below the top bar
- **"Add Aircraft" dropdown**: Two options — "Add by Platform & Generation" (opens modal) and "Find by Serial Number" (opens modal)
- **User menu**: Avatar/initials with dropdown (placeholder for future auth)

### 2. Wizard Panel (Collapsible)
- Slides down from below the top bar when triggered by "Find My Document" button
- **Reuses the existing wizard components**: `PlatformSelector`, `GenerationSelector`, `CategorySelector`, `WizardResults` — all from `src/components/wizard/`
- **Reuses existing wizard API functions**: `fetchPlatforms`, `fetchGenerations`, `fetchDocumentCategories`, `fetchFilteredDocuments`, `fetchDocumentTypes` — all from `src/lib/api/wizard.ts`
- **Key difference from current `/wizard` page**: The wizard is embedded inline (not a separate route). State is managed locally in the page component rather than via URL params. When the user finds a document in wizard results, clicking it navigates to the document viewer.
- Close button dismisses the panel
- The wizard currently has 3 steps (Platform > Generation > Category) then shows results with optional type chip filter and pagination — this should be preserved as-is

### 3. Sidebar (Collapsible)
- **My Docs / All Docs tabs**: Toggle between showing only the user's registered aircraft documents vs all documents in the system
- **Aircraft filter**: Grouped `<select>` with "My Aircraft" group (user's registered planes) and "Other Aircraft" group. "All My Aircraft" aggregates across user's fleet.
- **Category filter**: Dropdown of document categories (reuse `fetchDocumentCategories()`)
- **Document Type filter**: Dropdown of document types (reuse `fetchDocumentTypes()`)
- **Quick Stats panel**: Total documents, my aircraft docs, pinned count
- **Collapse toggle**: Collapses sidebar to maximize content area. State persists via localStorage.
- Filters apply immediately (no "Apply" button)

### 4. Main Content Area
- **Header**: Page title ("My Documents" or "All Documents" based on tab), document count, view toggle, sort dropdown
- **View toggle**: Card view (visual grid) or Table view (dense rows). Preference persists via localStorage.
- **Sort dropdown**: Newest First, Oldest First, Name A-Z, Name Z-A
- **Card view**: Grid of document cards showing file type icon, title, aircraft info, category/type badges, date, "View" button. Cards with user's aircraft show "My Aircraft" badge.
- **Table view**: Columns — Document (with icon), Aircraft (tail number + model), Category (badge), Type (badge), Date, Status (badges for owned/pinned)
- **Pagination**: Reuse the pagination pattern from `WizardResults` (10 per page, Previous/Next controls)

### 5. Add Aircraft Modals
- **Add by Platform & Generation**: Modal with cascading selects (Platform > Model/Generation), tail number input (required), serial number input (optional). Reuse `fetchPlatforms()` and `fetchGenerations()` for dropdown data.
- **Find by Serial Number**: Modal with serial number search field, results list showing matching aircraft, select + add with tail number.
- After adding, aircraft appears in sidebar "My Aircraft" filter group

### 6. Document Viewing
- Clicking a document (card or table row) navigates to the existing document viewer at `/admin/documents/{guid}`
- **Future consideration**: A dedicated user-facing viewer route (not under `/admin`) could be added later

---

## What Already Exists (Reuse)

| Component / Module | Location | How to Reuse |
|---|---|---|
| Wizard step components | `src/components/wizard/PlatformSelector.tsx`, `GenerationSelector.tsx`, `CategorySelector.tsx` | Embed directly in wizard panel |
| Wizard results with chip filter + pagination | `src/components/wizard/WizardResults.tsx` | Embed in wizard panel |
| Step indicator | `src/components/wizard/StepIndicator.tsx` | Use in wizard panel |
| Wizard API functions | `src/lib/api/wizard.ts` | Call from new page for filters and wizard |
| Document API functions | `src/lib/api/documents.ts` | `fetchDocuments()` for main document list |
| Document types | `src/types/wizard.ts`, `src/types/documents.ts` | Reuse all existing type definitions |
| API client foundation | `src/lib/api/client.ts` | `apiRequest()` for any new API calls |
| Document status indicator | `src/components/documents/DocumentStatusIndicator.tsx` | Show in table view |
| Cirrus logo | `public/Cirrus-Horizontal-White.svg` | Top bar branding |
| Dark mode patterns | All existing components | Follow `dark:` Tailwind class patterns |
| Skeleton loading | All wizard selectors | Follow `animate-pulse` pattern |
| Accessibility patterns | Wizard components | Follow ARIA roles, keyboard nav, focus management |
| Tailwind styling | All components | Zinc neutrals, blue-600 primary, focus rings |

## What Needs to Be Built (New)

| Component | Description |
|---|---|
| `TopBar` | Fixed header with logo, search, wizard trigger, add aircraft dropdown, user menu |
| `DocumentBrowserPage` | Main page component at `/` with all state management |
| `Sidebar` | Collapsible filter panel with tabs, aircraft/category/type filters, stats |
| `ContentHeader` | Title, doc count, view toggle, sort dropdown |
| `DocumentCardGrid` + `DocumentCard` | Card view for documents |
| `DocumentTable` (user-facing) | Table view for documents (distinct from admin `DocumentsTable`) |
| `AddByPlatformModal` | Modal form for adding aircraft by platform + generation |
| `AddBySerialModal` | Modal form for finding aircraft by serial number |
| `ViewToggle` | Card/Table view switcher |
| `SortDropdown` | Sort control |

## What Needs Backend Work

The design references several API endpoints that don't exist yet. These are needed for the full feature but could be stubbed or deferred:

| Endpoint | Purpose | Status |
|---|---|---|
| `GET /api/user/aircraft` | Fetch user's registered aircraft | **New** - requires user/auth system |
| `POST /api/user/aircraft` | Add aircraft to user's account | **New** - requires user/auth system |
| `GET /api/aircraft/search?serial=X` | Search aircraft by serial number | **New** |
| `POST /api/documents/:id/pin` | Pin a document | **New** - requires user system |
| `DELETE /api/documents/:id/pin` | Unpin a document | **New** - requires user system |
| `GET /api/documents/stats` | Quick stats (total, owned, pinned, new) | **New** |
| `GET /api/documents` with filters | Filter by aircraft, category, type, search, sort, pagination | **Partially exists** - needs search, sort, and server-side pagination |

**Note**: Many of these endpoints depend on a user/authentication system that doesn't exist yet. The initial implementation can use "All Documents" mode without auth — the My Docs/Add Aircraft/Pin features can be stubbed or deferred until auth is built.

---

## State Management

The page manages several state categories (see `design/aerodocs-component-template.tsx` for full TypeScript interfaces):

- **Filter state**: Active section (my/all), selected aircraft, category, doc type, sort, search query
- **UI state**: View mode (card/table), sidebar collapsed, wizard open
- **Wizard state**: Current step, platform/generation/category/type selections
- **Modal state**: Add aircraft modal open, mode (platform/serial)
- **Data**: User aircraft, all aircraft, documents, categories, types, platforms

---

## Route Structure

| Route | Purpose |
|---|---|
| `/` | User-facing document browser (this feature) |
| `/admin` | Redirects to `/admin/documents` |
| `/admin/documents` | Admin document list (existing) |
| `/admin/documents/[guid]` | Document viewer (existing, linked from user page) |
| `/admin/upload` | Admin upload form (existing) |
| `/admin/jobs` | Admin jobs monitor (existing) |
| `/wizard` | Standalone wizard page (existing — may deprecate in favor of embedded wizard) |

---

## Phasing Suggestion

This is a large feature. Consider breaking into phases:

1. **Phase 1 — Page Shell + Document List**: Build the page layout at `/`, top bar (without search/add aircraft), main content area with card and table views, basic document fetching. No sidebar filters, no wizard embedding, no auth.
2. **Phase 2 — Sidebar Filters**: Add collapsible sidebar with category and document type filters. Wire up to document fetching with query params.
3. **Phase 3 — Embedded Wizard**: Embed existing wizard as collapsible panel triggered from top bar. Reuse all existing wizard components.
4. **Phase 4 — Search + Sort**: Add search bar to top bar, sort dropdown to content header. Requires backend search support.
5. **Phase 5 — User System + My Aircraft**: Add authentication, user aircraft registration, My Docs/All Docs tabs, pinning, stats. Requires significant backend work.
