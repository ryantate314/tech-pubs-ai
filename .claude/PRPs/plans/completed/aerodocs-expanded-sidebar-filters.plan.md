# Feature: Expanded Sidebar Filters

## Summary

Add platform and generation filter dropdowns to the existing sidebar, creating a 4-dimension filter system (platform → generation → category → document type). Platform and generation follow the same cascading pattern already established for category → document type: generation is disabled until a platform is selected. Also remove the now-superseded WizardPanel component and its "Find My Document" button from the TopBar — this functionality will be replaced by the wizard-as-guided-filter in Phase 6.

## User Story

As a service center technician
I want to filter documents by platform and generation in the sidebar
So that I can see all documents relevant to a specific aircraft model without using the guided wizard

## Problem Statement

The sidebar currently only filters by category and document type. Service centers need to filter by platform (e.g., "SR22") and generation (e.g., "G6") to see all documents for a specific model. These filter dimensions exist in the API (`fetchFilteredDocuments` already accepts `platformId` and `generationId`) but have no UI controls.

## Solution Statement

Add two new dropdown filters to the top of the sidebar — Platform and Generation — above the existing Category and Document Type dropdowns. Generation cascades from Platform (disabled until platform selected), following the exact same pattern as Document Type cascading from Category. Wire both new filters into the `fetchFilteredDocuments` call. Remove the WizardPanel and its TopBar button since the sidebar now provides direct access to all filter dimensions. Update the `hasActiveFilters` check and `handleClearFilters` to include the new filters.

## Metadata

| Field            | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| Type             | ENHANCEMENT                                                |
| Complexity       | LOW-MEDIUM                                                 |
| Systems Affected | `app/ui/src/components/browser/Sidebar.tsx`, `app/ui/src/app/page.tsx`, `app/ui/src/components/browser/WizardPanel.tsx` (DELETE) |
| Dependencies     | None (reuses existing API functions and types)              |
| Estimated Tasks  | 4                                                          |

---

## UX Design

### Before State

```
┌─────────────────────────────────────────────────────────────────────┐
│ TopBar: [Logo] [Technical Publications]        [Find My Document]  │
├─────────────────────────────────────────────────────────────────────┤
│ WizardPanel (collapsible, when open)                                │
├──────────┬──────────────────────────────────────────────────────────┤
│ Sidebar  │ Main Content                                             │
│          │                                                          │
│ Filters: │ ContentHeader + DocumentCardGrid/Table + Pagination      │
│ Category │                                                          │
│ Doc Type │                                                          │
│          │                                                          │
│ [Clear]  │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘

- Only 2 filter dimensions (category, doc type)
- "Find My Document" wizard panel is a separate experience
- No way to filter by platform or generation from sidebar
```

### After State

```
┌─────────────────────────────────────────────────────────────────────┐
│ TopBar: [Logo] [Technical Publications]                             │
├──────────┬──────────────────────────────────────────────────────────┤
│ Sidebar  │ Main Content                                             │
│          │                                                          │
│ Filters: │ ContentHeader + DocumentCardGrid/Table + Pagination      │
│ Platform │                                                          │
│ Generat. │  (filtered by all 4 dimensions)                          │
│ Category │                                                          │
│ Doc Type │                                                          │
│          │                                                          │
│ [Clear]  │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘

- 4 filter dimensions: Platform → Generation → Category → Doc Type
- Generation disabled until Platform selected (cascading)
- Doc Type disabled until Category selected (existing behavior)
- WizardPanel and "Find My Document" button removed
- All filters wired to fetchFilteredDocuments()
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Sidebar | 2 filters (category, doc type) | 4 filters (platform, generation, category, doc type) | Service centers can filter by aircraft model directly |
| TopBar right side | "Find My Document" button | Empty (future: "My Aircraft") | Wizard panel removed; guided filter comes in Phase 6 |
| Below TopBar | WizardPanel renders when open | Nothing | Cleaner layout, no separate wizard UI |
| Clear Filters | Clears category + doc type | Clears all 4 filters | Single action resets all filters |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/components/browser/Sidebar.tsx` | 1-149 | Pattern to EXTEND: existing dropdown structure, styling, cascading logic, collapse mechanism |
| P0 | `app/ui/src/app/page.tsx` | 1-283 | Integration point: all state management, filter loading patterns, WizardPanel removal targets |
| P1 | `app/ui/src/lib/api/wizard.ts` | 1-50 | API functions to IMPORT: `fetchPlatforms`, `fetchGenerations`, and existing `fetchFilteredDocuments` params |
| P1 | `app/ui/src/types/wizard.ts` | 1-32 | Types to IMPORT: `Platform`, `Generation` (already has `DocumentCategory`, `DocumentType`) |
| P2 | `app/ui/src/components/browser/WizardPanel.tsx` | 1-175 | File to DELETE |

