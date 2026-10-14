import { CheckCircle2, Clock, Ban, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
    status: 'active' | 'cooldown' | 'disabled' | 'suspended' | 'pending';
    label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
    switch (status) {
        case 'active':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{label || 'Đang hoạt động'}</span>
                </span>
            );
        case 'cooldown':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <Clock className="h-3 w-3" />
                    <span>{label || 'Tạm nghỉ'}</span>
                </span>
            );
        case 'disabled':
        case 'suspended':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Ban className="h-3 w-3" />
                    <span>{label || 'Đã tạm khóa'}</span>
                </span>
            );
        case 'pending':
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <AlertCircle className="h-3 w-3" />
                    <span>{label || 'Chờ duyệt'}</span>
                </span>
            );
    }
}
