# Feature: Document Filter Wizard - Phase 3: Wizard UI

## Summary

Build a 4-step wizard React UI that guides aircraft owners through selecting their platform, generation, document category, and document type to find relevant technical publications. The wizard uses URL state management for shareable links and back/forward navigation support. Components follow existing patterns from FileUploader and DocumentsList.

## User Story

As a Cirrus aircraft owner
I want to navigate through a guided wizard that filters documents step by step
So that I can quickly find technical publications specific to my aircraft platform and generation

## Problem Statement

Aircraft owners need to find documents for their specific aircraft (SR2X or SF50) and generation (G1-G7+). Currently there's no filtering capability - all documents appear in a flat list. The wizard progressively narrows options to eliminate irrelevant documents.

## Solution Statement

Create a wizard flow with 4 selection steps + results display:
1. Platform selection (SR2X, SF50)
2. Generation selection (filtered by platform)
3. Document category selection (Service Publications, Marketing Materials, etc.)
4. Document type selection (filtered by category)
5. Results page showing filtered documents with view/download actions

State management via URL search params enables shareable links and browser navigation.

## Metadata

| Field | Value |
|-------|-------|
| Type | NEW_CAPABILITY |
| Complexity | MEDIUM |
| Systems Affected | app/ui/src/components/wizard, app/ui/src/app/wizard, app/ui/src/lib/api, app/ui/src/types |
| Dependencies | Next.js 16, React 19, Tailwind v4 |
| Estimated Tasks | 14 |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │                         Documents List                               │    ║
║   │  ┌──────────────────────────────────────────────────────────────┐   │    ║
║   │  │ All Documents (no filtering)                                  │   │    ║
║   │  │  - SR20 G3 AMM                                               │   │    ║
║   │  │  - SF50 G2 POH                                               │   │    ║
║   │  │  - SR22 G6 Service Bulletin                                  │   │    ║
║   │  │  - SF50 G1 AMM                                               │   │    ║
║   │  │  - SR20 G5 Illustrated Parts                                 │   │    ║
║   │  │  ... (dozens more)                                           │   │    ║
║   │  └──────────────────────────────────────────────────────────────┘   │    ║
║   └─────────────────────────────────────────────────────────────────────┘    ║
║                                                                               ║
║   USER_FLOW: User scrolls through entire list, uses Ctrl+F to find docs       ║
║   PAIN_POINT: No way to filter by aircraft platform, generation, or doc type  ║
║   DATA_FLOW: GET /api/documents → all documents → flat list display           ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │  Step 1 of 4: Select Platform          [●○○○]                       │    ║
║   │  ┌─────────────┐  ┌─────────────┐                                   │    ║
║   │  │    SR2X     │  │    SF50     │                                   │    ║
║   │  │   (SR20,    │  │   (Vision   │                                   │    ║
║   │  │    SR22)    │  │    Jet)     │                                   │    ║
║   │  └──────┬──────┘  └─────────────┘                                   │    ║
║   └─────────┼───────────────────────────────────────────────────────────┘    ║
║             ▼                                                                 ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │  Step 2 of 4: Select Generation        [●●○○]    ← Back             │    ║
║   │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │    ║
║   │  │ G1 │ │ G2 │ │ G3 │ │ G4 │ │ G5 │ │ G6 │ │ G7 │ (SR2X only)     │    ║
║   │  └──┬─┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                  │    ║
║   └─────┼───────────────────────────────────────────────────────────────┘    ║
║         ▼                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │  Step 3 of 4: Select Category          [●●●○]    ← Back             │    ║
║   │  ┌───────────────────┐ ┌───────────────────┐                        │    ║
║   │  │ Service Pubs      │ │ Marketing         │                        │    ║
║   │  └─────────┬─────────┘ └───────────────────┘                        │    ║
║   └────────────┼────────────────────────────────────────────────────────┘    ║
║                ▼                                                              ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │  Step 4 of 4: Select Document Type     [●●●●]    ← Back             │    ║
║   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │    ║
║   │  │ AMM  │ │ POH  │ │ IPC  │ │ WDM  │ │ CMM  │ ...                   │    ║
║   │  └──┬───┘ └──────┘ └──────┘ └──────┘ └──────┘                       │    ║
║   └─────┼───────────────────────────────────────────────────────────────┘    ║
║         ▼                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────┐    ║
║   │  Results: 3 documents found            ← Start Over                  │    ║
║   │  ┌──────────────────────────────────────────────────────────────┐   │    ║
║   │  │ SR20 G1 Aircraft Maintenance Manual          [View] [Download]│   │    ║
║   │  │ SR20 G1 AMM Revision 2                       [View] [Download]│   │    ║
║   │  │ SR20 G1 AMM Supplement                       [View] [Download]│   │    ║
║   │  └──────────────────────────────────────────────────────────────┘   │    ║
║   └─────────────────────────────────────────────────────────────────────┘    ║
║                                                                               ║
║   USER_FLOW: Select platform → generation → category → type → see results     ║
║   VALUE_ADD: Filtered results specific to user's aircraft, shareable URL      ║
║   DATA_FLOW: URL params → API calls with filters → filtered document list     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `/wizard` | N/A (doesn't exist) | 4-step wizard flow | Users can navigate guided selection |
| URL params | N/A | `?platform=1&generation=2&category=3&type=4` | Shareable links, browser back works |
| Back button | N/A | Returns to previous step | Easy correction of selections |
| Start Over | N/A | Resets wizard to step 1 | Quick restart capability |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/components/upload/FileUploader.tsx` | all | Multi-step flow pattern, state management, loading/error states |
| P0 | `app/ui/src/lib/api/client.ts` | all | API client pattern with ApiError |
| P0 | `app/ui/src/lib/api/categories.ts` | all | Simple fetch function pattern |
| P1 | `app/ui/src/types/categories.ts` | all | Type definition pattern |
| P1 | `app/ui/src/components/documents/DocumentsList.tsx` | all | Data loading container pattern |
| P1 | `app/ui/src/components/documents/DocumentsTable.tsx` | all | Table display with links |
| P2 | `app/ui/src/app/api/categories/route.ts` | all | Next.js API route proxy pattern |
| P2 | `app/ui/src/app/admin/upload/page.tsx` | all | Page wrapper pattern |

**External Documentation:**
| Source | Section | Why Needed |
|--------|---------|------------|
| [Next.js 16 Docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params) | useSearchParams | URL state management in client components |
| [Next.js 16 Docs](https://nextjs.org/docs/app/api-reference/functions/use-router) | useRouter | Programmatic navigation |

---

## Patterns to Mirror

**API_CLIENT_FUNCTION:**
```typescript
// SOURCE: app/ui/src/lib/api/categories.ts:1-6
import type { Category } from "@/types/categories";
import { apiRequest } from "./client";

export async function fetchCategories(): Promise<Category[]> {
  return apiRequest<Category[]>("/api/categories");
}
```

**TYPE_DEFINITION:**
```typescript
// SOURCE: app/ui/src/types/categories.ts:1-4
export interface Category {
  id: number;
  name: string;
}
```

**DATA_LOADING_CONTAINER:**
```typescript
// SOURCE: app/ui/src/components/documents/DocumentsList.tsx:8-36
export function DocumentsList() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchDocuments();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading documents...
        </p>
      </div>
    );
  }
