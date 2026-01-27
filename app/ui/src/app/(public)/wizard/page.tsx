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
