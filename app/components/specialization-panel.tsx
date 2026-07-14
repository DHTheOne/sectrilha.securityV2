'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { CurriculumCheckpoint, CurriculumSpecialization, SkillDefinition } from '@/src/lib/curriculum/types';
import { label } from '@/src/lib/curriculum/catalog';
import { useCurriculumProgress } from './progress-provider';

export function SpecializationPanel({ specialization, skills, checkpoints }: Readonly<{
  specialization: CurriculumSpecialization;
  skills: readonly SkillDefinition[];
  checkpoints: readonly CurriculumCheckpoint[];
}>) {
  const { completedCheckpointIds } = useCurriculumProgress();
  const selectedSkills = specialization.skillTargets.map((target) => ({ target, skill: skills.find((skill) => skill.id === target.skillId) })).filter((item) => item.skill);
  const nextCheckpoint = specialization.checkpointIds.map((id) => checkpoints.find((checkpoint) => checkpoint.id === id)).find((checkpoint) => checkpoint && !completedCheckpointIds.has(checkpoint.id));
  const completeCount = specialization.checkpointIds.filter((id) => completedCheckpointIds.has(id)).length;

  return (
    <section className="specialization-panel panel" aria-labelledby="skills-heading">
      <div className="specialization-progress"><span>{completeCount}/{specialization.checkpointIds.length} checkpoints concluídos</span><div className="progress-track"><span style={{ width: `${specialization.checkpointIds.length ? Math.round((completeCount / specialization.checkpointIds.length) * 100) : 0}%` }} /></div></div>
      <h2 id="skills-heading">Matriz de skills</h2>
      <div className="skill-matrix">
        {selectedSkills.map(({ target, skill }) => skill && (
          <div className="skill-row" key={skill.id}>
            <div><strong>{label(skill.title)}</strong><span>{label(skill.description)}</span></div>
            <div className="skill-dots" aria-label={`Meta de proficiência: ${target.targetProficiency} de 5`}>
              {[1, 2, 3, 4, 5].map((value) => <span key={value} className={value <= target.targetProficiency ? 'active' : ''} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="next-specialization-action">
        <CheckCircle2 aria-hidden="true" size={20} />
        <div><strong>Próximo passo recomendado</strong><p>{nextCheckpoint ? label(nextCheckpoint.title) : 'Revise as certificações e aprofunde seu portfólio.'}</p></div>
        {nextCheckpoint && <Link className="inline-link" href={`/curriculum/${nextCheckpoint.levelId}`}>Abrir nível <ArrowRight aria-hidden="true" size={14} /></Link>}
      </div>
    </section>
  );
}
