import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, ExternalLink, Loader2, Search } from "lucide-react";
import { searchItems, type SearchHit } from "../features/search";

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 20;

const CATEGORY_LABELS: Record<string, string> = {
  repo: "Repository",
  extension: "Extension",
  news: "Tin nóng",
  model: "Model",
  paper: "Paper",
};

function readQueryFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

export function SearchPage() {
  const [input, setInput] = useState<string>(readQueryFromUrl);
  const [query, setQuery] = useState<string>(readQueryFromUrl);
  const [items, setItems] = useState<SearchHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    searchItems(query, RESULT_LIMIT)
      .then((response) => {
        if (!cancelled) {
          setItems(response.items);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setItems([]);
          setError(err instanceof Error ? err.message : "Không thể tìm kiếm. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setValidationMessage(`Vui lòng nhập ít nhất ${MIN_QUERY_LENGTH} ký tự.`);
      return;
    }

    setValidationMessage(null);
    window.history.replaceState({}, "", `/search?q=${encodeURIComponent(trimmed)}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    setQuery(trimmed);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Tìm kiếm bản tin
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tra cứu nhanh repo, extension, tin tức, paper và model AI trong radar.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="search-input" className="sr-only">
            Tìm kiếm bản tin
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="search-input"
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ví dụ: agent, RAG, MCP, tóm tắt..."
              autoComplete="off"
              aria-invalid={validationMessage !== null}
              aria-describedby={validationMessage ? "search-validation" : undefined}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <Search className="h-4 w-4" />
            Tìm kiếm
          </button>
        </div>
        {validationMessage && (
          <p id="search-validation" role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {validationMessage}
          </p>
        )}
      </form>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400">Đang tìm kiếm...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
          <h2 className="mb-1 text-base font-bold text-slate-900 dark:text-white">Không thể tìm kiếm</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && query && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center dark:border-slate-800 dark:bg-slate-900/30">
          <Search className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200">Không tìm thấy mục nào khớp</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Thử từ khóa ngắn hơn hoặc dùng thuật ngữ tiếng Anh như “agent”, “RAG”, “MCP”.
          </p>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <section aria-label="Kết quả tìm kiếm" className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {items.length} kết quả cho “{query}”
          </p>
          {items.map((item) => (
            <article
              key={item.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-500/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-baseline gap-1.5 text-base font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                >
                  <span>{item.title}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </a>
                <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </span>
              </div>

              {item.purpose && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.purpose}</p>
              )}

              {item.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={`${item.key}-${tag}`}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {!isLoading && !error && !query && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center dark:border-slate-800 dark:bg-slate-900/30">
          <Search className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nhập ít nhất {MIN_QUERY_LENGTH} ký tự để bắt đầu tìm kiếm.
          </p>
        </div>
      )}
    </div>
  );
}
