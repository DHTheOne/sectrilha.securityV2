import type { Metadata } from 'next';
import { PrivacyControls } from '../components/privacy-controls';
import { ProgressProvider } from '../components/progress-provider';

export const metadata: Metadata = { title: 'Privacidade e dados', description: 'Como a SecTrilha trata o progresso de aprendizagem local e os controles disponíveis.' };

export default function PrivacyPage() {
  return <ProgressProvider><div className="page-shell"><section className="page-intro"><p className="eyebrow">PRIVACIDADE DESDE O INÍCIO</p><h1>Você controla seu progresso de aprendizagem.</h1><p>A SecTrilha funciona sem cadastro. Seus checkpoints ficam no navegador deste dispositivo, para que você possa estudar offline sem enviar o progresso a terceiros.</p></section><div className="privacy-copy"><section><h2>Dados usados no MVP</h2><p>O navegador guarda um identificador técnico local, checkpoints concluídos e datas de atualização. O site não inclui analytics, pixels de publicidade, chat automático, IA ou autenticação de terceiros.</p></section><section><h2>Links externos</h2><p>Os recursos de estudo só são abertos quando você escolhe acessá-los. Cada plataforma externa possui sua própria política de privacidade; a SecTrilha não transmite seu progresso a elas.</p></section><section><h2>Seus direitos</h2><p>Use os controles abaixo para exportar ou excluir todos os checkpoints locais. Para uma futura versão com contas, a organização responsável deverá publicar política, base legal e canal de atendimento conforme LGPD/GDPR.</p></section></div><PrivacyControls /></div></ProgressProvider>;
}
