'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeId =
  | 'original'
  | 'tech-blue'
  | 'electric-black'
  | 'purple-cyan'
  | 'green-hacker'
  | 'light-pro'
  | 'dark-minimal'
  | 'dark-premium';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  swatch: string;
};

export const THEMES: ThemeOption[] = [
  { id: 'original', label: 'Original (Padrão)', swatch: '#63df9b' },
  { id: 'tech-blue', label: 'Azul Tecnológico', swatch: '#2563EB' },
  { id: 'electric-black', label: 'Preto + Azul Elétrico', swatch: '#00A3FF' },
  { id: 'purple-cyan', label: 'Roxo + Ciano', swatch: '#7C3AED' },
  { id: 'green-hacker', label: 'Verde Hacker', swatch: '#00FF88' },
  { id: 'light-pro', label: 'Claro e Profissional', swatch: '#1D4ED8' },
  { id: 'dark-minimal', label: 'Dark Minimalista', swatch: '#6366F1' },
  { id: 'dark-premium', label: 'Dark Premium (Recomendado)', swatch: '#2563EB' },
];

const THEME_STORAGE_KEY = 'sectrilha-theme';
const THEME_IDS = new Set(THEMES.map((theme) => theme.id));

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeOption[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeId(value: string | null): value is ThemeId {
  return value !== null && THEME_IDS.has(value as ThemeId);
}

function applyThemeAttribute(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id);
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [theme, setThemeState] = useState<ThemeId>('original');

  useEffect(() => {
    let storedTheme: string | null = null;
    try {
      storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      storedTheme = null;
    }
    const resolvedTheme = isThemeId(storedTheme) ? storedTheme : 'original';
    setThemeState(resolvedTheme);
    applyThemeAttribute(resolvedTheme);
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    applyThemeAttribute(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private browsing, quota, etc.).
    }
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme,
    themes: THEMES,
  }), [setTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider.');
  return context;
}
