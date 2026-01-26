# AeroDocs - User-Facing Document Browser

## Problem Statement

Aircraft owners and maintenance personnel have no way to browse, search, or find their technical publications through the Tech Pubs system. The only interface is an admin dashboard at `/admin` — the homepage (`/`) is still a default Next.js template. Documents are ingested and stored, but the people who need them most have zero access to them through the application.

## Evidence

- The homepage (`/`) is the default Next.js boilerplate — no user-facing functionality exists
- The only document interface is `/admin/documents`, which is an admin-only management table
- The wizard at `/wizard` can find documents but exists as a standalone page without browse/filter context
- Design specifications already created (`design/aerodocs-ui-reference.md`, `design/aerodocs-component-template.tsx`) — indicating this has been planned and prioritized
- Assumption — needs validation: actual user demand from aircraft owners/service centers

## Proposed Solution

Build a user-facing document browser at the root route (`/`) with a top bar (search, wizard trigger, aircraft management), a collapsible sidebar (filters for aircraft, category, document type), and a main content area with card/table view toggle. The existing wizard components are embedded as a collapsible panel in the top bar rather than existing on a separate route. The design reuses existing API functions, wizard components, and UI patterns wherever possible, minimizing new code while delivering a complete browsing experience.

## Key Hypothesis

We believe a filterable document browser with embedded wizard will enable aircraft owners to self-serve their technical publications.
We'll know we're right when users can find and open documents without admin assistance.

## What We're NOT Building

- **Authentication/user system** (Phase 5 concern) — initial launch is "All Documents" mode without login
- **Semantic search** — text search against document names/part numbers only, not AI-powered semantic search
- **Document editing/annotation** — read-only viewing via existing PDF viewer
- **Mobile-native app** — responsive web only
- **Notification system** — no alerts for new documents or updates

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Documents browsable at `/` | 100% of ingested docs visible | Manual verification |
| Filter combinations functional | All filter permutations return correct results | Functional testing |
| Wizard embedded successfully | Existing wizard works identically inside panel | Regression testing |
| View toggle works | Card/table views render correctly with persistence | localStorage + manual test |
| Page load time | < 2s initial load | Browser dev tools |

## Open Questions

- [ ] Should search be client-side filtering or require a new backend search endpoint?
- [ ] What is the pagination strategy — server-side or client-side? Existing `fetchDocuments()` returns all documents
- [ ] Should the standalone `/wizard` route be deprecated or remain alongside the embedded wizard?
- [ ] How should document links work — continue using `/admin/documents/{guid}` or create a new user-facing route?
- [ ] Is dark mode a hard requirement for Phase 1, or can it follow the existing `dark:` Tailwind patterns and be tested later?

---

## Users & Context

**Primary User**
- **Who**: Aircraft owners who need to access maintenance manuals, service bulletins, airworthiness directives, and other technical publications for their aircraft
- **Current behavior**: Cannot use the system at all — homepage is a blank template, admin pages are not designed for end-user browsing
- **Trigger**: Need to reference a technical publication during maintenance, inspection, or pre-flight
- **Success state**: Found the correct document for their aircraft model and opened/downloaded the PDF

**Job to Be Done**
When I need a technical publication for my aircraft, I want to quickly find it by aircraft model, category, or type, so I can reference the correct documentation without calling support or searching through physical files.

**Non-Users**
- System administrators (they use `/admin` pages)
- Document uploaders (they use `/admin/upload`)
- Job monitors (they use `/admin/jobs`)

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Page layout at `/` with top bar, sidebar, content area | Core page structure — everything else depends on this |
| Must | Document card grid and table view with toggle | Two viewing modes serve different user preferences |
| Must | Sidebar filters (category, document type) | Basic filtering is the minimum for document discovery |
| Must | Document fetching with filters and pagination | Documents must load and respond to filter changes |
| Must | Sort dropdown (date, name) | Users need to order results meaningfully |
| Should | Embedded wizard panel (collapsible from top bar) | Guided discovery path reusing existing components |
| Should | Search bar in top bar | Text search is expected UX for document finding |
| Should | Sidebar collapse with localStorage persistence | Power users want maximum content area |
| Could | View mode persistence via localStorage | Nice polish, low effort |
| Could | Quick stats panel in sidebar | Contextual information, requires new API endpoint |
| Won't | My Docs / All Docs tabs | Requires auth system (Phase 5) |
| Won't | Aircraft filter with "My Aircraft" grouping | Requires user aircraft registration (Phase 5) |
| Won't | Add Aircraft modals | Requires user system and new API endpoints (Phase 5) |
| Won't | Document pinning | Requires user system (Phase 5) |
| Won't | User menu with avatar/profile | Requires auth system (Phase 5) |

