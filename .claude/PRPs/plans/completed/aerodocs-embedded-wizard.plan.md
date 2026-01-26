# Feature: Embedded Wizard Panel

## Summary

Add a collapsible "Find My Document" wizard panel to the document browser at `/`, triggered by a button in the TopBar. The panel slides open below the TopBar and embeds the existing wizard step components (`PlatformSelector`, `GenerationSelector`, `CategorySelector`, `WizardResults`) using local state management instead of URL params. This reuses all existing wizard components unchanged while providing a new `WizardPanel` wrapper that manages wizard state locally.

## User Story

As an aircraft owner browsing technical publications
I want to launch a guided document finder without leaving the browse page
So that I can quickly narrow down to the exact document I need while maintaining my browse context

## Problem Statement

The wizard at `/wizard` provides a guided path to find documents but requires navigating away from the browse page. Users lose their browse context (filters, scroll position, view mode) when they leave. The design calls for an embedded wizard panel that opens inline below the TopBar.

## Solution Statement

Create a `WizardPanel` client component that wraps the existing wizard selector components with local state management (no URL params, no router). Add a "Find My Document" trigger button in the TopBar. The panel slides down from below the TopBar when opened and collapses when closed. Clicking a document result in the wizard navigates to the document viewer. The panel state (open/closed) is ephemeral and not persisted.

## Metadata

| Field            | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| Type             | NEW_CAPABILITY                                             |
| Complexity       | MEDIUM                                                     |
| Systems Affected | `app/ui/src/app/page.tsx`, `app/ui/src/components/browser/TopBar.tsx`, new `app/ui/src/components/browser/WizardPanel.tsx` |
| Dependencies     | None (reuses existing wizard components and API functions)  |
| Estimated Tasks  | 4                                                          |

---

## UX Design

### Before State

```
┌─────────────────────────────────────────────────────────────────────┐
│ TopBar: [Logo] [Cirrus Technical Publications]                (empty right side) │
├─────────┬───────────────────────────────────────────────────────────┤
│ Sidebar │ ContentHeader: Title, count, view toggle, sort            │
│ Filters │                                                           │
│         │ DocumentCardGrid or DocumentTable                         │
│         │                                                           │
│         │ Pagination                                                │
└─────────┴───────────────────────────────────────────────────────────┘

To use the wizard, user must navigate to /wizard (separate page).
Loses browse context (filters, scroll, view mode).
```

### After State

