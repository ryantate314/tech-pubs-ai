# Feature: Document Filter Wizard - Phase 5: Polish & QA

## Summary

Enhance the existing wizard UI with accessibility improvements (ARIA attributes, screen reader announcements, keyboard navigation), mobile layout polish, loading skeleton states, and step transition animations to make it production-ready.

## User Story

As an aircraft owner using the wizard on any device
I want a polished, accessible experience
So that I can efficiently find documents regardless of my device or assistive technology

## Problem Statement

The wizard is functional but lacks production polish: no ARIA attributes for screen readers, no keyboard arrow navigation between options, text-only loading states (no skeletons), no transition animations between steps, and the mobile layout could be tighter. These gaps reduce accessibility compliance and perceived quality.

## Solution Statement

Add ARIA roles and labels to all wizard components, implement keyboard navigation for option grids, replace text loading states with skeleton loaders, add CSS transitions between steps, and optimize the mobile layout for smaller screens.

## Metadata

| Field            | Value                                             |
| ---------------- | ------------------------------------------------- |
| Type             | ENHANCEMENT                                       |
| Complexity       | MEDIUM                                            |
| Systems Affected | app/ui (wizard components only)                   |
| Dependencies     | None (all UI-only changes)                        |
| Estimated Tasks  | 7                                                 |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           WIZARD (BEFORE)                                     ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   Step Indicator: [1] Platform  [2] Generation  [3] Category  [4] Type        ║
║                   (labels hidden on mobile via hidden sm:block)               ║
║                                                                               ║
║   Loading state: "Loading platforms..." (text only, no visual indicator)      ║
║                                                                               ║
║   Selection grid: Click to select (no keyboard nav, no aria labels)           ║
║                                                                               ║
║   Step transitions: Instant swap (no animation between steps)                 ║
║                                                                               ║
║   PAIN_POINTS:                                                                ║
║   - No screen reader support (missing aria-label, role, live regions)         ║
║   - No keyboard arrow-key navigation between grid options                     ║
║   - Text-only loading indicators look unfinished                              ║
║   - Instant step transitions feel jarring                                     ║
║   - Mobile header+back button layout is cramped                               ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           WIZARD (AFTER)                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   Step Indicator: [✓] Platform  [2•] Generation  [3] Category  [4] Type       ║
║                   role="navigation" aria-label="Wizard progress"              ║
║                   (mobile: numbers only, labels on sm:+)                      ║
║                                                                               ║
║   Loading state: ┌────────┐ ┌────────┐  (skeleton cards pulse)               ║
║                  │ ░░░░░░ │ │ ░░░░░░ │  animate-pulse                        ║
║                  │ ░░░    │ │ ░░░    │                                        ║
║                  └────────┘ └────────┘                                        ║
║                                                                               ║
║   Selection grid:                                                             ║
║   role="listbox" aria-label="Select platform"                                ║
║   ┌─────────────┐  ┌─────────────┐                                           ║
║   │ SR2X        │  │ SF50        │  role="option"                             ║
║   │ Piston      │  │ Vision Jet  │  aria-selected, tabIndex                  ║
║   └─────────────┘  └─────────────┘  Arrow keys navigate, Enter selects       ║
║                                                                               ║
║   Screen reader: aria-live="polite" announces step changes                    ║
║                                                                               ║
║   Step transitions: fade-in via CSS transition                                ║
║                                                                               ║
║   Mobile: Header stacks vertically, back button below title                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| StepIndicator | No ARIA | `role="navigation"`, `aria-label`, `aria-current` | Screen readers announce progress |
| All selectors | No ARIA on grid | `role="listbox"`, `role="option"`, `aria-selected` | Screen readers announce options |
| All selectors | Click-only selection | Arrow keys navigate, Enter/Space selects | Keyboard-only users can navigate |
| All selectors | Text "Loading..." | Skeleton card grid with `animate-pulse` | Visual loading indicator |
| WizardContainer | Instant step swap | Fade-in transition on step change | Smoother visual experience |
| WizardContainer | No announcements | `aria-live="polite"` region announces step | Screen reader users know what changed |
| All selectors (mobile) | `flex justify-between` header | Stacked header on mobile, inline on sm:+ | Better mobile layout |
| WizardResults | Basic empty state | Empty state with suggestion to try different filters | Actionable guidance |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/components/wizard/WizardContainer.tsx` | all | Main component to MODIFY - step rendering, transitions, aria-live |
| P0 | `app/ui/src/components/wizard/StepIndicator.tsx` | all | Add ARIA navigation role |
| P0 | `app/ui/src/components/wizard/PlatformSelector.tsx` | all | Pattern for all selectors - add keyboard nav, skeletons, ARIA |
| P0 | `app/ui/src/components/wizard/GenerationSelector.tsx` | all | Same pattern - adapt with ARIA |
| P0 | `app/ui/src/components/wizard/CategorySelector.tsx` | all | Same pattern - adapt with ARIA |
| P0 | `app/ui/src/components/wizard/TypeSelector.tsx` | all | Same pattern - adapt with ARIA |
| P1 | `app/ui/src/components/wizard/WizardResults.tsx` | all | Enhance empty state |
| P2 | `app/ui/src/components/upload/UploadProgress.tsx` | all | Spinner/animation pattern reference |

---

## Patterns to Mirror

**FOCUS_RING_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/PlatformSelector.tsx:63
// All interactive elements already use this - KEEP consistent:
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

**LOADING_STATE_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/PlatformSelector.tsx:34-40
// REPLACE this text-only pattern with skeleton cards:
if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading platforms...
      </p>
    </div>
  );
}
```