### MVP Scope

Page shell at `/` with top bar, collapsible sidebar (category + doc type filters), main content area with card/table toggle, sort dropdown, document fetching with server-side filtering, and embedded wizard panel. No auth, no user aircraft, no pinning.

### User Flow

```
1. User lands on `/`
2. Sees all documents in card view (default)
3. Can toggle to table view
4. Can filter by category or document type via sidebar
5. Can sort by date or name
6. Can open "Find My Document" wizard for guided discovery
7. Clicks a document → navigates to document viewer
```

---

## Technical Approach

**Feasibility**: HIGH

The codebase already has most of the building blocks:
- Wizard components (`PlatformSelector`, `GenerationSelector`, `CategorySelector`, `WizardResults`) are client components ready for embedding
- API functions (`fetchPlatforms`, `fetchGenerations`, `fetchDocumentCategories`, `fetchDocumentTypes`, `fetchFilteredDocuments`, `fetchDocuments`) exist in `src/lib/api/`
- Type definitions exist in `src/types/wizard.ts` and `src/types/documents.ts`
- Tailwind CSS 4 with zinc neutrals and blue-600 primary is established
- Dark mode patterns (`dark:` classes) are consistent across components
- PDF viewer is production-ready at `src/components/pdf/PdfViewer.tsx`

**Architecture Notes**
- New page at `app/ui/src/app/page.tsx` (replace default template)
- New components under `app/ui/src/components/browser/` for browse-specific UI
- Reuse existing wizard components by importing directly — they are already client components
- State management via React `useState` hooks (consistent with existing patterns) and `useEffect` for data fetching
- localStorage for UI preferences (view mode, sidebar collapse state)
- Existing `apiRequest()` utility for all HTTP calls

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Wizard components tightly coupled to URL params | MEDIUM | Wizard currently uses URL params via `WizardContainer`; may need to create a wrapper that manages state locally instead of via URL |
| `fetchDocuments()` returns all docs without pagination | MEDIUM | May need backend changes to support `?page=X&limit=Y&sort=Z&search=Q` query params |
| No backend search endpoint exists | HIGH | Phase 4 search requires new `GET /api/documents?search=` support on the API |
| Large document counts may slow card grid rendering | LOW | Pagination limits visible items; can add virtualization later if needed |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases that can run concurrently (e.g., "with 3" or "-")
  DEPENDS: phases that must complete first (e.g., "1, 2" or "-")
  PRP: link to generated plan file once created
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Page Shell + Document List | Layout at `/` with top bar, content area, card/table views, basic document fetching | complete | - | - | `.claude/PRPs/plans/aerodocs-page-shell-document-list.plan.md` |
| 2 | Sidebar Filters | Collapsible sidebar with category and document type dropdowns wired to document fetching | pending | - | 1 | - |
| 3 | Embedded Wizard | Collapsible wizard panel triggered from top bar, reusing existing wizard components | pending | with 4 | 2 | - |
| 4 | Search + Sort | Search bar in top bar, sort dropdown in content header, backend search support if needed | pending | with 3 | 2 | - |
| 5 | User System + My Aircraft | Authentication, user aircraft registration, My Docs/All Docs, pinning, stats | pending | - | 3, 4 | - |

### Phase Details

**Phase 1: Page Shell + Document List**
- **Goal**: Replace the default homepage with a working document browser that displays all documents in card and table views
- **Scope**: `DocumentBrowserPage` at `/`, `TopBar` (logo + placeholder elements), `ContentHeader` (title, doc count, view toggle, sort), `DocumentCardGrid`, `DocumentCard`, `DocumentTable`, pagination. Fetch documents using existing `fetchDocuments()` or `fetchFilteredDocuments()`
- **Success signal**: Landing on `/` shows all documents in a grid of cards; user can switch to table view; documents link to the viewer

