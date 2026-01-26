# Feature: Remove Type Step from Wizard

## Summary

Remove the mandatory Document Type selection step (step 4) from the wizard flow, reducing it from 4 steps to 3. The wizard will navigate: Platform > Generation > Category > Results. The `type` URL param, state, handlers, hydration logic, and `TypeSelector` component are all removed. WizardResults receives `category` instead of `type` and calls `fetchFilteredDocuments` without `documentTypeId`. The StepIndicator is updated to show 3 steps.

## User Story

As a Cirrus aircraft owner
I want to see all documents in my selected category immediately after choosing it
So that I can browse available documents without guessing the exact document type upfront

## Problem Statement

The 4-step wizard forces users to select a specific document type before seeing any results. Users browsing or unsure which type they need are stuck at step 4. This adds friction and increases time-to-document.

## Solution Statement

Remove the Type step entirely. After Category selection, go directly to Results showing all documents for the selected platform/generation/category combination. The API already supports optional `documentTypeId`, so no backend changes are needed.

## Metadata

| Field            | Value                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Type             | ENHANCEMENT                                                                     |
| Complexity       | LOW                                                                             |
| Systems Affected | `types/wizard.ts`, `WizardContainer.tsx`, `StepIndicator.tsx`, `WizardResults.tsx`, `TypeSelector.tsx` (delete) |
| Dependencies     | None (all changes are frontend, API already supports optional type)             |
| Estimated Tasks  | 5                                                                               |

---

## UX Design

### Before State

```
  [1: Platform] ──► [2: Generation] ──► [3: Category] ──► [4: Type] ──► [Results]
       ↑                  ↑                   ↑                ↑
       └──────────────────┴───────────────────┴────────────────┘
                         (Back navigation)

URL: /wizard?platform=1&generation=2&category=3&type=4
Steps shown in indicator: Platform - Generation - Category - Type (4 circles)
Results subtitle: "SR22 G6 - IPC" (platform generation - type.name)
```

### After State

```
  [1: Platform] ──► [2: Generation] ──► [3: Category] ──► [Results]
       ↑                  ↑                   ↑
       └──────────────────┴───────────────────┘
                       (Back navigation)

URL: /wizard?platform=1&generation=2&category=3
Steps shown in indicator: Platform - Generation - Category (3 circles)
Results subtitle: "SR22 G6 - Maintenance" (platform generation - category.name)
```

### Interaction Changes

| Location              | Before                          | After                                 | User Impact                          |
|-----------------------|---------------------------------|---------------------------------------|--------------------------------------|
| StepIndicator         | 4 steps shown                   | 3 steps shown                         | Simpler progress view                |
| Category selection    | Navigates to Type step          | Navigates directly to Results         | One fewer click to see documents     |
| Results page          | Shows docs for specific type    | Shows all docs in category            | Broader view, more documents visible |
| Results subtitle      | `{platform} {gen} - {type}`     | `{platform} {gen} - {category}`       | Category name shown instead of type  |
| URL                   | Includes `&type=X`              | No `type` param                       | Cleaner shareable URLs               |
| Back from Results     | Goes to Type step               | Goes to Category step                 | Direct back to last selection        |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/components/wizard/WizardContainer.tsx` | all | Main orchestrator - most changes here |
| P0 | `app/ui/src/types/wizard.ts` | all | WizardStep type definition to modify |
| P0 | `app/ui/src/components/wizard/StepIndicator.tsx` | all | Steps array and index logic to update |
| P0 | `app/ui/src/components/wizard/WizardResults.tsx` | all | Props interface and data fetching to update |
| P1 | `app/ui/src/lib/api/wizard.ts` | 21-46 | FetchFilteredDocumentsParams - already optional |
| P2 | `app/ui/src/components/wizard/TypeSelector.tsx` | all | File being deleted - verify no external refs |

---

## Patterns to Mirror

**COMPONENT_PROPS_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardResults.tsx:9-14
// Current pattern for props interfaces:
interface WizardResultsProps {
  platform: Platform;
  generation: Generation;
  type: DocumentType;  // REMOVE THIS
  onStartOver: () => void;
}
```

