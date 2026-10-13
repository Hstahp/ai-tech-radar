import { useState, useEffect } from 'react';
import { MessageSquare, HelpCircle, Zap, Users, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { fetchAdminOverview, type AdminOverviewMetrics } from '../api/admin-client';

export function AdminOverviewTab() {
    const [overview, setOverview] = useState<AdminOverviewMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchAdminOverview();
            setOverview(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Lỗi tải tổng quan.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                <p className="text-sm">Đang tải chỉ số KPI vận hành...</p>
            </div>
        );
    }

    if (error || !overview) {
        return (
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center my-6">
                <p className="text-sm text-rose-300 mb-3">{error ?? 'Không có dữ liệu.'}</p>
                <button
                    type="button"
                    onClick={loadData}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white inline-flex items-center gap-2"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Thử lại
                </button>
            </div>
        );
    }

    const chatPercentage = Math.min(100, Math.round((overview.totalChatRequests / (overview.chatLimit || 1)) * 100));
    const explainPercentage = Math.min(
        100,
        Math.round((overview.totalExplainRequests / (overview.explainLimit || 1)) * 100),
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                    <h3 className="text-sm font-semibold text-white">Chỉ số hôm nay ({overview.today})</h3>
                    <p className="text-xs text-slate-400">Theo dõi thời gian thực hạn mức sử dụng và hoạt động</p>
                </div>
                <button
                    type="button"
                    onClick={loadData}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs inline-flex items-center gap-1.5 transition-colors"
                    title="Làm mới"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Làm mới</span>
                </button>
            </div>

            {/* Bento Grid KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Chat Requests */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">Lượt Chat RAG</span>
                        <MessageSquare className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {overview.totalChatRequests}{' '}
                            <span className="text-xs font-normal text-slate-500">/ {overview.chatLimit} max</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    chatPercentage >= 80
                                        ? 'bg-rose-500'
                                        : chatPercentage >= 60
                                          ? 'bg-amber-500'
                                          : 'bg-indigo-500'
                                }`}
                                style={{ width: `${chatPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Explain Requests */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">Giải thích sâu</span>
                        <HelpCircle className="h-4 w-4 text-violet-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {overview.totalExplainRequests}{' '}
                            <span className="text-xs font-normal text-slate-500">/ {overview.explainLimit} max</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    explainPercentage >= 80
                                        ? 'bg-rose-500'
                                        : explainPercentage >= 60
                                          ? 'bg-amber-500'
                                          : 'bg-violet-500'
                                }`}
                                style={{ width: `${explainPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Tokens Consumed */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">Tokens tiêu thụ</span>
                        <Zap className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white mb-1">
                            {overview.totalTokens.toLocaleString()}
                        </div>
                        <p className="text-[11px] text-slate-500">Gộp cả In &amp; Out tokens</p>
                    </div>
                </div>

                {/* Active Users */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-xs font-medium">Người dùng hoạt động</span>
                        <Users className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white mb-1">{overview.activeUsersCount}</div>
                        <p className="text-[11px] text-slate-500">Có tương tác trong ngày</p>
                    </div>
                </div>
            </div>

            {/* Secondary KPI section */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-slate-200">Câu hỏi ngoài phạm vi / Lọc tự động</h4>
                        <p className="text-[11px] text-slate-400">
                            Đã từ chối 0-token an toàn {overview.refusedChatRequests} câu hỏi ngoài nội dung tech radar
                        </p>
                    </div>
                </div>
                <span className="text-sm font-bold text-slate-300 font-mono">{overview.refusedChatRequests} lượt</span>
            </div>
        </div>
    );
}
