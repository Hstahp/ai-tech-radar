import { useState, useEffect } from 'react';
import { Plus, Check, X, Loader2, Pin, Power, RefreshCw, MessageSquarePlus } from 'lucide-react';
import {
    fetchAdminTags,
    updateAdminTag,
    createAdminTag,
    fetchAdminTagRequests,
    reviewTagRequest,
    type AdminTagItem,
    type AdminTagRequestItem,
} from '../api/admin-client';

export function AdminTagsTab() {
    const [tags, setTags] = useState<AdminTagItem[]>([]);
    const [requests, setRequests] = useState<AdminTagRequestItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'tags' | 'requests'>('tags');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form create tag
    const [newSlug, setNewSlug] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newIsSystem, setNewIsSystem] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [tagsData, reqData] = await Promise.all([fetchAdminTags(), fetchAdminTagRequests()]);
            setTags(tagsData);
            setRequests(reqData);
        } catch {
            // handle error gracefully
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleToggleEnabled = async (tag: AdminTagItem) => {
        const nextEnabled = tag.enabled === 1 ? 0 : 1;
        try {
            await updateAdminTag(tag.slug, { enabled: nextEnabled });
            setTags((prev) => prev.map((t) => (t.slug === tag.slug ? { ...t, enabled: nextEnabled } : t)));
        } catch {
            alert('Cập nhật trạng thái thẻ thất bại.');
        }
    };

    const handleToggleSystem = async (tag: AdminTagItem) => {
        const nextSystem = tag.isSystem === 1 ? 0 : 1;
        try {
            await updateAdminTag(tag.slug, { isSystem: nextSystem });
            setTags((prev) => prev.map((t) => (t.slug === tag.slug ? { ...t, isSystem: nextSystem } : t)));
        } catch {
            alert('Cập nhật ghim hệ thống thất bại.');
        }
    };

    const handleReview = async (id: number, status: 'approved' | 'rejected') => {
        try {
            await reviewTagRequest(id, status);
            await loadData();
        } catch {
            alert('Xét duyệt đề xuất thất bại.');
        }
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSlug || !newLabel) return;
        setIsSubmitting(true);
        try {
            await createAdminTag({
                slug: newSlug.trim().toLowerCase(),
                label: newLabel.trim(),
                enabled: 1,
                isSystem: newIsSystem ? 1 : 0,
            });
            setShowCreateModal(false);
            setNewSlug('');
            setNewLabel('');
            setNewIsSystem(false);
            await loadData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Thêm thẻ thất bại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
                <p className="text-sm">Đang tải danh sách thẻ và yêu cầu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Bar Switch & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveSection('tags')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            activeSection === 'tags'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                    >
                        Thẻ hệ thống ({tags.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('requests')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            activeSection === 'requests'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                    >
                        <span>Đề xuất từ User</span>
                        {pendingRequestsCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                                {pendingRequestsCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {activeSection === 'tags' && (
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Thêm thẻ mới</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={loadData}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Modal Thêm Thẻ Mới */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-white">Thêm Thẻ Hệ Thống Mới</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTag} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Mã định danh (Slug)
                                </label>
                                <input
                                    type="text"
                                    placeholder="vd: ai-agents"
                                    value={newSlug}
                                    onChange={(e) => setNewSlug(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Tên hiển thị (Label)
                                </label>
                                <input
                                    type="text"
                                    placeholder="vd: Autonomous AI Agents"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isSystemCheck"
                                    checked={newIsSystem}
                                    onChange={(e) => setNewIsSystem(e.target.checked)}
                                    className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                                />
                                <label htmlFor="isSystemCheck" className="text-xs text-slate-300">
                                    Thẻ mặc định hệ thống (luôn luôn thu thập)
                                </label>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                    <span>Tạo thẻ</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Section 1: Thẻ hệ thống */}
            {activeSection === 'tags' && (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/30">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="p-3 font-semibold">Tên thẻ</th>
                                <th className="p-3 font-semibold">Slug</th>
                                <th className="p-3 font-semibold">Người theo dõi</th>
                                <th className="p-3 font-semibold text-center">Ghim hệ thống</th>
                                <th className="p-3 font-semibold text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {tags.map((tag) => (
                                <tr key={tag.slug} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-3 font-medium text-white">{tag.label}</td>
                                    <td className="p-3 font-mono text-slate-400">{tag.slug}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300">
                                            {tag.followers ?? 0}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleSystem(tag)}
                                            className={`p-1.5 rounded-lg border transition-colors ${
                                                tag.isSystem === 1
                                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                                    : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
                                            }`}
                                            title={tag.isSystem === 1 ? 'Thẻ hệ thống' : 'Thẻ thông thường'}
                                        >
                                            <Pin className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleEnabled(tag)}
                                            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 transition-colors ${
                                                tag.enabled === 1
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                    : 'bg-slate-950 border-slate-800 text-slate-500'
                                            }`}
                                        >
                                            <Power className="h-3 w-3" />
                                            <span>{tag.enabled === 1 ? 'Bật' : 'Tắt'}</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Section 2: Đề xuất từ người dùng */}
            {activeSection === 'requests' && (
                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-2xl bg-slate-900/30">
                            <MessageSquarePlus className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-xs">Chưa có đề xuất thẻ nào từ người dùng.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/30">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="p-3 font-semibold">Tên đề xuất</th>
                                        <th className="p-3 font-semibold">Slug</th>
                                        <th className="p-3 font-semibold">Người gửi</th>
                                        <th className="p-3 font-semibold">Lý do</th>
                                        <th className="p-3 font-semibold">Trạng thái</th>
                                        <th className="p-3 font-semibold text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                    {requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3 font-medium text-white">{req.label}</td>
                                            <td className="p-3 font-mono text-slate-400">{req.slugProposed}</td>
                                            <td className="p-3 text-slate-400 text-[11px]">
                                                {req.userEmail ?? req.userId}
                                            </td>
                                            <td className="p-3 text-slate-400 max-w-[200px] truncate">
                                                {req.reason ?? '-'}
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        req.status === 'approved'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                            : req.status === 'rejected'
                                                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                                    }`}
                                                >
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                {req.status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReview(req.id, 'approved')}
                                                            className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40"
                                                            title="Duyệt thẻ"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReview(req.id, 'rejected')}
                                                            className="p-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40"
                                                            title="Từ chối"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-500">Đã xét duyệt</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
