import React, { useState } from 'react';
import {
    LayoutDashboard,
    Sliders,
    Tags,
    Users,
    ShieldAlert,
    ArrowLeft,
    Menu,
    X,
    ShieldCheck,
} from 'lucide-react';
import { copy } from '../../lib/copy';

interface AdminLayoutProps {
    currentPath: string;
    onNavigate: (path: string) => void;
    children: React.ReactNode;
}

export function AdminLayout({ currentPath, onNavigate, children }: AdminLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/admin', label: copy.admin.overview, icon: LayoutDashboard },
        { path: '/admin/settings', label: copy.admin.settings, icon: Sliders },
        { path: '/admin/tags', label: copy.admin.tags, icon: Tags },
        { path: '/admin/users', label: copy.admin.users, icon: Users },
        { path: '/admin/audit', label: copy.admin.audit, icon: ShieldAlert },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200">
            {/* 1. Header trên Mobile (< 1024px) */}
            <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-tight">AI Tech Radar</h1>
                        <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                            {copy.auth.adminOnly}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    aria-label="Chuyển đổi menu quản trị"
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </header>

            {/* Menu Mobile mở rộng ngay trong trang (không dùng overlay chặn theo mục 6.2) */}
            {isMobileMenuOpen && (
                <nav className="lg:hidden bg-slate-900/95 border-b border-slate-800 px-4 py-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.path;
                        return (
                            <button
                                key={item.path}
                                type="button"
                                onClick={() => {
                                    onNavigate(item.path);
                                    setIsMobileMenuOpen(false);
                                }}
                                aria-current={isActive ? 'page' : undefined}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                                    isActive
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                    <div className="pt-2 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={() => onNavigate('/')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>{copy.common.backToUserView}</span>
                        </button>
                    </div>
                </nav>
            )}

            {/* 2. Thanh bên cố định cho Desktop (>= 1024px) */}
            <aside className="hidden lg:flex flex-col w-64 bg-slate-900/70 border-r border-slate-800 shrink-0 sticky top-0 h-screen p-4 justify-between">
                <div className="space-y-6">
                    {/* Logo / Badge Quản trị */}
                    <div className="flex items-center gap-3 px-2 pt-2">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-white tracking-tight">AI Radar</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Admin
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{copy.admin.overview}</p>
                        </div>
                    </div>

                    {/* Danh sách điều hướng admin */}
                    <nav className="space-y-1.5" aria-label="Thanh điều hướng quản trị">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPath === item.path;
                            return (
                                <button
                                    key={item.path}
                                    type="button"
                                    onClick={() => onNavigate(item.path)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                        isActive
                                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Nút thoát về trang người dùng */}
                <div className="pt-4 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={() => onNavigate('/')}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800/80"
                    >
                        <ArrowLeft className="h-4 w-4 text-indigo-400" />
                        <span>{copy.common.backToUserView}</span>
                    </button>
                </div>
            </aside>

            {/* 3. Vùng nội dung chính */}
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">{children}</div>
            </main>
        </div>
    );
}
