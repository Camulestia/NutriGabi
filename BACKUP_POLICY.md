# Backup Policy

## Objetivo

Garantir recuperação segura do NutriConsulta IA em caso de falha operacional, erro humano, incidente de infraestrutura ou corrupção de dados.

## Frequência recomendada

- backup automático diário do PostgreSQL
- snapshot adicional antes de migrations relevantes
- retenção mínima de 7 dias para MVP
- retenção recomendada de 30 a 90 dias para produção real

## Provedores comuns

### Supabase

- habilitar backups automáticos no projeto
- revisar política de retenção do plano contratado
- testar restore em ambiente separado antes de depender do processo em produção

### Neon

- usar point-in-time restore quando disponível no plano
- manter registro do branch/instância restaurada para auditoria

### Railway

- verificar política do plugin ou serviço PostgreSQL contratado
- complementar com dumps regulares se o plano não oferecer retenção suficiente

### Render

- habilitar snapshots automáticos do banco
- validar janela de retenção e processo de restore

## Backup manual complementar

Quando necessário, gerar dump do banco:

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

Para restaurar:

```bash
psql "$DATABASE_URL" < backup.sql
```

## Restore seguro

1. restaurar primeiro em ambiente separado
2. validar tabelas críticas:
   - UserProfile
   - Patient
   - Consultation
   - Appointment
   - MealPlan
   - Report
   - Subscription
   - AuditLog
3. confirmar integridade do isolamento por `userId`
4. só então promover a restauração para produção

## Cuidados com dados sensíveis

- armazenar dumps em ambiente criptografado
- restringir acesso aos backups
- nunca enviar dumps clínicos por canais inseguros
- evitar incluir arquivos de backup em repositórios
- registrar quem executou backup e restore em processo interno

## Recomendação operacional

- manter checklist de restore testado trimestralmente
- revisar retenção conforme crescimento da base clínica
- combinar backup do banco com revisão de envs críticas e webhook Stripe
