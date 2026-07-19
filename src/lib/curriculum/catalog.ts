import type {
  CertificationCostBand,
  CertificationRecognition,
  CurriculumCatalog,
  CurriculumCertification,
  CurriculumCheckpoint,
  CurriculumLevel,
  CurriculumModule,
  CurriculumResource,
  CurriculumSpecialization,
  I18nText,
  LevelId,
  ResourceAccess,
  ResourceCollection,
  ResourceType,
  SpecializationId,
  TranslationKey,
} from './types';

const text = (key: TranslationKey, fallback: string): I18nText => ({ key, fallback });
const requiredLevel = (targetId: LevelId) => ({ targetType: 'level' as const, targetId, isRequired: true });
const optionalLevel = (targetId: LevelId) => ({ targetType: 'level' as const, targetId, isRequired: false });

type ResourceInput = Omit<CurriculumResource, 'title' | 'description' | 'collection'> & {
  title: string;
  description: string;
  collection?: ResourceCollection;
};
type CertificationInput = Omit<CurriculumCertification, 'name' | 'description'> & { name: string; description: string };

function resource(input: ResourceInput): CurriculumResource {
  return {
    ...input,
    collection: input.collection ?? 'curated',
    title: text(`curriculum.resource.${input.slug}.title`, input.title),
    description: text(`curriculum.resource.${input.slug}.description`, input.description),
  };
}

function certification(input: CertificationInput): CurriculumCertification {
  return {
    ...input,
    name: text(`curriculum.certification.${input.slug}.name`, input.name),
    description: text(`curriculum.certification.${input.slug}.description`, input.description),
  };
}

