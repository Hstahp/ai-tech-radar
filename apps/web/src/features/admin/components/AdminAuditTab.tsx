import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, FileText } from 'lucide-react';
import { fetchAdminAuditLogs, type AdminAuditLogItem } from '../api/admin-client';

export function AdminAuditTab() {
    const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const limit = 25;

    const loadLogs = async (p: number = page) => {
        setIsLoading(true);
        try {
            const data = await fetchAdminAuditLogs(limit, p * limit);
            setLogs(data);
        } catch {
            // handle error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs(page);
    }, [page]);

    const formatTime = (iso: string) => {
        try {
            const d = new Date(iso);
            return d.toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return iso;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                    <h3 className="text-sm font-semibold text-white">Nhật ký kiểm toán (Audit Trail)</h3>
                    <p className="text-xs text-slate-400">
                        Ghi nhận mọi thao tác cấu hình, duyệt thẻ và phân quyền của admin
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => loadLogs(page)}
                    className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Làm mới"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                    <p className="text-sm">Đang tải nhật ký kiểm toán...</p>
                </div>
            ) : logs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/30">
                    <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs">Chưa có bản ghi kiểm toán nào.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/30">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="p-3 font-semibold">Thời gian</th>
                                    <th className="p-3 font-semibold">Người thực hiện</th>
                                    <th className="p-3 font-semibold">Hành động</th>
                                    <th className="p-3 font-semibold">Đối tượng</th>
                                    <th className="p-3 font-semibold">Chi tiết (Metadata)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                            {formatTime(log.createdAt)}
                                        </td>
                                        <td className="p-3 text-white font-medium">
                                            {log.actorEmail ?? log.actorUserId ?? 'System'}
                                        </td>
                                        <td className="p-3">
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[11px]">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-300">
                                            {log.targetType
                                                ? `${log.targetType}${log.targetId ? `: ${log.targetId}` : ''}`
                                                : '-'}
                                        </td>
                                        <td className="p-3 text-slate-400 font-mono text-[11px] max-w-[250px] truncate">
                                            {log.metadataJson ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                        <span>Trang {page + 1}</span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={page === 0}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 text-white"
                            >
                                Trước
                            </button>
                            <button
                                type="button"
                                disabled={logs.length < limit}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 text-white"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