**Phase 2: Sidebar Filters**
- **Goal**: Users can narrow documents by category and document type without using the wizard
- **Scope**: `Sidebar` component with collapse toggle, category dropdown (using `fetchDocumentCategories()`), document type dropdown (using `fetchDocumentTypes()`), filter state wired to document refetching. localStorage for sidebar collapse state
- **Success signal**: Selecting a category or doc type filters the visible documents; sidebar collapses and remembers state across page loads

**Phase 3: Embedded Wizard**
- **Goal**: Guided document discovery without leaving the browse page
- **Scope**: `WizardPanel` wrapper component that embeds existing `PlatformSelector`, `GenerationSelector`, `CategorySelector`, `WizardResults` inside a collapsible panel below the top bar. Local state management (not URL params). "Find My Document" button in top bar toggles the panel
- **Success signal**: Clicking "Find My Document" slides open a wizard panel; completing the wizard shows results; clicking a result navigates to the document viewer; closing the panel returns to normal browse view

**Phase 4: Search + Sort**
- **Goal**: Users can search documents by name or part number, and sort results
- **Scope**: Search input in `TopBar` with debounced text input, sort dropdown in `ContentHeader` (Newest/Oldest/Name A-Z/Z-A). May require backend endpoint changes to support `?search=` and `?sort=` query params on `GET /api/documents`
- **Success signal**: Typing in search bar filters documents by name/part number; changing sort reorders results; search + filter combinations work together

**Phase 5: User System + My Aircraft**
- **Goal**: Personalized experience for aircraft owners with their own fleet and preferences
- **Scope**: Authentication system, `GET/POST /api/user/aircraft` endpoints, My Docs/All Docs tabs, aircraft filter with "My Aircraft" grouping, `AddByPlatformModal`, `AddBySerialModal`, document pinning (`POST/DELETE /api/documents/:id/pin`), stats endpoint, user menu. Significant backend work required
- **Success signal**: Users can log in, register their aircraft, see "My Documents" filtered to their fleet, pin important documents, and view personalized stats

### Parallelism Notes

Phases 3 and 4 can run in parallel as they touch different parts of the UI — Phase 3 is the wizard panel (below top bar) while Phase 4 is search/sort (within top bar and content header). They share no component dependencies. Phase 5 is a standalone milestone requiring backend auth work and should not begin until the frontend browsing experience (Phases 1-4) is validated.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Page route | `/` (root) | `/documents`, `/browse` | Homepage should serve end users, admin stays at `/admin` |
| State management | React useState hooks | React Query, Redux, Zustand | Consistent with existing codebase patterns; no additional dependencies |
| Wizard embedding | Local state (not URL params) | URL params (like `/wizard`) | Embedded panel shouldn't affect browser URL; avoids conflicting with page-level URL state |
| Initial mode | "All Documents" (no auth) | Require login from start | Ship browsing value immediately; auth is complex and can follow |
| Component location | `src/components/browser/` | Inline in page, `src/components/documents/` (existing) | Separate namespace avoids collision with admin document components |
| Styling approach | Tailwind CSS (match existing) | CSS modules, styled-components | Entire codebase uses Tailwind with zinc/blue-600 palette |

---

## Research Summary

**Market Context**
- Aviation document management is a regulated space — FAA requires operators to have current technical publications accessible
- Competitors (ATP, IPC, OEM portals like Cessna/Textron) provide searchable document libraries with aircraft-specific filtering
- Common patterns: filter by aircraft model/serial, categorize by document type (maintenance manual, service bulletin, AD), provide both search and browse paths
- Two-path discovery (browse + guided wizard) is an established UX pattern in document-heavy domains

**Technical Context**
- Codebase is well-structured with clear separation: `app/ui/` (Next.js 16/React 19), `app/api/` (FastAPI), `packages/techpubs-core/` (shared models)
- All wizard components are client-side React components with proper loading/error states and keyboard accessibility
- API layer uses `apiRequest<T>()` generic wrapper; endpoints return typed responses
- Database has proper relationships: Platform > Generation, DocumentCategory > DocumentType, Document with foreign keys to all classification entities
- Backend already supports filtered document queries via `GET /api/documents?platform_id=X&generation_id=Y&document_type_id=Z`
- Missing backend capabilities: text search, sort parameter, server-side pagination, user/auth system, aircraft registration, pinning

---

*Generated: 2026-01-26*
*Status: DRAFT - needs validation*