const resources: CurriculumResource[] = [
  resource({
    id: 'linux-journey', slug: 'linux-journey', title: 'Linux Journey',
    description: 'Trilha gratuita e progressiva de comandos, permissões e administração Linux.', provider: 'Linux Journey', url: 'https://labex.io/linuxjourney',
    type: 'course' satisfies ResourceType, access: 'free' satisfies ResourceAccess, languages: ['en-US'], estimatedHours: 20, levelIds: ['level-0'], specializationIds: [], tags: ['linux', 'terminal', 'fundamentos'],
  }),
  resource({
    id: 'google-networking', slug: 'google-computer-networking', title: 'Computer Networking',
    description: 'Curso introdutório de redes, protocolos e resolução de problemas.', provider: 'Google / Coursera', url: 'https://www.coursera.org/learn/computer-networking',
    type: 'course', access: 'freemium', languages: ['en-US'], estimatedHours: 30, levelIds: ['level-0'], specializationIds: [], tags: ['redes', 'tcp-ip', 'dns'],
  }),
  resource({
    id: 'tryhackme-presecurity', slug: 'tryhackme-pre-security', title: 'TryHackMe Pre Security',
    description: 'Laboratórios guiados para aprender redes, Linux e fundamentos de segurança.', provider: 'TryHackMe', url: 'https://tryhackme.com/path/outline/presecurity',
    type: 'lab', access: 'freemium', languages: ['en-US'], estimatedHours: 40, levelIds: ['level-0', 'level-1'], specializationIds: [], tags: ['hands-on', 'linux', 'networking'],
  }),
  resource({
    id: 'security-plus', slug: 'comptia-security-plus', title: 'CompTIA Security+',
    description: 'Objetivos oficiais para fundamentos, riscos, criptografia e operações de segurança.', provider: 'CompTIA', url: 'https://www.comptia.org/en-us/certifications/security/',
    type: 'guide', access: 'paid', languages: ['en-US'], estimatedHours: 70, levelIds: ['level-1'], specializationIds: [], tags: ['security-plus', 'frameworks', 'fundamentos'],
  }),
  resource({
    id: 'professor-messer', slug: 'professor-messer-security-plus', title: 'Professor Messer Security+',
    description: 'Aulas em vídeo gratuitas alinhadas aos principais domínios de Security+.', provider: 'Professor Messer', url: 'https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/',
    type: 'video', access: 'free', languages: ['en-US'], estimatedHours: 25, levelIds: ['level-1'], specializationIds: [], tags: ['security-plus', 'video', 'certificação'],
  }),
  resource({
    id: 'mitre-attack', slug: 'mitre-attack-navigator', title: 'MITRE ATT&CK Navigator',
    description: 'Base de conhecimento e visualização de técnicas adversárias para estudo e defesa.', provider: 'MITRE', url: 'https://attack.mitre.org/',
    type: 'framework', access: 'free', languages: ['en-US'], levelIds: ['level-1', 'level-2', 'level-3'], specializationIds: ['red-team', 'blue-team', 'threat-hunting', 'detection-engineering'], tags: ['attack', 'threat-modeling', 'detection'],
  }),
  resource({
    id: 'portswigger', slug: 'portswigger-academy', title: 'PortSwigger Web Security Academy',
    description: 'Laboratórios gratuitos de segurança web, APIs e vulnerabilidades OWASP.', provider: 'PortSwigger', url: 'https://portswigger.net/web-security',
    type: 'lab', access: 'free', languages: ['en-US'], estimatedHours: 60, levelIds: ['level-2'], specializationIds: ['red-team', 'appsec-devsecops'], tags: ['web', 'owasp', 'burp-suite', 'labs'],
  }),
  resource({
    id: 'ejpt', slug: 'ejpt-training', title: 'eJPTv2 training',
    description: 'Treinamento prático de testes de intrusão para iniciantes.', provider: 'INE Security', url: 'https://ine.com/security/certifications/ejpt-certification',
    type: 'course', access: 'paid', languages: ['en-US'], estimatedHours: 50, levelIds: ['level-2'], specializationIds: ['red-team'], tags: ['pentest', 'enumeration', 'entry-level'],
  }),
  resource({
    id: 'htb-starting-point', slug: 'hack-the-box-starting-point', title: 'Hack The Box Starting Point',
    description: 'Máquinas guiadas para introdução a enumeração, exploração e documentação.', provider: 'Hack The Box', url: 'https://app.hackthebox.com/starting-point',
    type: 'lab', access: 'freemium', languages: ['en-US'], estimatedHours: 20, levelIds: ['level-1', 'level-2'], specializationIds: ['red-team'], tags: ['pentest', 'lab', 'hands-on'],
  }),
  resource({
    id: 'pnpt', slug: 'pnpt-training', title: 'Practical Network Penetration Tester',
    description: 'Treinamento voltado a pentest de rede e relatório profissional.', provider: 'TCM Security', url: 'https://certifications.tcm-sec.com/pnpt/',
    type: 'course', access: 'paid', languages: ['en-US'], estimatedHours: 40, levelIds: ['level-2'], specializationIds: ['red-team'], tags: ['pentest', 'active-directory', 'reporting'],
  }),
  resource({
    id: 'blue-team-level-1', slug: 'blue-team-level-1', title: 'Blue Team Level 1',
    description: 'Treinamento prático de investigação, logs e resposta a incidentes.', provider: 'Centri', url: 'https://www.centri.org/certifications/blue-team-level-1',
    type: 'course', access: 'paid', languages: ['en-US'], estimatedHours: 60, levelIds: ['level-3'], specializationIds: ['blue-team', 'dfir'], tags: ['soc', 'dfir', 'incident-response'],
  }),
  resource({
    id: 'lets-defend', slug: 'lets-defend', title: "Let's Defend", description: 'Simulador de SOC para triagem e investigação de alertas.', provider: "Let's Defend", url: 'https://app.letsdefend.io/path/soc-analyst-learning-path',
    type: 'lab', access: 'freemium', languages: ['en-US'], estimatedHours: 40, levelIds: ['level-3'], specializationIds: ['blue-team', 'detection-engineering'], tags: ['soc', 'alerts', 'triage'],
  }),
  resource({
    id: 'sigma', slug: 'sigma-rules', title: 'Sigma Rules', description: 'Especificação aberta para regras portáveis de detecção.', provider: 'SigmaHQ', url: 'https://sigmahq.io/',
    type: 'framework', access: 'free', languages: ['en-US'], levelIds: ['level-3'], specializationIds: ['blue-team', 'threat-hunting', 'detection-engineering'], tags: ['sigma', 'detections', 'siem'],
  }),
  resource({
    id: 'flare-vm', slug: 'flare-vm', title: 'FLARE-VM', description: 'Ambiente Windows voltado à análise de malware e engenharia reversa.', provider: 'Mandiant', url: 'https://github.com/mandiant/flare-vm',
    type: 'tool', access: 'free', languages: ['en-US'], levelIds: ['level-4'], specializationIds: ['malware-reverse-engineering'], tags: ['malware', 'reverse-engineering', 'windows'],
  }),
  resource({
    id: 're4b', slug: 'reverse-engineering-for-beginners', title: 'Reverse Engineering for Beginners', description: 'Livro gratuito para começar engenharia reversa de software.', provider: 'Dennis Yurichev', url: 'https://beginners.re/',
    type: 'book', access: 'free', languages: ['en-US'], estimatedHours: 45, levelIds: ['level-4'], specializationIds: ['malware-reverse-engineering'], tags: ['reverse-engineering', 'assembly', 'malware'],
  }),
  resource({
    id: 'cloudgoat', slug: 'cloudgoat', title: 'CloudGoat', description: 'Cenários vulneráveis para aprender segurança em AWS de forma controlada.', provider: 'Rhino Security Labs', url: 'https://github.com/RhinoSecurityLabs/cloudgoat',
    type: 'lab', access: 'free', languages: ['en-US'], estimatedHours: 24, levelIds: ['level-4'], specializationIds: ['cloud-security'], tags: ['aws', 'iam', 'cloud'],
  }),
  resource({
    id: 'kubernetes-security', slug: 'kubernetes-security-liz-rice', title: 'Kubernetes Security', description: 'Livro prático sobre ameaças, hardening e execução segura em Kubernetes.', provider: "O'Reilly", url: 'https://www.oreilly.com/library/view/kubernetes-security/9781492039075/',
    type: 'book', access: 'paid', languages: ['en-US'], estimatedHours: 25, levelIds: ['level-4'], specializationIds: ['cloud-security'], tags: ['kubernetes', 'containers', 'cloud'],
  }),
  resource({
    id: 'owasp-code-review', slug: 'owasp-code-review-guide', title: 'OWASP Code Review Guide', description: 'Guia aberto para revisão de código segura e identificação de riscos.', provider: 'OWASP', url: 'https://owasp.org/www-project-code-review-guide/',
    type: 'guide', access: 'free', languages: ['en-US'], levelIds: ['level-4'], specializationIds: ['appsec-devsecops'], tags: ['appsec', 'code-review', 'secure-coding'],
  }),
  resource({
    id: 'slsa', slug: 'slsa-framework', title: 'SLSA Framework', description: 'Framework de integridade de supply chain para software.', provider: 'SLSA', url: 'https://slsa.dev/',
    type: 'framework', access: 'free', languages: ['en-US'], levelIds: ['level-4'], specializationIds: ['appsec-devsecops', 'cloud-security'], tags: ['supply-chain', 'devsecops', 'sbom'],
  }),
  resource({
    id: 'practical-hardware', slug: 'practical-hardware-pentesting', title: 'Practical Hardware Pentesting', description: 'Referência para avaliação responsável de dispositivos e interfaces embarcadas.', provider: 'Packt', url: 'https://www.packtpub.com/en-us/product/practical-hardware-pentesting-9781801071294',
    type: 'book', access: 'paid', languages: ['en-US'], estimatedHours: 30, levelIds: ['level-4'], specializationIds: ['hardware-iot'], tags: ['iot', 'hardware', 'embedded'],
  }),
  resource({
    id: 'ctftime', slug: 'ctftime', title: 'CTFtime', description: 'Calendário e ranking comunitário de competições Capture The Flag.', provider: 'CTFtime', url: 'https://ctftime.org/',
    type: 'ctf', access: 'free', languages: ['en-US'], levelIds: ['level-2', 'level-5'], specializationIds: ['red-team', 'blue-team', 'malware-reverse-engineering'], tags: ['ctf', 'community', 'practice'],
  }),
  resource({
    id: 'attekita-internet', slug: 'attekita-como-a-internet-funciona', title: 'Como a Internet funciona?',
    description: 'Vídeo em português que apresenta os conceitos básicos de funcionamento da internet.', provider: 'Attekita Dev', url: 'https://www.youtube.com/watch?v=wkZcszMyUbQ',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 1, levelIds: ['level-0'], specializationIds: [], tags: ['internet', 'redes', 'fundamentos'],
  }),
  resource({
    id: 'fabio-akita-redes', slug: 'fabio-akita-introducao-redes', title: 'Introdução a Redes: como dados viram ondas?',
    description: 'Vídeo em português sobre comunicação de dados, redes e os fundamentos por trás da internet.', provider: 'Fábio Akita', url: 'https://www.youtube.com/watch?v=0TndL-Nh6Ok',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 1, levelIds: ['level-0'], specializationIds: [], tags: ['redes', 'protocolos', 'internet'],
  }),
  resource({
    id: 'mdn-como-funciona-internet', slug: 'mdn-como-funciona-a-internet', title: 'Como funciona a Internet',
    description: 'Guia da MDN em português sobre infraestrutura, protocolos e o caminho dos dados na internet.', provider: 'MDN Web Docs', url: 'https://developer.mozilla.org/pt-BR/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work',
    type: 'guide', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 2, levelIds: ['level-0'], specializationIds: [], tags: ['internet', 'redes', 'http'],
  }),
  resource({
    id: 'netacad-introduction-cybersecurity', slug: 'netacad-introducao-ciberseguranca', title: 'Introduction to Cybersecurity',
    description: 'Curso introdutório oficial da Cisco Networking Academy, disponível em português.', provider: 'Cisco Networking Academy', url: 'https://www.netacad.com/pt/courses/introduction-to-cybersecurity?courseLang=pt-BR',
    type: 'course', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 15, levelIds: ['level-0', 'level-1'], specializationIds: [], tags: ['fundamentos', 'segurança', 'redes'],
  }),
  resource({
    id: 'curso-em-video-redes', slug: 'curso-em-video-redes-computadores', title: 'Curso de Redes de Computadores',
    description: 'Playlist gratuita em português com fundamentos de redes de computadores.', provider: 'Curso em Vídeo', url: 'https://www.youtube.com/playlist?list=PLHz_AreHm4dkd4lr9G0Up-W-YaHYdTDuP',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 20, levelIds: ['level-0'], specializationIds: [], tags: ['redes', 'tcp-ip', 'fundamentos'],
  }),
  resource({
    id: 'diolinux-comandos', slug: 'diolinux-30-comandos-terminal-linux', title: '30 comandos do terminal Linux',
    description: 'Vídeo em português para praticar comandos essenciais no terminal Linux.', provider: 'Diolinux', url: 'https://www.youtube.com/watch?v=JEhVB4VHsTI',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 1, levelIds: ['level-0'], specializationIds: [], tags: ['linux', 'terminal', 'comandos'],
  }),
  resource({
    id: 'boson-linux-essentials', slug: 'boson-linux-essentials', title: 'Curso de Linux Básico (LPIC-1)',
    description: 'Playlist em português com fundamentos de Linux e linha de comando, alinhada à certificação LPIC-1.', provider: 'Bóson Treinamentos', url: 'https://www.youtube.com/playlist?list=PLucm8g_ezqNp92MmkF9p_cj4yhT-fCTl7',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 20, levelIds: ['level-0'], specializationIds: [], tags: ['linux', 'terminal', 'sistemas-operacionais'],
  }),
  resource({
    id: 'boson-shell-scripting', slug: 'boson-shell-scripting', title: 'Curso de Shell Script com Bash',
    description: 'Playlist em português para automatizar tarefas do laboratório com Shell Script e Bash.', provider: 'Cavalcante Treinamentos', url: 'https://www.youtube.com/playlist?list=PLQ7gVTPc8Kmir1ndvWklQvkTcf1hPoHCl',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 12, levelIds: ['level-0'], specializationIds: [], tags: ['linux', 'shell', 'automação'],
  }),
  resource({
    id: 'codigo-fonte-python', slug: 'codigo-fonte-tv-python', title: 'Python: por onde começar',
    description: 'Vídeo em português com uma introdução prática à linguagem Python.', provider: 'Código Fonte TV', url: 'https://www.youtube.com/watch?v=uOgDa1rlqjE',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 1, levelIds: ['level-0'], specializationIds: [], tags: ['python', 'programação', 'automação'],
  }),
  resource({
    id: 'ignorancia-zero-python', slug: 'ignorancia-zero-aulas-python', title: 'Aulas de Python',
    description: 'Playlist em português para praticar lógica e programação em Python.', provider: 'Ignorância Zero', url: 'https://www.youtube.com/playlist?list=PLfCKf0-awunOu2WyLe2pSD2fXUo795xRe',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 24, levelIds: ['level-0'], specializationIds: [], tags: ['python', 'programação', 'automação'],
  }),
  resource({
    id: 'python-docs-pt', slug: 'tutorial-python-pt-br', title: 'Tutorial Python',
    description: 'Tutorial oficial da linguagem Python em português do Brasil.', provider: 'Python Software Foundation', url: 'https://docs.python.org/pt-br/3/tutorial/index.html',
    type: 'guide', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 24, levelIds: ['level-0'], specializationIds: [], tags: ['python', 'documentação', 'automação'],
  }),
  resource({
    id: 'solyd-pentest-playlist', slug: 'solyd-pentest-2-0', title: 'Pentest 2.0',
    description: 'Playlist em português com fundamentos práticos de pentest em ambientes autorizados.', provider: 'Solyd', url: 'https://www.youtube.com/playlist?list=PLp95aw034Wn8Wi0NViVF58hOpX-m00jyg',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 30, levelIds: ['level-2'], specializationIds: ['red-team'], tags: ['pentest', 'laboratório', 'enumeração'],
  }),
  resource({
    id: 'codigo-fonte-criptografia', slug: 'codigo-fonte-tv-criptografia', title: 'Criptografia: como funciona?',
    description: 'Vídeo em português para entender conceitos fundamentais de criptografia.', provider: 'Código Fonte TV', url: 'https://www.youtube.com/watch?v=qHFbuXpz7e4',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 1, levelIds: ['level-1'], specializationIds: [], tags: ['criptografia', 'hash', 'fundamentos'],
  }),
  resource({
    id: 'fabio-akita-criptografia', slug: 'fabio-akita-criptografia', title: 'Criptografia e segurança',
    description: 'Vídeo em português sobre conceitos de criptografia e segurança digital.', provider: 'Fábio Akita', url: 'https://www.youtube.com/watch?v=CcU5Kc_FN_4',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 1, levelIds: ['level-1'], specializationIds: [], tags: ['criptografia', 'segurança', 'fundamentos'],
  }),
  resource({
    id: 'boson-criptografia', slug: 'boson-criptografia-seguranca', title: 'Segurança e Criptografia',
    description: 'Playlist em português sobre segurança e criptografia, com fundamentos técnicos explicados a fundo.', provider: 'Fábio Akita', url: 'https://www.youtube.com/playlist?list=PLdsnXVqbHDUesbvzAORxf6iKrYaHqu8S0',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 8, levelIds: ['level-1'], specializationIds: [], tags: ['criptografia', 'segurança', 'fundamentos'],
  }),
  resource({
    id: 'codigo-fonte-owasp', slug: 'codigo-fonte-tv-owasp-top-10', title: 'OWASP Top 10',
    description: 'Vídeo em português que introduz os principais riscos de segurança em aplicações web.', provider: 'Código Fonte TV', url: 'https://www.youtube.com/watch?v=OzBy8nYLY-I',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 1, levelIds: ['level-2'], specializationIds: ['red-team', 'appsec-devsecops'], tags: ['owasp', 'web', 'appsec'],
  }),
  resource({
    id: 'messias-eric-pentest', slug: 'messias-eric-introducao-pentest', title: 'Introdução a Pentest',
    description: 'Vídeo em português sobre os primeiros conceitos de testes de intrusão éticos.', provider: 'Messias Eric', url: 'https://www.youtube.com/watch?v=oPGMahvwaKE',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 1, levelIds: ['level-2'], specializationIds: ['red-team'], tags: ['pentest', 'ética', 'fundamentos'],
  }),
  resource({
    id: 'boson-nmap', slug: 'boson-nmap', title: 'Nmap: introdução',
    description: 'Vídeo em português sobre uso responsável do Nmap em laboratórios autorizados.', provider: 'Bóson Treinamentos', url: 'https://www.youtube.com/watch?v=cEAPTtn8TyU',
    type: 'video', access: 'free', collection: 'legacy', languages: ['pt-BR'], estimatedHours: 1, levelIds: ['level-2'], specializationIds: ['red-team'], tags: ['nmap', 'enumeração', 'pentest'],
  }),
  resource({
    id: 'evg-cis-controls', slug: 'evg-cis-controls', title: 'Controles CIS',
    description: 'Curso gratuito da Escola Virtual de Governo sobre os controles CIS e sua aplicação.', provider: 'Escola Virtual de Governo', url: 'https://www.escolavirtual.gov.br/curso/1153',
    type: 'course', access: 'free', languages: ['pt-BR'], estimatedHours: 20, levelIds: ['level-1'], specializationIds: ['blue-team', 'detection-engineering'], tags: ['cis-controls', 'governança', 'defesa'],
  }),
  resource({
    id: 'evg-seguranca-informacao', slug: 'evg-seguranca-da-informacao-para-todos', title: 'Segurança da Informação para Todos',
    description: 'Curso aberto e gratuito da Escola Virtual de Governo sobre segurança da informação.', provider: 'Escola Virtual de Governo', url: 'https://www.escolavirtual.gov.br/curso/1256',
    type: 'course', access: 'free', languages: ['pt-BR'], estimatedHours: 24, levelIds: ['level-1'], specializationIds: [], tags: ['segurança', 'privacidade', 'fundamentos'],
  }),
  resource({
    id: 'microsoft-learn-cybersecurity-basics', slug: 'microsoft-learn-conceitos-basicos-ciberseguranca', title: 'Descrever conceitos básicos de cibersegurança',
    description: 'Trilha oficial gratuita da Microsoft Learn em português sobre conceitos básicos de cibersegurança.', provider: 'Microsoft Learn', url: 'https://learn.microsoft.com/pt-br/training/paths/describe-basic-concepts-of-cybersecurity/',
    type: 'course', access: 'free', languages: ['pt-BR'], estimatedHours: 8, levelIds: ['level-1'], specializationIds: [], tags: ['cibersegurança', 'fundamentos', 'microsoft'],
  }),
  resource({
    id: 'certbr-cartilha', slug: 'certbr-cartilha-seguranca-internet', title: 'Cartilha de Segurança para Internet',
    description: 'Cartilha gratuita e oficial do CERT.br com orientações práticas de segurança e privacidade.', provider: 'CERT.br', url: 'https://cartilha.cert.br/',
    type: 'guide', access: 'free', languages: ['pt-BR'], estimatedHours: 8, levelIds: ['level-0', 'level-1'], specializationIds: [], tags: ['privacidade', 'segurança', 'boas-práticas'],
  }),
  resource({
    id: 'owasp-top-10-pt-br', slug: 'owasp-top-10-2021-pt-br', title: 'OWASP Top 10 2021',
    description: 'Versão em português do guia oficial OWASP sobre os riscos mais críticos para aplicações web.', provider: 'OWASP', url: 'https://owasp.org/Top10/2021/pt-BR/',
    type: 'guide', access: 'free', languages: ['pt-BR'], estimatedHours: 6, levelIds: ['level-2'], specializationIds: ['red-team', 'appsec-devsecops'], tags: ['owasp', 'web', 'appsec'],
  }),
];

