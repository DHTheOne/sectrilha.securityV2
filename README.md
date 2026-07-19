# SecTrilha — Jornada de Cibersegurança

Plataforma educacional de cibersegurança com currículo estruturado, recursos curados e checkpoints offline-first.

## Resumo do projeto

A SecTrilha organiza uma jornada de aprendizagem em 6 níveis, 15 módulos e 27 checkpoints, complementada por 9 especializações, 13 certificações e 44 recursos curados — 23 deles disponíveis em português. Construída com Next.js, React e TypeScript, a plataforma gera páginas estáticas, oferece navegação responsiva e acessível e mantém o progresso exclusivamente no navegador por meio de IndexedDB, com suporte a exportação, exclusão e uso offline.

## Privacidade por padrão

O MVP não tem cadastro, autenticação, IA, chat automático, analytics, pixels de publicidade ou sincronização com serviços externos. O progresso é salvo somente no navegador do estudante, via IndexedDB, e pode ser exportado ou apagado em `/privacy`.

Os recursos externos são links de saída abertos apenas após uma ação explícita da pessoa usuária. Eles não são incorporados em iframes e usam `rel="noreferrer"`.

## Páginas do currículo

- `/curriculum` — visão geral, árvore de aprendizagem e próxima ação;
- `/curriculum/level-0` a `/curriculum/level-5` — níveis e checkpoints;
- `/curriculum/specializations/red-team` (e demais especializações);
- `/certifications/oscp` e `/resources/portswigger-academy` — páginas estáticas com dados estruturados;
- `/privacy` — exportação e exclusão do progresso local.

As páginas são geradas estaticamente e revalidadas diariamente. O catálogo, inclusive os materiais em português, fica em `src/lib/curriculum/catalog.ts`.

O schema PostgreSQL para uma futura versão com contas próprias está em `prisma/schema.prisma`. Ele não é usado para rastrear estudantes no MVP.

## Executar localmente

Pré-requisito: Node.js 20 ou superior.

1. Instale as dependências: `npm install`.
2. Opcionalmente, copie `.env.example` para `.env.local` e defina `NEXT_PUBLIC_SITE_URL`.
3. Inicie a aplicação: `npm run dev`.
4. Abra `http://localhost:3000` no navegador.

## Verificações

- `npm run lint` — checagem de TypeScript;
- `npm run test` — testes do catálogo;
- `npm run build` — geração das páginas estáticas;
- `npm run test:e2e` — navegação principal;
- `npm run check:links` — valida links externos do catálogo, seguindo redirecionamentos;
- `npm run prisma:validate` — valida o schema Prisma.

Links externos podem mudar ou exigir login/região. Rode `npm run check:links` antes de uma publicação para confirmar os destinos novamente.
