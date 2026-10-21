import { useEffect } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Code2,
  Star,
  Compass,
  Target,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import { UserLayout } from '../app/layouts/UserLayout';
import { CategoryBadge } from '../features/digest/components/CategoryBadge';
import { VerdictBadge } from '../features/digest/components/VerdictBadge';
import { copy } from '../lib/copy';
import { Button } from '../components/ui/Button';
import { slugify, type DigestFeedItem } from '@radar/core';

interface ItemDetailPageProps {
  itemKey: string;
  items: DigestFeedItem[];
  user?: any;
  onNavigateHome: () => void;
  onLogin?: () => void;
  rightSlot?: React.ReactNode;
}

/**
 * Trích xuất tác giả / tổ chức phát triển
 */
function extractAuthor(item: DigestFeedItem): string | null {
  if (item.author && item.author.trim()) {
    return item.author.trim();
  }
  try {
    const parsed = new URL(item.url);
    if (parsed.hostname === 'github.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 1) {
        return parts[0];
      }
    } else if (parsed.hostname === 'open-vsx.org') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] === 'extension') {
        return parts[1];
      }
    }
  } catch {
    // Bỏ qua lỗi URL không hợp lệ
  }
  return null;
}

/**
 * Định dạng ngày đăng theo chuẩn tiếng Việt thân thiện
 */
function formatPublishedDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return null;
  }
}

export function ItemDetailPage({
  itemKey,
  items,
  onNavigateHome,
  rightSlot,
}: ItemDetailPageProps) {
  const item = items.find(
    (i) => slugify(i.title) === itemKey || (i.key ?? String(i.item_id)) === itemKey
  );

  // Cập nhật tiêu đề trang web
  useEffect(() => {
    if (item) {
      document.title = `${item.title} — AI Tech Radar`;
    }
  }, [item]);

  if (!item) {
    return (
      <UserLayout rightSlot={rightSlot}>
        <div className="py-20 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Không tìm thấy thông tin mục này.</p>
          <Button variant="secondary" onClick={onNavigateHome}>
            {copy.common.backToDigest}
          </Button>
        </div>
      </UserLayout>
    );
  }

  const author = extractAuthor(item);
  const publishedDate = formatPublishedDate(item.published_at);
  const tagsList = item.tags
    ? item.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <UserLayout rightSlot={rightSlot}>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
        {/* Nút quay lại danh sách bản tin */}
        <div>
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{copy.common.backToDigest}</span>
          </button>
        </div>

        {/* 1. Header chi tiết mục */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CategoryBadge category={item.category} />
              <VerdictBadge verdict={item.verdict} />
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:text-indigo-900 dark:hover:text-white transition-all shadow-xs"
            >
              <span>Xem dự án gốc</span>
              <ExternalLink className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
            </a>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
            {item.title}
          </h1>

          {/* Hàng thông tin Metadata: Tác giả, Ngày đăng, Ngôn ngữ, Sao GitHub */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {author && (
              <div
                title="Tác giả / Tổ chức"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
              >
                <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Tác giả: <strong className="font-semibold text-slate-900 dark:text-slate-100">{author}</strong>
                </span>
              </div>
            )}

            {publishedDate && (
              <div
                title="Ngày đăng tải"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
              >
                <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Ngày đăng: <strong className="font-semibold text-slate-900 dark:text-slate-100">{publishedDate}</strong>
                </span>
              </div>
            )}

            {item.language && (
              <div
                title="Ngôn ngữ lập trình"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
              >
                <Code2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                <span className="font-medium text-slate-800 dark:text-slate-200">{item.language}</span>
              </div>
            )}

            {item.stars && (
              <div
                title="Số lượng sao GitHub"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
              >
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="font-semibold">{item.stars.toLocaleString()} sao</span>
              </div>
            )}
          </div>

          {/* Danh sách Tags */}
          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tagsList.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 2. Tóm tắt nội dung chi tiết */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tóm tắt & Phân tích nội dung
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {item.purpose && (
              <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                    Mục đích giải quyết
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed pl-6">
                  {item.purpose}
                </p>
              </div>
            )}

            {item.highlight && (
              <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Điểm nổi bật kỹ thuật
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed pl-6">
                  {item.highlight}
                </p>
              </div>
            )}

            {item.action && (
              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                    Gợi ý thực thi & Hành động
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed pl-6">
                  {item.action}
                </p>
              </div>
            )}

            {item.description && item.description !== item.purpose && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Mô tả từ tác giả
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-6 italic">
                  {item.description}
                </p>
              </div>
            )}
          </div>

          {/* Footer Card dẫn link trực tiếp */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Dữ liệu được cập nhật tự động từ hệ thống AI Tech Radar.
            </span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>Truy cập nguồn gốc dự án</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