const modules: CurriculumModule[] = [
  {
    id: 'foundations-networking', slug: 'foundations-networking', levelId: 'level-0', specializationIds: [],
    title: text('curriculum.module.foundations-networking.title', 'Redes e internet'),
    summary: text('curriculum.module.foundations-networking.summary', 'DNS, HTTP(S), TCP/IP, TLS, subnetting e roteamento.'),
    learningObjectives: [text('curriculum.objective.networking.protocols', 'Explicar como dados trafegam pela internet.'), text('curriculum.objective.networking.subnetting', 'Planejar sub-redes IPv4 e IPv6.')],
    skillIds: ['networking', 'protocols'], estimatedHours: 28, prerequisites: [], resourceIds: ['linux-journey', 'google-networking', 'tryhackme-presecurity', 'attekita-internet', 'fabio-akita-redes', 'mdn-como-funciona-internet', 'netacad-introduction-cybersecurity', 'curso-em-video-redes', 'certbr-cartilha'], checkpointIds: ['level-0-subnetting'],
  },
  {
    id: 'operating-systems-scripting', slug: 'operating-systems-scripting', levelId: 'level-0', specializationIds: [],
    title: text('curriculum.module.operating-systems-scripting.title', 'Sistemas operacionais e automação'),
    summary: text('curriculum.module.operating-systems-scripting.summary', 'Linux, virtualização, containers e scripts Bash, PowerShell e Python.'),
    learningObjectives: [text('curriculum.objective.os.vm', 'Montar um laboratório Linux isolado.'), text('curriculum.objective.os.automation', 'Automatizar tarefas de forma segura.')],
    skillIds: ['linux', 'scripting'], estimatedHours: 36, prerequisites: [], resourceIds: ['linux-journey', 'tryhackme-presecurity', 'diolinux-comandos', 'boson-linux-essentials', 'boson-shell-scripting', 'codigo-fonte-python', 'ignorancia-zero-python', 'python-docs-pt'], checkpointIds: ['level-0-linux-vm', 'level-0-automation', 'level-0-tls'],
  },
  {
    id: 'security-principles', slug: 'security-principles', levelId: 'level-1', specializationIds: [],
    title: text('curriculum.module.security-principles.title', 'Princípios de cibersegurança'),
    summary: text('curriculum.module.security-principles.summary', 'CIA, AAA, criptografia, PKI, risco e frameworks de segurança.'),
    learningObjectives: [text('curriculum.objective.security.cia', 'Aplicar CIA e defesa em profundidade.'), text('curriculum.objective.security.crypto', 'Diferenciar criptografia, hashes e certificados.')],
    skillIds: ['security-fundamentals', 'cryptography'], estimatedHours: 44, prerequisites: [requiredLevel('level-0')], resourceIds: ['security-plus', 'professor-messer', 'mitre-attack', 'netacad-introduction-cybersecurity', 'codigo-fonte-criptografia', 'fabio-akita-criptografia', 'boson-criptografia', 'evg-seguranca-informacao', 'microsoft-learn-cybersecurity-basics', 'certbr-cartilha'], checkpointIds: ['level-1-attack-map', 'level-1-security-cert'],
  },
  {
    id: 'home-security-lab', slug: 'home-security-lab', levelId: 'level-1', specializationIds: [],
    title: text('curriculum.module.home-security-lab.title', 'Laboratório de defesa'),
    summary: text('curriculum.module.home-security-lab.summary', 'Firewall, logs, SIEM e IDS em um ambiente próprio.'),
    learningObjectives: [text('curriculum.objective.lab.logging', 'Centralizar eventos básicos.'), text('curriculum.objective.lab.ethics', 'Operar somente em ambientes autorizados.')],
    skillIds: ['logging', 'security-fundamentals'], estimatedHours: 32, prerequisites: [requiredLevel('level-0')], resourceIds: ['tryhackme-presecurity', 'htb-starting-point', 'evg-cis-controls', 'certbr-cartilha'], checkpointIds: ['level-1-tryhackme', 'level-1-home-lab'],
  },
  {
    id: 'offensive-pentest', slug: 'offensive-pentest', levelId: 'level-2', specializationIds: ['red-team'],
    title: text('curriculum.module.offensive-pentest.title', 'Pentest e enumeração'),
    summary: text('curriculum.module.offensive-pentest.summary', 'Reconhecimento autorizado, enumeração, exploração controlada e relatórios.'),
    learningObjectives: [text('curriculum.objective.red.enum', 'Executar enumeração metódica em labs.'), text('curriculum.objective.red.reporting', 'Comunicar riscos com clareza.')],
    skillIds: ['pentesting', 'reporting'], estimatedHours: 48, prerequisites: [requiredLevel('level-1')], resourceIds: ['ejpt', 'htb-starting-point', 'pnpt', 'solyd-pentest-playlist', 'messias-eric-pentest', 'boson-nmap'], checkpointIds: ['level-2-ejpt', 'level-2-htb', 'level-2-report'],
  },
  {
    id: 'web-application-security', slug: 'web-application-security', levelId: 'level-2', specializationIds: ['red-team', 'appsec-devsecops'],
    title: text('curriculum.module.web-application-security.title', 'Segurança de aplicações web'),
    summary: text('curriculum.module.web-application-security.summary', 'OWASP Top 10, APIs, autenticação e testes em laboratórios.'),
    learningObjectives: [text('curriculum.objective.web.owasp', 'Reconhecer riscos do OWASP Top 10.'), text('curriculum.objective.web.testing', 'Testar aplicações vulneráveis de forma autorizada.')],
    skillIds: ['web-security', 'appsec'], estimatedHours: 60, prerequisites: [requiredLevel('level-1')], resourceIds: ['portswigger', 'mitre-attack', 'codigo-fonte-owasp', 'owasp-top-10-pt-br'], checkpointIds: ['level-2-portswigger'],
  },
  {
    id: 'active-directory-security', slug: 'active-directory-security', levelId: 'level-2', specializationIds: ['red-team', 'blue-team'],
    title: text('curriculum.module.active-directory-security.title', 'Segurança de Active Directory'),
    summary: text('curriculum.module.active-directory-security.summary', 'Identidade, delegações, ataques em labs e técnicas de hardening.'),
    learningObjectives: [text('curriculum.objective.ad.identity', 'Avaliar relações de confiança em um lab.'), text('curriculum.objective.ad.hardening', 'Recomendar controles de identidade.')],
    skillIds: ['active-directory', 'identity'], estimatedHours: 45, prerequisites: [requiredLevel('level-1')], resourceIds: ['pnpt', 'htb-starting-point'], checkpointIds: ['level-2-ad-lab'],
  },
  {
    id: 'soc-detection', slug: 'soc-detection', levelId: 'level-3', specializationIds: ['blue-team', 'detection-engineering'],
    title: text('curriculum.module.soc-detection.title', 'SOC e engenharia de detecção'),
    summary: text('curriculum.module.soc-detection.summary', 'Logs, triagem, Sigma, SIEM e cobertura ATT&CK.'),
    learningObjectives: [text('curriculum.objective.soc.triage', 'Investigar alertas e documentar decisões.'), text('curriculum.objective.soc.sigma', 'Criar regras de detecção testáveis.')],
    skillIds: ['soc', 'detection-engineering', 'logging'], estimatedHours: 70, prerequisites: [requiredLevel('level-1')], resourceIds: ['blue-team-level-1', 'lets-defend', 'sigma', 'mitre-attack', 'evg-cis-controls'], checkpointIds: ['level-3-btl1', 'level-3-lets-defend', 'level-3-sigma'],
  },
  {
    id: 'dfir-hunting', slug: 'dfir-hunting', levelId: 'level-3', specializationIds: ['blue-team', 'dfir', 'threat-hunting'],
    title: text('curriculum.module.dfir-hunting.title', 'DFIR e threat hunting'),
    summary: text('curriculum.module.dfir-hunting.summary', 'Forense, hipóteses, timelines, evidências e resposta a incidentes.'),
    learningObjectives: [text('curriculum.objective.dfir.evidence', 'Preservar evidências e montar uma timeline.'), text('curriculum.objective.hunting.hypothesis', 'Conduzir hunting orientado por hipótese.')],
    skillIds: ['dfir', 'threat-hunting'], estimatedHours: 68, prerequisites: [requiredLevel('level-1')], resourceIds: ['lets-defend', 'mitre-attack'], checkpointIds: ['level-3-forensics', 'level-3-hunting-notebook'],
  },
  {
    id: 'advanced-red-team', slug: 'advanced-red-team', levelId: 'level-4', specializationIds: ['red-team'],
    title: text('curriculum.module.advanced-red-team.title', 'Red Team avançado'),
    summary: text('curriculum.module.advanced-red-team.summary', 'Operações autorizadas, C2 em labs, evasão defensivamente orientada e mitigação.'),
    learningObjectives: [text('curriculum.objective.red.advanced', 'Avaliar a resiliência de controles em laboratório.'), text('curriculum.objective.red.remediation', 'Traduzir resultados em recomendações de defesa.')],
    skillIds: ['pentesting', 'active-directory'], estimatedHours: 90, prerequisites: [requiredLevel('level-2')], resourceIds: ['pnpt', 'mitre-attack'], checkpointIds: ['level-4-red-capstone'],
  },
  {
    id: 'cloud-appsec', slug: 'cloud-appsec', levelId: 'level-4', specializationIds: ['cloud-security', 'appsec-devsecops'],
    title: text('curriculum.module.cloud-appsec.title', 'Cloud, containers e AppSec'),
    summary: text('curriculum.module.cloud-appsec.summary', 'IAM, Kubernetes, CI/CD, SAST, SBOM e supply chain.'),
    learningObjectives: [text('curriculum.objective.cloud.iam', 'Revisar permissões e configurações de nuvem.'), text('curriculum.objective.appsec.pipeline', 'Adicionar controles a uma pipeline segura.')],
    skillIds: ['cloud-security', 'appsec', 'supply-chain'], estimatedHours: 80, prerequisites: [requiredLevel('level-2')], resourceIds: ['cloudgoat', 'kubernetes-security', 'owasp-code-review', 'slsa'], checkpointIds: ['level-4-cloud-lab', 'level-4-devsecops'],
  },
  {
    id: 'malware-reverse-engineering', slug: 'malware-reverse-engineering', levelId: 'level-4', specializationIds: ['malware-reverse-engineering'],
    title: text('curriculum.module.malware-reverse-engineering.title', 'Malware e engenharia reversa'),
    summary: text('curriculum.module.malware-reverse-engineering.summary', 'Análise estática e dinâmica em ambientes isolados.'),
    learningObjectives: [text('curriculum.objective.malware.safety', 'Operar amostras apenas em laboratório isolado.'), text('curriculum.objective.malware.analysis', 'Extrair IOCs e comportamento de forma reprodutível.')],
    skillIds: ['malware-analysis', 'reverse-engineering'], estimatedHours: 85, prerequisites: [requiredLevel('level-2')], resourceIds: ['flare-vm', 're4b'], checkpointIds: ['level-4-malware-report'],
  },
  {
    id: 'hardware-iot-security', slug: 'hardware-iot-security', levelId: 'level-4', specializationIds: ['hardware-iot'],
    title: text('curriculum.module.hardware-iot-security.title', 'Hardware, IoT e sistemas embarcados'),
    summary: text('curriculum.module.hardware-iot-security.summary', 'Interfaces, firmware, RF e avaliação responsável de dispositivos.'),
    learningObjectives: [text('curriculum.objective.iot.scope', 'Definir escopo e segurança física em avaliações.'), text('curriculum.objective.iot.firmware', 'Analisar firmware e interfaces em dispositivo autorizado.')],
    skillIds: ['hardware-security', 'iot-security'], estimatedHours: 70, prerequisites: [requiredLevel('level-2')], resourceIds: ['practical-hardware'], checkpointIds: ['level-4-iot-lab'],
  },
  {
    id: 'research-leadership', slug: 'research-leadership', levelId: 'level-5', specializationIds: [],
    title: text('curriculum.module.research-leadership.title', 'Pesquisa e liderança técnica'),
    summary: text('curriculum.module.research-leadership.summary', 'Pesquisa original, threat modeling, comunicação e estratégia de segurança.'),
    learningObjectives: [text('curriculum.objective.research.disclosure', 'Conduzir divulgação responsável.'), text('curriculum.objective.leadership.strategy', 'Comunicar decisões técnicas a diferentes públicos.')],
    skillIds: ['research', 'leadership'], estimatedHours: 100, prerequisites: [requiredLevel('level-4')], resourceIds: ['ctftime', 'mitre-attack'], checkpointIds: ['level-5-research', 'level-5-threat-model'],
  },
  {
    id: 'open-source-mentorship', slug: 'open-source-mentorship', levelId: 'level-5', specializationIds: [],
    title: text('curriculum.module.open-source-mentorship.title', 'Open source e mentoria'),
    summary: text('curriculum.module.open-source-mentorship.summary', 'Ferramentas, documentação, comunidade e formação de outras pessoas.'),
    learningObjectives: [text('curriculum.objective.opensource.contribution', 'Contribuir de forma sustentável em um projeto.'), text('curriculum.objective.mentorship', 'Criar material didático seguro e inclusivo.')],
    skillIds: ['open-source', 'leadership'], estimatedHours: 80, prerequisites: [requiredLevel('level-4')], resourceIds: ['ctftime'], checkpointIds: ['level-5-tool', 'level-5-mentoring'],
  },
];