---

## Patterns to Mirror

**DROPDOWN_SECTION (category dropdown — copy this exactly for platform and generation):**
```typescript
// SOURCE: app/ui/src/components/browser/Sidebar.tsx:74-102
<div>
  <label
    htmlFor="sidebar-category"
    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
  >
    Category
  </label>
  <select
    id="sidebar-category"
    value={selectedCategoryId ?? ""}
    onChange={(e) => {
      const val = e.target.value;
      onCategoryChange(val ? Number(val) : null);
    }}
    disabled={categoriesLoading}
    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
  >
    <option value="">All Categories</option>
    {categories.map((cat) => (
      <option key={cat.id} value={cat.id}>
        {cat.name}
      </option>
    ))}
  </select>
</div>
```

**CASCADING_DISABLED_PATTERN (doc type disabled until category selected):**
```typescript
// SOURCE: app/ui/src/components/browser/Sidebar.tsx:122
disabled={selectedCategoryId === null}
// COPY THIS for generation dropdown:
disabled={selectedPlatformId === null}
```

**FILTER_STATE_PATTERN (page-level state for category):**
```typescript
// SOURCE: app/ui/src/app/page.tsx:35-36
const [categories, setCategories] = useState<DocumentCategory[]>([]);
const [categoriesLoading, setCategoriesLoading] = useState(true);
// COPY THIS for platforms:
const [platforms, setPlatforms] = useState<Platform[]>([]);
const [platformsLoading, setPlatformsLoading] = useState(true);
```

**LOAD_ON_MOUNT_PATTERN (categories loaded on mount):**
```typescript
// SOURCE: app/ui/src/app/page.tsx:55-69
const loadCategories = useCallback(async () => {
  try {
    setCategoriesLoading(true);
    const data = await fetchDocumentCategories();
    setCategories(data);
  } catch {
    // non-critical
  } finally {
    setCategoriesLoading(false);
  }
}, []);

useEffect(() => {
  loadCategories();
}, [loadCategories]);
```

**CASCADING_LOAD_PATTERN (doc types loaded when category changes):**
```typescript
// SOURCE: app/ui/src/app/page.tsx:72-103
useEffect(() => {
  if (selectedCategoryId === null) {
    setDocumentTypes([]);
    return;
  }

  let cancelled = false;

  async function loadTypes() {
    try {
      setDocumentTypesLoading(true);
      const data = await fetchDocumentTypes(selectedCategoryId!);
      if (!cancelled) {
        setDocumentTypes(data);
      }
    } catch {
      if (!cancelled) {
        setDocumentTypes([]);
      }
    } finally {
      if (!cancelled) {
        setDocumentTypesLoading(false);
      }
    }
  }

  loadTypes();

  return () => {
    cancelled = true;
  };
}, [selectedCategoryId]);
```

**HANDLER_WITH_RESET_PATTERN (category change resets doc type):**
```typescript
// SOURCE: app/ui/src/app/page.tsx:158-161
const handleCategoryChange = useCallback((id: number | null) => {
  setSelectedCategoryId(id);
  setSelectedDocumentTypeId(null); // Reset downstream
}, []);
```

---

## Files to Change

| File | Action | Justification |
| ---- | ------ | ------------- |
| `app/ui/src/components/browser/Sidebar.tsx` | UPDATE | Add platform and generation dropdown sections above existing category/doc type dropdowns. Add new props for platform/generation state and handlers |
| `app/ui/src/app/page.tsx` | UPDATE | Add platform/generation state, loading effects, handlers. Wire new filters to `fetchFilteredDocuments`. Remove WizardPanel state/handlers/import/JSX and TopBar button. Update `hasActiveFilters` and `handleClearFilters` |
| `app/ui/src/components/browser/WizardPanel.tsx` | DELETE | Superseded by expanded sidebar filters. Phase 6 will reintroduce wizard-as-guided-filter |

