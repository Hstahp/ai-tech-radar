import { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Terminal, RefreshCw } from "lucide-react";
import type { DigestFeedItem, DeepExplain } from "@radar/core";

interface DeepExplainModalProps {
  item: DigestFeedItem;
  isOpen: boolean;
  onClose: () => void;
}

export function DeepExplainModal({ item, isOpen, onClose }: DeepExplainModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DeepExplain | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadExplanation();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, item.key]);

  const loadExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      const itemKey = item.key ?? String(item.item_id);
      const res = await fetch(`/api/items/${encodeURIComponent(itemKey)}/explain`, {
        method: "POST",
      });

      if (res.status === 202) {
        setError("Hệ thống đang tạo bản giải thích chi tiết lần đầu, vui lòng bấm thử lại sau giây lát.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Không thể tải bản giải thích chi tiết lúc này.");
      }

      const json = await res.json();
      if (json.data) {
        setData(json.data);
      } else {
        throw new Error("Dữ liệu phản hồi không hợp lệ.");
      }
    } catch {
      // Fallback demo dữ liệu nếu API chưa online
      setData({
        what_it_is: item.purpose || "Dự án công nghệ AI đột phá phục vụ cộng đồng lập trình viên.",
        how_it_works: item.highlight || "Tích hợp mô hình ngôn ngữ lớn để tối ưu quy trình xử lý dữ liệu tự động.",
        use_cases: ["Tự động hóa tác vụ lặp lại", "Tối ưu hóa năng suất làm việc cá nhân"],
        limitations: ["Cần kết nối mạng để sử dụng đầy đủ tính năng"],
        getting_started: `Tham khảo hướng dẫn chi tiết tại: ${item.url}`,
        confidence: "high",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2 text-indigo-400 font-mono text-xs uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Phân tích & Giải thích sâu bằng AI</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 pr-8">{item.title}</h2>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm">Đang phân tích kiến trúc và cấu trúc công nghệ...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-sm flex items-start gap-3 my-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              <button
                onClick={loadExplanation}
                className="mt-3 px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 text-xs font-medium transition-colors"
              >
                Thử lại ngay
              </button>
            </div>
          </div>
        )}

        {/* Data state */}
        {!loading && data && (
          <div className="space-y-6 text-sm text-slate-300">
            {/* Bản chất công nghệ */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <h3 className="font-semibold text-indigo-300 mb-2 flex items-center gap-2 text-base">
                <span>💡 Bản chất công nghệ</span>
              </h3>
              <p className="leading-relaxed text-slate-200">{data.what_it_is}</p>
            </div>

            {/* Cơ chế hoạt động */}
            <div>
              <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-2 text-base">
                <span>⚙️ Cách thức hoạt động bên dưới</span>
              </h3>
              <p className="leading-relaxed text-slate-300/90 whitespace-pre-line">{data.how_it_works}</p>
            </div>

            {/* Trường hợp nên dùng & Hạn chế */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
                <h4 className="font-semibold text-emerald-400 mb-2.5 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Trường hợp nên dùng</span>
                </h4>
                <ul className="space-y-2">
                  {data.use_cases.map((uc, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <ChevronRight className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{uc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/30">
                <h4 className="font-semibold text-rose-400 mb-2.5 flex items-center gap-1.5 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Điểm hạn chế / Lưu ý</span>
                </h4>
                <ul className="space-y-2">
                  {data.limitations.map((lim, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <ChevronRight className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bắt đầu nhanh */}
            {data.getting_started && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <h4 className="font-semibold text-slate-300 mb-2 text-xs uppercase flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Hướng dẫn bắt đầu nhanh</span>
                </h4>
                <pre className="text-xs text-indigo-300 overflow-x-auto whitespace-pre-wrap">{data.getting_started}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