const checkpoints: CurriculumCheckpoint[] = [
  ['level-0-linux-vm', 'level-0', 'operating-systems-scripting', 'Configure uma VM Linux', 'Crie um ambiente Ubuntu, Debian ou equivalente e documente os controles básicos.', 'lab'],
  ['level-0-subnetting', 'level-0', 'foundations-networking', 'Faça subnetting manual', 'Resolva cenários IPv4 e IPv6 sem calculadora automática.', 'explanation'],
  ['level-0-automation', 'level-0', 'operating-systems-scripting', 'Automatize uma tarefa segura', 'Escreva um script Bash, PowerShell ou Python para manutenção de laboratório.', 'project'],
  ['level-0-tls', 'level-0', 'operating-systems-scripting', 'Explique o handshake TLS', 'Descreva de forma simples o estabelecimento seguro de uma sessão TLS.', 'explanation'],
  ['level-1-security-cert', 'level-1', 'security-principles', 'Valide fundamentos de segurança', 'Faça uma avaliação Security+ ou equivalente, quando isso fizer sentido para seu objetivo.', 'certification'],
  ['level-1-tryhackme', 'level-1', 'home-security-lab', 'Complete salas introdutórias', 'Conclua salas de fundamentos em um ambiente de aprendizado autorizado.', 'lab'],
  ['level-1-attack-map', 'level-1', 'security-principles', 'Mapeie um incidente no ATT&CK', 'Relacione as técnicas de um caso público às táticas ATT&CK.', 'project'],
  ['level-1-home-lab', 'level-1', 'home-security-lab', 'Monte um laboratório defensivo', 'Configure firewall, logs e uma fonte de alertas em ambiente doméstico isolado.', 'lab'],
  ['level-2-ejpt', 'level-2', 'offensive-pentest', 'Conclua uma certificação prática de entrada', 'Obtenha eJPT, PNPT ou demonstre domínio equivalente em labs.', 'certification'],
  ['level-2-portswigger', 'level-2', 'web-application-security', 'Complete laboratórios PortSwigger', 'Resolva laboratórios de segurança web dentro da plataforma oficial.', 'lab'],
  ['level-2-htb', 'level-2', 'offensive-pentest', 'Resolva máquinas em laboratório', 'Documente a resolução de pelo menos 30 máquinas Easy/Medium ou equivalentes.', 'lab'],
  ['level-2-report', 'level-2', 'offensive-pentest', 'Escreva um relatório de pentest', 'Produza um relatório com sumário executivo, evidências e recomendações.', 'report'],
  ['level-2-ad-lab', 'level-2', 'active-directory-security', 'Avalie um laboratório Active Directory', 'Demonstre enumeração, riscos de identidade e controles recomendados em lab próprio.', 'lab'],
  ['level-3-btl1', 'level-3', 'soc-detection', 'Valide uma trilha de Blue Team', 'Conclua BTL1, CySA+ ou evidência prática equivalente.', 'certification'],
  ['level-3-lets-defend', 'level-3', 'soc-detection', 'Investigue incidentes simulados', 'Registre decisões de triagem em ao menos 50 incidentes simulados.', 'lab'],
  ['level-3-sigma', 'level-3', 'soc-detection', 'Crie regras Sigma', 'Escreva e teste 10 regras para técnicas ATT&CK distintas.', 'project'],
  ['level-3-forensics', 'level-3', 'dfir-hunting', 'Faça uma análise forense completa', 'Analise três imagens de disco ou memória em ambiente de treinamento.', 'report'],
  ['level-3-hunting-notebook', 'level-3', 'dfir-hunting', 'Crie um notebook de threat hunting', 'Documente hipótese, query, evidências, enrichment e conclusão.', 'project'],
  ['level-4-red-capstone', 'level-4', 'advanced-red-team', 'Conclua um capstone Red Team', 'Faça uma avaliação autorizada em laboratório e entregue recomendações defensivas.', 'report'],
  ['level-4-cloud-lab', 'level-4', 'cloud-appsec', 'Avalie um laboratório cloud', 'Identifique e corrija riscos de IAM, containers ou configuração em ambiente próprio.', 'lab'],
  ['level-4-devsecops', 'level-4', 'cloud-appsec', 'Implemente uma pipeline DevSecOps', 'Adicione controles SAST, SCA ou SBOM em um repositório de demonstração.', 'project'],
  ['level-4-malware-report', 'level-4', 'malware-reverse-engineering', 'Escreva relatório de análise de malware', 'Analise uma amostra educacional isolada e descreva comportamento e IOCs.', 'report'],
  ['level-4-iot-lab', 'level-4', 'hardware-iot-security', 'Avalie um dispositivo autorizado', 'Documente ameaças, interfaces e recomendações em hardware de sua propriedade.', 'lab'],
  ['level-5-research', 'level-5', 'research-leadership', 'Publique pesquisa responsável', 'Produza um artigo técnico, whitepaper ou relatório de divulgação responsável.', 'portfolio'],
  ['level-5-threat-model', 'level-5', 'research-leadership', 'Facilite um threat model', 'Conduza e documente uma sessão de modelagem de ameaças.', 'project'],
  ['level-5-tool', 'level-5', 'open-source-mentorship', 'Contribua com uma ferramenta open source', 'Publique ou mantenha uma contribuição útil e documentada.', 'contribution'],
  ['level-5-mentoring', 'level-5', 'open-source-mentorship', 'Ensine ou faça mentoria', 'Crie material acessível ou apoie uma pessoa iniciante.', 'portfolio'],
].map(([id, levelId, moduleId, titleValue, description, evidence]) => ({
  id,
  levelId: levelId as LevelId,
  moduleId,
  specializationIds: modules.find((module) => module.id === moduleId)?.specializationIds ?? [],
  title: text(`curriculum.checkpoint.${id}.title`, titleValue),
  description: text(`curriculum.checkpoint.${id}.description`, description),
  evidence: evidence as CurriculumCheckpoint['evidence'],
  isRequired: true,
  prerequisites: levelId === 'level-0' ? [] : [requiredLevel((`level-${Number(levelId.split('-')[1]) - 1}`) as LevelId)],
}));