**STEP_INDICATOR_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/StepIndicator.tsx:9-14
// Steps defined as typed array:
const steps: { key: WizardStep; label: string }[] = [
  { key: "platform", label: "Platform" },
  { key: "generation", label: "Generation" },
  { key: "category", label: "Category" },
  { key: "type", label: "Type" },  // REMOVE THIS
];
```

**CURRENT_STEP_CALCULATION:**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardContainer.tsx:158-164
const currentStep: WizardStep = useMemo(() => {
  if (type) return "results";     // CHANGE: if (category) return "results"
  if (category) return "type";    // REMOVE
  if (generation) return "category";
  if (platform) return "generation";
  return "platform";
}, [platform, generation, category, type]);
```

**URL_NAVIGATION_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardContainer.tsx:188-197
const handleCategorySelect = useCallback(
  (selected: DocumentCategory) => {
    setCategory(selected);
    setType(null);  // REMOVE - no type state anymore
    router.push(
      `/wizard?platform=${platformId}&generation=${generationId}&category=${selected.id}`
    );
  },
  [router, platformId, generationId]
);
```

**RESULTS_SUBTITLE_PATTERN:**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardResults.tsx:85-87
<p className="text-sm text-zinc-500 dark:text-zinc-400">
  {platform.name} {generation.name} - {type.name}  // CHANGE to category.name
</p>
```

**RESULTS_RENDER_GUARD:**
```typescript
// SOURCE: app/ui/src/components/wizard/WizardContainer.tsx:313-320
{currentStep === "results" && platform && generation && category && type && (
  <WizardResults
    platform={platform}
    generation={generation}
    type={type}            // CHANGE: category={category}
    onStartOver={handleStartOver}
  />
)}
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/ui/src/types/wizard.ts` | UPDATE | Remove `"type"` from WizardStep union |
| `app/ui/src/components/wizard/WizardContainer.tsx` | UPDATE | Remove type state, handlers, hydration, update step logic and rendering |
| `app/ui/src/components/wizard/StepIndicator.tsx` | UPDATE | Remove type from steps array, update results index |
| `app/ui/src/components/wizard/WizardResults.tsx` | UPDATE | Replace `type: DocumentType` prop with `category: DocumentCategory`, remove documentTypeId from fetch, update subtitle |
| `app/ui/src/components/wizard/TypeSelector.tsx` | DELETE | Component no longer used in wizard flow |

---

## NOT Building (Scope Limits)

- **Chip filter for optional type narrowing on results** - That's Phase 2; this phase only removes the mandatory step
- **Pagination** - Phase 2 scope
- **URL type param for optional filtering** - Phase 2; we remove the mandatory `type` param here
- **Backend changes** - API already supports optional `documentTypeId`
- **fetchDocumentTypeById removal from wizard.ts** - Keep for now; Phase 2 may reuse it for chip filter URL state, and FileUploader also imports from wizard.ts

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `app/ui/src/types/wizard.ts` - Remove "type" from WizardStep

- **ACTION**: Remove `"type"` from the WizardStep union type
- **IMPLEMENT**:
  - Line 32: Change `"platform" | "generation" | "category" | "type" | "results"` to `"platform" | "generation" | "category" | "results"`
- **KEEP**: The `DocumentType` interface (line 24-30) stays - it's used by `FileUploader` and will be used by Phase 2 chip filter
- **VALIDATE**: `npm run build` from `app/ui/` - TypeScript will flag all locations still referencing `"type"` as a WizardStep (which helps identify remaining cleanup in subsequent tasks)

### Task 2: UPDATE `app/ui/src/components/wizard/StepIndicator.tsx` - Remove type step

- **ACTION**: Remove the type entry from steps array, update getStepIndex
- **IMPLEMENT**:
  - Line 13: Remove `{ key: "type", label: "Type" },` from the steps array
  - Line 17: Change `if (step === "results") return 4;` to `if (step === "results") return 3;` (now 3 steps, results = index 3)
- **RESULT**: Step indicator shows 3 circles: Platform, Generation, Category
- **VALIDATE**: `npm run build` from `app/ui/` - no type errors

