import { Loader2, AlertCircle } from "lucide-react";
import { MainLayout } from "../layouts/MainLayout";
import { FilterBar, DigestSection, useDigest } from "../features/digest";

export function HomePage() {
  const {
    data,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedVerdict,
    setSelectedVerdict,
    filteredItems,
    totalCount,
    filteredCount,
  } = useDigest();

  return (
    <MainLayout digestDate={data?.digest_date} itemsCount={data?.items_count}>
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm text-slate-400">Đang nạp dữ liệu radar công nghệ...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center max-w-lg mx-auto my-12">
          <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-rose-300">Không thể tải dữ liệu</h3>
          <p className="text-xs text-rose-400/80 mt-1">{error}</p>
        </div>
      )}

      {/* Content state */}
      {!isLoading && !error && (
        <>
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedVerdict={selectedVerdict}
            onVerdictChange={setSelectedVerdict}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />

          <DigestSection items={filteredItems} />
        </>
      )}
    </MainLayout>
  );
}
