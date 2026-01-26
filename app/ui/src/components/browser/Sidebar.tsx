"use client";

import type { Platform, Generation, DocumentCategory, DocumentType } from "@/types/wizard";
import type { AircraftModel } from "@/types/aircraft-models";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  platforms: Platform[];
  platformsLoading: boolean;
  selectedPlatformId: number | null;
  onPlatformChange: (id: number | null) => void;
  aircraftModels: AircraftModel[];
  aircraftModelsLoading: boolean;
  selectedAircraftModelId: number | null;
  onAircraftModelChange: (id: number | null) => void;
  generations: Generation[];
  generationsLoading: boolean;
  selectedGenerationId: number | null;
  onGenerationChange: (id: number | null) => void;
  categories: DocumentCategory[];
  categoriesLoading: boolean;
  selectedCategoryId: number | null;
  onCategoryChange: (id: number | null) => void;
  documentTypes: DocumentType[];
  documentTypesLoading: boolean;
  selectedDocumentTypeId: number | null;
  onDocumentTypeChange: (id: number | null) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  platforms,
  platformsLoading,
  selectedPlatformId,
  onPlatformChange,
  aircraftModels,
  aircraftModelsLoading,
  selectedAircraftModelId,
  onAircraftModelChange,
  generations,
  generationsLoading,
  selectedGenerationId,
  onGenerationChange,
  categories,
  categoriesLoading,
  selectedCategoryId,
  onCategoryChange,
  documentTypes,
  documentTypesLoading,
  selectedDocumentTypeId,
  onDocumentTypeChange,
  onClearFilters,
  hasActiveFilters,
}: SidebarProps) {
  return (
    <aside
      role="complementary"
      aria-label="Document filters"
      className={`flex-shrink-0 transition-all duration-200 ${
        collapsed ? "w-12" : "w-64"
      }`}
    >
      <div className="sticky top-6 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Collapse toggle */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} border-b border-zinc-200 px-3 py-3 dark:border-zinc-800`}>
          {!collapsed && (
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Filters
            </h2>
          )}
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand filters" : "Collapse filters"}
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${collapsed ? "rotate-0" : "rotate-180"}`}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {!collapsed && (
          <div className="space-y-4 p-4">
            {/* Platform dropdown */}
            <div>
              <label
                htmlFor="sidebar-platform"
                className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                Platform
              </label>
              {platformsLoading ? (
                <div className="h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ) : (
                <select
                  id="sidebar-platform"
                  value={selectedPlatformId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onPlatformChange(val ? Number(val) : null);
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <option value="">All Platforms</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Model dropdown */}
            <div>
              <label
                htmlFor="sidebar-model"
                className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                Model
              </label>
              {aircraftModelsLoading ? (
                <div className="h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ) : (
                <select
                  id="sidebar-model"
                  value={selectedAircraftModelId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onAircraftModelChange(val ? Number(val) : null);
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <option value="">All Models</option>
                  {aircraftModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Generation dropdown */}
            <div>
              <label
                htmlFor="sidebar-generation"
                className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                Generation
              </label>
              {generationsLoading ? (
                <div className="h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ) : (
                <select
                  id="sidebar-generation"
                  value={selectedGenerationId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onGenerationChange(val ? Number(val) : null);
                  }}
                  disabled={selectedPlatformId === null}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <option value="">All Generations</option>
                  {generations.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Category dropdown */}
            <div>
              <label
                htmlFor="sidebar-category"
                className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                Category
              </label>
              {categoriesLoading ? (
                <div className="h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ) : (
                <select
                  id="sidebar-category"
                  value={selectedCategoryId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onCategoryChange(val ? Number(val) : null);
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Document Type dropdown */}
            <div>
              <label
                htmlFor="sidebar-doc-type"
                className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                Document Type
              </label>
              {documentTypesLoading ? (
                <div className="h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ) : (
                <select
                  id="sidebar-doc-type"
                  value={selectedDocumentTypeId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onDocumentTypeChange(val ? Number(val) : null);
                  }}
                  disabled={selectedCategoryId === null}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <option value="">All Types</option>
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
