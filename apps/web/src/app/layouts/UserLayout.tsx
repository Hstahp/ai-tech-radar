import React from 'react';
import { HeaderNav } from '../../features/digest';

interface UserLayoutProps {
    digestDate?: string;
    itemsCount?: number;
    rightSlot?: React.ReactNode;
    onNavigateHome?: () => void;
    children: React.ReactNode;
}

export function UserLayout({ digestDate, itemsCount, rightSlot, onNavigateHome, children }: UserLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <HeaderNav digestDate={digestDate} itemsCount={itemsCount} rightSlot={rightSlot} onNavigateHome={onNavigateHome} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">{children}</main>
            <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-100/60 dark:bg-slate-950/60 py-6 text-center text-xs text-slate-500">
                <p>AI Tech Radar © 2026 • Tự động thu thập &amp; tóm tắt 100% bằng Free Tier</p>
            </footer>
        </div>
    );
}
