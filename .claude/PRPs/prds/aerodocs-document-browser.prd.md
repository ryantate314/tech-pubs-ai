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

Build a user-facing document browser at the root route (`/`) with a top bar (search, "My Aircraft" configurator), a collapsible sidebar (filters for platform, model, generation, category, document type), and a main content area with card/table view toggle. The sidebar provides all filter dimensions so users can narrow results from broad (all documents for a platform) to specific (a single document type for a model and generation). Aircraft models are SR20, SR22, SR22T (SR2X platform) and SF50. A "My Aircraft" menu in the top bar lets users configure their aircraft (model + generation) — stored in localStorage, no auth needed — and documents in the main list show a visual indicator when they are an exact match for the configured aircraft. The wizard acts as a guided filter: completing it applies selections to the sidebar filters and shows results in the main content area (not a separate panel). Service centers can use the sidebar to browse documents for an entire platform or generation without configuring "My Aircraft".

## Key Hypothesis

We believe a filterable document browser with aircraft-aware highlighting will enable aircraft owners to self-serve their technical publications, while service centers can browse by platform/generation.
We'll know we're right when users can find and open documents without admin assistance.

## What We're NOT Building

- **Authentication/user system** — "My Aircraft" uses localStorage, no login required
- **Serial number filtering** — no serial number data exists in the current data model; this requires backend schema changes and is deferred
- **AI search in initial phases** — Phase 4 implements traditional name/model code search only. AI-powered RAG search is a separate phase (Phase 8) that requires pulling upstream backend changes first
- **Document editing/annotation** — read-only viewing via existing PDF viewer
- **Mobile-native app** — responsive web only
- **Notification system** — no alerts for new documents or updates
- **Document pinning** — requires a user system to persist pins server-side

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Documents browsable at `/` | 100% of ingested docs visible | Manual verification |
| Filter combinations functional | All filter permutations (platform, model, generation, category, doc type) return correct results | Functional testing |
| Wizard applies filters to main list | Completing wizard populates sidebar filters and shows results in main content area | Manual verification |
| My Aircraft configuration | Users can set platform + generation, persisted in localStorage | Manual test |
| Match indicators | Documents matching configured aircraft show visual indicator | Manual verification |
| View toggle works | Card/table views render correctly with persistence | localStorage + manual test |
| Page load time | < 2s initial load | Browser dev tools |

## Open Questions

- [x] Should search be client-side filtering or require a new backend search endpoint? **Resolved**: Server-side ILIKE search (Phase 4, complete). AI/RAG search added as Phase 8 (requires upstream backend changes)
- [ ] What is the pagination strategy — server-side or client-side? Existing `fetchDocuments()` returns all documents
- [ ] Should the standalone `/wizard` route be deprecated or remain alongside the embedded wizard?
- [ ] How should document links work — continue using `/admin/documents/{guid}` or create a new user-facing route?
- [ ] Is dark mode a hard requirement for Phase 1, or can it follow the existing `dark:` Tailwind patterns and be tested later?
- [ ] Should "My Aircraft" support multiple aircraft (fleet), or just one at a time?
- [ ] Does the backend need to return platform/generation info on `DocumentListItem` for match detection, or can we match by `aircraft_model_code`?
- [ ] When serial number data is added to the data model in the future, how should match granularity work (platform-level vs serial-level)?

---

## Users & Context

**Primary User: Aircraft Owner**
- **Who**: Aircraft owners who need to access maintenance manuals, service bulletins, airworthiness directives, and other technical publications for their specific aircraft
- **Current behavior**: Cannot use the system at all — homepage is a blank template, admin pages are not designed for end-user browsing
- **Trigger**: Need to reference a technical publication during maintenance, inspection, or pre-flight
- **Success state**: Configured "My Aircraft" once, now sees which documents match their aircraft with a visual indicator, and can quickly find the right document
- **Key need**: Set their aircraft once and immediately see what's relevant to them

