export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "radar_theme";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ElementLike {
  classList: {
    add(token: string): void;
    remove(token: string): void;
  };
}

export function resolveTheme(
  storage?: StorageLike,
  systemPrefersLight?: boolean,
  defaultTheme: Theme = "dark"
): Theme {
  const stored = storage?.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (systemPrefersLight) {
    return "light";
  }

  return defaultTheme;
}

export function getInitialTheme(defaultTheme: Theme = "dark"): Theme {
  const storage = typeof window !== "undefined" ? window.localStorage : undefined;
  const prefersLight =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: light)").matches
      : false;

  return resolveTheme(storage, prefersLight, defaultTheme);
}

export function applyTheme(
  theme: Theme,
  targetElement?: ElementLike,
  storage?: StorageLike
): void {
  const el = targetElement ?? (typeof document !== "undefined" ? document.documentElement : undefined);
  if (el) {
    if (theme === "dark") {
      el.classList.add("dark");
      el.classList.remove("light");
    } else {
      el.classList.remove("dark");
      el.classList.add("light");
    }
  }

  const s = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  if (s) {
    try {
      s.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Bỏ qua lỗi storage
    }
  }
}
