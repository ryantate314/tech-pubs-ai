# Document Filter Wizard

## Problem Statement

Aircraft owners using the Tech Pubs portal cannot efficiently find technical publications for their specific aircraft. Currently, all documents are displayed in a single unfiltered list, forcing owners to manually scan through irrelevant documentation (wrong aircraft platform, wrong generation, wrong document type) to find what they need. This wastes time and increases frustration, particularly during time-sensitive maintenance scenarios.

## Evidence

- Assumption - needs validation through user interviews
- Current UI shows all documents in a flat list without filtering capability (observed in codebase)
- Aircraft documentation varies significantly by platform (SR2X vs SF50) and generation (G1-G7+)

## Proposed Solution

Build a guided 4-step wizard that progressively narrows document selection: Platform → Generation → Document Category → Document Type. Each step filters subsequent options, ensuring users only see relevant choices. The wizard culminates in a filtered document list matching all selected criteria. This approach is chosen over a single multi-select filter because:
1. It educates users about the document hierarchy
2. It prevents invalid combinations (e.g., selecting G7 for SF50)
3. It reduces cognitive load by presenting fewer choices at each step

## Key Hypothesis

We believe a guided wizard interface will reduce time-to-document for aircraft owners.
We'll know we're right when users can find their target document in under 30 seconds (vs current undefined time with manual scanning).

## What We're NOT Building

- **User Profiles** - Saving aircraft configuration per user account (requires auth system changes)
- **Document Availability Filtering** - Showing only categories/types that have documents (adds complexity, can iterate later)
- **Multi-Aircraft Support** - Owners with multiple aircraft selecting different configs (v2 feature)
- **Search Integration** - Combining wizard filters with semantic search (separate feature)
- **Favorites/Bookmarks** - Bookmarking frequently accessed document types (v2 feature)

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Wizard completion rate | >80% | Users who start wizard and reach results |
| Time to document | <30 seconds | Analytics from step 1 start to document click |
| Filter accuracy | 100% | Results match all selected criteria |

## Open Questions

- [ ] Should generation selection be optional? (Some documents may apply to all generations)
- [ ] How to handle documents that span multiple platforms or generations?
- [ ] Should we show document counts at each step to indicate what's available?
- [ ] What happens when a filter combination returns zero documents?

---

## Users & Context

**Primary User**
- **Who**: Cirrus aircraft owner (SR20, SR22, or SF50) needing maintenance or operational documentation
- **Current behavior**: Scrolls through full document list, uses browser Ctrl+F, or asks support
- **Trigger**: Needs a specific document (AMM for maintenance, POH for flight ops, Service Bulletin for updates)
- **Success state**: Views or downloads the exact document for their aircraft variant

**Job to Be Done**
When I need technical documentation for my aircraft, I want to quickly filter to my specific platform and generation, so I can find the correct manual without wading through irrelevant documents.

