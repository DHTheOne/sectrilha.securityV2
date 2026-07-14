'use client';

import { Download, Eraser, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useCurriculumProgress } from './progress-provider';

export function PrivacyControls() {
  const { clearProgress, exportProgress, isReady, profileId } = useCurriculumProgress();
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function downloadExport() {
    setIsWorking(true);
    setMessage(null);
    try {
      const data = await exportProgress();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `sectrilha-progresso-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage('Seu arquivo de progresso foi preparado.');
    } catch {
      setMessage('Não foi possível preparar a exportação. Tente novamente.');
    } finally {
      setIsWorking(false);
    }
  }

  async function eraseProgress() {
    if (!window.confirm('Excluir os checkpoints do currículo neste dispositivo? Esta ação não pode ser desfeita.')) return;
    setIsWorking(true);
    setMessage(null);
    try {
      await clearProgress();
      setMessage('O progresso curricular foi excluído.');
    } catch {
      setMessage('Não foi possível excluir o progresso completamente. Tente novamente.');
    } finally {
      setIsWorking(false);
    }
  }

  return <section className="privacy-controls panel" aria-labelledby="privacy-controls-heading">
    <h2 id="privacy-controls-heading">Seus dados de aprendizagem</h2>
    <p>Perfil local: <code>{profileId}</code>. A exportação contém somente os checkpoints guardados neste navegador.</p>
    <div className="button-row">
      <button className="button button-secondary" type="button" disabled={!isReady || isWorking} onClick={() => void downloadExport()}>
        {isWorking ? <LoaderCircle aria-hidden="true" className="spin" size={17} /> : <Download aria-hidden="true" size={17} />} Exportar progresso
      </button>
      <button className="button button-danger" type="button" disabled={!isReady || isWorking} onClick={() => void eraseProgress()}>
        <Eraser aria-hidden="true" size={17} /> Excluir progresso curricular
      </button>
    </div>
    {message && <p className="privacy-message" role="status">{message}</p>}
  </section>;
}