### Task 3: UPDATE `app/ui/src/components/wizard/WizardResults.tsx` - Accept category instead of type

- **ACTION**: Replace `type: DocumentType` prop with `category: DocumentCategory`, remove documentTypeId from fetch call, update subtitle
- **IMPLEMENT**:
  - Line 6: Change import from `type { Platform, Generation, DocumentType }` to `type { Platform, Generation, DocumentCategory }`
  - Lines 9-14: Replace `type: DocumentType` with `category: DocumentCategory` in props interface
  - Lines 16-21: Replace `type` destructure with `category`
  - Lines 30-34: Remove `documentTypeId: type.id` from fetchFilteredDocuments call (keep platformId and generationId)
  - Line 41: Change deps array from `[platform.id, generation.id, type.id]` to `[platform.id, generation.id, category.id]`
  - Line 86: Change `{type.name}` to `{category.name}` in subtitle
  - Line 103: Update empty-state text from "Try a different platform, generation, or document type" to "Try a different platform, generation, or category"
  - Line 279 of WizardContainer (aria-live): Will be updated in Task 4
- **ALSO ADD** to fetchFilteredDocuments call: `categoryId` is not currently a supported filter param - check if needed.
  - Looking at `FetchFilteredDocumentsParams` (wizard.ts:21-25): only `platformId`, `generationId`, `documentTypeId`. No `categoryId`.
  - The backend `/api/documents` endpoint may or may not support `category_id`. Since Phase 1 just removes the type step and we're still filtering by platform+generation, we'll proceed without adding category filtering. The results will show all documents matching platform+generation. Phase 2 can add category-level filtering if the API supports it.
  - **CORRECTION**: Actually re-reading the PRD: "Results page shows all documents matching the selected platform/generation/category". We need to check if the API supports `category_id` filtering. If not, we filter by platform+generation only (which the API already supports). Let me check...
  - The `FetchFilteredDocumentsParams` interface doesn't have `categoryId`. The backend endpoint params would need to be checked. For Phase 1, we filter by `platformId` and `generationId` only. This is acceptable since categories are broad groupings and the result set from platform+generation is already well-scoped.
- **VALIDATE**: `npm run build` from `app/ui/` - no type errors

### Task 4: UPDATE `app/ui/src/components/wizard/WizardContainer.tsx` - Remove all type-related logic

