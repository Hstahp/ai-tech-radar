import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchAdminSettings, updateAdminSettings } from '../api/admin-client';

export function AdminSettingsTab() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await fetchAdminSettings();
                setSettings(data);
            } catch {
                setMessage({ type: 'error', text: 'Không thể tải cài đặt.' });
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            const updated = await updateAdminSettings(settings);
            setSettings(updated);
            setMessage({
                type: 'success',
                text: 'Cấu hình runtime đã được lưu thành công và ghi vào nhật ký kiểm toán.',
            });
        } catch (err: unknown) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Lưu thất bại.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                <p className="text-sm">Đang tải cấu hình runtime...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                    <h3 className="text-sm font-semibold text-white">Cấu hình tham số hệ thống</h3>
                    <p className="text-xs text-slate-400">
                        Điều chỉnh hạn mức chat, giải thích sâu và các ngưỡng vận hành
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>Lưu cấu hình</span>
                </button>
            </div>

            {message && (
                <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        message.type === 'success'
                            ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-950/30 border border-rose-500/30 text-rose-300'
                    }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chat Configs */}
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Hạn mức Chat RAG</h4>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Lượt chat mỗi người dùng / ngày
                        </label>
                        <input
                            type="number"
                            value={settings['chat.user_daily_limit'] ?? '10'}
                            onChange={(e) => handleChange('chat.user_daily_limit', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Hạn mức chat toàn hệ thống / ngày
                        </label>
                        <input
                            type="number"
                            value={settings['chat.global_daily_limit'] ?? '300'}
                            onChange={(e) => handleChange('chat.global_daily_limit', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Độ dài câu hỏi tối đa (ký tự)
                        </label>
                        <input
                            type="number"
                            value={settings['chat.max_question_chars'] ?? '500'}
                            onChange={(e) => handleChange('chat.max_question_chars', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Ngưỡng điểm truy xuất tối thiểu (min retrieval score)
                        </label>
                        <input
                            type="number"
                            step="0.05"
                            value={settings['chat.min_retrieval_score'] ?? '0.5'}
                            onChange={(e) => handleChange('chat.min_retrieval_score', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                    </div>
                </div>

                {/* Explain & Tag Configs */}
                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
                    <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                        Hạn mức Giải thích &amp; Thẻ
                    </h4>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Lượt giải thích sâu mỗi người dùng / ngày
                        </label>
                        <input
                            type="number"
                            value={settings['explain.user_daily_limit'] ?? '5'}
                            onChange={(e) => handleChange('explain.user_daily_limit', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Hạn mức giải thích sâu toàn hệ thống / ngày
                        </label>
                        <input
                            type="number"
                            value={settings['explain.global_daily_limit'] ?? '30'}
                            onChange={(e) => handleChange('explain.global_daily_limit', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Số thẻ tối đa mỗi người dùng được chọn
                        </label>
                        <input
                            type="number"
                            value={settings['tags.max_per_user'] ?? '10'}
                            onChange={(e) => handleChange('tags.max_per_user', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Số thẻ tối đa kích hoạt hệ thống thu thập
                        </label>
                        <input
                            type="number"
                            value={settings['tags.max_active'] ?? '30'}
                            onChange={(e) => handleChange('tags.max_active', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}