**Secondary User: Service Center Technician**
- **Who**: Authorized service center staff who work on multiple aircraft across platforms and generations
- **Current behavior**: No access to the system; relies on physical files or OEM portals
- **Trigger**: Needs documentation for a specific aircraft platform or generation they're servicing
- **Success state**: Filtered the sidebar to a platform (e.g., "SR22") or generation (e.g., "G6") and found all relevant documents
- **Key need**: Browse all documents for an entire model, not tied to a single serial number

**Job to Be Done**
- **Owner**: When I need a technical publication for my aircraft, I want to see which documents match my specific aircraft and find them quickly, without calling support or searching through physical files.
- **Service Center**: When I'm working on a customer's aircraft, I want to filter documents by platform and generation to see everything relevant to that model.

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
| Must | Sidebar filters: platform, model, generation, category, document type | All filter dimensions available for service centers and power users |
| Must | Document fetching with filters and pagination | Documents must load and respond to filter changes |
| Must | Sort dropdown (date, name) | Users need to order results meaningfully |
| Must | "My Aircraft" configurator in top bar (localStorage, no auth) | Aircraft owners set their aircraft once; persists across sessions |
| Must | Match indicator on documents | Documents matching the configured aircraft show a visual badge/indicator |
| Should | Embedded wizard as guided filter (results in main content) | Guided discovery that populates sidebar filters and shows results in the main list |
| Should | Search bar in top bar with two modes: traditional name search and AI (RAG) search | Text search is expected; AI search leverages existing document embeddings for semantic queries |
| Should | Sidebar collapse with localStorage persistence | Power users want maximum content area |
| Could | View mode persistence via localStorage | Nice polish, low effort |
| Could | Quick stats panel in sidebar | Contextual information, requires new API endpoint |
| Won't | Serial number filtering | No serial number data in current data model; requires backend schema changes |
| Won't | Document pinning | Requires a user system to persist pins server-side |
| Won't | User menu with avatar/profile | Requires auth system |
| Won't | Multi-aircraft fleet management | Single aircraft selection is sufficient for MVP; fleet requires a user system |

### MVP Scope

Page shell at `/` with top bar (search, "My Aircraft" configurator), collapsible sidebar (platform, model, generation, category, document type filters), main content area with card/table toggle, sort dropdown, document fetching with server-side filtering. "My Aircraft" stored in localStorage (no auth). Documents matching configured aircraft show a visual indicator. Wizard acts as a guided filter that applies selections to the sidebar and shows results in the main content area.

### User Flow

**Aircraft Owner Flow:**
```
1. User lands on `/` for the first time
2. Sees all documents in card view (default)
3. Clicks "My Aircraft" in top bar → configures model + generation (e.g., SR22 G6)
4. Configuration saved to localStorage — persists across sessions
5. Document list now shows match indicators on documents applicable to their aircraft
6. Can further filter using sidebar (model, category, document type)
7. Can use wizard for guided discovery → wizard applies filters to sidebar → results appear in main content
8. Clicks a document → navigates to document viewer
```

