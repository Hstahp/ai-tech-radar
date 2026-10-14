import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { copy } from '../../lib/copy';
import { Button } from '../../components/ui/Button';

interface RequireAdminProps {
    userRole?: 'admin' | 'user';
    isLoading: boolean;
    onNavigateHome: () => void;
    children: React.ReactNode;
}

export function RequireAdmin({ userRole, isLoading, onNavigateHome, children }: RequireAdminProps) {
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (userRole !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center shadow-2xl">
                    <div className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <h1 className="text-lg font-bold text-white mb-2">{copy.auth.forbidden}</h1>
                    <p className="text-xs text-slate-400 mb-6">
                        Khu vực này yêu cầu tài khoản quản trị hệ thống. Vui lòng quay lại hoặc liên hệ quản trị viên.
                    </p>
                    <Button
                        variant="secondary"
                        onClick={onNavigateHome}
                        className="w-full inline-flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Về trang chủ</span>
                    </Button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
