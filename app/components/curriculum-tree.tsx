'use client';

import Link from 'next/link';
import { ArrowRight, Check, LockKeyhole, Route } from 'lucide-react';
import type { CurriculumLevel } from '@/src/lib/curriculum/types';
import { getLevelProgress, label } from '@/src/lib/curriculum/catalog';
import { useCurriculumProgress } from './progress-provider';

export function CurriculumTree({ levels }: Readonly<{ levels: readonly CurriculumLevel[] }>) {
  const { completedCheckpointIds, isReady } = useCurriculumProgress();

  return (
    <div className="tree-shell" aria-label="Trilha visual de aprendizagem">
      <div className="tree-heading">
        <Route aria-hidden="true" size={20} />
        <span>Trilha visual de aprendizagem</span>
      </div>
      <ol className="curriculum-tree">
        {levels.map((level, index) => {
          const progress = getLevelProgress(level, completedCheckpointIds);
          const previousComplete = index === 0 || getLevelProgress(levels[index - 1], completedCheckpointIds).percent === 100;
          const isComplete = progress.percent === 100;
          const isCurrent = !isComplete && previousComplete;
          return (
            <li key={level.id} className={isComplete ? 'tree-node complete' : isCurrent ? 'tree-node current' : 'tree-node'}>
              <div className="tree-connector" aria-hidden="true" />
              <div className="tree-node-icon" aria-hidden="true">
                {isComplete ? <Check size={18} /> : previousComplete ? <span>{level.order}</span> : <LockKeyhole size={16} />}
              </div>
              <div className="tree-node-body">
                <div className="tree-node-topline">
                  <span className="meta">NÍVEL {level.order}</span>
                  <span className="tree-progress">{isReady ? `${progress.percent}%` : '…'}</span>
                </div>
                <h3>{label(level.title)}</h3>
                <p>{label(level.summary)}</p>
                <div className="progress-track" aria-label={`${progress.percent}% concluído`}>
                  <span style={{ transform: `scaleX(${progress.percent / 100})` }} />
                </div>
                <Link className="inline-link" href={`/curriculum/${level.slug}`}>
                  {isComplete ? 'Revisar nível' : isCurrent ? 'Continuar nível' : 'Ver nível'} <ArrowRight aria-hidden="true" size={15} />
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
