import { useState, useEffect, useCallback } from "react";
import { getInitialTheme, applyTheme, type Theme } from "../../../lib/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme("dark"));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === "dark",
  };
}
