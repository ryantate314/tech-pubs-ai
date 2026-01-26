"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Platform, Generation, DocumentCategory, WizardStep } from "@/types/wizard";
import {
  fetchPlatformById,
  fetchGenerationById,
  fetchDocumentCategoryById,
} from "@/lib/api/wizard";
import { StepIndicator } from "./StepIndicator";
import { PlatformSelector } from "./PlatformSelector";
import { GenerationSelector } from "./GenerationSelector";
import { CategorySelector } from "./CategorySelector";
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
            router.replace(`/wizard?platform=${platformId}`);
            return;
          }
          setGeneration(fetchedGeneration);
        } else {
          setGeneration(null);
          setCategory(null);
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
            router.replace(`/wizard?platform=${platformId}&generation=${generationId}`);
            return;
          }
          setCategory(fetchedCategory);
        } else {
          setCategory(null);
          setIsHydrating(false);
          return;
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
  }, [platformId, generationId, categoryId, router]);

  // Determine current step based on state (not URL params)
  const currentStep: WizardStep = useMemo(() => {
    if (category) return "results";
    if (generation) return "category";
    if (platform) return "generation";
    return "platform";
  }, [platform, generation, category]);

  // Navigation handlers - update both state and URL
  const handlePlatformSelect = useCallback(
    (selected: Platform) => {
      setPlatform(selected);
      setGeneration(null);
      setCategory(null);
      router.push(`/wizard?platform=${selected.id}`);
    },
    [router]
  );

  const handleGenerationSelect = useCallback(
    (selected: Generation) => {
      setGeneration(selected);
      setCategory(null);
      router.push(`/wizard?platform=${platformId}&generation=${selected.id}`);
    },
    [router, platformId]
  );

  const handleCategorySelect = useCallback(
    (selected: DocumentCategory) => {
      setCategory(selected);
      router.push(
        `/wizard?platform=${platformId}&generation=${generationId}&category=${selected.id}`
      );
    },
    [router, platformId, generationId]
  );

  const handleBackToGeneration = useCallback(() => {
    setCategory(null);
    router.push(`/wizard?platform=${platformId}`);
  }, [router, platformId]);

  const handleBackFromResults = useCallback(() => {
    setCategory(null);
    router.push(`/wizard?platform=${platformId}&generation=${generationId}`);
  }, [router, platformId, generationId]);

  const handleTypeFilterChange = useCallback(
    (selectedTypeId: number | null) => {
      const base = `/wizard?platform=${platformId}&generation=${generationId}&category=${categoryId}`;
      router.push(selectedTypeId ? `${base}&type=${selectedTypeId}` : base);
    },
    [router, platformId, generationId, categoryId]
  );

  const handleStartOver = useCallback(() => {
    setPlatform(null);
    setGeneration(null);
    setCategory(null);
    router.push("/wizard");
  }, [router]);

  // Show loading during URL hydration
  if (isHydrating) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="hidden h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700 sm:block" />
              {i < 3 && <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-700" />}
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
    <div role="main" aria-label="Document wizard" className="space-y-8">
      <StepIndicator currentStep={currentStep} />

      <div aria-live="polite" className="sr-only">
        {currentStep === "platform" && "Step 1 of 3: Select your aircraft platform"}
        {currentStep === "generation" && `Step 2 of 3: Select generation for ${platform?.name}`}
        {currentStep === "category" && "Step 3 of 3: Select document category"}
        {currentStep === "results" && `Showing results for ${platform?.name} ${generation?.name} ${category?.name}`}
      </div>

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

      {currentStep === "results" && platform && generation && category && (
        <WizardResults
          platform={platform}
          generation={generation}
          category={category}
          selectedTypeId={typeId ? Number(typeId) : null}
          onTypeFilterChange={handleTypeFilterChange}
          onBack={handleBackFromResults}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