```

**SELECT_DROPDOWN_STYLING:**
```typescript
// SOURCE: app/ui/src/components/upload/FileUploader.tsx:192-206
<select
  id="aircraftModel"
  value={selectedAircraftModelId ?? ""}
  onChange={(e) => setSelectedAircraftModelId(Number(e.target.value))}
  disabled={isUploading || aircraftModels.length === 0}
  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
>
  {aircraftModels.map((model) => (
    <option key={model.id} value={model.id}>
      {model.name}
    </option>
  ))}
</select>
```

**BUTTON_STYLING:**
```typescript
// SOURCE: app/ui/src/components/upload/FileUploader.tsx:289-304
// Primary button
className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

// Secondary button
className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
```

**ERROR_DISPLAY:**
```typescript
// SOURCE: app/ui/src/components/documents/DocumentsList.tsx:41-45
{error && (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
  </div>
)}
```

**PAGE_WRAPPER:**
```typescript
// SOURCE: app/ui/src/app/admin/upload/page.tsx:1-21
import { FileUploader } from "@/components/upload/FileUploader";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Upload Document
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Upload a PDF document to the system.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <FileUploader />
      </div>
    </div>
  );
}
```

**API_ROUTE_PROXY:**
```typescript
// SOURCE: app/ui/src/app/api/categories/route.ts:1-13
import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { Category } from "@/types/categories";

