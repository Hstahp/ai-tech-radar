import { useEffect, useMemo, useState } from "react";
import { History, Loader2, Search } from "lucide-react";
import { loadHistoryIndex, type HistoryIndex } from "../features/history";

export function HistoryPage() {
  const [data, setData] = useState<HistoryIndex | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("all");

  useEffect(() => {
    let isMounted = true;
    loadHistoryIndex()
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

  const dates = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.items.map((item) => item.digest_date))].sort().reverse();
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const terms = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return data.items.filter((item) => {
      if (selectedDate !== "all" && item.digest_date !== selectedDate) return false;
      if (terms.length === 0) return true;

      const haystack = [item.title, item.purpose ?? "", item.tags ?? "", item.category]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [data, query, selectedDate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400">Đang nạp lịch sử bản tin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-500" />
          <h1 className="text-2xl font-extrabold tracking-tight">Lịch sử bản tin</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {data ? `${data.items_count} mục trong ${data.days} ngày gần nhất` : "Chưa có dữ liệu"}
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Tìm trong lịch sử</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tiêu đề, tag, mô tả..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
          />
        </label>
        <label className="sm:w-48">
          <span className="sr-only">Chọn ngày</span>
          <select
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="all">Tất cả các ngày</option>
            {dates.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </label>
      </div>

      {filteredItems.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-8 text-center text-sm text-slate-500">
          Không tìm thấy mục nào khớp.
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredItems.slice(0, 100).map((item) => (
            <li key={`${item.digest_date}-${item.key}`}>
              <article className="flex flex-col gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {item.title}
                  </a>
                  {item.purpose && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.purpose}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5">
                    {item.category}
                  </span>
                  <span className="font-mono">{item.digest_date}</span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
