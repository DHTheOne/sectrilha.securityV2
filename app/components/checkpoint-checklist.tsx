'use client';

import { CheckCircle2, CloudOff } from 'lucide-react';
import type { CurriculumCheckpoint } from '@/src/lib/curriculum/types';
import { label } from '@/src/lib/curriculum/catalog';
import { useCurriculumProgress } from './progress-provider';

export function CheckpointChecklist({ checkpoints }: Readonly<{ checkpoints: readonly CurriculumCheckpoint[] }>) {
  const { isCheckpointComplete, isReady, setCheckpointComplete, storageMode } = useCurriculumProgress();

  return (
    <section className="checkpoint-section" aria-labelledby="checkpoint-heading">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">VALIDAÇÃO PRÁTICA</p>
          <h2 id="checkpoint-heading">Checkpoints</h2>
        </div>
        <span className="sync-badge" aria-live="polite">
          <CloudOff aria-hidden="true" size={14} />
          {storageMode === 'indexeddb' ? 'Salvo offline' : 'Salvo nesta sessão'}
        </span>
      </div>
      <p className="muted">Marque somente entregas que você realmente concluiu. O progresso fica somente neste dispositivo, inclusive quando você estiver offline.</p>
      <ul className="checkpoint-list">
        {checkpoints.map((checkpoint) => {
          const checked = isCheckpointComplete(checkpoint.id);
          const descriptionId = `${checkpoint.id}-description`;
          return (
            <li key={checkpoint.id} className={checked ? 'checkpoint-item checked' : 'checkpoint-item'}>
              <input
                id={checkpoint.id}
                type="checkbox"
                checked={checked}
                disabled={!isReady}
                aria-describedby={descriptionId}
                onChange={(event) => void setCheckpointComplete(checkpoint.id, event.target.checked)}
              />
              <label htmlFor={checkpoint.id}>
                <span className="checkpoint-title"><CheckCircle2 aria-hidden="true" size={18} />{label(checkpoint.title)}</span>
                <span id={descriptionId}>{label(checkpoint.description)}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
