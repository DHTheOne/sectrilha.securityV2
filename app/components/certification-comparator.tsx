'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CertificationCostBand, CertificationRecognition, CurriculumCertification } from '@/src/lib/curriculum/types';
import { getCostBandLabel, getRecognitionLabel, label } from '@/src/lib/curriculum/catalog';

export function CertificationComparator({ certifications }: Readonly<{ certifications: readonly CurriculumCertification[] }>) {
  const [cost, setCost] = useState<CertificationCostBand | 'all'>('all');
  const [recognition, setRecognition] = useState<CertificationRecognition | 'all'>('all');
  const visible = useMemo(() => certifications.filter((item) =>
    (cost === 'all' || item.costBand === cost) && (recognition === 'all' || item.recognition === recognition)
  ), [certifications, cost, recognition]);

  return (
    <section aria-labelledby="comparison-heading">
      <div className="filter-bar compact-filter-bar">
        <div className="filter-label"><strong id="comparison-heading">Compare certificações</strong></div>
        <label>Custo
          <select value={cost} onChange={(event) => setCost(event.target.value as CertificationCostBand | 'all')}>
            <option value="all">Todos</option><option value="low">Baixo</option><option value="medium">Médio</option><option value="high">Alto</option><option value="premium">Premium</option>
          </select>
        </label>
        <label>Reconhecimento
          <select value={recognition} onChange={(event) => setRecognition(event.target.value as CertificationRecognition | 'all')}>
            <option value="all">Todos</option><option value="foundational">Fundamental</option><option value="professional">Profissional</option><option value="advanced">Avançado</option><option value="specialist">Especialista</option>
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Tabela comparativa de certificações</caption>
          <thead><tr><th>Certificação</th><th>Custo</th><th>Tempo</th><th>Reconhecimento</th><th>Pré-requisito</th></tr></thead>
          <tbody>{visible.map((certification) => (
            <tr key={certification.id}>
              <th scope="row"><Link href={`/certifications/${certification.slug}`}>{label(certification.name)}</Link><span>{certification.provider}</span></th>
              <td>{getCostBandLabel(certification.costBand)}</td>
              <td>{certification.estimatedStudyHours ? `${certification.estimatedStudyHours} h` : 'A definir'}</td>
              <td>{getRecognitionLabel(certification.recognition)}</td>
              <td>{certification.prerequisites.length ? certification.prerequisites.map((item) => item.targetId.replace('level-', 'Nível ')).join(', ') : 'Nenhum'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
