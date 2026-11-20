import { Flame, Star, TrendingUp } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { useTrending } from "../hooks/useTrending";

const CATEGORY_LABELS: Record<string, string> = {
  repo: "Repository",
  extension: "Extension",
  news: "Tin nóng",
  model: "Model",
  paper: "Paper",
};

export function TrendingStrip() {
  const { data, isLoading } = useTrending();

  if (isLoading || !data || data.items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Xu hướng tăng nhanh"
      className="mb-8 rounded-2xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/20 p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-amber-500" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            Trending {data.window_days} ngày
          </h2>
          <Badge variant="warning">{data.items_count} mục</Badge>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {data.from_date} → {data.digest_date}
        </span>
      </header>

      <ol className="flex gap-3 overflow-x-auto pb-1">
        {data.items.map((item, index) => (
          <li key={item.item_id} className="min-w-[240px] max-w-[280px] shrink-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm hover:border-amber-400 dark:hover:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                  #{index + 1}
                </span>
                <Badge variant="info">{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                {item.title}
              </h3>
              <div className="mt-auto pt-3 flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />+{item.delta.toLocaleString("vi-VN")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {item.stars.toLocaleString("vi-VN")}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
