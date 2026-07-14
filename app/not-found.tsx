import Link from 'next/link';

export default function NotFound() {
  return <section className="page-shell"><div className="empty-state panel"><p className="eyebrow">PÁGINA NÃO ENCONTRADA</p><h1>Esse conteúdo não está nesta trilha.</h1><p>Volte ao currículo para escolher um nível, recurso ou especialização disponível.</p><Link className="button button-primary" href="/curriculum">Ir para o currículo</Link></div></section>;
}
