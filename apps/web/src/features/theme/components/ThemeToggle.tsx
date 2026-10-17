import { Sun, Moon } from "lucide-react";
import type { Theme } from "../../../lib/theme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, className }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 border cursor-pointer ${
        isDark
          ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:border-slate-700 hover:text-amber-300"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-indigo-600 shadow-sm"
      } ${className ?? ""}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
