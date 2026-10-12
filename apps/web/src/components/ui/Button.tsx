import React from "react";
import { cn } from "../../lib/classnames";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 border-transparent",
    secondary: "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60",
    outline: "bg-transparent hover:bg-slate-800/50 text-slate-300 border-slate-700",
    ghost: "bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border-transparent",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs rounded-md",
    md: "px-3.5 py-1.5 text-sm rounded-lg",
    lg: "px-5 py-2.5 text-base rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
