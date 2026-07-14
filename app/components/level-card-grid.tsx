'use client';

import Link from 'next/link';
import { Award, Clock3 } from 'lucide-react';
import type { CurriculumLevel } from '@/src/lib/curriculum/types';
import { getLevelProgress, label } from '@/src/lib/curriculum/catalog';
import { useCurriculumProgress } from './progress-provider';

export function LevelCardGrid({ levels }: Readonly<{ levels: readonly CurriculumLevel[] }>) {
  const { completedCheckpointIds, isReady } = useCurriculumProgress();
  return (
    <div className="grid grid-3">
      {levels.map((level) => {
        const progress = getLevelProgress(level, completedCheckpointIds);
        return (
          <Link key={level.id} href={`/curriculum/${level.slug}`} className="card card-link level-card">
            <span className="level-number">Nível {level.order}</span>
            <h3>{label(level.title)}</h3>
            <p>{label(level.summary)}</p>
            <div className="card-spacer" />
            <div className="level-details">
              <span><Clock3 aria-hidden="true" size={15} /> {level.duration.minWeeks}–{level.duration.maxWeeks} sem.</span>
              <span><Award aria-hidden="true" size={15} /> {label(level.badge.label)}</span>
            </div>
            <div className="level-progress-line">
              <div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div>
              <span>{isReady ? `${progress.percent}%` : 'Carregando…'}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
