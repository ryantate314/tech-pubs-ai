import { Suspense } from "react";
import { SearchContainer } from "@/components/search/SearchContainer";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

function SearchLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading search...
      </p>
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Document Search
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Search aircraft maintenance documents using semantic search.
          </p>
        </div>

        <Suspense fallback={<SearchLoading />}>
          <SearchContainer initialQuery={q} />
        </Suspense>
      </div>
    </div>
  );
}
