# Wizard: Reduce Steps to 3 + Type Filter on Results

## Problem Statement

The 4-step document wizard (Platform → Generation → Category → Type) forces users to select a specific document type before seeing any results. Users who are browsing or unsure which type they need are stuck at step 4 — they must guess a type or click through each one to find their document. Even users who know exactly what they want lose time on an unnecessary mandatory step. This adds friction and increases time-to-document.

## Evidence

- Assumption: Based on developer experience using the wizard — the Type step felt like unnecessary friction. Needs validation through user testing post-change.
- The document type list within a category can have 5-10+ options, making guessing unproductive for browsing users.
- The existing backend API already supports optional type filtering (`document_type_id` is an optional query param), suggesting the mandatory type step was a UX choice, not a technical requirement.

## Proposed Solution

Remove the Document Type step from the wizard flow, reducing it to 3 mandatory steps: **Platform → Generation → Category → Results**. The results page shows all documents matching the selected platform/generation/category. A horizontal chip filter on the results page lets users optionally narrow by document type. This preserves the ability to filter by type while removing it as a blocking step.

This approach over alternatives:
1. Keeps the progressive-disclosure pattern that makes the wizard effective
2. Shows documents faster (one fewer mandatory click)
3. Lets users browse all documents in a category or filter to a specific type — their choice

## Key Hypothesis

We believe removing the mandatory Type step and adding an optional type filter will reduce time-to-document for aircraft owners.
We'll know we're right when wizard completion rate stays above 80% and users reach documents in fewer interactions.

## What We're NOT Building

- **Full faceted search** - Multiple simultaneous filter dimensions (platform + type + date, etc.) — that's a separate feature
- **Pagination on other pages** - Only adding pagination to wizard results, not the admin document list
- **Type-ahead / search within results** - Text search within the filtered results list (defer to v2)
- **Saved filters** - Remembering the user's last type filter selection (defer)

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Steps to results | 3 (down from 4) | Count of wizard steps before documents appear |
| Wizard completion rate | >80% | Users who start wizard and reach results |
| Time to document | <25 seconds | Time from step 1 to document click |

## Open Questions

- [ ] Should the "All" chip be selected by default, or should we default to no filter (same behavior, just naming)?
- [ ] Should the type filter persist in the URL (e.g., `?type=5` as optional param) for shareability?
- [ ] What's a reasonable page size for pagination? 10? 20?

---

## Users & Context

**Primary User**
- **Who**: Cirrus aircraft owner (SR20, SR22, or SF50) looking for technical publications
- **Current behavior**: Navigates 4 wizard steps, must pick a document type before seeing any results
- **Trigger**: Needs a document but isn't sure of the exact type, or wants to browse what's available for their aircraft category
- **Success state**: Sees all relevant documents after 3 clicks, optionally filters by type

**Job to Be Done**
When I need technical documentation for my aircraft, I want to browse all documents in my category quickly, so I can find the right document without guessing the exact type upfront.

**Non-Users**
- Admin users uploading documents (they use the upload form, not the wizard)
- Users who already have a direct link to their document

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Remove Type step from wizard flow | Core change — reduces steps from 4 to 3 |
| Must | Update StepIndicator to 3 steps | Visual progress must match actual flow |
| Must | WizardResults accepts optional type | Results must work without type selection |
| Must | Chip filter for document type on results | Users need a way to narrow by type after seeing all docs |
| Must | Pagination on results | More documents shown per page now, need pagination |
| Should | URL state reflects optional type filter | Shareable filtered results links |
| Won't | Full faceted search | Out of scope, separate feature |

### MVP Scope

1. Remove "type" from WizardStep type and StepIndicator
2. WizardContainer skips Type step: category selection → results
3. WizardResults fetches without mandatory documentTypeId
4. Chip filter component on results for optional type narrowing
5. Pagination for the document list
6. Delete TypeSelector component

### User Flow

```
[Platform] → [Generation] → [Category] → [Results + optional type filter chips]
     ↑              ↑              ↑
     └──────────────┴──────────────┘
              (Back navigation)
```

---

## Technical Approach

**Feasibility**: HIGH

**Architecture Notes**
- Backend already supports optional `document_type_id` filtering — no API changes needed
- `fetchDocumentTypes(categoryId)` already exists for populating the chip filter
- `fetchFilteredDocuments` params interface already marks `documentTypeId` as optional
- Main work is UI refactoring: WizardContainer orchestration, StepIndicator, WizardResults props + chip filter + pagination
- TypeSelector component will be deleted (recoverable from git history)

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| More results per page could feel overwhelming | Medium | Pagination + type chips mitigate this |
| Removing a step could break URL state for shared links | Low | Old URLs with `type` param can still work — just pre-select the chip |
| Chip filter adds complexity to results component | Low | Simple state management, reuses existing `fetchDocumentTypes` |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Remove Type Step | Remove type from wizard flow, update StepIndicator, delete TypeSelector | complete | - | - | `.claude/PRPs/plans/completed/wizard-reduce-steps-phase1.plan.md` |
| 2 | Results Refactor | Make type optional in WizardResults, add chip filter + pagination | complete | - | 1 | `.claude/PRPs/plans/completed/wizard-reduce-steps-phase2.plan.md` |

### Phase Details

**Phase 1: Remove Type Step**
- **Goal**: Wizard flow goes Platform → Generation → Category → Results (3 steps)
- **Scope**:
  - Update `WizardStep` type to remove "type"
  - Update `StepIndicator` steps array (3 items, results index = 3)
  - Update `WizardContainer`: category selection goes directly to results, remove type-related state/handlers/URL params
  - Delete `TypeSelector.tsx`
  - Remove type-related imports
- **Success signal**: Wizard navigates from Category directly to Results; build passes

**Phase 2: Results Refactor**
- **Goal**: Results page shows all category documents with optional type filter and pagination
- **Scope**:
  - Make `type` prop optional in `WizardResults`
  - Fetch documents without `documentTypeId` by default
  - Add chip filter that fetches types for the category and filters results
  - Add pagination (page size TBD, likely 10-20)
  - Handle "All" chip state
  - Update URL state to include optional `type` filter param
  - ARIA/accessibility on chips and pagination
- **Success signal**: Results show all documents for category; chips filter by type; pagination works; build passes

### Parallelism Notes

Phases must be sequential — Phase 2 depends on Phase 1 removing the type step so WizardResults can receive an optional type.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Type filter pattern | Chip toggles | Dropdown, sidebar facets | Visible, fast, no extra clicks to see options |
| TypeSelector fate | Delete | Keep unused | Clean codebase; recoverable from git history |
| Pagination | Yes | Infinite scroll, no pagination | More documents visible now; pagination is simpler and more accessible |
| Phase split | 2 phases | 1 big phase | Separation of concerns: step removal vs results enhancement |

---

## Research Summary

**Technical Context**
- Backend API (`app/api/routers/documents.py`) already supports optional `document_type_id` filtering — no backend changes needed
- Frontend `fetchFilteredDocuments` already has optional `documentTypeId` in its params interface
- `fetchDocumentTypes(categoryId)` exists and can be reused for chip filter data
- StepIndicator uses a hardcoded array — straightforward to modify
- WizardContainer step logic is a `useMemo` based on which objects are selected — needs adjustment to skip type

---

*Generated: 2026-01-25*
*Status: DRAFT - ready for implementation*