- **ACTION**: Remove type state, type URL param, type hydration, type handlers, type rendering. Update step calculation and category handler.
- **IMPLEMENT** (in order of lines):
  - **Line 5**: Remove `DocumentType` from type import: `import type { Platform, Generation, DocumentCategory, WizardStep } from "@/types/wizard";`
  - **Lines 6-11**: Remove `fetchDocumentTypeById` from import
  - **Line 16**: Remove `import { TypeSelector } from "./TypeSelector";`
  - **Line 27**: Remove `const typeId = searchParams.get("type");`
  - **Line 33**: Remove `const [type, setType] = useState<DocumentType | null>(null);`
  - **Lines 50-57**: In the no-URL-params reset block, remove `setType(null)` (line 54)
  - **Lines 82-83**: In the invalid-generation block, remove `setType(null)` (line 83)
  - **Lines 90-91**: In the no-generation else block, remove `setType(null)` (line 91)
  - **Lines 103-104**: In the invalid-category block, remove `setType(null)` (line 104)
  - **Lines 110-111**: In the no-category else block, remove `setType(null)` (line 111)
  - **Lines 116-135**: Remove entire type hydration block (fetch type from URL)
  - **Line 155**: Remove `typeId` from useEffect dependency array
  - **Lines 158-164**: Update currentStep calculation:
    ```typescript
    const currentStep: WizardStep = useMemo(() => {
      if (category) return "results";
      if (generation) return "category";
      if (platform) return "generation";
      return "platform";
    }, [platform, generation, category]);
    ```
  - **Lines 170-172**: In handlePlatformSelect, remove `setType(null)` (line 172)
  - **Lines 180-182**: In handleGenerationSelect, remove `setType(null)` (line 182)
  - **Lines 189-196**: In handleCategorySelect, remove `setType(null)` (line 191). The URL push stays the same (already doesn't include type).
  - **Lines 199-207**: Remove entire `handleTypeSelect` callback
  - **Lines 215-218**: Remove entire `handleBackToCategory` callback
  - **Lines 222-224**: In handleStartOver, remove `setType(null)` (line 224)
  - **Line 233**: Change loading skeleton step count from `[1, 2, 3, 4]` to `[1, 2, 3]`
  - **Line 237**: Change connector guard from `i < 4` to `i < 3`
  - **Lines 274-280**: Update aria-live announcements:
    - Change "Step 1 of 4" to "Step 1 of 3"
    - Change "Step 2 of 4" to "Step 2 of 3"
    - Change "Step 3 of 4" to "Step 3 of 3"
    - Remove line 278: `{currentStep === "type" && "Step 4 of 4: Select document type"}`
    - Change results announcement from `${type?.name}` to `${category?.name}`
  - **Lines 303-311**: Remove entire TypeSelector rendering block
  - **Lines 313-320**: Update WizardResults rendering:
    - Change guard from `platform && generation && category && type` to `platform && generation && category`
    - Change props from `type={type}` to `category={category}`
    - Add `onBack` prop pointing to `handleBackToGeneration` (so user can go back from results)
  - **ALSO**: Add a `handleBackToCategory` that goes back to category selection (resets category):
    ```typescript
    const handleBackToCategory = useCallback(() => {
      setCategory(null);
      router.push(`/wizard?platform=${platformId}&generation=${generationId}`);
    }, [router, platformId, generationId]);
    ```
    Wait - this is the same as the existing `handleBackToGeneration`! Looking at the code again:
    - `handleBackToGeneration` (line 209-213): sets `category=null, type=null`, pushes `/wizard?platform=${platformId}`. This goes back to generation selection (shows platform only in URL).
    - We need a way to go back from results to category selection. The URL for category selection is `/wizard?platform=${platformId}&generation=${generationId}`. So we need:
    ```typescript
    const handleBackFromResults = useCallback(() => {
      setCategory(null);
      router.push(`/wizard?platform=${platformId}&generation=${generationId}`);
    }, [router, platformId, generationId]);
    ```
    Actually this is what `handleBackToCategory` currently does (line 215-218) but it's being repurposed. The old one resets type and goes to category URL. The new one resets category and goes to generation URL (which shows category selector).

    **Simplification**: We can pass `handleBackToCategory` but redefine it:
    ```typescript
    const handleBackFromResults = useCallback(() => {
      setCategory(null);
      router.push(`/wizard?platform=${platformId}&generation=${generationId}`);
    }, [router, platformId, generationId]);
    ```
    And pass `onBack={handleBackFromResults}` to WizardResults.

  - **WizardResults also needs an `onBack` prop** - we need to add this to WizardResults in Task 3. Update Task 3 to also add `onBack: () => void` to WizardResultsProps and render a Back button.
- **VALIDATE**: `npm run build` from `app/ui/` - no type errors, no unused imports

### Task 5: DELETE `app/ui/src/components/wizard/TypeSelector.tsx`

- **ACTION**: Delete the file entirely
- **PREREQ**: Tasks 1-4 completed - no remaining imports of TypeSelector
- **VALIDATE**: `npm run build` from `app/ui/` - build succeeds with no errors

---

## Testing Strategy

### Manual Testing Checklist

Since there are no automated UI tests in this codebase, validation is manual + build verification.

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Fresh wizard start | Navigate to `/wizard` | 3-step indicator shown, Platform selector displayed |
| Full flow | Select Platform > Generation > Category | Results displayed immediately after category selection |
| URL state - full | Navigate to `/wizard?platform=1&generation=1&category=1` | Results hydrate correctly from URL |
| URL state - partial | Navigate to `/wizard?platform=1&generation=1` | Category selector shown |
| URL state - old format | Navigate to `/wizard?platform=1&generation=1&category=1&type=5` | Results shown (extra `type` param ignored) |
| Back from results | Click Back on results page | Category selector shown |
| Start Over | Click Start Over on results | Returns to Platform selector, URL is `/wizard` |
| Error recovery | Use invalid platform ID in URL | Error state shown, Start Over works |
| Step indicator | Complete each step | Steps show checkmarks for completed, ring for current |
| Accessibility | Tab through wizard | Focus rings visible, aria-live announces step changes |

### Edge Cases Checklist

- [ ] Old bookmarked URLs with `&type=X` param still work (param ignored)
- [ ] Empty category (no documents) shows empty state
- [ ] Back navigation from results resets correctly
- [ ] Step indicator shows 3 steps (not 4) in both mobile and desktop
- [ ] Loading skeleton shows 3 step circles (not 4)

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && npm run lint
```

**EXPECT**: Exit 0, no errors

### Level 2: TYPE_CHECK (included in build)

```bash
cd app/ui && npm run build
```

**EXPECT**: Exit 0, successful build. This validates TypeScript compilation, Next.js page rendering, and no unused imports flagged by lint.

### Level 3: MANUAL_VALIDATION

1. Start dev server: `cd app/ui && npm run dev`
2. Navigate to `http://localhost:3000/wizard`
3. Walk through: Platform > Generation > Category > verify Results appear
4. Verify 3-step indicator
5. Verify Back and Start Over work
6. Test URL hydration with `/wizard?platform=1&generation=1&category=1`

---

## Acceptance Criteria

- [ ] Wizard navigates Platform > Generation > Category > Results (3 steps, no Type)
- [ ] StepIndicator shows 3 steps (Platform, Generation, Category)
- [ ] WizardResults fetches documents by platform+generation only (no mandatory type)
- [ ] Results subtitle shows category name instead of type name
- [ ] TypeSelector.tsx is deleted
- [ ] `WizardStep` type no longer includes `"type"`
- [ ] URL format is `/wizard?platform=X&generation=Y&category=Z` (no `&type=`)
- [ ] Old URLs with `&type=` param don't break (param is simply ignored)
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] All aria-live announcements say "of 3" not "of 4"

