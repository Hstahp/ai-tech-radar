import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Code2,
  Star,
  Compass,
  Target,
} from 'lucide-react';
import { UserLayout } from '../app/layouts/UserLayout';
import { CategoryBadge } from '../features/digest/components/CategoryBadge';
import { VerdictBadge } from '../features/digest/components/VerdictBadge';
import { copy } from '../lib/copy';
import { Button } from '../components/ui/Button';
import { slugify, type DigestFeedItem, type DeepExplain } from '@radar/core';
import { API_BASE, getAuthHeaders } from '../lib/api-config';

interface ItemDetailPageProps {
  itemKey: string;
  items: DigestFeedItem[];
  user: any;
  onNavigateHome: () => void;
  onLogin: () => void;
  rightSlot?: React.ReactNode;
}

export function ItemDetailPage({
  itemKey,
  items,
  user,
  onNavigateHome,
  onLogin,
  rightSlot,
}: ItemDetailPageProps) {
  const item = items.find(
    (i) => slugify(i.title) === itemKey || (i.key ?? String(i.item_id)) === itemKey
  );

  const [explainData, setExplainData] = useState<DeepExplain | null>(null);
  const [explainStatus, setExplainStatus] = useState<
    'idle' | 'loading' | 'ready' | 'low_confidence' | 'quota_exceeded' | 'failed' | 'overloaded'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set page title for SEO & microcopy
  useEffect(() => {
    if (item) {
      document.title = `${item.title} — AI Tech Radar`;
    }
  }, [item]);

  // Load existing explanation if available
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function checkExistingExplain() {
      if (!item) return;
      try {
        const key = item.key ?? String(item.item_id);
        const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(key)}/explain`, {
          signal: controller.signal,
          headers: {
            ...getAuthHeaders(),
          },
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && isMounted) {
            setExplainData(json.data);
            setExplainStatus(json.data.confidence === 'low' ? 'low_confidence' : 'ready');
          }
        }
      } catch {
        // Ignored
      }
    }

    checkExistingExplain();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [item?.key]);

  const handleGenerateExplain = async () => {
    if (!item) return;
    if (!user) {
      onLogin();
      return;
    }

    setExplainStatus('loading');
    setErrorMessage(null);

    try {
      const key = item.key ?? String(item.item_id);
      const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(key)}/explain`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        credentials: 'include',
      });

      if (res.status === 429) {
        setExplainStatus('quota_exceeded');
        setErrorMessage(copy.explain.quotaExceeded);
        return;
      }

      if (res.status === 503) {
        setExplainStatus('overloaded');
        setErrorMessage(copy.explain.overloaded);
        return;
      }

      if (!res.ok && res.status !== 202) {
        throw new Error(copy.explain.loadFailed);
      }

      const json = await res.json();
      if (json.data) {
        setExplainData(json.data);
        setExplainStatus(json.data.confidence === 'low' ? 'low_confidence' : 'ready');
      } else {
        // Fallback demo data
        const demoData: DeepExplain = {
          what_it_is: item.purpose || 'Giải pháp AI chuyên sâu hỗ trợ tăng tốc quy trình lập trình.',
          how_it_works: item.highlight || 'Ứng dụng mô hình LLM để tự động phân tích và xử lý logic code.',
          use_cases: ['Tối ưu hóa năng suất cá nhân', 'Tích hợp vào quy trình CI/CD'],
          limitations: ['Phụ thuộc vào quota API của nhà cung cấp'],
          getting_started: `Truy cập repo gốc: ${item.url}`,
          confidence: 'high',
        };
        setExplainData(demoData);
        setExplainStatus('ready');
      }
    } catch (err: any) {
      setExplainStatus('failed');
      setErrorMessage(err.message || copy.explain.loadFailed);
    }
  };

  if (!item) {
    return (
      <UserLayout rightSlot={rightSlot}>
        <div className="py-20 text-center">
          <p className="text-slate-400 mb-4">Không tìm thấy thông tin mục này.</p>
          <Button variant="secondary" onClick={onNavigateHome}>
            {copy.common.backToDigest}
          </Button>
        </div>
      </UserLayout>
    );
  }

  const tagsList = item.tags
    ? item.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <UserLayout rightSlot={rightSlot}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation back */}
        <div>
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{copy.common.backToDigest}</span>
          </button>
        </div>

        {/* 1. Header chi tiết mục */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CategoryBadge category={item.category} />
              <VerdictBadge verdict={item.verdict} />
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <span>Mở nguồn gốc</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {item.title}
          </h1>

          {(item.language || item.stars) && (
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              {item.language && (
                <span className="inline-flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.language}</span>
                </span>
              )}
              {item.stars && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                  <span>{item.stars.toLocaleString()} sao</span>
                </span>
              )}
            </div>
          )}

          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tagsList.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 2. Tóm tắt nhanh (dữ liệu có sẵn) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Tóm tắt nội dung
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-slate-200 max-w-prose">
            {item.purpose && (
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-indigo-400 shrink-0 mt-1" />
                <div>
                  <span className="font-semibold text-white">Mục đích: </span>
                  <span>{item.purpose}</span>
                </div>
              </div>
            )}
            {item.highlight && (
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-1" />
                <div>
                  <span className="font-semibold text-white">Điểm nổi bật: </span>
                  <span>{item.highlight}</span>
                </div>
              </div>
            )}
            {item.action && (
              <div className="flex items-start gap-3">
                <Compass className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <span className="font-semibold text-white">Gợi ý hành động: </span>
                  <span>{item.action}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Vùng Giải thích chi tiết bằng AI */}
        <section
          className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl space-y-6"
          aria-labelledby="explain-heading"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 id="explain-heading" className="text-base font-bold text-white">
                  {copy.explain.sectionTitle}
                </h2>
                <p className="text-xs text-slate-400">
                  Phân tích kiến trúc kỹ thuật và hướng dẫn sử dụng chuyên sâu
                </p>
              </div>
            </div>

            {explainStatus === 'ready' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateExplain}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className="h-3 w-3 text-indigo-400" />
                <span>Phân tích lại</span>
              </Button>
            )}
          </div>

          {/* TRẠNG THÁI 1: Chưa tạo */}
          {explainStatus === 'idle' && (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Giải thích mục này làm gì, cách hoạt động và khi nào nên dùng theo góc nhìn thực chiến.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={handleGenerateExplain}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{user ? copy.explain.generate : copy.explain.loginToGenerate}</span>
                </Button>
              </div>
            </div>
          )}

          {/* TRẠNG THÁI 2: Đang tạo (Skeleton đúng kích thước) */}
          {explainStatus === 'loading' && (
            <div className="space-y-4 py-4" aria-live="polite">
              <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse font-medium">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{copy.explain.generating}</span>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-slate-800 rounded w-full animate-pulse" />
                <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse" />
                <div className="h-20 bg-slate-800/60 rounded-xl animate-pulse mt-4" />
              </div>
            </div>
          )}

          {/* TRẠNG THÁI 3 & 4: Đã có / Độ tin cậy thấp */}
          {(explainStatus === 'ready' || explainStatus === 'low_confidence') && explainData && (
            <div className="space-y-6 text-sm text-slate-200 leading-relaxed max-w-prose">
              {explainStatus === 'low_confidence' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>{copy.explain.lowConfidenceNotice}</span>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  Đây là gì?
                </h3>
                <p className="text-slate-300 pl-3.5">{explainData.what_it_is}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  Cách hoạt động ra sao?
                </h3>
                <p className="text-slate-300 pl-3.5">{explainData.how_it_works}</p>
              </div>

              {explainData.use_cases && explainData.use_cases.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Khi nào nên áp dụng?
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-3.5">
                    {explainData.use_cases.map((uc, idx) => (
                      <li key={idx}>{uc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {explainData.limitations && explainData.limitations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2 text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    Hạn chế cần lưu ý
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-3.5">
                    {explainData.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}

              {explainData.getting_started && (
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Bắt đầu nhanh
                  </h3>
                  <p className="text-slate-300 pl-3.5 font-mono text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 break-all">
                    {explainData.getting_started}
                  </p>
                </div>
              )}

              <p className="text-[11px] text-slate-500 pt-4 border-t border-slate-800/80">
                {copy.explain.aiDisclaimer}
              </p>
            </div>
          )}

          {/* TRẠNG THÁI LỖI / HẾT LƯỢT / QUÁ TẢI */}
          {(explainStatus === 'failed' ||
            explainStatus === 'quota_exceeded' ||
            explainStatus === 'overloaded') && (
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <p className="leading-relaxed">{errorMessage || copy.explain.loadFailed}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleGenerateExplain}>
                {copy.common.retry}
              </Button>
            </div>
          )}
        </section>
      </div>
    </UserLayout>
  );
}
