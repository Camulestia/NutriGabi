# Regression Checklist

Antes de publicar uma nova versão, valide:

- Login, cadastro, logout e proteção de rotas privadas
- Onboarding de primeiro acesso e página de configurações
- Criação, edição, exportação e arquivamento de pacientes
- Busca de pacientes e dashboard da visão geral
- Nova consulta, avanço entre etapas e salvamento da Etapa 8
- Agenda, calendário, criação de agendamento e abertura do perfil
- Exportação de relatório em PDF
- Interpretação com IA e fallback manual
- Planejamento alimentar, cálculo de macros e exportação em PDF
- Billing, limite do plano Free, upgrade e cancelamento
- Consentimento LGPD, Termos e Política de Privacidade
- Isolamento de dados entre usuários
- Health check e webhooks principais

Antes de rodar testes e2e pela primeira vez, execute:

```bash
npx playwright install
```
