# NutriConsulta IA

MVP funcional para nutricionistas com:

- cadastro e perfil de pacientes
- nova consulta em wizard com autosave
- cálculos antropométricos automáticos
- interpretação clínica com IA ou fallback local
- acompanhamento evolutivo com gráficos
- geração de relatório em PDF

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma com esquema PostgreSQL pronto para expansão
- Recharts
- @react-pdf/renderer

## Executar

```bash
npm install
npm run dev
```

Se `OPENAI_API_KEY` não estiver configurada, a interpretação usa um motor local determinístico para o MVP.
