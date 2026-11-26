import { Radar, Calendar, Rss, GitFork, Search, CalendarDays, History } from "lucide-react";
import { formatDigestDate } from "../../../lib/date-format";
import { ThemeToggle, useTheme } from "../../theme";

interface HeaderNavProps {
  digestDate?: string;
  itemsCount?: number;
  rightSlot?: React.ReactNode;
  onNavigateHome?: () => void;
}

interface HeaderIconLinkProps {
  href: string;
  label: string;
  children: React.ReactNode;
  external?: boolean;
}

function HeaderIconLink({ href, label, children, external }: HeaderIconLinkProps) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={
        external
          ? undefined
          : (event) => {
              event.preventDefault();
              window.history.pushState({}, "", href);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }
      }
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      {children}
    </a>
  );
}

export function HeaderNav({ digestDate, itemsCount, rightSlot, onNavigateHome }: HeaderNavProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

          {/* Navigation & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {digestDate && (
              <div className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{formatDigestDate(digestDate)}</span>
                {itemsCount !== undefined && (
                  <span className="text-slate-400 dark:text-slate-500">• {itemsCount} tin</span>
                )}
              </div>
            )}

            <nav
              aria-label="Bản tin theo thời gian"
              className="inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900/80"
            >
              <a
                href="/weekly"
                onClick={(event) => {
                  event.preventDefault();
                  window.history.pushState({}, '', '/weekly');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tuần</span>
              </a>
              <a
                href="/history"
                onClick={(event) => {
                  event.preventDefault();
                  window.history.pushState({}, '', '/history');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lịch sử</span>
              </a>
            </nav>

            <div className="flex items-center gap-1.5">
              <HeaderIconLink href="/search" label="Tìm kiếm">
                <Search className="h-4 w-4" />
              </HeaderIconLink>
              <HeaderIconLink href="/data/export/feed.xml" label="RSS Feed" external>
                <Rss className="h-4 w-4" />
              </HeaderIconLink>
              <HeaderIconLink
                href="https://github.com/Hstahp/ai-tech-radar"
                label="GitHub"
                external
              >
                <GitFork className="h-4 w-4" />
              </HeaderIconLink>
            </div>

            <ThemeToggle theme={theme} onToggle={toggleTheme} className="h-10 w-10" />

            <div className="mx-0.5 hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

            {rightSlot}
          </div>
        </div>
      </div>
    </header>
  );
}