---

## NOT Building (Scope Limits)

- **Wizard as guided filter** — Phase 6 scope. We remove the old WizardPanel but don't create its replacement yet
- **"My Aircraft" configurator** — Phase 5 scope. The TopBar right side will be empty after removing the wizard button
- **Search bar** — Phase 4 scope. Separate parallel work
- **Document match indicators** — Phase 5 scope. Requires "My Aircraft" first
- **Removing `/wizard` route** — The standalone wizard page at `app/ui/src/app/wizard/page.tsx` remains untouched. Only the embedded WizardPanel in the browser page is removed
- **Removing wizard components** — The reusable components in `app/ui/src/components/wizard/` stay. Only `app/ui/src/components/browser/WizardPanel.tsx` is deleted. Phase 6 will reuse the wizard step components

---

## Step-by-Step Tasks

### Task 1: UPDATE `app/ui/src/components/browser/Sidebar.tsx` — Add platform and generation dropdowns

- **ACTION**: Expand the Sidebar props interface and add two new dropdown sections above the existing Category section
- **IMPLEMENT**:
  - Add new props to `SidebarProps`:
    ```typescript
    platforms: Platform[];
    platformsLoading: boolean;
    selectedPlatformId: number | null;
    onPlatformChange: (id: number | null) => void;
    generations: Generation[];
    generationsLoading: boolean;
    selectedGenerationId: number | null;
    onGenerationChange: (id: number | null) => void;
    ```
  - Add import: `import type { Platform, Generation } from "@/types/wizard";` (add to existing import from `@/types/wizard`)
  - Add Platform dropdown section (identical structure to Category dropdown):
    - Label: "Platform"
    - ID: `sidebar-platform`
    - Default option: "All Platforms"
    - Options: `platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)`
    - Disabled when: `platformsLoading`
  - Add Generation dropdown section (identical to Doc Type dropdown):
    - Label: "Generation"
    - ID: `sidebar-generation`
    - Default option: "All Generations"
    - Options: `generations.map(g => <option key={g.id} value={g.id}>{g.name}</option>)`
    - Disabled when: `selectedPlatformId === null` (cascading)
  - Place both ABOVE the existing Category dropdown in the render order:
    ```
    Platform dropdown
    Generation dropdown
    Category dropdown (existing)
    Document Type dropdown (existing)
    Clear Filters button (existing)
    ```
