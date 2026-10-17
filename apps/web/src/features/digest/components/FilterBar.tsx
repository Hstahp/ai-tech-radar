import { Search, Zap, Eye, Layers, Sparkles } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { CategoryFilter, VerdictFilter } from "../../../types";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryFilter;
  onCategoryChange: (cat: CategoryFilter) => void;
  selectedVerdict: VerdictFilter;
  onVerdictChange: (v: VerdictFilter) => void;
  totalCount: number;
  filteredCount: number;
}

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "my_feed", label: "Dành cho bạn" },
  { id: "repo", label: "Repositories" },
  { id: "extension", label: "Extensions" },
  { id: "news", label: "Tin tức" },
  { id: "model", label: "Models" },
  { id: "paper", label: "Papers" },
];

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedVerdict,
  onVerdictChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-none rounded-2xl p-4 sm:p-5 mb-8 space-y-4 transition-colors">
      {/* Search Input & stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tên repo, mô tả, từ khóa hoặc tag (#mcp, #agent)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap self-center sm:self-auto font-mono">
          Hiển thị <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{filteredCount}</span> / {totalCount} mục
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/60">
        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "primary" : "ghost"}
              size="sm"
              onClick={() => onCategoryChange(cat.id)}
              className={
                cat.id === "my_feed" && selectedCategory === "my_feed"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-500 text-white"
                  : cat.id === "my_feed"
                  ? "text-indigo-300 hover:text-indigo-200"
                  : ""
              }
            >
              {cat.id === "my_feed" && <Sparkles className="h-3 w-3 mr-1.5 inline text-amber-300" />}
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Verdict filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={selectedVerdict === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onVerdictChange("all")}
            className="flex items-center gap-1.5"
          >
            <Layers className="h-3 w-3" />
            <span>Tất cả</span>
          </Button>

          <Button
            variant={selectedVerdict === "try_now" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onVerdictChange("try_now")}
            className={selectedVerdict === "try_now" ? "border-emerald-500/40 text-emerald-300" : "flex items-center gap-1.5"}
          >
            <Zap className="h-3 w-3 text-emerald-400" />
            <span>Thử ngay</span>
          </Button>

          <Button
            variant={selectedVerdict === "watch" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onVerdictChange("watch")}
            className={selectedVerdict === "watch" ? "border-amber-500/40 text-amber-300" : "flex items-center gap-1.5"}
          >
            <Eye className="h-3 w-3 text-amber-400" />
            <span>Theo dõi</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