**Service Center Flow:**
```
1. Technician lands on `/`
2. Uses sidebar to filter by platform (e.g., "SR2X") — sees all SR2X documents
3. Optionally narrows by model (e.g., "SR22") — sees only SR22 documents
4. Optionally narrows by generation (e.g., "G6") — sees only G6-specific documents
5. Further filters by category or document type as needed
6. Does not need to configure "My Aircraft" — browses broadly across models
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
- Page at `app/ui/src/app/page.tsx` — root route serves the document browser
- Components under `app/ui/src/components/browser/` for browse-specific UI
- Reuse existing wizard components by importing directly — they are already client components
- State management via React `useState` hooks (consistent with existing patterns) and `useEffect` for data fetching
- localStorage for UI preferences (view mode, sidebar collapse state) AND "My Aircraft" configuration (model + generation selection)
- Existing `apiRequest()` utility for all HTTP calls
- Backend already supports filtering by `platform_id`, `generation_id`, `document_category_id`, `document_type_id` via `GET /api/documents` query params. Phase 5 adds `aircraft_model_id` filter
- Aircraft models in the system: SR20, SR22, SR22T (SR2X platform), SF50 (SF50 platform). The `AircraftModel` table has no `platform_id` FK, so the model dropdown is independent (not cascading)
- "My Aircraft" match detection: compare `DocumentListItem.aircraft_model_code` against the configured model code. The `aircraft_model_code` field is already on `DocumentListItem` and maps directly to model codes (SR20, SR22, SR22T, SF50)
- Wizard acts as "guided filter": completing the wizard populates the sidebar filter dropdowns with the selected platform, generation, and category, then the main content area shows the filtered results

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `DocumentListItem` lacks platform/generation IDs for match detection | LOW | `aircraft_model_code` is already on `DocumentListItem` and maps directly to model codes (SR20, SR22, SR22T, SF50). Match detection compares against configured model code — no backend changes needed for matching |
| `fetchDocuments()` returns all docs without pagination | MEDIUM | May need backend changes to support `?page=X&limit=Y&sort=Z&search=Q` query params |
| No backend search endpoint exists | LOW | Traditional search (Phase 4) is complete. AI/RAG search (Phase 8) requires pulling upstream backend changes that expose a semantic search endpoint using pgvector embeddings |
| Serial number data doesn't exist in data model | HIGH | Deferred — serial number filtering is explicitly out of scope until backend schema supports it |
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
| 2 | Sidebar Filters | Collapsible sidebar with category and document type dropdowns wired to document fetching | complete | - | 1 | `.claude/PRPs/plans/aerodocs-sidebar-filters.plan.md` |
| 3 | Expanded Sidebar Filters | Add platform and generation dropdowns to sidebar (cascading: generation depends on platform). All 4 filter dimensions available | complete | with 4 | 2 | `.claude/PRPs/plans/aerodocs-expanded-sidebar-filters.plan.md` |
| 4 | Search + Sort | Search bar in top bar (traditional name/model search), sort dropdown in content header, backend search support | complete | with 3 | 2 | `.claude/PRPs/plans/aerodocs-search-sort.plan.md` |
| 5 | Model Sidebar Filter | Add aircraft model dropdown to sidebar (SR20, SR22, SR22T, SF50). Backend adds `aircraft_model_id` filter to `GET /api/documents`. Models are independent of platform in the DB but logically group under platforms (SR2X → SR20/SR22/SR22T, SF50 → SF50) | complete | - | 3 | `.claude/PRPs/plans/aerodocs-model-sidebar-filter.plan.md` |
| 6 | My Aircraft (No Auth) | "My Aircraft" configurator in top bar (localStorage). User selects model + generation. Match indicators on documents. No authentication required | pending | - | 5 | - |
| 7 | Wizard as Guided Filter | Rework wizard to apply selections to sidebar filters and show results in main content area (not a separate panel) | pending | - | 5, 6 | - |
| 8 | AI Search (RAG) | Add AI search mode toggle to search bar. Uses existing document embeddings (BAAI/bge-base-en-v1.5) for semantic search via pgvector. Requires pulling upstream backend changes first | pending | - | 4 | - |

### Phase Details

**Phase 1: Page Shell + Document List**
- **Goal**: Replace the default homepage with a working document browser that displays all documents in card and table views
- **Scope**: `DocumentBrowserPage` at `/`, `TopBar` (logo + placeholder elements), `ContentHeader` (title, doc count, view toggle, sort), `DocumentCardGrid`, `DocumentCard`, `DocumentTable`, pagination. Fetch documents using existing `fetchDocuments()` or `fetchFilteredDocuments()`
- **Success signal**: Landing on `/` shows all documents in a grid of cards; user can switch to table view; documents link to the viewer

**Phase 2: Sidebar Filters**
- **Goal**: Users can narrow documents by category and document type without using the wizard
- **Scope**: `Sidebar` component with collapse toggle, category dropdown (using `fetchDocumentCategories()`), document type dropdown (using `fetchDocumentTypes()`), filter state wired to document refetching. localStorage for sidebar collapse state
- **Success signal**: Selecting a category or doc type filters the visible documents; sidebar collapses and remembers state across page loads

**Phase 3: Expanded Sidebar Filters**
- **Goal**: Service centers and power users can filter by any dimension — platform, generation, category, document type
- **Scope**: Add platform dropdown and generation dropdown (cascading — generation options depend on selected platform) to the existing sidebar. Wire both to document fetching via `fetchFilteredDocuments({ platformId, generationId, documentCategoryId, documentTypeId })`. Platform and generation use existing `fetchPlatforms()` and `fetchGenerations(platformId)` API functions. Remove the existing wizard panel (Phase 3 old) — its functionality is superseded by the sidebar filters and the wizard-as-guided-filter (Phase 6)
- **Success signal**: Selecting a platform filters documents to that platform; selecting a generation further narrows results; all 4 filter dropdowns work together; clearing filters shows all documents

**Phase 4: Search + Sort (Traditional)**
- **Goal**: Users can search documents by name or aircraft model code, and sort results
- **Scope**: Search input in `TopBar` with debounced text input (ILIKE on `Document.name` and `AircraftModel.code`), sort dropdown in `ContentHeader` (Newest/Oldest/Name A-Z/Z-A). This is the traditional/keyword search mode. AI search mode (Phase 8) will add a toggle button to switch to semantic RAG search
- **Success signal**: Typing in search bar filters documents by name/model code; changing sort reorders results; search + filter combinations work together

**Phase 5: Model Sidebar Filter**
- **Goal**: Users can filter documents by aircraft model (SR20, SR22, SR22T, SF50) in addition to existing platform/generation/category/document-type filters
- **Scope**: Add `aircraft_model_id` query parameter to backend `GET /api/documents` endpoint. Add aircraft model dropdown to the `Sidebar` component between the Platform and Generation dropdowns. Fetch models using existing `fetchAircraftModels()` API function (`GET /api/aircraft-models`). Wire model selection state through `page.tsx` to `fetchFilteredDocuments`. The model dropdown is independent (not cascading from platform) since `AircraftModel` has no `platform_id` FK — all 4 models always appear. The existing `aircraft_model_code` on `DocumentListItem` can be used for display; the filter uses `aircraft_model_id` for precise filtering
- **Success signal**: Selecting "SR22" from the model dropdown filters to only SR22 documents; model filter combines with platform, generation, category, and document type filters; clearing filters resets the model dropdown

**Phase 6: My Aircraft (No Auth)**
- **Goal**: Aircraft owners can configure their aircraft and see which documents are relevant to them, without needing to log in
- **Scope**: "My Aircraft" menu/popover in `TopBar` where users select a model (SR20, SR22, SR22T, SF50) and generation. Selection stored in `localStorage` (key: `aerodocs-my-aircraft`). Documents in the main list show a visual match indicator (badge, icon, or highlight) when they match the configured aircraft. Match detection compares `DocumentListItem.aircraft_model_code` against the configured model's code. No authentication, no server-side user records
- **Success signal**: User configures SR22 G6 as "My Aircraft"; documents for SR22 show a "Your Aircraft" badge; configuration persists across browser sessions; clearing "My Aircraft" removes all indicators

**Phase 7: Wizard as Guided Filter**
- **Goal**: The wizard becomes a guided path that populates the sidebar filters and shows results in the main content area
- **Scope**: Rework the wizard panel so that completing the wizard (platform → model → generation → category) sets the corresponding sidebar filter dropdowns to those values. The wizard panel closes and the main document list displays the filtered results. The wizard does not have its own separate results view — it delegates to the existing main content area. Essentially, the wizard is a friendlier interface for filling in the sidebar filters
- **Success signal**: User opens wizard, selects platform → model → generation → category; wizard closes; sidebar shows those selections; main content shows filtered documents; user can further refine using sidebar

**Phase 8: AI Search (RAG)**
- **Goal**: Users can toggle between traditional keyword search and AI-powered semantic search that queries document content via embeddings
- **Scope**: Add a toggle/button next to the search input in `TopBar` to switch between "Search" (traditional, existing Phase 4 behavior) and "AI Search" (semantic RAG). AI search sends the query to a backend endpoint that generates an embedding (BAAI/bge-base-en-v1.5), performs a pgvector similarity search against `DocumentChunk.embedding`, and returns matching documents ranked by relevance. The UI shows results in the same main content area. **Prerequisite**: Pull upstream backend changes that expose a RAG/semantic search endpoint before implementing this phase
- **Success signal**: User toggles to "AI Search", types a natural language query like "how to inspect landing gear", and sees documents ranked by semantic relevance; toggling back to traditional search restores ILIKE keyword behavior

### Parallelism Notes

Phases 3 and 4 ran in parallel — Phase 3 added filter dropdowns to the sidebar, Phase 4 added search/sort to the top bar and content header. Phase 5 adds the model filter to the sidebar (depends on Phase 3's filter infrastructure). Phase 6 depends on Phase 5 (My Aircraft needs model selection). Phase 7 depends on both Phase 5 and Phase 6. Phase 8 (AI Search) depends only on Phase 4 and can run in parallel with Phases 5-7, but requires pulling upstream backend changes (RAG endpoint) from the remote repo first.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Page route | `/` (root) | `/documents`, `/browse` | Homepage should serve end users, admin stays at `/admin` |
| State management | React useState hooks | React Query, Redux, Zustand | Consistent with existing codebase patterns; no additional dependencies |
| Wizard behavior | Guided filter (populates sidebar, results in main content) | Separate results panel (original Phase 3) | Wizard should not duplicate the main content area; users expect one place to see results |
| "My Aircraft" storage | localStorage (no auth) | Server-side with auth, session storage | No user system needed; persists across sessions; simple implementation |
| Sidebar filter dimensions | Platform, model, generation, category, document type | Category + doc type only (original Phases 1-2) | All data points should be available for service centers to browse by any dimension; model is the most meaningful filter for aircraft owners |
| Match detection | Compare `aircraft_model_code` against configured model code | Require exact platform_id + generation_id match | Start simple; `aircraft_model_code` is available on `DocumentListItem` today and maps directly to model |
| Serial number filtering | Deferred (not building) | Build now with placeholder data | No serial number data exists in the data model; building UI for nonexistent data is wasteful |
| Initial mode | "All Documents" (no auth) | Require login from start | Ship browsing value immediately; auth is complex and can follow |
| Component location | `src/components/browser/` | Inline in page, `src/components/documents/` (existing) | Separate namespace avoids collision with admin document components |
| Styling approach | Tailwind CSS (match existing) | CSS modules, styled-components | Entire codebase uses Tailwind with zinc/blue-600 palette |
| Search modes | Two modes: traditional (ILIKE) + AI (RAG), toggled via button | Single search bar, always semantic | Traditional search ships first (Phase 4); AI search deferred (Phase 8) until backend RAG endpoint is available from upstream. The project's core value prop is RAG-powered search, so both modes are needed |

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
- Missing backend capabilities: `aircraft_model_id` filter on documents endpoint (Phase 5), server-side pagination, serial number data in document model. Text search was added in Phase 4. Sort is client-side. Match detection uses existing `aircraft_model_code` on `DocumentListItem`

---

*Generated: 2026-01-26*
*Updated: 2026-01-26 — Expanded sidebar filters to all dimensions, added "My Aircraft" (localStorage, no auth), wizard as guided filter, match indicators, service center use case*
*Status: DRAFT - needs validation*
