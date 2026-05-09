# Production Checklist

## Autenticação

- [ ] login funcionando em produção
- [ ] cadastro funcionando em produção
- [ ] logout funcionando
- [ ] redirecionamento para onboarding no primeiro acesso
- [ ] rotas privadas bloqueadas sem login
- [ ] `/dashboard` redirecionando para a visão geral autenticada

## Banco de dados

- [ ] `DATABASE_URL` aponta para PostgreSQL de produção
- [ ] `npx prisma migrate deploy` executado com sucesso
- [ ] Prisma Client gerado no build
- [ ] dados isolados por `userId`
- [ ] pacientes arquivados não aparecem na lista padrão

## Stripe

- [ ] checkout do plano Pro funcionando
- [ ] webhook apontando para `APP_URL/api/webhooks/stripe`
- [ ] `STRIPE_WEBHOOK_SECRET` configurado
- [ ] eventos recebidos:
  - [ ] `checkout.session.completed`
  - [ ] `invoice.paid`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] status da assinatura sincronizando no app

## Aplicação clínica

- [ ] criar paciente
- [ ] editar paciente
- [ ] criar consulta
- [ ] abrir agenda
- [ ] criar agendamento
- [ ] abrir planejamento alimentar
- [ ] gerar relatório PDF
- [ ] exportar dados do paciente
- [ ] arquivar paciente com confirmação

## LGPD básica

- [ ] página `/privacy` publicada
- [ ] página `/terms` publicada
- [ ] aceite do onboarding funcionando
- [ ] consentimento do paciente visível no perfil
- [ ] exportação de dados protegida por autenticação

## Segurança

- [ ] sem segredos em variáveis `NEXT_PUBLIC` indevidas
- [ ] sem logs clínicos sensíveis em `console.log`
- [ ] APIs protegidas com autenticação
- [ ] filtros por `userId` revisados nas consultas principais
- [ ] Stripe webhook validando assinatura

## Infra e observabilidade

- [ ] domínio configurado na Vercel
- [ ] domínio configurado no Clerk
- [ ] backups do PostgreSQL habilitados
- [ ] restaurar backup testado pelo menos uma vez
- [ ] erro 404 amigável validado
- [ ] billing, settings e onboarding sem falhas silenciosas

## Variáveis de ambiente

- [ ] `DATABASE_URL`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRO_PRICE_ID`
- [ ] `STRIPE_CLINIC_PRICE_ID`
- [ ] `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- [ ] `OPENAI_API_KEY` (se usar IA remota)
- [ ] `APP_URL`
- [ ] `NEXT_PUBLIC_APP_URL`
