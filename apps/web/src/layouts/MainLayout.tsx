import React from "react";
import { HeaderNav } from "../features/digest";

interface MainLayoutProps {
  children: React.ReactNode;
  digestDate?: string;
  itemsCount?: number;
  rightSlot?: React.ReactNode;
}

export function MainLayout({ children, digestDate, itemsCount, rightSlot }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <HeaderNav digestDate={digestDate} itemsCount={itemsCount} rightSlot={rightSlot} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {children}
      </main>
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <p>
          AI Tech Radar © 2026 • Tự động thu thập &amp; tóm tắt 100% bằng Free Tier
        </p>
      </footer>
    </div>
  );
}