**ERROR_STATE_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/GenerationSelector.tsx:48-61
// KEEP this pattern unchanged - it already works well:
if (error) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
      <button onClick={onBack} className="...">← Back</button>
    </div>
  );
}
```

**BUTTON_CARD_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/PlatformSelector.tsx:57-74
// This is the pattern to enhance with role="option" and keyboard handlers:
<button
  key={platform.id}
  onClick={() => onSelect(platform)}
  className="flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
>
```

**ANIMATE_PULSE_PATTERN:**
```typescript
// SOURCE: Tailwind standard - used for skeleton loading
// NEW pattern to introduce (consistent with Tailwind ecosystem):
<div className="animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 p-6 dark:border-zinc-700 dark:bg-zinc-800">
  <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
  <div className="mt-2 h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
</div>
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/ui/src/components/wizard/StepIndicator.tsx` | UPDATE | Add ARIA navigation role, aria-current, aria-label |
| `app/ui/src/components/wizard/PlatformSelector.tsx` | UPDATE | Add skeleton loading, ARIA listbox/option, keyboard nav, mobile layout |
| `app/ui/src/components/wizard/GenerationSelector.tsx` | UPDATE | Same enhancements as PlatformSelector |
| `app/ui/src/components/wizard/CategorySelector.tsx` | UPDATE | Same enhancements as PlatformSelector |
| `app/ui/src/components/wizard/TypeSelector.tsx` | UPDATE | Same enhancements as PlatformSelector |
| `app/ui/src/components/wizard/WizardResults.tsx` | UPDATE | Enhanced empty state with suggestion |
| `app/ui/src/components/wizard/WizardContainer.tsx` | UPDATE | Add aria-live region, fade transition wrapper |

---

## NOT Building (Scope Limits)

- **localStorage persistence** - Remembering last selection for returning users (PRD says "Could", deferring)
- **Skip links** - Jump-ahead navigation between wizard steps (adds complexity, not in PRD scope)
- **Full WCAG audit** - Only adding essential ARIA attributes, not pursuing WCAG AA certification
- **Complex animations** - No spring/physics animations, just simple CSS fade transitions
- **Touch gestures** - No swipe navigation on mobile (adds complexity, buttons work fine)

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `app/ui/src/components/wizard/StepIndicator.tsx` - Accessibility