```
┌─────────────────────────────────────────────────────────────────────┐
│ TopBar: [Logo] [Cirrus Technical Publications]    [Find My Document]│
├─────────────────────────────────────────────────────────────────────┤
│ WizardPanel (collapsible, slides down when open)                    │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Header: "Find My Document"                           [X Close] │ │
│ │                                                                 │ │
│ │ StepIndicator: (1) Platform  (2) Generation  (3) Category      │ │
│ │                                                                 │ │
│ │ Current Step Content:                                           │ │
│ │   PlatformSelector / GenerationSelector / CategorySelector      │ │
│ │   / WizardResults                                               │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────┬───────────────────────────────────────────────────────────┤
│ Sidebar │ ContentHeader: Title, count, view toggle, sort            │
│ Filters │                                                           │
│         │ DocumentCardGrid or DocumentTable                         │
│         │                                                           │
│         │ Pagination                                                │
└─────────┴───────────────────────────────────────────────────────────┘

User clicks "Find My Document" → panel slides open.
Wizard works identically to /wizard page but with local state (no URL changes).
Clicking [X] or completing the flow closes the panel.
Browse context is preserved underneath.
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| TopBar (right side) | Empty | "Find My Document" button | Single-click access to guided wizard |
| Below TopBar | Nothing | Collapsible WizardPanel | Wizard overlays browse page, no navigation required |
| `/wizard` route | Only way to use wizard | Still exists (not deprecated) | Users who bookmarked `/wizard` still work |
| Document results in wizard | Links to `/admin/documents/{guid}` | Same links | No change to document viewing |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/components/wizard/WizardContainer.tsx` | 1-278 | Pattern to ADAPT: state management, step logic, handler callbacks. The new WizardPanel mirrors this but without URL params |
| P0 | `app/ui/src/app/page.tsx` | 1-263 | Integration point: page-level state, TopBar usage, DOM structure for inserting WizardPanel |
| P0 | `app/ui/src/components/browser/TopBar.tsx` | 1-30 | Integration point: children prop slot where button goes |
| P1 | `app/ui/src/components/wizard/PlatformSelector.tsx` | 1-11 | Props interface: `{ onSelect: (platform: Platform) => void }` |
| P1 | `app/ui/src/components/wizard/GenerationSelector.tsx` | 1-11 | Props interface: `{ platform, onSelect, onBack }` |
| P1 | `app/ui/src/components/wizard/CategorySelector.tsx` | 1-12 | Props interface: `{ platform, generation, onSelect, onBack }` |
| P1 | `app/ui/src/components/wizard/WizardResults.tsx` | 1-19 | Props interface: `{ platform, generation, category, selectedTypeId, onTypeFilterChange, onBack, onStartOver }` |
| P1 | `app/ui/src/components/wizard/StepIndicator.tsx` | 1-76 | Step indicator UI pattern |
| P2 | `app/ui/src/types/wizard.ts` | 1-32 | Type definitions: Platform, Generation, DocumentCategory, DocumentType, WizardStep |
| P2 | `app/ui/src/lib/api/wizard.ts` | 1-78 | API functions (already used by wizard components; WizardPanel doesn't call these directly) |
| P2 | `design/aerodocs-ui-reference.md` | 61-117 | Design reference for wizard panel layout and behavior |

---

## Patterns to Mirror

**COMPONENT_STRUCTURE:**
```typescript
// SOURCE: app/ui/src/components/browser/Sidebar.tsx:1-5
// COPY THIS PATTERN: "use client" directive, named export, props interface
"use client";

import { ... } from "react";

interface WizardPanelProps {
  ...
}

export function WizardPanel({ ... }: WizardPanelProps) {
```

**STATE_MANAGEMENT (from WizardContainer - adapt to local state):**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardContainer.tsx:28-34
// ADAPT THIS PATTERN: Same state, but NO router/searchParams
const [platform, setPlatform] = useState<Platform | null>(null);
const [generation, setGeneration] = useState<Generation | null>(null);
const [category, setCategory] = useState<DocumentCategory | null>(null);
// NEW: selectedTypeId managed locally instead of URL
const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
```

**STEP_CALCULATION:**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardContainer.tsx:129-134
// COPY THIS PATTERN EXACTLY:
const currentStep: WizardStep = useMemo(() => {
  if (category) return "results";
  if (generation) return "category";
  if (platform) return "generation";
  return "platform";
}, [platform, generation, category]);
```

**BUTTON_STYLING (primary):**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardResults.tsx:251
// COPY THIS PATTERN for "Find My Document" button:
className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
```

**PANEL_STYLING (card/container):**
```typescript
// SOURCE: app/ui/src/app/wizard/page.tsx:27-28 (wizard page card)
// ADAPT THIS PATTERN for panel container:
className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
```

**TRANSITION_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/browser/Sidebar.tsx (transition on collapse)
// COPY THIS PATTERN for slide animation:
className="transition-all duration-200"
// Use overflow-hidden + max-height or grid-rows for smooth collapse
```

**CLOSE_BUTTON_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/browser/Sidebar.tsx:55-69
// ADAPT THIS PATTERN for close button (X icon):
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M18 6 6 18" />
  <path d="m6 6 12 12" />
</svg>
```

**LOCALSTORAGE_PATTERN:**
```typescript
// SOURCE: app/ui/src/app/page.tsx:38-48
// NOTE: Wizard panel open/close is NOT persisted to localStorage.
// This is ephemeral state - panel always starts closed on page load.
```

---

## Files to Change

| File | Action | Justification |
| ---- | ------ | ------------- |
| `app/ui/src/components/browser/WizardPanel.tsx` | CREATE | New component: collapsible wizard panel with local state management, embeds existing wizard step components |
| `app/ui/src/components/browser/TopBar.tsx` | UPDATE | No code changes needed - already accepts `children` prop. The button is passed as children from page.tsx |
| `app/ui/src/app/page.tsx` | UPDATE | Add wizard open/close state, render WizardPanel between TopBar and main content, pass "Find My Document" button as TopBar children |

---

## NOT Building (Scope Limits)

- **URL state synchronization** - The embedded wizard does NOT update the browser URL. This is by design per PRD decision log ("Embedded panel shouldn't affect browser URL")
- **Deprecating `/wizard` route** - The standalone wizard page remains. PRD open question explicitly defers this decision
- **Search bar** - This is Phase 4 scope, not Phase 3
- **Sort dropdown changes** - This is Phase 4 scope
- **Keyboard shortcut to open wizard** - Not in PRD scope. Could be added later
- **Animation polish** - Basic CSS transition for open/close. No spring animations or complex choreography
- **Wizard state persistence** - Panel always starts closed on page load. No localStorage for wizard open state

---

## Step-by-Step Tasks

### Task 1: CREATE `app/ui/src/components/browser/WizardPanel.tsx`

- **ACTION**: Create the WizardPanel component that manages wizard state locally and renders existing wizard step components
- **IMPLEMENT**:
  - Props: `{ isOpen: boolean; onClose: () => void }`
  - Local state: `platform`, `generation`, `category`, `selectedTypeId` (mirroring WizardContainer but without URL params)
  - Computed `currentStep` using same `useMemo` logic as WizardContainer (line 129-134)
  - Handler callbacks: `handlePlatformSelect`, `handleGenerationSelect`, `handleCategorySelect`, `handleTypeFilterChange`, `handleBack*`, `handleStartOver` - all update local state only (no `router.push`)
  - Render: Container div with `transition-all duration-200` for smooth open/close, panel header with title "Find My Document" and close (X) button, `StepIndicator`, then conditionally render `PlatformSelector`/`GenerationSelector`/`CategorySelector`/`WizardResults` based on `currentStep`
  - Use `overflow-hidden` with conditional `max-h-0`/`max-h-[600px]` (or similar) pattern for collapse animation. Alternative: use `grid` with `grid-rows-[0fr]`/`grid-rows-[1fr]` transition pattern
  - No loading/hydration state needed (unlike WizardContainer which hydrates from URL)
- **MIRROR**: `app/ui/src/components/wizard/WizardContainer.tsx` for state management logic; `app/ui/src/components/browser/Sidebar.tsx` for component structure/styling conventions
- **IMPORTS**:
  ```typescript
  import { useCallback, useMemo, useState } from "react";
  import type { Platform, Generation, DocumentCategory, WizardStep } from "@/types/wizard";
  import { StepIndicator } from "@/components/wizard/StepIndicator";
  import { PlatformSelector } from "@/components/wizard/PlatformSelector";
  import { GenerationSelector } from "@/components/wizard/GenerationSelector";
  import { CategorySelector } from "@/components/wizard/CategorySelector";
  import { WizardResults } from "@/components/wizard/WizardResults";
  ```
- **GOTCHA**: WizardContainer uses `useRouter` and `useSearchParams` for all navigation. The WizardPanel must NOT import or use these. All state changes are `setState` only. The key difference is every handler that previously called `router.push(...)` now just calls `setState(...)`.
- **GOTCHA**: WizardResults `onTypeFilterChange` callback currently updates URL in WizardContainer. In WizardPanel, this becomes `setSelectedTypeId(typeId)`.
- **GOTCHA**: WizardContainer has URL hydration logic (lines 37-126). WizardPanel does NOT need this - it always starts at step 1 (platform selection) with null state.
- **GOTCHA**: When `isOpen` transitions from true to false, reset wizard state so next open starts fresh. Use a `useEffect` watching `isOpen` to reset when it becomes false.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit` - types must compile. `npm run lint` - no lint errors.

### Task 2: UPDATE `app/ui/src/app/page.tsx` - Add wizard state and render WizardPanel

- **ACTION**: Add `wizardOpen` state, render "Find My Document" button in TopBar children, render WizardPanel between TopBar and the main content container
- **IMPLEMENT**:
  - Add state: `const [wizardOpen, setWizardOpen] = useState(false);`
  - Add handler: `const handleToggleWizard = useCallback(() => { setWizardOpen(prev => !prev); }, []);`
  - Add handler: `const handleCloseWizard = useCallback(() => { setWizardOpen(false); }, []);`
  - Pass button as TopBar children:
    ```tsx
    <TopBar>
      <button
        onClick={handleToggleWizard}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Find My Document
      </button>
    </TopBar>
    ```
  - Render WizardPanel BETWEEN TopBar and the `max-w-7xl` container div:
    ```tsx
    <TopBar>...</TopBar>
    <WizardPanel isOpen={wizardOpen} onClose={handleCloseWizard} />
    <div className="mx-auto max-w-7xl px-4 py-6">
      ...existing content...
    </div>
    ```
  - Add import: `import { WizardPanel } from "@/components/browser/WizardPanel";`
- **MIRROR**: `app/ui/src/app/page.tsx:138-143` for `useCallback` handler pattern; `app/ui/src/app/page.tsx:196-198` for component placement
- **GOTCHA**: The WizardPanel sits outside the `max-w-7xl` container so it can span full width with its own internal max-width. This matches the design reference (panel spans below topbar edge-to-edge).
- **GOTCHA**: Don't break existing `<TopBar />` self-closing tag - change to `<TopBar>...</TopBar>` with children.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit && npm run lint`

### Task 3: VERIFY wizard components work correctly inside WizardPanel

- **ACTION**: Manually verify the integration works end-to-end by running the dev server
- **IMPLEMENT**:
  - Run `cd app/ui && npm run dev`
  - Navigate to `http://localhost:3000`
  - Verify:
    1. "Find My Document" button appears in TopBar right side
    2. Clicking button opens the wizard panel with smooth animation
    3. Platform selector loads and displays platforms
    4. Selecting a platform advances to generation selector
    5. Back button returns to previous step
    6. Completing all steps shows WizardResults with documents
    7. Document type chip filters work in results
    8. Clicking X closes the panel
    9. Re-opening the panel starts fresh at step 1
    10. Sidebar filters and document grid/table still work underneath
    11. Dark mode renders correctly (if testable)
- **VALIDATE**: All 11 verification points pass. No console errors.

### Task 4: BUILD verification

- **ACTION**: Run production build to ensure no build-time errors
- **IMPLEMENT**: Run `cd app/ui && npm run build`
- **VALIDATE**: Build completes with exit 0, no errors

---

## Testing Strategy

### Manual Test Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Panel opens | Click "Find My Document" | Panel slides open showing PlatformSelector |
| Panel closes via X | Click X button in panel header | Panel slides closed |
| Panel closes via toggle | Click "Find My Document" again while open | Panel slides closed |
| Step progression | Select Platform → Generation → Category | Each step renders correct component |
| Back navigation | Click Back on GenerationSelector | Returns to PlatformSelector with null state |
| Start Over | Click Start Over on WizardResults | Returns to PlatformSelector, all state reset |
| Results display | Complete all steps | WizardResults shows filtered documents |
| Type filter chips | Click a document type chip in results | Results filter by type |
| Document link | Click View on a result | Navigates to `/admin/documents/{guid}` |
| Panel reset on close | Open panel, progress to step 2, close, reopen | Panel starts at step 1 |
| Browse context preserved | Open filters in sidebar, open wizard, close wizard | Sidebar filters still active, documents filtered |
| No URL change | Open wizard, progress through steps | Browser URL stays at `/` |

### Edge Cases Checklist

- [ ] Open panel with slow network (platforms loading state)
- [ ] Open panel, close immediately before platforms load
- [ ] Platform selection with 0 generations returned
- [ ] Category with 0 document types (no chips shown)
- [ ] Results with 0 documents (empty state message)
- [ ] Results with >10 documents (pagination within wizard results)
- [ ] Rapid open/close toggling (animation doesn't break)
- [ ] Panel open with very long content (scrolling within panel)

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

**EXPECT**: Build succeeds with exit 0

### Level 3: MANUAL_VALIDATION

1. Start dev server: `cd app/ui && npm run dev`
2. Open `http://localhost:3000`
3. Run through all manual test cases in Testing Strategy table
4. Verify no console errors in browser dev tools

---

## Acceptance Criteria

- [ ] "Find My Document" button visible in TopBar
- [ ] Clicking button opens collapsible wizard panel below TopBar
- [ ] Wizard panel uses local state (no URL changes)
- [ ] All 4 wizard steps work: Platform → Generation → Category → Results
- [ ] Back and Start Over navigation works within panel
- [ ] Document type chip filters work in results
- [ ] Document links navigate to viewer correctly
- [ ] Closing panel resets wizard state
- [ ] Reopening panel starts at step 1
- [ ] Panel has smooth open/close CSS transition
- [ ] Panel close button (X) works
- [ ] Existing browse functionality (sidebar, grid/table, pagination) unaffected
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Production build succeeds

---

## Completion Checklist

- [ ] Task 1 completed: WizardPanel component created
- [ ] Task 2 completed: page.tsx updated with wizard state and panel rendering
- [ ] Task 3 completed: Manual verification passes
- [ ] Task 4 completed: Production build succeeds
- [ ] Level 1: Static analysis passes
- [ ] Level 2: Build passes
- [ ] Level 3: Manual verification passes
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Wizard step components may have implicit dependency on WizardContainer's URL hydration | LOW | MEDIUM | Verified: PlatformSelector, GenerationSelector, CategorySelector, WizardResults all accept their data via props. They don't read URL params directly. Only WizardContainer reads URL params. |
| WizardResults links go to `/admin/documents/{guid}` which may not be the ideal user-facing route | LOW | LOW | This is existing behavior. A user-facing document route is a future concern. Leave as-is for Phase 3. |
| CSS transition for panel collapse may look janky | MEDIUM | LOW | Use proven `max-height` + `overflow-hidden` + `transition-all duration-200` pattern. Can also use `grid-rows` technique for smoother animation. Test both approaches and pick the smoother one. |
| Large wizard content height may cause layout shift | LOW | LOW | Set a reasonable `max-h` that accommodates all wizard steps. PlatformSelector is the tallest with its grid of buttons. |

---

## Notes

- The existing `/wizard` route is NOT modified or deprecated. Both paths to the wizard coexist.
- The WizardPanel is deliberately simple - it's essentially WizardContainer without the URL routing logic. About 60% of WizardContainer's code is URL hydration/synchronization that we don't need.
- The "Find My Document" button styling uses the primary blue button pattern already established in the codebase.
- The panel renders at full page width (outside `max-w-7xl`) with its own internal `max-w-3xl` container to match the wizard page's content width. This creates a visual "band" across the page that clearly separates the wizard from the browse content.
- Phase 4 (Search + Sort) can run in parallel since it modifies different parts of the TopBar (left/center for search vs right side for wizard button) and ContentHeader (sort controls).
