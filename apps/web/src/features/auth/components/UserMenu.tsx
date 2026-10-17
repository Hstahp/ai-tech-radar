import { useState, useRef, useEffect } from 'react';
import { LogOut, Tag as TagIcon, Trash2, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '@radar/core';
import { Button } from '../../../components/ui/Button';

interface UserMenuProps {
    user: UserProfile | null;
    isLoading: boolean;
    onLogin: () => void;
    onLogout: () => void;
    onDeleteAccount: () => void;
    onOpenTagModal: () => void;
    onOpenAdmin?: () => void;
}

export function UserMenu({
    user,
    isLoading,
    onLogin,
    onLogout,
    onDeleteAccount,
    onOpenTagModal,
    onOpenAdmin,
}: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return <div className="h-8 w-24 rounded-lg bg-slate-900 animate-pulse border border-slate-800" />;
    }

    // Chua dang nhap -> Hien thi nut Dang nhap Google
    if (!user) {
        return (
            <Button
                variant="secondary"
                size="sm"
                onClick={onLogin}
                className="flex items-center gap-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs dark:shadow-none transition-colors"
            >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                </svg>
                <span>Đăng nhập Google</span>
            </Button>
        );
    }

    // Da dang nhap -> Dropdown User
    return (
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
                {user.avatarUrl ? (
                    <img
                        src={user.avatarUrl}
                        alt={user.displayName ?? user.email}
                        className="h-6 w-6 rounded-lg object-cover"
                    />
                ) : (
                    <div className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                        {user.displayName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                )}
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[120px] truncate hidden sm:inline">
                    {user.displayName ?? user.email.split('@')[0]}
                </span>
                {user.role === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Admin
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.displayName ?? 'Người dùng'}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>

                    {user.role === 'admin' && onOpenAdmin && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                onOpenAdmin();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-colors font-medium mb-1"
                        >
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                            <span>Bảng điều khiển Quản trị</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onOpenTagModal();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <TagIcon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                            <span>Chủ đề quan tâm</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {user.tags.length}/10
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Đăng xuất</span>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onDeleteAccount();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xóa tài khoản</span>
                    </button>
                </div>
            )}
        </div>
    );
}
