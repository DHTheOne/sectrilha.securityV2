'use client';

import { useId } from 'react';
import { useTheme, type ThemeId } from './theme-provider';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const selectId = useId();

  return (
    <div className="theme-switcher">
      <label htmlFor={selectId} className="sr-only">Escolher tema de cores</label>
      <select
        id={selectId}
        aria-label="Escolher tema de cores"
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemeId)}
      >
        {themes.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
