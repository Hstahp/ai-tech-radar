import { useState } from 'react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <TagIcon className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Chủ đề quan tâm của bạn</h3>
                            <p className="text-xs text-slate-400">
                                Chọn tối đa 10 thẻ để lọc bản tin riêng trong mục "Dành cho bạn"
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Counter & Warning */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                        Đã chọn:{' '}
                        <span
                            className={`font-semibold ${
                                selectedTags.length >= 10 ? 'text-amber-400' : 'text-indigo-400'
                            }`}
                        >
                            {selectedTags.length} / 10
                        </span>
                    </span>
                    {selectedTags.length > 0 && (
                        <button
                            onClick={() => setSelectedTags([])}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Bỏ chọn tất cả
                        </button>
                    )}
                </div>

                {errorMsg && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
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
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                                    isSelected
                                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-sm shadow-indigo-500/20'
                                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                }`}
                            >
                                {isSelected && <Check className="h-3 w-3 text-indigo-400" />}
                                <span>#{tag}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Propose Tag Section */}
                <div className="pt-2 border-t border-slate-800/60">
                    {!showPropose ? (
                        <button
                            type="button"
                            onClick={() => setShowPropose(true)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            + Chưa thấy thẻ bạn muốn? Đề xuất chủ đề mới
                        </button>
                    ) : (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                                <span>Đề xuất chủ đề mới</span>
                                <button
                                    type="button"
                                    onClick={() => setShowPropose(false)}
                                    className="text-slate-500 hover:text-slate-300"
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
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono"
                                />
                                <input
                                    type="text"
                                    placeholder="Tên thẻ (vd: Cursor IDE)"
                                    value={propLabel}
                                    onChange={(e) => setPropLabel(e.target.value)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handlePropose}
                                disabled={isProposing}
                                className="w-full py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors"
                            >
                                {isProposing ? 'Đang gửi...' : 'Gửi đề xuất tới Admin'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
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
