import { useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { loadWeeklyDigest, type WeeklyPayload } from "../features/weekly";

const CATEGORY_LABELS: Record<string, string> = {
  repo: "Repository",
  extension: "Extension",
  news: "Tin nóng",
  model: "Model",
  paper: "Paper",
};

export function WeeklyPage() {
  const [data, setData] = useState<WeeklyPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    loadWeeklyDigest()
      .then((payload) => {
        if (isMounted) setData(payload);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400">Đang nạp bản tin tuần...</p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="mx-auto my-12 max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-8 text-center">
        <CalendarDays className="mx-auto mb-3 h-9 w-9 text-indigo-500" />
        <h1 className="text-lg font-bold">Chưa có bản tin tuần</h1>
        <p className="mt-2 text-sm text-slate-500">
          Bản tin tuần sẽ xuất hiện sau khi pipeline chạy đủ vài ngày.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-indigo-500" />
          <h1 className="text-2xl font-extrabold tracking-tight">Bản tin tuần</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {data.week_start} → {data.week_end} • {data.items_count} mục nổi bật
        </p>
      </header>

      <ol className="grid gap-3 md:grid-cols-2">
        {data.items.map((item) => (
          <li key={`${item.key ?? item.item_id}`}>
            <article className="flex h-full flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </span>
                <span className="text-xs font-mono text-slate-500">{item.appearances} ngày</span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-base font-bold hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {item.title}
              </a>
              {item.purpose && (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{item.purpose}</p>
              )}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
