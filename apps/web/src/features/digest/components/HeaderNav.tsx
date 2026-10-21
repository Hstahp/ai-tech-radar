import { Radar, Calendar, Rss, GitFork } from "lucide-react";
import { formatDigestDate } from "../../../lib/date-format";
import { ThemeToggle, useTheme } from "../../theme";

interface HeaderNavProps {
  digestDate?: string;
  itemsCount?: number;
  rightSlot?: React.ReactNode;
  onNavigateHome?: () => void;
}

export function HeaderNav({ digestDate, itemsCount, rightSlot, onNavigateHome }: HeaderNavProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Logo & Tagline (Clickable to Home) */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateHome) {
                onNavigateHome();
              } else {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="flex items-center gap-3 group cursor-pointer select-none transition-transform active:scale-98"
            title="Quay về trang chủ AI Tech Radar"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white group-hover:scale-105 group-hover:shadow-indigo-500/30 transition-all duration-200">
              <Radar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  AI TECH RADAR
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Daily Feed
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chắt lọc &amp; phân tích hệ sinh thái AI cho lập trình viên
              </p>
            </div>
          </a>

          {/* Links, Date & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {digestDate && (
              <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{formatDigestDate(digestDate)}</span>
                {itemsCount !== undefined && <span className="text-slate-400 dark:text-slate-500">• {itemsCount} tin</span>}
              </div>
            )}

            <a
              href="/data/export/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Rss className="h-3.5 w-3.5" />
              <span>RSS Feed</span>
            </a>

            <a
              href="https://github.com/Hstahp/ai-tech-radar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>

            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            {rightSlot}
          </div>
        </div>
      </div>
    </header>
  );
}
