# NutriConsulta IA

NutriConsulta IA é um SaaS clínico para nutricionistas com prontuário nutricional, consultas em wizard, agenda, relatórios em PDF, planejamento alimentar, autenticação, billing e isolamento de dados por usuário.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Clerk para autenticação
- Prisma ORM
- PostgreSQL
- Stripe
- Sentry
- Recharts
- @react-pdf/renderer
- OpenAI API opcional

## Funcionalidades atuais

- autenticação com Clerk
- onboarding profissional obrigatório no primeiro acesso
- pacientes, consultas, agenda e planejamento alimentar
- assinatura com Stripe e controle por plano
- isolamento de dados por usuário
- LGPD básica com consentimento do paciente
- logs de auditoria básicos
- exportação de dados do paciente
- health check operacional
- preparação para monitoramento com Sentry

## Instalação local

```bash
npm install
npm run prisma:generate
npx prisma migrate dev
npm run dev
```

## Variáveis de ambiente

Use o arquivo [D:\Documentos\Nutricaogabi\.env.example](</D:\Documentos\Nutricaogabi\.env.example>) como base.

Principais variáveis:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nutriconsulta"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_CLINIC_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_..."

OPENAI_API_KEY=""

SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
SENTRY_ORG=""
SENTRY_PROJECT=""

UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Banco PostgreSQL

Provedores recomendados para produção:

- Supabase
- Neon
- Railway
- Render

Checklist do banco:

1. criar um banco PostgreSQL gerenciado
2. copiar a connection string para `DATABASE_URL`
3. rodar migrations em produção com:

```bash
npx prisma migrate deploy
```

4. garantir que o Prisma Client seja gerado no build

O projeto já inclui `postinstall: prisma generate`, o que ajuda no build da Vercel.

## Prisma e migrations

Arquivos principais:

- [D:\Documentos\Nutricaogabi\prisma\schema.prisma](</D:\Documentos\Nutricaogabi\prisma\schema.prisma>)
- [D:\Documentos\Nutricaogabi\prisma\migrations](</D:\Documentos\Nutricaogabi\prisma\migrations>)
- [D:\Documentos\Nutricaogabi\lib\prisma.ts](</D:\Documentos\Nutricaogabi\lib\prisma.ts>)

Comandos úteis:

```bash
npm run prisma:generate
npx prisma migrate dev
npx prisma migrate deploy
```

## Clerk

1. criar aplicação no Clerk
2. configurar `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`
3. configurar URLs:
   - sign in: `/sign-in`
   - sign up: `/sign-up`
   - after sign in: `/dashboard`
   - after sign up: `/onboarding`
4. adicionar domínio local e domínio de produção no painel do Clerk

## Stripe

