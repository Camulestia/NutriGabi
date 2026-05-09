# Stability Checklist

## Fluxos principais

- [ ] criar paciente
- [ ] editar paciente
- [ ] criar consulta
- [ ] gerar interpretação com IA
- [ ] gerar PDF
- [ ] criar agendamento
- [ ] criar plano alimentar
- [ ] pagar assinatura teste
- [ ] cancelar assinatura teste
- [ ] exportar dados do paciente
- [ ] excluir ou arquivar paciente

## Segurança e acesso

- [ ] acessar app sem login
- [ ] acessar rota privada sem login
- [ ] tentar abrir paciente de outro usuário
- [ ] validar bloqueio de API sem autenticação
- [ ] validar isolamento por `userId`

## Operação

- [ ] `/api/health` responde `status: ok`
- [ ] build de produção com `npm run build`
- [ ] Prisma Client com `npm run prisma:generate`
- [ ] webhook Stripe validado em sandbox
- [ ] onboarding concluído sem falha silenciosa
- [ ] billing responde sem erro

## IA e estabilidade

- [ ] validar limite de taxa nas rotas de IA
- [ ] validar mensagem amigável em falha de IA
- [ ] validar payload grande bloqueado
- [ ] validar fallback local sem `OPENAI_API_KEY`

## Observabilidade

- [ ] erro de frontend capturado pelo Sentry
- [ ] erro de API capturado pelo Sentry
- [ ] sem dados clínicos sensíveis nos eventos enviados
- [ ] logs locais sem payloads completos de paciente ou consulta
