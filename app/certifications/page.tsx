import type { Metadata } from 'next';
import { CertificationComparator } from '../components/certification-comparator';
import { StructuredData } from '../components/structured-data';
import { catalog } from '@/src/lib/curriculum/catalog';

export const revalidate = 86_400;
export const metadata: Metadata = { title: 'Certificações', description: 'Compare certificações de cibersegurança por custo, tempo, reconhecimento e pré-requisitos.', alternates: { canonical: '/certifications' } };

export default function CertificationsPage() {
  return <div className="page-shell"><StructuredData data={{ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Certificações de cibersegurança', itemListElement: catalog.certifications.map((item, position) => ({ '@type': 'ListItem', position: position + 1, name: item.name.fallback })) }} /><section className="page-intro"><p className="eyebrow">DECISÃO INFORMADA</p><h1>Compare certificações sem perder o contexto.</h1><p>Os custos são classificados em faixas, pois podem mudar com moeda, região e promoções. Confira sempre a página oficial antes da compra.</p></section><CertificationComparator certifications={catalog.certifications} /></div>;
}