1. criar os produtos e preços recorrentes dos planos
2. configurar:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRO_PRICE_ID`
   - `STRIPE_CLINIC_PRICE_ID`
3. para testes locais, usar Stripe CLI:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

4. cartões de teste:

```text
4242 4242 4242 4242
```

## Sentry

Arquivos principais de monitoramento:

- [D:\Documentos\Nutricaogabi\next.config.ts](</D:\Documentos\Nutricaogabi\next.config.ts>)
- [D:\Documentos\Nutricaogabi\instrumentation.ts](</D:\Documentos\Nutricaogabi\instrumentation.ts>)
- [D:\Documentos\Nutricaogabi\instrumentation-client.ts](</D:\Documentos\Nutricaogabi\instrumentation-client.ts>)
- [D:\Documentos\Nutricaogabi\sentry.server.config.ts](</D:\Documentos\Nutricaogabi\sentry.server.config.ts>)
- [D:\Documentos\Nutricaogabi\sentry.edge.config.ts](</D:\Documentos\Nutricaogabi\sentry.edge.config.ts>)
- [D:\Documentos\Nutricaogabi\app\global-error.tsx](</D:\Documentos\Nutricaogabi\app\global-error.tsx>)

Configuração básica:

1. criar projeto no Sentry
2. preencher `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` e `SENTRY_PROJECT`
3. fazer deploy com source maps habilitados
4. validar uma exceção de teste em produção ou staging

Observação:
- o app sanitiza eventos para evitar envio de dados clínicos sensíveis, payloads completos de paciente, consultas e dados alimentares

## Webhook Stripe

Endpoint:

```text
APP_URL/api/webhooks/stripe
```

Eventos esperados:

- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

O endpoint já valida `stripe-signature` com `STRIPE_WEBHOOK_SECRET`.

## Health check

Endpoint:

```text
/api/health
```

Retorno esperado quando tudo estiver saudável:

```json
{
  "status": "ok",
  "database": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Deploy na Vercel

Passo a passo sugerido:

1. subir o repositório no GitHub
2. importar o projeto na Vercel
3. configurar as variáveis do `.env.example`
4. garantir que `DATABASE_URL` aponte para o banco de produção
5. configurar o domínio público em `APP_URL` e `NEXT_PUBLIC_APP_URL`
6. rodar migrations com:

```bash
npx prisma migrate deploy
```

7. configurar o webhook do Stripe apontando para:

```text
https://SEU_DOMINIO/api/webhooks/stripe
```

8. validar login, onboarding, billing, pacientes e PDFs

## Segurança básica verificada

- segredos ficam no backend
- `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `DATABASE_URL` não usam `NEXT_PUBLIC`
- rotas privadas protegidas por autenticação
- API routes validam usuário autenticado
- dados clínicos filtrados por `userId`
- logs de auditoria não armazenam prontuários completos
- exportação e arquivamento de paciente passam por rotas protegidas
- prompts de IA foram reduzidos ao mínimo clínico necessário

## Performance atual

- backend de pacientes já aceita paginação e busca (`search`, `page`, `pageSize`)
- agenda já filtra por data
- consultas e planos são ordenados por data
- a busca visual da visão geral usa `useDeferredValue` para reduzir trabalho a cada tecla
- rotas de IA têm rate limit em memória para o MVP

## Backup e recuperação

Leia a política detalhada em [D:\Documentos\Nutricaogabi\BACKUP_POLICY.md](</D:\Documentos\Nutricaogabi\BACKUP_POLICY.md>).

Resumo operacional:

- habilitar backup automático diário do PostgreSQL
- manter retenção mínima de 7 dias, idealmente 30+
- testar restore em ambiente separado
- armazenar dumps com criptografia e acesso restrito
- registrar responsável por backup/restore no processo interno

## Checklists operacionais

- produção: [D:\Documentos\Nutricaogabi\PRODUCTION_CHECKLIST.md](</D:\Documentos\Nutricaogabi\PRODUCTION_CHECKLIST.md>)
- estabilidade: [D:\Documentos\Nutricaogabi\STABILITY_CHECKLIST.md](</D:\Documentos\Nutricaogabi\STABILITY_CHECKLIST.md>)
- regressão manual: [D:\Documentos\Nutricaogabi\REGRESSION_CHECKLIST.md](</D:\Documentos\Nutricaogabi\REGRESSION_CHECKLIST.md>)

## Testes e qualidade

Ferramentas já configuradas:

- Vitest para testes unitários
- Testing Library para componentes React
- Playwright para fluxos end-to-end
- ESLint para qualidade estática
- Prettier para formatação

Comandos:

```bash
npm run lint
npm run test
npm run test:watch
npm run test:e2e
npm run format
```

Antes de rodar testes e2e pela primeira vez, execute:

```bash
npx playwright install
```

Observações:

- os testes unitários e de componente usam mocks locais para Clerk, Stripe, IA e navegação do Next
- os testes e2e não chamam Stripe real nem OpenAI real
- os fluxos de autenticação e isolamento multiusuário em e2e dependem de um ambiente dedicado e por isso podem ficar marcados como `skip` até que as URLs de teste sejam fornecidas

## Comandos principais

```bash
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run build
npm run start
```