**Non-Users**
- Cirrus employees (they have internal systems)
- Prospective buyers (they don't have aircraft serial numbers/generations)
- Mechanics without owner portal access

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Platform selection (SR2X/SF50) | Top-level filter, most documents are platform-specific |
| Must | Generation selection (G1-G7+) | Critical differentiator for maintenance docs |
| Must | Document category selection | Groups 22 doc types into 4 manageable categories |
| Must | Document type selection | Final filter to specific document type |
| Must | Filtered results display | Shows matching documents with view/download |
| Must | Back navigation | Users need to modify earlier selections |
| Should | URL state persistence | Shareable links, browser back/forward |
| Should | Step indicator | Visual progress through wizard |
| Could | localStorage persistence | Remember last selection for returning users |
| Could | Animations/transitions | Polish for better UX |
| Won't | Document count badges | Adds query complexity, defer to v2 |

### MVP Scope

1. Database schema + Flyway migration with seed data
2. API endpoints for platforms, generations, categories, types
3. Enhanced /api/documents with filter parameters
4. Basic wizard UI with 4 steps + results
5. Back/forward navigation between steps

### User Flow

```
[Landing] → [Platform] → [Generation] → [Category] → [Type] → [Results]
                ↑             ↑             ↑           ↑
                └─────────────┴─────────────┴───────────┘
                        (Back navigation allowed)
```

---

## Technical Approach

**Feasibility**: HIGH

**Architecture Notes**
- New tables: `platforms`, `generations`, `document_categories`, `document_types`
- Existing `documents` table gets 3 new FK columns
- Flyway migration includes all schema + seed data for dev reproducibility
- SQLAlchemy models added to `techpubs-core` package
- FastAPI endpoints follow existing patterns in `app/api/routers/`
- React wizard in `app/ui/src/components/wizard/`
- URL state management with Next.js searchParams

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migration conflicts with existing data | Low | New columns are nullable, existing docs unaffected |
| API performance with multiple filters | Low | Composite index on filter columns |
| Complex wizard state management | Medium | Use URL state (simple, shareable, no context needed) |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Database & Models | Flyway migration, SQLAlchemy models | in-progress | - | - | [plan](../plans/wizard-phase1-database-models.plan.md) |
| 2 | API Endpoints | Platform, generation, category, type endpoints + document filtering | pending | - | 1 | - |
| 3 | Wizard UI | React components for all 4 steps + results | pending | - | 2 | - |
| 4 | Admin Integration | Update upload form with new classification fields | pending | - | 2 | - |
| 5 | Polish & QA | URL state, animations, mobile, accessibility | pending | - | 3 | - |

### Phase Details

**Phase 1: Database & Models**
- **Goal**: Create data infrastructure for wizard
- **Scope**:
  - Create `V4__add_wizard_tables.sql` Flyway migration
  - Add `Platform`, `Generation`, `DocumentCategory`, `DocumentType` SQLAlchemy models
  - Run migration, verify with `make db-info`
- **Success signal**: `make db-migrate` succeeds, tables exist with seed data

**Phase 2: API Endpoints**
- **Goal**: Expose wizard data via REST API
- **Scope**:
  - `GET /api/platforms`
  - `GET /api/platforms/{id}/generations`
  - `GET /api/document-categories`
  - `GET /api/document-categories/{id}/types`
  - Add filter params to `GET /api/documents`
- **Success signal**: All endpoints return expected data, Swagger docs updated

**Phase 3: Wizard UI**
- **Goal**: Build functional wizard flow
- **Scope**:
  - `WizardContainer` - orchestration + state
  - `StepIndicator` - progress display
  - `PlatformSelector`, `GenerationSelector`, `CategorySelector`, `TypeSelector`
  - `WizardResults` - filtered document list
  - New page at `/wizard`
- **Success signal**: Can navigate all steps and see filtered results

**Phase 4: Admin Integration**
- **Goal**: Allow admins to classify documents on upload
- **Scope**:
  - Add platform, generation, document type dropdowns to FileUploader
  - Update upload API to accept new fields
- **Success signal**: Newly uploaded documents appear in wizard results

**Phase 5: Polish & QA**
- **Goal**: Production-ready experience
- **Scope**:
  - URL state management (shareable links)
  - Mobile responsive layout
  - Keyboard navigation + accessibility
  - Loading states and error handling
  - Empty state when no results
- **Success signal**: Passes accessibility audit, works on mobile

### Parallelism Notes

Phase 4 (Admin Integration) can technically run in parallel with Phase 3 (Wizard UI) since they touch different parts of the frontend, but both depend on Phase 2 (API) being complete. Recommended to complete Phase 3 first to validate the data model works end-to-end before updating admin.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| State management | URL params | React Context, localStorage | Shareable links, browser nav works, no hydration issues |
| Step flow | Sequential 4-step | Single page multi-filter | Reduces cognitive load, prevents invalid combinations |
| DB design | Separate tables | JSON in documents | Referential integrity, queryable, admin-editable |
| Category structure | 4 categories | Flat type list | Groups 22 types into manageable chunks |
| Generation per platform | Platform-specific | Global generation list | SF50 has different generations than SR2X |

---

## Research Summary

**Market Context**
- Aviation document portals typically use aircraft serial number lookup
- Wizard/guided flows common in complex product configurators
- Progressive disclosure reduces user overwhelm

**Technical Context**
- Existing codebase has document listing, upload, and viewing
- No current filtering capability
- SQLAlchemy + FastAPI patterns established
- Next.js 16 with React 19 on frontend
- Flyway handles migrations with seed data

---

## Reference

See detailed technical specification: [init-wizard.md](/init-wizard.md)

---

*Generated: 2026-01-22*
*Status: DRAFT - ready for implementation*