const certifications: CurriculumCertification[] = [
  certification({ id: 'security-plus', slug: 'security-plus', name: 'CompTIA Security+', provider: 'CompTIA', description: 'Certificação ampla de fundamentos de segurança.', recognition: 'foundational' satisfies CertificationRecognition, costBand: 'medium' satisfies CertificationCostBand, estimatedStudyHours: 70, url: 'https://www.comptia.org/en-us/certifications/security/', levelIds: ['level-1'], specializationIds: [], prerequisites: [requiredLevel('level-0')], resourceIds: ['security-plus', 'professor-messer'] }),
  certification({ id: 'google-cybersecurity', slug: 'google-cybersecurity-certificate', name: 'Google Cybersecurity Certificate', provider: 'Google', description: 'Certificado inicial com foco em práticas de segurança e análise.', recognition: 'foundational', costBand: 'medium', estimatedStudyHours: 150, url: 'https://www.coursera.org/professional-certificates/google-cybersecurity', levelIds: ['level-1'], specializationIds: [], prerequisites: [requiredLevel('level-0')], resourceIds: ['google-networking'] }),
  certification({ id: 'ejpt', slug: 'ejpt', name: 'eJPT', provider: 'INE Security', description: 'Certificação prática de entrada para pentest.', recognition: 'professional', costBand: 'medium', estimatedStudyHours: 50, url: 'https://ine.com/security/certifications/ejpt-certification', levelIds: ['level-2'], specializationIds: ['red-team'], prerequisites: [requiredLevel('level-1')], resourceIds: ['ejpt', 'htb-starting-point'] }),
  certification({ id: 'pnpt', slug: 'pnpt', name: 'PNPT', provider: 'TCM Security', description: 'Certificação prática de pentest de rede e relatórios.', recognition: 'professional', costBand: 'medium', estimatedStudyHours: 60, url: 'https://certifications.tcm-sec.com/pnpt/', levelIds: ['level-2'], specializationIds: ['red-team'], prerequisites: [requiredLevel('level-1')], resourceIds: ['pnpt'] }),
  certification({ id: 'oscp', slug: 'oscp', name: 'OSCP', provider: 'OffSec', description: 'Certificação prática de testes de intrusão e enumeração metódica.', recognition: 'advanced', costBand: 'premium', estimatedStudyHours: 300, url: 'https://www.offsec.com/courses/pen-200/', levelIds: ['level-2', 'level-4'], specializationIds: ['red-team'], prerequisites: [requiredLevel('level-2')], resourceIds: ['portswigger', 'pnpt'] }),
  certification({ id: 'osep', slug: 'osep', name: 'OSEP', provider: 'OffSec', description: 'Certificação avançada focada em operações de Red Team autorizadas.', recognition: 'specialist', costBand: 'premium', estimatedStudyHours: 250, url: 'https://www.offsec.com/courses/pen-300/', levelIds: ['level-4'], specializationIds: ['red-team'], prerequisites: [requiredLevel('level-2')], resourceIds: ['mitre-attack'] }),
  certification({ id: 'crto', slug: 'crto', name: 'CRTO', provider: 'Zero Point Security', description: 'Treinamento prático de operações Red Team.', recognition: 'advanced', costBand: 'high', estimatedStudyHours: 100, url: 'https://www.zeropointsecurity.co.uk/course/red-team-ops', levelIds: ['level-4'], specializationIds: ['red-team'], prerequisites: [requiredLevel('level-2')], resourceIds: ['mitre-attack'] }),
  certification({ id: 'cysa-plus', slug: 'cysa-plus', name: 'CompTIA CySA+', provider: 'CompTIA', description: 'Certificação de análise e operações de segurança.', recognition: 'professional', costBand: 'medium', estimatedStudyHours: 50, url: 'https://www.comptia.org/en-us/certifications/cybersecurity-analyst/', levelIds: ['level-3'], specializationIds: ['blue-team'], prerequisites: [requiredLevel('level-1')], resourceIds: ['lets-defend', 'mitre-attack'] }),
  certification({ id: 'btl1', slug: 'btl1', name: 'Blue Team Level 1', provider: 'Centri', description: 'Certificação prática de SOC e resposta a incidentes.', recognition: 'professional', costBand: 'medium', estimatedStudyHours: 60, url: 'https://www.centri.org/certifications/blue-team-level-1', levelIds: ['level-3'], specializationIds: ['blue-team', 'dfir'], prerequisites: [requiredLevel('level-1')], resourceIds: ['blue-team-level-1', 'lets-defend'] }),
  certification({ id: 'osda', slug: 'osda', name: 'OffSec Defense Analyst (OSDA)', provider: 'OffSec', description: 'Certificação prática de operações SOC.', recognition: 'advanced', costBand: 'premium', estimatedStudyHours: 80, url: 'https://www.offsec.com/courses/soc-200/', levelIds: ['level-3'], specializationIds: ['blue-team'], prerequisites: [requiredLevel('level-1')], resourceIds: ['lets-defend', 'sigma'] }),
  certification({ id: 'cks', slug: 'cks', name: 'CKS', provider: 'Linux Foundation', description: 'Certificação de segurança em Kubernetes.', recognition: 'advanced', costBand: 'high', estimatedStudyHours: 80, url: 'https://training.linuxfoundation.org/certification/certified-kubernetes-security-specialist/', levelIds: ['level-4'], specializationIds: ['cloud-security'], prerequisites: [requiredLevel('level-2')], resourceIds: ['kubernetes-security', 'cloudgoat'] }),
  certification({ id: 'ccsp', slug: 'ccsp', name: 'CCSP', provider: 'ISC2', description: 'Certificação de segurança em cloud para profissionais experientes.', recognition: 'advanced', costBand: 'high', estimatedStudyHours: 100, url: 'https://www.isc2.org/certifications/ccsp', levelIds: ['level-4'], specializationIds: ['cloud-security'], prerequisites: [requiredLevel('level-2')], resourceIds: ['cloudgoat', 'slsa'] }),
  certification({ id: 'oswa', slug: 'oswa', name: 'OSWA', provider: 'OffSec', description: 'Certificação prática de segurança de aplicações web.', recognition: 'advanced', costBand: 'premium', estimatedStudyHours: 100, url: 'https://www.offsec.com/courses/web-200/', levelIds: ['level-4'], specializationIds: ['appsec-devsecops', 'red-team'], prerequisites: [requiredLevel('level-2')], resourceIds: ['portswigger', 'owasp-code-review'] }),
];

