'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Compass, Target } from 'lucide-react';
import type { CurriculumCertification, CurriculumCheckpoint, CurriculumLevel } from '@/src/lib/curriculum/types';
import { getLevelEstimatedHours, getLevelProgress, label } from '@/src/lib/curriculum/catalog';
import { useCurriculumProgress } from './progress-provider';

const WEEKLY_HOURS_KEY = 'sectrilha-weekly-hours';

export function NextActionCard({
  levels,
  checkpoints,
  certifications,
}: Readonly<{
  levels: readonly CurriculumLevel[];
  checkpoints: readonly CurriculumCheckpoint[];
  certifications: readonly CurriculumCertification[];
}>) {
  const { completedCheckpointIds } = useCurriculumProgress();
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [targetCertificationId, setTargetCertificationId] = useState('security-plus');

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(WEEKLY_HOURS_KEY));
    if (Number.isFinite(stored) && stored >= 1 && stored <= 40) setWeeklyHours(stored);
  }, []);

  const recommendation = useMemo(() => {
    const currentLevel = levels.find((level) => getLevelProgress(level, completedCheckpointIds).percent < 100) ?? levels.at(-1);
    const checkpoint = currentLevel
      ? checkpoints.find((item) => item.levelId === currentLevel.id && !completedCheckpointIds.has(item.id))
      : undefined;
    const certification = certifications.find((item) => item.id === targetCertificationId);
    const certificationLevel = certification?.levelIds[0];
    const targetLevel = certificationLevel ? levels.find((level) => level.id === certificationLevel) : undefined;
    const targetCheckpointIds = targetLevel?.checkpointIds ?? [];
    const missingForTarget = targetCheckpointIds.filter((id) => !completedCheckpointIds.has(id)).length;
    return { currentLevel, checkpoint, certification, missingForTarget, targetTotal: targetCheckpointIds.length };
  }, [certifications, checkpoints, completedCheckpointIds, levels, targetCertificationId]);

  function updateWeeklyHours(value: number) {
    const nextValue = Math.max(1, Math.min(40, value || 1));
    setWeeklyHours(nextValue);
    window.localStorage.setItem(WEEKLY_HOURS_KEY, String(nextValue));
  }

  const projectedWeeks = recommendation.currentLevel
    ? Math.max(1, Math.ceil(getLevelEstimatedHours(recommendation.currentLevel) / weeklyHours))
    : 0;

  return (
    <section className="recommendation-card panel" aria-labelledby="recommendation-heading">
      <div className="recommendation-icon"><Compass aria-hidden="true" size={24} /></div>
      <div className="recommendation-content">
        <p className="eyebrow">PLANEJAMENTO ADAPTATIVO</p>
        <h2 id="recommendation-heading">Próxima ação recomendada</h2>
        {recommendation.checkpoint && recommendation.currentLevel ? (
          <>
            <p className="recommendation-main">No <strong>{label(recommendation.currentLevel.title)}</strong>, priorize: <strong>{label(recommendation.checkpoint.title)}</strong>.</p>
            <p className="muted">{label(recommendation.checkpoint.description)}</p>
            <Link className="inline-link" href={`/curriculum/${recommendation.currentLevel.slug}`}>Abrir este nível</Link>
          </>
        ) : <p className="recommendation-main">Você concluiu todos os checkpoints atuais. Escolha uma especialização para aprofundar sua prática.</p>}
        <div className="recommendation-controls">
          <label>
            <span><CalendarClock aria-hidden="true" size={15} /> Horas disponíveis por semana</span>
            <input type="number" min="1" max="40" value={weeklyHours} onChange={(event) => updateWeeklyHours(Number(event.target.value))} />
          </label>
          <label>
            <span><Target aria-hidden="true" size={15} /> Certificação-alvo</span>
            <select value={targetCertificationId} onChange={(event) => setTargetCertificationId(event.target.value)}>
              {certifications.map((certification) => <option key={certification.id} value={certification.id}>{label(certification.name)}</option>)}
            </select>
          </label>
        </div>
        <div className="recommendation-summary">
          <span>Com {weeklyHours} h/semana, reserve cerca de {projectedWeeks} semanas para o próximo estágio.</span>
          {recommendation.certification && <span>Para {label(recommendation.certification.name)}: {recommendation.missingForTarget}/{recommendation.targetTotal} checkpoints do nível-alvo ainda pendentes.</span>}
        </div>
      </div>
    </section>
  );
}
