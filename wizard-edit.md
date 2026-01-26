# Wizard: Reduce Steps to 3 + Add Document Type Filter on Results

## Problem

The current 4-step wizard (Platform → Generation → Category → Type) requires too many clicks before showing documents. The "Document Type" step forces users to make a narrow selection upfront, which is especially painful when they're browsing or unsure of the exact type they need. This adds friction and slows down time-to-document.

## Proposed Change

Shorten the wizard to 3 steps: **Platform → Generation → Category**. After category selection, show the results page immediately with all documents matching that category. Add a document type filter (e.g., dropdown or chip toggles) on the results page so users can optionally narrow by type without requiring it as a mandatory step.

## Expected Behavior

- Wizard steps: Platform → Generation → Category → Results (3 steps + results, down from 4 + results)
- Results page shows all documents for the selected platform/generation/category combination
- Results page includes a document type filter to optionally narrow the list
- URL state should reflect the reduced steps (remove `type` param from wizard flow, add it as an optional filter param on results)
- StepIndicator updates to show 3 steps instead of 4
- The `TypeSelector` component is removed from the wizard flow (may be repurposed or deleted)

## Systems Affected

- `app/ui/src/components/wizard/` - WizardContainer, StepIndicator, WizardResults, TypeSelector
- `app/ui/src/types/wizard.ts` - WizardStep type
- API query for filtered documents (needs to make `documentTypeId` optional)
