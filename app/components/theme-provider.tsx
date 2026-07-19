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
  | 'sentinela-ciano'
  | 'zero-trust-violeta'
  | 'firewall-rubi'
  | 'criptografia-esmeralda'
  | 'grafite-ambar'
  | 'azul-forense'
  | 'light-pro'
  | 'dark-minimal'
  | 'dark-premium';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  /** Cor principal (primary) da paleta, usada como amostra no seletor. */
  swatch: string;
};

// Ordem exibida no seletor. O `swatch` é a cor primária de cada paleta.
// As cores completas de cada tema vivem em `app/globals.css` (blocos [data-theme]).
export const THEMES: ThemeOption[] = [
  { id: 'original', label: 'Original (Padrão)', swatch: '#63df9b' },
  { id: 'sentinela-ciano', label: 'Sentinela Ciano', swatch: '#22D3EE' },
  { id: 'zero-trust-violeta', label: 'Zero Trust Violeta', swatch: '#7C3AED' },
  { id: 'firewall-rubi', label: 'Firewall Rubi', swatch: '#BE123C' },
  { id: 'criptografia-esmeralda', label: 'Criptografia Esmeralda', swatch: '#047857' },
  { id: 'grafite-ambar', label: 'Grafite Âmbar', swatch: '#F59E0B' },
  { id: 'azul-forense', label: 'Azul Forense', swatch: '#2563EB' },
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
  // Mantém o chrome do navegador (barra de status mobile) na cor do tema.
  const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (background && themeColorMeta) themeColorMeta.setAttribute('content', background);
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
