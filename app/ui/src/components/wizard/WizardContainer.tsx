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
          type={type}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
