'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, Palette, X } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    // Move focus into the panel so keyboard users land on the current theme.
    containerRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-fab-wrap" ref={containerRef}>
      {open && (
        <div className="theme-fab-panel" id={panelId} role="dialog" aria-label="Temas de cores">
          <p className="theme-fab-title">Tema de cores</p>
          <fieldset className="theme-fab-options">
            <legend className="sr-only">Escolha uma paleta de cores</legend>
            {themes.map((option) => {
              const isActive = option.id === theme;
              return (
                <label key={option.id} className="theme-option">
                  <input
                    type="radio"
                    name="sectrilha-theme"
                    value={option.id}
                    checked={isActive}
                    onChange={() => setTheme(option.id)}
                  />
                  <span className="theme-swatch" style={{ background: option.swatch }} aria-hidden="true" />
                  <span>{option.label}</span>
                  {isActive && <Check className="theme-check" aria-hidden="true" size={16} />}
                </label>
              );
            })}
          </fieldset>
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        className="theme-fab"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? 'Fechar seletor de temas' : 'Escolher tema de cores'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden="true" size={20} /> : <Palette aria-hidden="true" size={20} />}
      </button>
    </div>
  );
}