- **MIRROR**: `app/ui/src/components/browser/Sidebar.tsx:74-133` — copy the exact dropdown JSX structure, styling, and cascading disable pattern
- **GOTCHA**: The existing `DocumentCategory` and `DocumentType` imports from `@/types/wizard` are already in the file. Just add `Platform` and `Generation` to that import
- **VALIDATE**: `cd app/ui && npx tsc --noEmit` (will fail until page.tsx passes the new props — that's expected)

### Task 2: UPDATE `app/ui/src/app/page.tsx` — Add platform/generation state and wire to sidebar + document fetching

- **ACTION**: Add state, loading effects, handlers for platform and generation filters. Pass them to Sidebar. Wire to `fetchFilteredDocuments`
- **IMPLEMENT**:
  - Add imports: `fetchPlatforms`, `fetchGenerations` from `@/lib/api/wizard`. Add `Platform`, `Generation` to the type import from `@/types/wizard`
  - Add state (after existing sidebar state declarations):
    ```typescript
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [platformsLoading, setPlatformsLoading] = useState(true);
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [generationsLoading, setGenerationsLoading] = useState(false);
    const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null);
    const [selectedGenerationId, setSelectedGenerationId] = useState<number | null>(null);
    ```
  - Add platform loading effect (mirror `loadCategories` pattern):
    ```typescript
    const loadPlatforms = useCallback(async () => {
      try {
        setPlatformsLoading(true);
        const data = await fetchPlatforms();
        setPlatforms(data);
      } catch {
        // non-critical
      } finally {
        setPlatformsLoading(false);
      }
    }, []);

    useEffect(() => {
      loadPlatforms();
    }, [loadPlatforms]);
    ```
  - Add generation cascading effect (mirror `loadTypes` pattern):
    ```typescript
    useEffect(() => {
      if (selectedPlatformId === null) {
        setGenerations([]);
        return;
      }

      let cancelled = false;

      async function loadGenerations() {
        try {
          setGenerationsLoading(true);
          const data = await fetchGenerations(selectedPlatformId!);
          if (!cancelled) {
            setGenerations(data);
          }
        } catch {
          if (!cancelled) {
            setGenerations([]);
          }
        } finally {
          if (!cancelled) {
            setGenerationsLoading(false);
          }
        }
      }

      loadGenerations();

      return () => {
        cancelled = true;
      };
    }, [selectedPlatformId]);
    ```
  - Add handlers:
    ```typescript
    const handlePlatformChange = useCallback((id: number | null) => {
      setSelectedPlatformId(id);
      setSelectedGenerationId(null); // Reset downstream
    }, []);

    const handleGenerationChange = useCallback((id: number | null) => {
      setSelectedGenerationId(id);
    }, []);
    ```
  - Update `loadDocuments` to include platform and generation:
    ```typescript
    const data = await fetchFilteredDocuments({
      platformId: selectedPlatformId ?? undefined,
      generationId: selectedGenerationId ?? undefined,
      documentCategoryId: selectedCategoryId ?? undefined,
      documentTypeId: selectedDocumentTypeId ?? undefined,
    });
    ```
    And update its dependency array:
    ```typescript
    }, [selectedPlatformId, selectedGenerationId, selectedCategoryId, selectedDocumentTypeId]);
    ```
  - Update `handleClearFilters`:
    ```typescript
    const handleClearFilters = useCallback(() => {
      setSelectedPlatformId(null);
      setSelectedGenerationId(null);
      setSelectedCategoryId(null);
      setSelectedDocumentTypeId(null);
    }, []);
    ```
  - Update `hasActiveFilters`:
    ```typescript
    const hasActiveFilters = selectedPlatformId !== null || selectedGenerationId !== null || selectedCategoryId !== null || selectedDocumentTypeId !== null;
    ```
  - Update page-reset effect to include new filters:
    ```typescript
    useEffect(() => {
      setCurrentPage(1);
    }, [selectedPlatformId, selectedGenerationId, selectedCategoryId, selectedDocumentTypeId]);
    ```
  - Pass new props to `<Sidebar>`:
    ```typescript
    platforms={platforms}
    platformsLoading={platformsLoading}
    selectedPlatformId={selectedPlatformId}
    onPlatformChange={handlePlatformChange}
    generations={generations}
    generationsLoading={generationsLoading}
    selectedGenerationId={selectedGenerationId}
    onGenerationChange={handleGenerationChange}
    ```
- **MIRROR**: `app/ui/src/app/page.tsx:55-103` for loading patterns; lines 158-172 for handler patterns
- **GOTCHA**: The `loadDocuments` dependency array currently includes `[selectedCategoryId, selectedDocumentTypeId]`. Must add `selectedPlatformId, selectedGenerationId` so documents refetch when these filters change
- **GOTCHA**: `fetchFilteredDocuments` already accepts `platformId` and `generationId` — no API changes needed
- **VALIDATE**: `cd app/ui && npx tsc --noEmit && npm run lint`

### Task 3: UPDATE `app/ui/src/app/page.tsx` — Remove WizardPanel integration

- **ACTION**: Remove all WizardPanel-related code from page.tsx and delete the WizardPanel component file
- **IMPLEMENT**:
  - Remove import: `import { WizardPanel } from "@/components/browser/WizardPanel";`
  - Remove state: `const [wizardOpen, setWizardOpen] = useState(false);`
  - Remove handlers: `handleToggleWizard` and `handleCloseWizard`
  - Remove JSX: The entire `<TopBar>...</TopBar>` children block becomes just `<TopBar />` (self-closing, no children)
  - Remove JSX: `<WizardPanel isOpen={wizardOpen} onClose={handleCloseWizard} />` line
  - Delete file: `app/ui/src/components/browser/WizardPanel.tsx`
- **MIRROR**: N/A (removal task)
- **GOTCHA**: Do NOT delete `app/ui/src/components/wizard/` directory — those components are still used by `/wizard` page and will be reused by Phase 6
- **GOTCHA**: Do NOT remove `TopBar` import — it's still rendered, just without children
- **VALIDATE**: `cd app/ui && npx tsc --noEmit && npm run lint`

### Task 4: BUILD verification

- **ACTION**: Run production build to ensure no build-time errors
- **IMPLEMENT**: Run `cd app/ui && npm run build`
- **VALIDATE**: Build completes with exit 0, no errors. Both `/` and `/wizard` routes compile successfully.

---

## Testing Strategy

### Manual Test Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Platform dropdown loads | Open page, expand sidebar | Platform dropdown shows all platforms |
| Generation cascading | Select a platform | Generation dropdown becomes enabled, shows generations for that platform |
| Generation disabled | Clear platform filter | Generation dropdown becomes disabled, shows "All Generations" |
| Platform filter works | Select a platform | Document list filters to that platform's documents |
| Generation filter works | Select platform + generation | Document list narrows to that generation |
| All 4 filters combine | Select platform + generation + category + doc type | Documents filtered by all 4 dimensions |
| Clear filters | Click "Clear Filters" | All 4 dropdowns reset to "All", full document list shown |
| Platform change resets generation | Select platform + generation, then change platform | Generation resets to null |
| Category change resets doc type | Select category + doc type, then change category | Doc type resets to null (existing behavior) |
| WizardPanel removed | Load page | No "Find My Document" button in TopBar, no wizard panel |
| Wizard page still works | Navigate to `/wizard` | Standalone wizard still functions |
| Sidebar collapse | Toggle sidebar collapse | All 4 dropdowns hidden when collapsed, shown when expanded |

### Edge Cases Checklist

- [ ] Platform with 0 generations (generation dropdown enabled but empty)
- [ ] Select all 4 filters, then clear only platform (generation resets, category + doc type stay)
- [ ] Rapid platform switching (cancellation flag prevents stale generations)
- [ ] Network error loading platforms (sidebar shows empty dropdown, non-critical failure)
- [ ] No documents match filter combination (existing empty state message)

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

**EXPECT**: Build succeeds with exit 0. Both `/` and `/wizard` routes in output.

### Level 3: MANUAL_VALIDATION

1. Start dev server: `cd app/ui && npm run dev`
2. Open `http://localhost:3000`
3. Run through all manual test cases
4. Navigate to `/wizard` — confirm standalone wizard still works
5. Verify no console errors

---

## Acceptance Criteria

- [ ] Platform dropdown visible in sidebar (above Category)
- [ ] Generation dropdown visible in sidebar (below Platform, above Category)
- [ ] Generation disabled until Platform selected
- [ ] Selecting Platform filters documents
- [ ] Selecting Generation further filters documents
- [ ] All 4 filters work in combination
- [ ] Clear Filters resets all 4 dropdowns
- [ ] Platform change resets Generation
- [ ] WizardPanel removed from page (no button, no panel)
- [ ] WizardPanel.tsx file deleted
- [ ] `/wizard` standalone page still works
- [ ] Wizard components in `src/components/wizard/` untouched
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Production build succeeds

---

## Completion Checklist

- [ ] Task 1 completed: Sidebar expanded with platform + generation dropdowns
- [ ] Task 2 completed: page.tsx state/effects/handlers for new filters
- [ ] Task 3 completed: WizardPanel removed from page and file deleted
- [ ] Task 4 completed: Production build succeeds
- [ ] Level 1: Static analysis passes
- [ ] Level 2: Build passes
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Platform/generation loading slow on mount | LOW | LOW | Both load in parallel with categories. Loading state disables dropdown. Non-critical failure handled gracefully |
| Stale generations after rapid platform switching | MEDIUM | LOW | Cancellation flag in useEffect cleanup (same pattern as existing doc types loading) prevents stale data |
| Removing WizardPanel breaks something | LOW | LOW | WizardPanel state is self-contained; removing it has no side effects on other state. `/wizard` route is independent |

---

## Notes

- This is a small-scope enhancement: the core pattern (cascading dropdowns in sidebar + filter state in page) is already established for category → doc type. We're adding platform → generation as a second cascade pair, following the identical pattern.
- The filter order in the sidebar is intentional: Platform → Generation → Category → Document Type. This mirrors the data hierarchy (broad to narrow) and matches the wizard step order.
- `fetchFilteredDocuments` already supports all 4 filter params — no backend changes needed.
- The WizardPanel removal is clean because wizard state (`wizardOpen`, handlers) is fully isolated from sidebar state. No shared state or side effects.
- Phase 6 will re-add a wizard trigger to the TopBar, but it will function differently (populating sidebar filters and showing results in main content).
