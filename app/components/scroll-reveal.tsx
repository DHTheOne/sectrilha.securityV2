'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Revela conteúdo conforme ele entra na viewport ("vem online", como
 * telemetria num painel de monitoramento). Regras de segurança do efeito:
 * - Só elementos abaixo da dobra viram candidatos — o que já está visível
 *   nunca é escondido (zero flash, zero CLS; transform/opacity apenas).
 * - Sem JavaScript, nada é escondido (classes só existem após hidratar).
 * - Com prefers-reduced-motion, o efeito é desligado por completo.
 */
const REVEAL_SELECTOR = [
  '.page-shell .card',
  '.page-shell .panel:not(.optional-planner)',
  '.page-shell .section-heading',
  '.page-shell .filter-bar',
  '.page-shell .table-wrap',
  '.page-shell .tree-node',
  '.page-shell .checkpoint-item',
  '.page-shell .fact-grid > div',
  '.page-shell .privacy-copy section',
].join(', ');

const BATCH_STAGGER_MS = 45;
const MAX_STAGGER_STEPS = 4;

function getTopLevelCandidates(elements: HTMLElement[]) {
  const candidates = new Set(elements);
  return elements.filter((element) => {
    let parent = element.parentElement;
    while (parent) {
      if (candidates.has(parent)) return false;
      parent = parent.parentElement;
    }
    return true;
  });
}

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const foldLine = window.innerHeight * 0.92;
    const belowFold = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR))
      .filter((element) => element.getBoundingClientRect().top > foldLine);
    const candidates = getTopLevelCandidates(belowFold);
    if (candidates.length === 0) return;

    let batch: HTMLElement[] = [];
    let frame = 0;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        batch.push(entry.target as HTMLElement);
      }
      if (batch.length === 0) return;
      // Agrupa o que entrou no mesmo frame para escalonar em conjunto.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        batch.forEach((element, index) => {
          // animation-delay (e não transition-delay): não interfere nas
          // transitions de hover/estado que o elemento tenha por conta própria.
          element.style.animationDelay = `${Math.min(index, MAX_STAGGER_STEPS) * BATCH_STAGGER_MS}ms`;
          element.classList.remove('reveal-pending');
          element.classList.add('reveal-in');
          element.addEventListener('animationend', () => {
            element.classList.remove('reveal-in');
            element.style.removeProperty('animation-delay');
          }, { once: true });
        });
        batch = [];
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    for (const element of candidates) {
      element.classList.add('reveal-pending');
      observer.observe(element);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      // Nunca deixar conteúdo escondido para trás (ex.: troca rápida de rota).
      for (const element of candidates) {
        element.classList.remove('reveal-pending', 'reveal-in');
        element.style.removeProperty('animation-delay');
      }
    };
  }, [pathname]);

  return null;
}
