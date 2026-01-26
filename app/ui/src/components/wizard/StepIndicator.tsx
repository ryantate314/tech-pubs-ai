"use client";

import type { WizardStep } from "@/types/wizard";

interface StepIndicatorProps {
  currentStep: WizardStep;
}

const steps: { key: WizardStep; label: string }[] = [
  { key: "platform", label: "Platform" },
  { key: "generation", label: "Generation" },
  { key: "category", label: "Category" },
];

function getStepIndex(step: WizardStep): number {
  if (step === "results") return 3;
  return steps.findIndex((s) => s.key === step);
}

function getStepStatus(index: number, currentIndex: number): string {
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <nav aria-label="Wizard progress">
      <ol className="flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const status = getStepStatus(index, currentIndex);

          return (
            <li key={step.key} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  isCompleted
                    ? "bg-blue-600 text-white"
                    : isCurrent
                      ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600 dark:bg-blue-950 dark:text-blue-400"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                }`}
                aria-label={`Step ${index + 1}: ${step.label}, ${status}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? "✓" : index + 1}
              </div>
              <span
                className={`hidden text-sm font-medium sm:block ${
                  isCurrent
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
                aria-hidden="true"
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-8 ${
                    isCompleted ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