- **ACTION**: Add ARIA navigation role and step status attributes
- **IMPLEMENT**:
  1. Add `role="navigation"` and `aria-label="Wizard progress"` to outer container
  2. Wrap steps in `<ol>` with `role="list"`
  3. Each step gets `<li>` with `aria-current="step"` when current
  4. Add `aria-label` to each step circle with status (e.g., "Step 1: Platform, completed")
- **MIRROR**: `StepIndicator.tsx:22-63` - keep existing visual patterns
- **GOTCHA**: Don't break the existing flex layout when adding `<ol>/<li>`; use `className="contents"` on `<ol>` or style `<li>` with flex
- **VALIDATE**: `cd app/ui && source ~/.nvm/nvm.sh && npm run build`

### Task 2: UPDATE `app/ui/src/components/wizard/PlatformSelector.tsx` - Skeleton + ARIA + Keyboard

- **ACTION**: Replace text loading with skeleton cards; add ARIA and keyboard navigation
- **IMPLEMENT**:
  1. **Skeleton loading**: Replace "Loading platforms..." text with skeleton card grid:
     ```tsx
     if (loading) {
       return (
         <div className="space-y-4">
           <div className="h-6 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
           <div className="grid gap-4 sm:grid-cols-2">
             {[1, 2].map((i) => (
               <div key={i} className="animate-pulse rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
                 <div className="h-6 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                 <div className="mt-2 h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
               </div>
             ))}
           </div>
         </div>
       );
     }
     ```
  2. **ARIA**: Add `role="listbox"` and `aria-label="Select your aircraft platform"` to grid container; each button gets `role="option"`
  3. **Keyboard navigation**: Add `onKeyDown` handler to grid:
     - ArrowRight/ArrowDown: focus next option
     - ArrowLeft/ArrowUp: focus previous option
     - Enter/Space: select focused option (already works via button click)
  4. **tabIndex**: Set `tabIndex={0}` on first option, `tabIndex={-1}` on others; update on arrow key press
- **MIRROR**: `PlatformSelector.tsx:50-77` - keep existing card styling
- **GOTCHA**: Arrow key navigation must wrap around (last -> first, first -> last). Use `useRef` for the grid container to query button children.
- **VALIDATE**: `cd app/ui && source ~/.nvm/nvm.sh && npm run build`

### Task 3: UPDATE `app/ui/src/components/wizard/GenerationSelector.tsx` - Skeleton + ARIA + Keyboard + Mobile

- **ACTION**: Same enhancements as Task 2, adapted for generation cards
- **IMPLEMENT**:
  1. **Skeleton loading**: Replace text with skeleton grid matching `sm:grid-cols-3 md:grid-cols-4`:
     ```tsx
     if (loading) {
       return (
         <div className="space-y-4">
           <div className="h-6 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
           <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="animate-pulse rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700">
                 <div className="mx-auto h-5 w-12 rounded bg-zinc-200 dark:bg-zinc-700" />
               </div>
             ))}
           </div>
         </div>
       );
     }
     ```
  2. **ARIA**: `role="listbox"` on grid, `role="option"` on buttons, `aria-label="Select generation for {platform.name}"`
  3. **Keyboard navigation**: Same pattern as Task 2
  4. **Mobile header**: Change `flex items-center justify-between` to stack on mobile:
     ```tsx
     <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
     ```
- **MIRROR**: `GenerationSelector.tsx:69-97`
- **GOTCHA**: The Back button must remain accessible on mobile - stacking puts it below the title, which is fine
- **VALIDATE**: `cd app/ui && source ~/.nvm/nvm.sh && npm run build`

### Task 4: UPDATE `app/ui/src/components/wizard/CategorySelector.tsx` - Skeleton + ARIA + Keyboard + Mobile

- **ACTION**: Same enhancements as Task 2, adapted for category cards
- **IMPLEMENT**:
  1. **Skeleton loading**: 4 skeleton cards in `sm:grid-cols-2` grid
  2. **ARIA**: `role="listbox"`, `role="option"`, `aria-label="Select document category"`
  3. **Keyboard navigation**: Same pattern
  4. **Mobile header**: Same stacking pattern as Task 3
