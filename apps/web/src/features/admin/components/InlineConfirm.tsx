import { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface InlineConfirmProps {
  label: string;
  confirmMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
}

export function InlineConfirm({
  label,
  confirmMessage = 'Bạn chắc chắn?',
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  onConfirm,
  disabled = false,
}: InlineConfirmProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
    }
  };

  if (!isConfirming) {
    return (
      <Button
        variant={variant === 'danger' ? 'secondary' : 'secondary'}
        size="sm"
        disabled={disabled}
        onClick={() => setIsConfirming(true)}
        className={variant === 'danger' ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/30' : ''}
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-700 shadow-md">
      <span className="text-[11px] text-slate-300 font-medium px-2 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
        <span>{confirmMessage}</span>
      </span>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleConfirm}
        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors inline-flex items-center gap-1"
      >
        <Check className="h-2.5 w-2.5" />
        <span>{confirmLabel}</span>
      </button>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setIsConfirming(false)}
        className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-800 text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
      >
        <X className="h-2.5 w-2.5" />
        <span>{cancelLabel}</span>
      </button>
    </div>
  );
}