export async function GET() {
  try {
    const data = await serverFetch<Category[]>("/api/categories");
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/ui/src/types/wizard.ts` | CREATE | Type definitions for platforms, generations, document categories, document types |
| `app/ui/src/lib/api/wizard.ts` | CREATE | API functions for wizard data fetching |
| `app/ui/src/app/api/platforms/route.ts` | CREATE | Next.js API route proxy for platforms |
| `app/ui/src/app/api/platforms/[id]/generations/route.ts` | CREATE | Next.js API route proxy for generations |
| `app/ui/src/app/api/document-categories/route.ts` | CREATE | Next.js API route proxy for document categories |
| `app/ui/src/app/api/document-categories/[id]/types/route.ts` | CREATE | Next.js API route proxy for document types |
| `app/ui/src/components/wizard/StepIndicator.tsx` | CREATE | Progress indicator showing current step |
| `app/ui/src/components/wizard/PlatformSelector.tsx` | CREATE | Step 1: Platform selection cards |
| `app/ui/src/components/wizard/GenerationSelector.tsx` | CREATE | Step 2: Generation selection |
| `app/ui/src/components/wizard/CategorySelector.tsx` | CREATE | Step 3: Document category selection |
| `app/ui/src/components/wizard/TypeSelector.tsx` | CREATE | Step 4: Document type selection |
| `app/ui/src/components/wizard/WizardResults.tsx` | CREATE | Filtered document results display |
| `app/ui/src/components/wizard/WizardContainer.tsx` | CREATE | Main orchestrator with URL state management |
| `app/ui/src/app/wizard/page.tsx` | CREATE | Wizard page at /wizard route |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **localStorage persistence** - Remembering last selection is a Phase 5 (Polish) item
- **Animations/transitions** - Phase 5 item
- **Mobile-specific layout** - Phase 5 item
- **Document count badges** - Explicitly out of PRD scope
- **Empty state handling** - Phase 5 item (basic empty message OK for now)
- **Error recovery UI** - Basic error display only, no retry logic

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `app/ui/src/types/wizard.ts`

- **ACTION**: CREATE type definitions for all wizard data
- **IMPLEMENT**:
```typescript
export interface Platform {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}

export interface Generation {
  id: number;
  code: string;
  name: string;
  display_order: number;
}

export interface DocumentCategory {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}

export interface DocumentType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}

export type WizardStep = "platform" | "generation" | "category" | "type" | "results";
```
- **MIRROR**: `app/ui/src/types/categories.ts`
- **VALIDATE**: `cd app/ui && npm run build`

### Task 2: CREATE `app/ui/src/lib/api/wizard.ts`

- **ACTION**: CREATE API functions for wizard data
- **IMPLEMENT**:
```typescript
import type { Platform, Generation, DocumentCategory, DocumentType } from "@/types/wizard";
import type { DocumentListResponse } from "@/types/documents";
import { apiRequest } from "./client";

export async function fetchPlatforms(): Promise<Platform[]> {
  return apiRequest<Platform[]>("/api/platforms");
}

export async function fetchGenerations(platformId: number): Promise<Generation[]> {
  return apiRequest<Generation[]>(`/api/platforms/${platformId}/generations`);
}

export async function fetchDocumentCategories(): Promise<DocumentCategory[]> {
  return apiRequest<DocumentCategory[]>("/api/document-categories");
}

export async function fetchDocumentTypes(categoryId: number): Promise<DocumentType[]> {
  return apiRequest<DocumentType[]>(`/api/document-categories/${categoryId}/types`);
}

export interface FetchFilteredDocumentsParams {
  platformId?: number;
  generationId?: number;
  documentTypeId?: number;
}

export async function fetchFilteredDocuments(
  params: FetchFilteredDocumentsParams
): Promise<DocumentListResponse> {
  const searchParams = new URLSearchParams();

  if (params.platformId) {
    searchParams.set("platform_id", String(params.platformId));
  }
  if (params.generationId) {
    searchParams.set("generation_id", String(params.generationId));
  }
  if (params.documentTypeId) {
    searchParams.set("document_type_id", String(params.documentTypeId));
  }

  const queryString = searchParams.toString();
  const endpoint = `/api/documents${queryString ? `?${queryString}` : ""}`;

  return apiRequest<DocumentListResponse>(endpoint);
}

// Helper to find a single item by ID from the list endpoints
// (Used when restoring wizard state from URL params)
export async function fetchPlatformById(id: number): Promise<Platform | null> {
  const platforms = await fetchPlatforms();
  return platforms.find((p) => p.id === id) ?? null;
}

export async function fetchGenerationById(
  platformId: number,
  generationId: number
): Promise<Generation | null> {
  const generations = await fetchGenerations(platformId);
  return generations.find((g) => g.id === generationId) ?? null;
}

export async function fetchDocumentCategoryById(id: number): Promise<DocumentCategory | null> {
  const categories = await fetchDocumentCategories();
  return categories.find((c) => c.id === id) ?? null;
}

export async function fetchDocumentTypeById(
  categoryId: number,
  typeId: number
): Promise<DocumentType | null> {
  const types = await fetchDocumentTypes(categoryId);
  return types.find((t) => t.id === typeId) ?? null;
}
```
- **MIRROR**: `app/ui/src/lib/api/categories.ts`
- **VALIDATE**: `cd app/ui && npm run build`

### Task 3: CREATE `app/ui/src/app/api/platforms/route.ts`

- **ACTION**: CREATE Next.js API route proxy for platforms
- **IMPLEMENT**:
```typescript
import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { Platform } from "@/types/wizard";

export async function GET() {
  try {
    const data = await serverFetch<Platform[]>("/api/platforms");
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch platforms";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```
- **MIRROR**: `app/ui/src/app/api/categories/route.ts`
- **VALIDATE**: `cd app/ui && npm run build`

### Task 4: CREATE `app/ui/src/app/api/platforms/[id]/generations/route.ts`

- **ACTION**: CREATE Next.js API route proxy for generations (nested dynamic route)
- **IMPLEMENT**:
```typescript
import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { Generation } from "@/types/wizard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await serverFetch<Generation[]>(`/api/platforms/${id}/generations`);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch generations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```
- **GOTCHA**: In Next.js 16, dynamic route params are a Promise and must be awaited
- **VALIDATE**: `cd app/ui && npm run build`

### Task 5: CREATE `app/ui/src/app/api/document-categories/route.ts`

- **ACTION**: CREATE Next.js API route proxy for document categories
- **IMPLEMENT**:
```typescript
import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { DocumentCategory } from "@/types/wizard";

export async function GET() {
  try {
    const data = await serverFetch<DocumentCategory[]>("/api/document-categories");
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch document categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```
- **MIRROR**: `app/ui/src/app/api/categories/route.ts`
- **VALIDATE**: `cd app/ui && npm run build`

### Task 6: CREATE `app/ui/src/app/api/document-categories/[id]/types/route.ts`

- **ACTION**: CREATE Next.js API route proxy for document types
- **IMPLEMENT**:
```typescript
import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { DocumentType } from "@/types/wizard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await serverFetch<DocumentType[]>(`/api/document-categories/${id}/types`);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch document types";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```
- **GOTCHA**: In Next.js 16, dynamic route params are a Promise and must be awaited
- **VALIDATE**: `cd app/ui && npm run build`

### Task 7: CREATE `app/ui/src/components/wizard/StepIndicator.tsx`

- **ACTION**: CREATE step progress indicator component
- **IMPLEMENT**:
```typescript
"use client";

import type { WizardStep } from "@/types/wizard";

interface StepIndicatorProps {
  currentStep: WizardStep;
}

const steps: { key: WizardStep; label: string }[] = [
  { key: "platform", label: "Platform" },
  { key: "generation", label: "Generation" },
  { key: "category", label: "Category" },
  { key: "type", label: "Type" },
];

function getStepIndex(step: WizardStep): number {
  if (step === "results") return 4;
  return steps.findIndex((s) => s.key === step);
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                isCompleted
                  ? "bg-blue-600 text-white"
                  : isCurrent
                    ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
              }`}
            >
              {isCompleted ? "✓" : index + 1}
            </div>
            <span
              className={`hidden text-sm font-medium sm:block ${
                isCurrent
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 ${
                  isCompleted ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
```
- **VALIDATE**: `cd app/ui && npm run build`

### Task 8: CREATE `app/ui/src/components/wizard/PlatformSelector.tsx`

- **ACTION**: CREATE platform selection component (Step 1)
- **IMPLEMENT**:
```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Platform } from "@/types/wizard";
import { fetchPlatforms } from "@/lib/api/wizard";

interface PlatformSelectorProps {
  onSelect: (platform: Platform) => void;
}

export function PlatformSelector({ onSelect }: PlatformSelectorProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlatforms = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPlatforms();
      setPlatforms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load platforms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading platforms...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
        Select Your Aircraft Platform
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => onSelect(platform)}
            className="flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
          >
            <span className="text-xl font-semibold text-zinc-900 dark:text-white">
              {platform.name}
            </span>
            <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {platform.code}
            </span>
            {platform.description && (
              <span className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {platform.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```
- **MIRROR**: `app/ui/src/components/documents/DocumentsList.tsx` for loading pattern
- **VALIDATE**: `cd app/ui && npm run build`

### Task 9: CREATE `app/ui/src/components/wizard/GenerationSelector.tsx`

- **ACTION**: CREATE generation selection component (Step 2)
- **IMPLEMENT**:
```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Generation, Platform } from "@/types/wizard";
import { fetchGenerations } from "@/lib/api/wizard";

interface GenerationSelectorProps {
  platform: Platform;
  onSelect: (generation: Generation) => void;
  onBack: () => void;
}

export function GenerationSelector({
  platform,
  onSelect,
  onBack,
}: GenerationSelectorProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGenerations = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchGenerations(platform.id);
      setGenerations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load generations");
    } finally {
      setLoading(false);
    }
  }, [platform.id]);

  useEffect(() => {
    loadGenerations();
  }, [loadGenerations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading generations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
            Select Generation
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            for {platform.name}
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
        {generations.map((generation) => (
          <button
            key={generation.id}
            onClick={() => onSelect(generation)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
          >
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              {generation.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```
- **VALIDATE**: `cd app/ui && npm run build`

### Task 10: CREATE `app/ui/src/components/wizard/CategorySelector.tsx`

- **ACTION**: CREATE document category selection component (Step 3)
- **IMPLEMENT**:
```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentCategory, Platform, Generation } from "@/types/wizard";
import { fetchDocumentCategories } from "@/lib/api/wizard";

interface CategorySelectorProps {
  platform: Platform;
  generation: Generation;
  onSelect: (category: DocumentCategory) => void;
  onBack: () => void;
}

export function CategorySelector({
  platform,
  generation,
  onSelect,
  onBack,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchDocumentCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading categories...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
            Select Document Category
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {platform.name} {generation.name}
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category)}
            className="flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
          >
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              {category.name}
            </span>
            {category.description && (
              <span className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {category.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```
- **VALIDATE**: `cd app/ui && npm run build`

### Task 11: CREATE `app/ui/src/components/wizard/TypeSelector.tsx`

- **ACTION**: CREATE document type selection component (Step 4)
- **IMPLEMENT**:
```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentType, DocumentCategory, Platform, Generation } from "@/types/wizard";
import { fetchDocumentTypes } from "@/lib/api/wizard";

interface TypeSelectorProps {
  platform: Platform;
  generation: Generation;
  category: DocumentCategory;
  onSelect: (type: DocumentType) => void;
  onBack: () => void;
}

export function TypeSelector({
  platform,
  generation,
  category,
  onSelect,
  onBack,
}: TypeSelectorProps) {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchDocumentTypes(category.id);
      setTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document types");
    } finally {
      setLoading(false);
    }
  }, [category.id]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading document types...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
            Select Document Type
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {platform.name} {generation.name} - {category.name}
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type)}
            className="flex flex-col items-start rounded-lg border border-zinc-200 bg-white p-4 text-left transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
          >
            <span className="font-semibold text-zinc-900 dark:text-white">
              {type.code}
            </span>
            <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {type.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```
- **VALIDATE**: `cd app/ui && npm run build`

### Task 12: CREATE `app/ui/src/components/wizard/WizardResults.tsx`

- **ACTION**: CREATE filtered document results display component
- **IMPLEMENT**:
```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DocumentListItem } from "@/types/documents";
import type { Platform, Generation, DocumentCategory, DocumentType } from "@/types/wizard";
import { fetchFilteredDocuments } from "@/lib/api/wizard";

interface WizardResultsProps {
  platform: Platform;
  generation: Generation;
  category: DocumentCategory;
  type: DocumentType;
  onStartOver: () => void;
}

export function WizardResults({
  platform,
  generation,
  category,
  type,
  onStartOver,
}: WizardResultsProps) {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchFilteredDocuments({
        platformId: platform.id,
        generationId: generation.id,
        documentTypeId: type.id,
      });
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [platform.id, generation.id, type.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading documents...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
        <button
          onClick={onStartOver}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
            Results
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {platform.name} {generation.name} - {type.name}
          </p>
        </div>
        <button
          onClick={onStartOver}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Start Over
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-300">
            No documents found for this selection.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {documents.length} document{documents.length !== 1 ? "s" : ""} found
          </p>
          <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-800">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <Link
                    href={`/admin/documents/${doc.guid}`}
                    className="font-medium text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {doc.name}
                  </Link>
                </div>
                <Link
                  href={`/admin/documents/${doc.guid}`}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```
- **VALIDATE**: `cd app/ui && npm run build`

### Task 13: CREATE `app/ui/src/components/wizard/WizardContainer.tsx`

- **ACTION**: CREATE main wizard orchestrator with URL state management
- **IMPLEMENT**:
```typescript
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Platform, Generation, DocumentCategory, DocumentType, WizardStep } from "@/types/wizard";
import {
  fetchPlatformById,
  fetchGenerationById,
  fetchDocumentCategoryById,
  fetchDocumentTypeById,
} from "@/lib/api/wizard";
import { StepIndicator } from "./StepIndicator";
import { PlatformSelector } from "./PlatformSelector";
import { GenerationSelector } from "./GenerationSelector";
import { CategorySelector } from "./CategorySelector";
import { TypeSelector } from "./TypeSelector";
import { WizardResults } from "./WizardResults";

export function WizardContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL state
  const platformId = searchParams.get("platform");
  const generationId = searchParams.get("generation");
  const categoryId = searchParams.get("category");
  const typeId = searchParams.get("type");

  // State for selected objects
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [category, setCategory] = useState<DocumentCategory | null>(null);
  const [type, setType] = useState<DocumentType | null>(null);

  // Loading state for URL restoration
  const [isHydrating, setIsHydrating] = useState(true);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  // Hydrate state from URL params on mount or when URL changes
  useEffect(() => {
    let cancelled = false;

    async function hydrateFromUrl() {
      setIsHydrating(true);
      setHydrationError(null);

      try {
        // No URL params - reset to initial state
        if (!platformId) {
          if (!cancelled) {
            setPlatform(null);
            setGeneration(null);
            setCategory(null);
            setType(null);
            setIsHydrating(false);
          }
          return;
        }

        // Fetch platform
        const fetchedPlatform = await fetchPlatformById(Number(platformId));
        if (cancelled) return;

        if (!fetchedPlatform) {
          // Invalid platform ID - reset to start
          router.replace("/wizard");
          return;
        }
        setPlatform(fetchedPlatform);

        // Fetch generation if ID in URL
        if (generationId) {
          const fetchedGeneration = await fetchGenerationById(
            Number(platformId),
            Number(generationId)
          );
          if (cancelled) return;

          if (!fetchedGeneration) {
            // Invalid generation ID - go back to platform selection
            setGeneration(null);
            setCategory(null);
            setType(null);
            router.replace(`/wizard?platform=${platformId}`);
            return;
          }
          setGeneration(fetchedGeneration);
        } else {
          setGeneration(null);
          setCategory(null);
          setType(null);
          setIsHydrating(false);
          return;
        }

        // Fetch category if ID in URL
        if (categoryId) {
          const fetchedCategory = await fetchDocumentCategoryById(Number(categoryId));
          if (cancelled) return;

          if (!fetchedCategory) {
            // Invalid category ID - go back to generation selection
            setCategory(null);
            setType(null);
            router.replace(`/wizard?platform=${platformId}&generation=${generationId}`);
            return;
          }
          setCategory(fetchedCategory);
        } else {
          setCategory(null);
          setType(null);
          setIsHydrating(false);
          return;
        }

        // Fetch type if ID in URL
        if (typeId) {
          const fetchedType = await fetchDocumentTypeById(
            Number(categoryId),
            Number(typeId)
          );
          if (cancelled) return;

          if (!fetchedType) {
            // Invalid type ID - go back to category selection
            setType(null);
            router.replace(
              `/wizard?platform=${platformId}&generation=${generationId}&category=${categoryId}`
            );
            return;
          }
          setType(fetchedType);
        } else {
          setType(null);
        }
      } catch (err) {
        if (!cancelled) {
          setHydrationError(
            err instanceof Error ? err.message : "Failed to restore wizard state"
          );
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    }

    hydrateFromUrl();

    // Cleanup to handle component unmount or URL change during fetch
    return () => {
      cancelled = true;
    };
  }, [platformId, generationId, categoryId, typeId, router]);

  // Determine current step based on state (not URL params)
  const currentStep: WizardStep = useMemo(() => {
    if (type) return "results";
    if (category) return "type";
    if (generation) return "category";
    if (platform) return "generation";
    return "platform";
  }, [platform, generation, category, type]);

  // Navigation handlers - update both state and URL
  const handlePlatformSelect = useCallback(
    (selected: Platform) => {
      setPlatform(selected);
      setGeneration(null);
      setCategory(null);
      setType(null);
      router.push(`/wizard?platform=${selected.id}`);
    },
    [router]
  );

  const handleGenerationSelect = useCallback(
    (selected: Generation) => {
      setGeneration(selected);
      setCategory(null);
      setType(null);
      router.push(`/wizard?platform=${platformId}&generation=${selected.id}`);
    },
    [router, platformId]
  );

  const handleCategorySelect = useCallback(
    (selected: DocumentCategory) => {
      setCategory(selected);
      setType(null);
      router.push(
        `/wizard?platform=${platformId}&generation=${generationId}&category=${selected.id}`
      );
    },
    [router, platformId, generationId]
  );

  const handleTypeSelect = useCallback(
    (selected: DocumentType) => {
      setType(selected);
      router.push(
        `/wizard?platform=${platformId}&generation=${generationId}&category=${categoryId}&type=${selected.id}`
      );
    },
    [router, platformId, generationId, categoryId]
  );

  const handleBackToGeneration = useCallback(() => {
    setCategory(null);
    setType(null);
    router.push(`/wizard?platform=${platformId}`);
  }, [router, platformId]);

  const handleBackToCategory = useCallback(() => {
    setType(null);
    router.push(`/wizard?platform=${platformId}&generation=${generationId}`);
  }, [router, platformId, generationId]);

  const handleBackToType = useCallback(() => {
    setType(null);
    router.push(
      `/wizard?platform=${platformId}&generation=${generationId}&category=${categoryId}`
    );
  }, [router, platformId, generationId, categoryId]);

  const handleStartOver = useCallback(() => {
    setPlatform(null);
    setGeneration(null);
    setCategory(null);
    setType(null);
    router.push("/wizard");
  }, [router]);

  // Show loading during URL hydration
  if (isHydrating) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading...
        </p>
      </div>
    );
  }

  // Show error if hydration failed
  if (hydrationError) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{hydrationError}</p>
        </div>
        <button
          onClick={handleStartOver}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StepIndicator currentStep={currentStep} />

      {currentStep === "platform" && (
        <PlatformSelector onSelect={handlePlatformSelect} />
      )}

      {currentStep === "generation" && platform && (
        <GenerationSelector
          platform={platform}
          onSelect={handleGenerationSelect}
          onBack={handleStartOver}
        />
      )}

      {currentStep === "category" && platform && generation && (
        <CategorySelector
          platform={platform}
          generation={generation}
          onSelect={handleCategorySelect}
          onBack={handleBackToGeneration}
        />
      )}

      {currentStep === "type" && platform && generation && category && (
        <TypeSelector
          platform={platform}
          generation={generation}
          category={category}
          onSelect={handleTypeSelect}
          onBack={handleBackToCategory}
        />
      )}

      {currentStep === "results" && platform && generation && category && type && (
        <WizardResults
          platform={platform}
          generation={generation}
          category={category}
          type={type}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
```
- **KEY FEATURE**: URL state is fully restorable - shared URLs work correctly
- **PATTERN**: Hydrates state from URL on mount by fetching necessary data from API
- **GOTCHA**: Add `router` to useEffect dependency array carefully - using replace() to avoid infinite loops
- **VALIDATE**: `cd app/ui && npm run build`

### Task 14: CREATE `app/ui/src/app/wizard/page.tsx`

- **ACTION**: CREATE wizard page at /wizard route
- **IMPLEMENT**:
```typescript
import { Suspense } from "react";
import { WizardContainer } from "@/components/wizard/WizardContainer";

function WizardLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading wizard...
      </p>
    </div>
  );
}

export default function WizardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Find Your Documentation
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Select your aircraft platform and configuration to find relevant technical publications.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Suspense fallback={<WizardLoading />}>
            <WizardContainer />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```
- **GOTCHA**: Wrap WizardContainer in Suspense because it uses useSearchParams
- **MIRROR**: `app/ui/src/app/admin/upload/page.tsx`
- **VALIDATE**: `cd app/ui && npm run build`

---

## Testing Strategy

### Manual Testing Checklist

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Step 1 - Platform loads | Navigate to /wizard | Platforms display (SR2X, SF50) |
| Step 1 - Platform select | Click SR2X | URL updates, generation step shows |
| Step 2 - Generations load | Select SR2X platform | SR2X generations appear (G1-G7) |
| Step 2 - Back button | Click Back on generation step | Returns to platform step |
| Step 3 - Categories load | Complete step 2 | 4 document categories appear |
| Step 4 - Types load | Complete step 3 | Document types for category appear |
| Results - Documents load | Complete step 4 | Filtered documents display |
| Results - Empty state | Select combination with no docs | "No documents found" message |
| Browser back | Use browser back button | Previous step displayed |

### URL Sharing Tests (Critical)

| Test Case | URL | Expected Result |
|-----------|-----|-----------------|
| Share full wizard state | `/wizard?platform=1&generation=2&category=1&type=3` | Opens directly to results, all selections shown |
| Share partial state | `/wizard?platform=1&generation=2` | Opens to category selection, platform/generation pre-selected |
| Invalid platform ID | `/wizard?platform=999` | Redirects to /wizard (step 1) |
| Invalid generation ID | `/wizard?platform=1&generation=999` | Redirects to /wizard?platform=1 (step 2) |
| Invalid category ID | `/wizard?platform=1&generation=2&category=999` | Redirects to step 3 with valid platform/generation |
| Fresh incognito window | Copy full URL, paste in incognito | Full state restored from API (no localStorage) |

### Edge Cases Checklist

- [ ] Non-existent platform ID in URL shows platform step
- [ ] Non-existent generation ID in URL shows generation step
- [ ] API errors display error message
- [ ] Empty results display "No documents found"
- [ ] Loading states show while fetching data

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && npm run lint && npm run build
```

**EXPECT**: Exit 0, no errors

### Level 2: TYPE_CHECK

```bash
cd app/ui && npx tsc --noEmit
```

**EXPECT**: Exit 0, no type errors

### Level 3: DEV_SERVER

```bash
cd app/ui && npm run dev
# Then navigate to http://localhost:3000/wizard
```

**EXPECT**: Page loads, wizard displays

### Level 4: API_INTEGRATION (requires API server running)

```bash
# Terminal 1: Start API
cd app/api && uv run uvicorn main:app --reload

# Terminal 2: Start UI
cd app/ui && npm run dev

# Navigate to http://localhost:3000/wizard and test full flow
```

**EXPECT**: All wizard steps work end-to-end

---

## Acceptance Criteria

- [ ] Wizard page accessible at `/wizard`
- [ ] Step 1: Platforms load and display
- [ ] Step 2: Generations load filtered by platform
- [ ] Step 3: Document categories load
- [ ] Step 4: Document types load filtered by category
- [ ] Results: Filtered documents display with View links
- [ ] Back navigation works at every step
- [ ] Start Over resets wizard to step 1
- [ ] URL state persists selections (shareable links)
- [ ] **Shared URLs work in fresh browser** - pasting a wizard URL into incognito window restores full state
- [ ] Browser back/forward navigation works
- [ ] Loading states display while fetching
- [ ] Error states display on API failures
- [ ] Empty state shows when no documents match
- [ ] Invalid URL params gracefully redirect to valid state

---

## Completion Checklist

- [ ] Task 1: wizard.ts types created
- [ ] Task 2: wizard.ts API functions created
- [ ] Task 3: platforms/route.ts created
- [ ] Task 4: platforms/[id]/generations/route.ts created
- [ ] Task 5: document-categories/route.ts created
- [ ] Task 6: document-categories/[id]/types/route.ts created
- [ ] Task 7: StepIndicator.tsx created
- [ ] Task 8: PlatformSelector.tsx created
- [ ] Task 9: GenerationSelector.tsx created
- [ ] Task 10: CategorySelector.tsx created
- [ ] Task 11: TypeSelector.tsx created
- [ ] Task 12: WizardResults.tsx created
- [ ] Task 13: WizardContainer.tsx created
- [ ] Task 14: wizard/page.tsx created
- [ ] Level 1 validation passes (lint + build)
- [ ] Level 2 validation passes (type-check)
- [ ] Level 3 validation passes (dev server)
- [ ] Level 4 validation passes (API integration)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large number of document types | LOW | LOW | Grid layout handles variable counts |
| Slow API responses | LOW | MEDIUM | Loading states provide user feedback |
| Invalid URL params (user edits URL) | LOW | LOW | Validation redirects to valid state |
| Network failure during hydration | LOW | MEDIUM | Error state with "Start Over" option |

---

## Notes

- **URL sharing works fully**: When a user shares a URL, the recipient's wizard fetches all necessary data from the API to restore state
- The wizard uses URL for IDs (shareable) + React state for full objects (display)
- State hydration happens on mount and when URL params change
- Invalid URL params (e.g., non-existent IDs) gracefully redirect to the last valid step
- StepIndicator shows 4 steps, with "results" being the final state after step 4 completion
- Dark mode is supported via Tailwind's dark: prefix throughout
- The hydration approach makes a few extra API calls for URL restoration, but this is acceptable for the user experience benefit