- **MIRROR**: `CategorySelector.tsx:69-104`
- **VALIDATE**: `cd app/ui && source ~/.nvm/nvm.sh && npm run build`

### Task 5: UPDATE `app/ui/src/components/wizard/TypeSelector.tsx` - Skeleton + ARIA + Keyboard + Mobile

- **ACTION**: Same enhancements as Task 2, adapted for type cards
- **IMPLEMENT**:
  1. **Skeleton loading**: 6 skeleton cards in `sm:grid-cols-2 md:grid-cols-3` grid
  2. **ARIA**: `role="listbox"`, `role="option"`, `aria-label="Select document type"`
  3. **Keyboard navigation**: Same pattern
  4. **Mobile header**: Same stacking pattern as Task 3
- **MIRROR**: `TypeSelector.tsx:69-104`
- **VALIDATE**: `cd app/ui && source ~/.nvm/nvm.sh && npm run build`

### Task 6: UPDATE `app/ui/src/components/wizard/WizardResults.tsx` - Enhanced Empty State

- **ACTION**: Improve empty state with actionable guidance and ARIA
- **IMPLEMENT**:
  1. **Enhanced empty state**: Replace plain "No documents found" with:
     ```tsx
     <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
       <p className="text-lg font-medium text-zinc-900 dark:text-white">
         No documents found
       </p>
       <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
         No documents match your selection. Try a different platform, generation, or document type.
       </p>
       <button
         onClick={onStartOver}
         className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
       >
         Start Over
       </button>
     </div>
     ```
  2. **ARIA on results**: Add `aria-label="Search results"` on results container, `role="list"` on document list
  3. **Mobile header**: Same stacking pattern as Task 3
- **MIRROR**: `WizardResults.tsx:83-128`
- **VALIDATE**: `cd app/ui && source ~/.nvm/nvm.sh && npm run build`

### Task 7: UPDATE `app/ui/src/components/wizard/WizardContainer.tsx` - Transitions + aria-live

- **ACTION**: Add aria-live region for step announcements and fade transitions
- **IMPLEMENT**:
  1. **aria-live region**: Add a visually hidden live region that announces the current step:
     ```tsx
     <div aria-live="polite" className="sr-only">
       {currentStep === "platform" && "Step 1 of 4: Select your aircraft platform"}
       {currentStep === "generation" && `Step 2 of 4: Select generation for ${platform?.name}`}
       {currentStep === "category" && `Step 3 of 4: Select document category`}
       {currentStep === "type" && `Step 4 of 4: Select document type`}
       {currentStep === "results" && `Showing results for ${platform?.name} ${generation?.name} ${type?.name}`}
     </div>
     ```
  2. **Skeleton loading for hydration**: Replace "Loading..." text with a skeleton layout matching the step indicator + content area:
     ```tsx
     if (isHydrating) {
       return (
         <div className="space-y-8">
           <div className="flex items-center justify-center gap-2">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="flex items-center gap-2">
                 <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
                 <div className="hidden h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 sm:block" />
                 {i < 4 && <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-700" />}
               </div>
             ))}
           </div>
           <div className="grid gap-4 sm:grid-cols-2">
             {[1, 2].map((i) => (
               <div key={i} className="animate-pulse rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
                 <div className="h-6 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                 <div className="mt-2 h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
               </div>
             ))}
           </div>
         </div>
       );
     }
     ```
  3. **Main content `role`**: Add `role="main"` and `aria-label="Document wizard"` to the outer container
- **MIRROR**: `WizardContainer.tsx:228-301`
- **GOTCHA**: `sr-only` is a Tailwind utility (`position: absolute; width: 1px; height: 1px; ...`); verify it exists in the project or use the full class: `absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0` (clip-path approach)
- **VALIDATE**: `cd app/ui && source ~/.nvm/nvm.sh && npm run build`

---

## Testing Strategy

### Manual Testing Steps