const levels: CurriculumLevel[] = [
  { id: 'level-0', order: 0, slug: 'level-0', title: text('curriculum.level.level-0.title', 'Fundamentos de TI'), summary: text('curriculum.level.level-0.summary', 'Redes, sistemas operacionais, virtualização e scripting básico.'), duration: { minWeeks: 8, maxWeeks: 12 }, prerequisites: [], moduleIds: ['foundations-networking', 'operating-systems-scripting'], checkpointIds: ['level-0-linux-vm', 'level-0-subnetting', 'level-0-automation', 'level-0-tls'], certificationIds: [], specializationIds: [], badge: { id: 'digital-foundations', label: text('curriculum.badge.digital-foundations', 'Fundamentos digitais') } },
  { id: 'level-1', order: 1, slug: 'level-1', title: text('curriculum.level.level-1.title', 'Introdução à cibersegurança'), summary: text('curriculum.level.level-1.summary', 'Conceitos, criptografia, frameworks e laboratórios defensivos.'), duration: { minWeeks: 8, maxWeeks: 12 }, prerequisites: [requiredLevel('level-0')], moduleIds: ['security-principles', 'home-security-lab'], checkpointIds: ['level-1-security-cert', 'level-1-tryhackme', 'level-1-attack-map', 'level-1-home-lab'], certificationIds: ['security-plus', 'google-cybersecurity'], specializationIds: [], badge: { id: 'security-foundations', label: text('curriculum.badge.security-foundations', 'Bases de segurança') } },
  { id: 'level-2', order: 2, slug: 'level-2', title: text('curriculum.level.level-2.title', 'Prática ofensiva'), summary: text('curriculum.level.level-2.summary', 'Pentest, aplicações web, Active Directory e relatórios profissionais.'), duration: { minWeeks: 16, maxWeeks: 24 }, prerequisites: [requiredLevel('level-1')], moduleIds: ['offensive-pentest', 'web-application-security', 'active-directory-security'], checkpointIds: ['level-2-ejpt', 'level-2-portswigger', 'level-2-htb', 'level-2-report', 'level-2-ad-lab'], certificationIds: ['ejpt', 'pnpt', 'oscp'], specializationIds: ['red-team', 'appsec-devsecops'], badge: { id: 'ethical-tester', label: text('curriculum.badge.ethical-tester', 'Testador ético') } },
  { id: 'level-3', order: 3, slug: 'level-3', title: text('curriculum.level.level-3.title', 'Prática defensiva'), summary: text('curriculum.level.level-3.summary', 'SOC, DFIR, threat hunting e engenharia de detecção.'), duration: { minWeeks: 16, maxWeeks: 24 }, prerequisites: [requiredLevel('level-1')], moduleIds: ['soc-detection', 'dfir-hunting'], checkpointIds: ['level-3-btl1', 'level-3-lets-defend', 'level-3-sigma', 'level-3-forensics', 'level-3-hunting-notebook'], certificationIds: ['cysa-plus', 'btl1', 'osda'], specializationIds: ['blue-team', 'dfir', 'threat-hunting', 'detection-engineering'], badge: { id: 'defense-operator', label: text('curriculum.badge.defense-operator', 'Operador de defesa') } },
  { id: 'level-4', order: 4, slug: 'level-4', title: text('curriculum.level.level-4.title', 'Especializações avançadas'), summary: text('curriculum.level.level-4.summary', 'Red Team, cloud, AppSec, malware e hardware/IoT.'), duration: { minWeeks: 24, maxWeeks: 52 }, prerequisites: [optionalLevel('level-2'), optionalLevel('level-3')], moduleIds: ['advanced-red-team', 'cloud-appsec', 'malware-reverse-engineering', 'hardware-iot-security'], checkpointIds: ['level-4-red-capstone', 'level-4-cloud-lab', 'level-4-devsecops', 'level-4-malware-report', 'level-4-iot-lab'], certificationIds: ['oscp', 'osep', 'crto', 'cks', 'ccsp', 'oswa'], specializationIds: ['red-team', 'cloud-security', 'appsec-devsecops', 'malware-reverse-engineering', 'hardware-iot'], badge: { id: 'specialist', label: text('curriculum.badge.specialist', 'Especialista') } },
  { id: 'level-5', order: 5, slug: 'level-5', title: text('curriculum.level.level-5.title', 'Pesquisa e liderança'), summary: text('curriculum.level.level-5.summary', 'Pesquisa original, open source, mentoria e liderança técnica.'), duration: { minWeeks: 52, maxWeeks: 104 }, prerequisites: [requiredLevel('level-4')], moduleIds: ['research-leadership', 'open-source-mentorship'], checkpointIds: ['level-5-research', 'level-5-threat-model', 'level-5-tool', 'level-5-mentoring'], certificationIds: [], specializationIds: [], badge: { id: 'community-leader', label: text('curriculum.badge.community-leader', 'Liderança e pesquisa') } },
];