---

## Completion Checklist

- [ ] Task 1: WizardStep type updated
- [ ] Task 2: StepIndicator updated
- [ ] Task 3: WizardResults updated (category prop, no type, back button)
- [ ] Task 4: WizardContainer updated (all type logic removed)
- [ ] Task 5: TypeSelector.tsx deleted
- [ ] Level 1: `npm run lint` passes
- [ ] Level 2: `npm run build` passes
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Old bookmarked URLs with `&type=` break | LOW | LOW | URL search params are parsed individually; unrecognized `type` param is ignored by new code |
| Results show too many documents without type filter | MEDIUM | LOW | Phase 2 adds chip filter + pagination. For Phase 1, the result set is scoped by platform+generation which is already reasonably bounded |
| `fetchDocumentTypeById` becomes unused | LOW | LOW | Keep it - Phase 2 chip filter and FileUploader may need it |
| No `categoryId` filter in API means results aren't category-scoped | MEDIUM | MEDIUM | Results filter by platform+generation. If the API has a `category_id` param we're not using, we should add it. Implementation agent should check the backend API for this param and add `categoryId` to `FetchFilteredDocumentsParams` if supported. |

---

## Notes

- **API check needed during implementation**: The backend `GET /api/documents` endpoint may support a `category_id` query param. The implementation agent should check `app/api/routers/documents.py` for the endpoint definition. If `category_id` is supported, add it to `FetchFilteredDocumentsParams` and pass `category.id` from WizardResults. If not, Phase 1 works fine with platform+generation filtering only.
- **WizardResults `onBack` prop**: Task 3 should add `onBack: () => void` to WizardResultsProps and render a Back button (matching the style used in CategorySelector). Task 4 then passes a `handleBackFromResults` callback that resets category and navigates to `/wizard?platform=${platformId}&generation=${generationId}`.
- **Phase 2 dependency**: This phase must be complete before Phase 2 (chip filter + pagination) can begin. Phase 2 will modify WizardResults further.