1. **Keyboard Navigation**
   - Tab through entire wizard
   - Use arrow keys within each selection grid
   - Verify focus ring is visible on every interactive element
   - Press Enter/Space to select
   - Verify arrow wrapping (last -> first)

2. **Screen Reader** (VoiceOver on Mac, NVDA on Windows)
   - Navigate wizard with screen reader active
   - Verify step indicator announces progress
   - Verify options are announced with their names
   - Verify step changes are announced via aria-live

3. **Mobile Layout** (Chrome DevTools, 375px width)
   - Verify header + back button don't overlap
   - Verify cards stack properly on small screens
   - Verify step indicator shows numbers without labels
   - Verify touch targets are >= 44px

4. **Loading States**
   - Throttle network in DevTools (Slow 3G)
   - Verify skeleton cards appear during loading
   - Verify hydration skeleton appears on page load with URL params

5. **Empty State**
   - Navigate to a combination with no documents
   - Verify enhanced empty state shows with suggestion text and Start Over button

### Edge Cases Checklist

- [ ] Keyboard focus trapped correctly within selector grid
- [ ] Arrow keys wrap around from last to first item
- [ ] Screen reader announces step changes
- [ ] Skeleton count matches expected data (2 platforms, 4 generations, etc.)
- [ ] Back button accessible via keyboard on mobile
- [ ] Empty state Start Over button works

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && source ~/.nvm/nvm.sh && npm run lint
```

**EXPECT**: Exit 0, no errors

### Level 2: TYPE_CHECK

```bash
cd app/ui && source ~/.nvm/nvm.sh && npm run build
```

**EXPECT**: Build succeeds with no TypeScript errors

### Level 3: MANUAL_VALIDATION

See "Manual Testing Steps" above.

---

## Acceptance Criteria

- [ ] StepIndicator has `role="navigation"` and `aria-label`
- [ ] All selector grids have `role="listbox"` and options have `role="option"`
- [ ] Arrow key navigation works within each selector grid
- [ ] All loading states show skeleton cards instead of text
- [ ] WizardContainer hydration shows skeleton layout
- [ ] aria-live region announces step changes
- [ ] Mobile layout stacks headers vertically
- [ ] Empty results state has actionable suggestion and Start Over button
- [ ] Build passes with zero errors

---

## Completion Checklist

- [ ] Task 1: StepIndicator accessibility
- [ ] Task 2: PlatformSelector skeleton + ARIA + keyboard
- [ ] Task 3: GenerationSelector skeleton + ARIA + keyboard + mobile
- [ ] Task 4: CategorySelector skeleton + ARIA + keyboard + mobile
- [ ] Task 5: TypeSelector skeleton + ARIA + keyboard + mobile
- [ ] Task 6: WizardResults enhanced empty state
- [ ] Task 7: WizardContainer transitions + aria-live
- [ ] Level 1: Lint passes
- [ ] Level 2: Build succeeds
- [ ] Level 3: Manual testing passes
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ARIA roles break visual layout | LOW | MEDIUM | Use semantic elements with existing Tailwind classes; `<ol>` with flex |
| Keyboard navigation conflicts with browser defaults | LOW | LOW | Only handle ArrowUp/Down/Left/Right within listbox; don't prevent other keys |
| Skeleton count mismatch with real data | LOW | LOW | Use 2 for platforms, 4 for generations, 4 for categories, 6 for types - reasonable estimates |
| `sr-only` not available in Tailwind config | LOW | LOW | Tailwind includes `sr-only` by default; fallback to manual clip classes |

---

## Notes

- URL state management already works (implemented in Phase 3) - no changes needed
- Browser back/forward already works via `useSearchParams` dependency in useEffect
- Error states already have Back buttons for recovery - no changes needed
- Dark mode already supported across all components - skeleton cards must also support dark mode
- The `sr-only` Tailwind utility is included by default in Tailwind CSS v3+ and renders content visually hidden but available to screen readers
- Keyboard navigation uses `useRef` on the grid container and queries `button` children for focus management
