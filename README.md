# SecAcademy — Jornada de Cibersegurança

Aplicação educacional em React com trilhas de estudo, simuladores conceituais seguros, progresso sincronizado pelo Firebase e mentor IA.

## Executar localmente

Pré-requisito: Node.js 20 ou superior.

1. Instale as dependências: `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Defina `GEMINI_API_KEY` em `.env.local`. Essa chave fica somente no servidor; nunca a coloque em `firebase-applet-config.json` nem a envie ao repositório.
4. Inicie a aplicação: `npm run dev`.

O servidor usa a porta `3000` por padrão. Defina `PORT` em `.env.local` para usar outra porta.

## Firebase e dados de progresso

O arquivo `firebase-applet-config.json` contém identificadores públicos do cliente Firebase. Antes de publicar, aplique `firestore.rules` no banco Firestore configurado nesse projeto. As regras restringem cada pessoa autenticada ao próprio documento `users/{uid}` e permitem apenas os campos de progresso.

As regras são entregues como arquivo para revisão; este repositório não executa uma publicação automática no Firebase.

## Segurança do mentor IA

O endpoint `/api/gemini` mantém a chave e as instruções do mentor no servidor. Ele limita tamanho de pergunta e taxa por IP, mas uma implantação pública deve usar também limite de gasto/quotas no provedor e proteção de borda apropriada.