const specializations: CurriculumSpecialization[] = [
  { id: 'red-team', slug: 'red-team', title: text('curriculum.specialization.red-team.title', 'Red Team e pentest'), summary: text('curriculum.specialization.red-team.summary', 'Avaliações autorizadas de redes, web e identidade.'), prerequisites: [requiredLevel('level-1')], levelIds: ['level-2', 'level-4'], moduleIds: ['offensive-pentest', 'web-application-security', 'active-directory-security', 'advanced-red-team'], resourceIds: ['portswigger', 'ejpt', 'pnpt', 'htb-starting-point', 'mitre-attack', 'solyd-pentest-playlist', 'codigo-fonte-owasp', 'messias-eric-pentest', 'boson-nmap', 'owasp-top-10-pt-br'], checkpointIds: ['level-2-ejpt', 'level-2-portswigger', 'level-2-htb', 'level-2-report', 'level-2-ad-lab', 'level-4-red-capstone'], certificationIds: ['ejpt', 'pnpt', 'oscp', 'osep', 'crto'], skillTargets: [{ skillId: 'pentesting', targetProficiency: 5 }, { skillId: 'web-security', targetProficiency: 4 }, { skillId: 'active-directory', targetProficiency: 4 }, { skillId: 'reporting', targetProficiency: 4 }] },
  { id: 'blue-team', slug: 'blue-team', title: text('curriculum.specialization.blue-team.title', 'Blue Team e SOC'), summary: text('curriculum.specialization.blue-team.summary', 'Prevenção, detecção, investigação e resposta a incidentes.'), prerequisites: [requiredLevel('level-1')], levelIds: ['level-3'], moduleIds: ['soc-detection', 'dfir-hunting'], resourceIds: ['blue-team-level-1', 'lets-defend', 'sigma', 'mitre-attack', 'evg-cis-controls'], checkpointIds: ['level-3-btl1', 'level-3-lets-defend', 'level-3-sigma', 'level-3-forensics'], certificationIds: ['cysa-plus', 'btl1', 'osda'], skillTargets: [{ skillId: 'soc', targetProficiency: 5 }, { skillId: 'detection-engineering', targetProficiency: 4 }, { skillId: 'dfir', targetProficiency: 3 }, { skillId: 'logging', targetProficiency: 4 }] },
  { id: 'dfir', slug: 'dfir', title: text('curriculum.specialization.dfir.title', 'DFIR'), summary: text('curriculum.specialization.dfir.summary', 'Forense digital, resposta a incidentes e cadeia de custódia.'), prerequisites: [requiredLevel('level-1')], levelIds: ['level-3'], moduleIds: ['dfir-hunting'], resourceIds: ['blue-team-level-1', 'lets-defend'], checkpointIds: ['level-3-forensics', 'level-3-hunting-notebook'], certificationIds: ['btl1'], skillTargets: [{ skillId: 'dfir', targetProficiency: 5 }, { skillId: 'threat-hunting', targetProficiency: 3 }] },
  { id: 'threat-hunting', slug: 'threat-hunting', title: text('curriculum.specialization.threat-hunting.title', 'Threat hunting'), summary: text('curriculum.specialization.threat-hunting.summary', 'Busca guiada por hipóteses e cobertura ATT&CK.'), prerequisites: [requiredLevel('level-1')], levelIds: ['level-3'], moduleIds: ['dfir-hunting', 'soc-detection'], resourceIds: ['mitre-attack', 'sigma', 'lets-defend'], checkpointIds: ['level-3-hunting-notebook', 'level-3-sigma'], certificationIds: ['cysa-plus'], skillTargets: [{ skillId: 'threat-hunting', targetProficiency: 5 }, { skillId: 'detection-engineering', targetProficiency: 4 }] },
  { id: 'detection-engineering', slug: 'detection-engineering', title: text('curriculum.specialization.detection-engineering.title', 'Engenharia de detecção'), summary: text('curriculum.specialization.detection-engineering.summary', 'Regras, cobertura de telemetria e validação contínua.'), prerequisites: [requiredLevel('level-1')], levelIds: ['level-3'], moduleIds: ['soc-detection'], resourceIds: ['sigma', 'mitre-attack', 'lets-defend', 'evg-cis-controls'], checkpointIds: ['level-3-sigma', 'level-3-lets-defend'], certificationIds: ['osda'], skillTargets: [{ skillId: 'detection-engineering', targetProficiency: 5 }, { skillId: 'logging', targetProficiency: 4 }] },
  { id: 'cloud-security', slug: 'cloud-security', title: text('curriculum.specialization.cloud-security.title', 'Segurança em cloud'), summary: text('curriculum.specialization.cloud-security.summary', 'IAM, containers, Kubernetes e configuração segura.'), prerequisites: [requiredLevel('level-2')], levelIds: ['level-4'], moduleIds: ['cloud-appsec'], resourceIds: ['cloudgoat', 'kubernetes-security', 'slsa'], checkpointIds: ['level-4-cloud-lab', 'level-4-devsecops'], certificationIds: ['cks', 'ccsp'], skillTargets: [{ skillId: 'cloud-security', targetProficiency: 5 }, { skillId: 'supply-chain', targetProficiency: 4 }] },
  { id: 'appsec-devsecops', slug: 'appsec-devsecops', title: text('curriculum.specialization.appsec-devsecops.title', 'AppSec e DevSecOps'), summary: text('curriculum.specialization.appsec-devsecops.summary', 'Segurança web, revisão de código e supply chain.'), prerequisites: [requiredLevel('level-2')], levelIds: ['level-2', 'level-4'], moduleIds: ['web-application-security', 'cloud-appsec'], resourceIds: ['portswigger', 'owasp-code-review', 'slsa', 'codigo-fonte-owasp', 'owasp-top-10-pt-br'], checkpointIds: ['level-2-portswigger', 'level-4-devsecops'], certificationIds: ['oswa'], skillTargets: [{ skillId: 'appsec', targetProficiency: 5 }, { skillId: 'web-security', targetProficiency: 5 }, { skillId: 'supply-chain', targetProficiency: 4 }] },
  { id: 'malware-reverse-engineering', slug: 'malware-reverse-engineering', title: text('curriculum.specialization.malware-reverse-engineering.title', 'Análise de malware e reversa'), summary: text('curriculum.specialization.malware-reverse-engineering.summary', 'Análise segura de binários e comportamento malicioso.'), prerequisites: [requiredLevel('level-2')], levelIds: ['level-4'], moduleIds: ['malware-reverse-engineering'], resourceIds: ['flare-vm', 're4b'], checkpointIds: ['level-4-malware-report'], certificationIds: [], skillTargets: [{ skillId: 'malware-analysis', targetProficiency: 5 }, { skillId: 'reverse-engineering', targetProficiency: 5 }] },
  { id: 'hardware-iot', slug: 'hardware-iot', title: text('curriculum.specialization.hardware-iot.title', 'Hardware, IoT e OT'), summary: text('curriculum.specialization.hardware-iot.summary', 'Avaliação responsável de dispositivos, firmware e interfaces físicas.'), prerequisites: [requiredLevel('level-2')], levelIds: ['level-4'], moduleIds: ['hardware-iot-security'], resourceIds: ['practical-hardware'], checkpointIds: ['level-4-iot-lab'], certificationIds: [], skillTargets: [{ skillId: 'hardware-security', targetProficiency: 5 }, { skillId: 'iot-security', targetProficiency: 5 }] },
];

