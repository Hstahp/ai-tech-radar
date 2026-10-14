import { Save, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { copy } from '../../../lib/copy';

interface SaveBarProps {
    isVisible: boolean;
    isLoading?: boolean;
    onSave: () => void | Promise<void>;
    onReset: () => void;
    note?: string;
}

export function SaveBar({
    isVisible,
    isLoading = false,
    onSave,
    onReset,
    note = copy.admin.saveBarNote,
}: SaveBarProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 lg:left-72 lg:right-8 z-40 animate-in slide-in-from-bottom duration-200">
            <div className="max-w-4xl mx-auto rounded-2xl bg-slate-900/95 border border-amber-500/30 p-3 sm:p-4 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-amber-300 font-medium text-center sm:text-left">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span>{note}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onReset}
                        disabled={isLoading}
                        className="flex items-center gap-1.5"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>{copy.common.undo}</span>
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onSave}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white"
                    >
                        <Save className="h-3.5 w-3.5" />
                        <span>{isLoading ? copy.common.loading : copy.common.save}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
