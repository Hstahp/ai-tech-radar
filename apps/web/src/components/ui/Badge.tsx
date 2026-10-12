import React from "react";
import { cn } from "../../lib/classnames";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700/60",
    success: "bg-emerald-950/70 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-950/70 text-amber-300 border-amber-500/30",
    info: "bg-indigo-950/70 text-indigo-300 border-indigo-500/30",
    outline: "bg-transparent text-slate-400 border-slate-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