const skills = [
  ['networking', 'Redes', 'Protocolos, endereçamento e tráfego.'], ['protocols', 'Protocolos', 'DNS, HTTP(S), TLS e TCP/IP.'], ['linux', 'Linux', 'Administração e terminal.'], ['scripting', 'Automação', 'Bash, PowerShell e Python.'], ['security-fundamentals', 'Fundamentos de segurança', 'Risco, criptografia e controles.'], ['cryptography', 'Criptografia', 'Chaves, hashes, certificados e PKI.'], ['logging', 'Telemetria e logs', 'Coleta e qualidade de eventos.'], ['pentesting', 'Pentest', 'Avaliação autorizada e metodologia.'], ['reporting', 'Comunicação de risco', 'Relatórios técnicos e executivos.'], ['web-security', 'Segurança web', 'OWASP, APIs e validação de entradas.'], ['appsec', 'AppSec', 'Segurança no ciclo de desenvolvimento.'], ['active-directory', 'Active Directory', 'Identidade, delegações e hardening.'], ['identity', 'Identidade', 'Acesso, autenticação e autorização.'], ['soc', 'Operações SOC', 'Triagem e investigação de alertas.'], ['detection-engineering', 'Engenharia de detecção', 'Regras, testes e cobertura ATT&CK.'], ['dfir', 'DFIR', 'Forense e resposta a incidentes.'], ['threat-hunting', 'Threat hunting', 'Hipóteses, queries e evidências.'], ['cloud-security', 'Segurança em cloud', 'IAM, configuração e cargas de trabalho.'], ['supply-chain', 'Supply chain', 'SBOM, proveniência e dependências.'], ['malware-analysis', 'Análise de malware', 'Comportamento e indicadores.'], ['reverse-engineering', 'Engenharia reversa', 'Binários, assembly e depuração.'], ['hardware-security', 'Segurança de hardware', 'Interfaces, firmware e ataques físicos.'], ['iot-security', 'Segurança IoT', 'Dispositivos embarcados e RF.'], ['research', 'Pesquisa', 'Método, divulgação e validação.'], ['leadership', 'Liderança técnica', 'Estratégia e comunicação.'], ['open-source', 'Open source', 'Contribuição e manutenção.'],
].map(([id, name, description]) => ({ id, title: text(`curriculum.skill.${id}.title`, name), description: text(`curriculum.skill.${id}.description`, description) }));

export const curriculumCatalog: CurriculumCatalog = {
  metadata: {
    id: 'cybersecurity-learning-roadmap', version: '1.1.0', sourceUpdatedAt: '2026-07-13', license: 'CC-BY-SA-4.0',
    title: text('curriculum.metadata.title', 'Estrutura abrangente de aprendizagem em cibersegurança'),
    description: text('curriculum.metadata.description', 'Currículo do básico à pesquisa e liderança, com prática responsável.'),
  },
  levels, modules, resources, checkpoints, certifications, specializations, skills,
};

export const catalog = curriculumCatalog;

export function label(value: I18nText): string { return value.fallback; }
export function getLevel(idOrSlug: string) { return levels.find((level) => level.id === idOrSlug || level.slug === idOrSlug); }
export function getModule(idOrSlug: string) { return modules.find((module) => module.id === idOrSlug || module.slug === idOrSlug); }
export function getResource(idOrSlug: string) { return resources.find((item) => item.id === idOrSlug || item.slug === idOrSlug); }
export function getCertification(idOrSlug: string) { return certifications.find((item) => item.id === idOrSlug || item.slug === idOrSlug); }
export function getSpecialization(idOrSlug: string) { return specializations.find((item) => item.id === idOrSlug || item.slug === idOrSlug); }
export function getLevelModules(levelId: LevelId) { return modules.filter((module) => module.levelId === levelId); }
export function getLevelCheckpoints(levelId: LevelId) { return checkpoints.filter((checkpoint) => checkpoint.levelId === levelId); }
export function getResourceTypeLabel(type: ResourceType) { return ({ course: 'Curso', book: 'Livro', video: 'Vídeo', lab: 'Laboratório', platform: 'Plataforma', tool: 'Ferramenta', guide: 'Guia', framework: 'Framework', community: 'Comunidade', ctf: 'CTF', hardware: 'Hardware' } as const)[type]; }
export function getAccessLabel(access: ResourceAccess) { return ({ free: 'Gratuito', freemium: 'Freemium', paid: 'Pago', reference: 'Referência' } as const)[access]; }
export function getResourceCollectionLabel(collection: ResourceCollection) { return ({ legacy: 'Conteúdos anteriores', curated: 'Novos conteúdos curados' } as const)[collection]; }
export function getCostBandLabel(cost: CertificationCostBand) { return ({ low: 'Baixo', medium: 'Médio', high: 'Alto', premium: 'Premium' } as const)[cost]; }
export function getRecognitionLabel(recognition: CertificationRecognition) { return ({ foundational: 'Fundamental', professional: 'Profissional', advanced: 'Avançado', specialist: 'Especialista' } as const)[recognition]; }
export function getLevelProgress(level: CurriculumLevel, completedIds: ReadonlySet<string>) {
  const required = level.checkpointIds;
  const completed = required.filter((id) => completedIds.has(id)).length;
  return { completed, total: required.length, percent: required.length ? Math.round((completed / required.length) * 100) : 0 };
}
/** Sum of the estimated study hours of every module in a level. */
export function getLevelEstimatedHours(level: CurriculumLevel) {
  return level.moduleIds.reduce((total, moduleId) => total + (getModule(moduleId)?.estimatedHours ?? 0), 0);
}
/** Catalog source-review date formatted as DD/MM/YYYY for pt-BR display. */
export function getSourceUpdatedLabel() {
  const [year, month, day] = curriculumCatalog.metadata.sourceUpdatedAt.split('-');
  return `${day}/${month}/${year}`;
}
