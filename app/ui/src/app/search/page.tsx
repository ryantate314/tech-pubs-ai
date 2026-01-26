import { SearchContainer } from "@/components/search/SearchContainer";

export default function SearchPage() {
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

        <SearchContainer />
      </div>
    </div>
  );
}
