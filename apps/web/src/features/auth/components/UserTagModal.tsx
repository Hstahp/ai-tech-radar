import { useState, useEffect } from 'react';
import { X, Check, Tag as TagIcon, Loader2 } from 'lucide-react';
import { TAGS, type Tag } from '@radar/core';
import { Button } from '../../../components/ui/Button';
import { submitTagRequest } from '../../admin/api/admin-client';
import { notify } from '../../../lib/toast';

interface UserTagModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTags: string[];
    onSave: (tags: string[]) => Promise<void>;
}

export function UserTagModal({ isOpen, onClose, currentTags, onSave }: UserTagModalProps) {
    const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Đồng bộ selectedTags với currentTags khi modal mở lên hoặc currentTags thay đổi
    useEffect(() => {
        if (isOpen) {
            setSelectedTags(currentTags || []);
            setErrorMsg(null);
            setShowPropose(false);
        }
    }, [isOpen, currentTags]);

    // Propose tag state
    const [showPropose, setShowPropose] = useState(false);
    const [propSlug, setPropSlug] = useState('');
    const [propLabel, setPropLabel] = useState('');
    const [isProposing, setIsProposing] = useState(false);

    if (!isOpen) return null;

    const handlePropose = async () => {
        if (!propSlug.trim() || !propLabel.trim()) {
            setErrorMsg('Vui lòng điền đầy đủ slug và tên thẻ đề xuất.');
            return;
        }
        setIsProposing(true);
        setErrorMsg(null);
        try {
            await submitTagRequest(propSlug.trim().toLowerCase(), propLabel.trim());
            setShowPropose(false);
            setPropSlug('');
            setPropLabel('');
            notify.success('Đề xuất thẻ đã được gửi thành công tới quản trị viên!');
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Gửi đề xuất thất bại.');
        } finally {
            setIsProposing(false);
        }
    };

    const toggleTag = (tag: string) => {
        setErrorMsg(null);
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else {
            if (selectedTags.length >= 10) {
                setErrorMsg('Bạn chỉ có thể chọn tối đa 10 thẻ quan tâm.');
                return;
            }
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setErrorMsg(null);
        try {
            await onSave(selectedTags);
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || 'Không thể lưu danh sách thẻ.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm transition-colors">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                            <TagIcon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Chủ đề quan tâm của bạn</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Chọn tối đa 10 thẻ để lọc bản tin riêng trong mục "Dành cho bạn"
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        aria-label="Đóng popup"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Counter & Warning */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Đã chọn:{' '}
                        <span
                            className={`font-semibold ${
                                selectedTags.length >= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
                            }`}
                        >
                            {selectedTags.length} / 10
                        </span>
                    </span>
                    {selectedTags.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setSelectedTags([])}
                            className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer font-medium"
                        >
                            Bỏ chọn tất cả
                        </button>
                    )}
                </div>

                {errorMsg && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                        {errorMsg}
                    </div>
                )}

                {/* Tags Selection Grid */}
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto py-1">
                    {TAGS.map((tag: Tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-600/20 dark:border-indigo-500/50 dark:text-indigo-200 shadow-xs dark:shadow-indigo-500/20'
                                        : 'bg-slate-100/80 hover:bg-slate-200/70 border-slate-200/90 text-slate-700 hover:text-slate-900 dark:bg-slate-950/60 dark:hover:bg-slate-800/70 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {isSelected && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />}
                                <span>#{tag}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Propose Tag Section */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    {!showPropose ? (
                        <button
                            type="button"
                            onClick={() => setShowPropose(true)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                            + Chưa thấy thẻ bạn muốn? Đề xuất chủ đề mới
                        </button>
                    ) : (
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
                                <span>Đề xuất chủ đề mới</span>
                                <button
                                    type="button"
                                    onClick={() => setShowPropose(false)}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Slug (vd: cursor)"
                                    value={propSlug}
                                    onChange={(e) => setPropSlug(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="Tên thẻ (vd: Cursor IDE)"
                                    value={propLabel}
                                    onChange={(e) => setPropLabel(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handlePropose}
                                disabled={isProposing}
                                className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/30 dark:hover:bg-indigo-600/40 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors cursor-pointer"
                            >
                                {isProposing ? 'Đang gửi...' : 'Gửi đề xuất tới Admin'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
                        Hủy
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving} className="min-w-24">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu tùy chọn'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
