import React from "react";
import { cn } from "../../lib/classnames";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  isFeatured?: boolean;
}

export function BentoCard({ children, className, isFeatured = false }: BentoCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300",
        "bg-white/90 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-none hover:border-indigo-500/40",
        "hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5",
        isFeatured && "md:col-span-2 bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/50 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-indigo-950/20 border-indigo-300/80 dark:border-indigo-500/30",
        className
      )}
    >
      {/* Background ambient radial glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl transition-opacity group-hover:opacity-100" />
      {children}
    </article>
  );
}
