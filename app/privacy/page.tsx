import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card className="p-8">
        <Section
          eyebrow="Política de Privacidade"
          title="Base inicial de privacidade para o NutriConsulta IA"
          description="Este texto serve como base operacional inicial e deve ser revisado juridicamente antes do uso comercial em produção."
          action={<Link href="/sign-up" className={buttonStyles({ variant: "secondary" })}>Voltar ao cadastro</Link>}
        >
          <div className="space-y-5 text-sm leading-7 text-ink">
            <p>O NutriConsulta IA trata dados cadastrais, dados de autenticação, informações clínicas e registros operacionais para viabilizar o uso do prontuário nutricional, agenda, relatórios e planejamento alimentar.</p>
            <p>Os dados são utilizados para prestação do serviço, segurança da conta, geração de documentos clínicos, histórico longitudinal e suporte técnico básico da plataforma.</p>
            <p>Dados sensíveis de saúde são exibidos e armazenados apenas no contexto autenticado do profissional responsável, com isolamento por usuário e controles de acesso do sistema.</p>
            <p>O profissional usuário é responsável por coletar o consentimento do paciente quando necessário e por revisar a adequação jurídica do uso da ferramenta em sua rotina.</p>
            <p>Solicitações de exclusão, exportação e correção de dados podem ser atendidas por meio das ferramentas internas do prontuário e da conta do profissional.</p>
          </div>
        </Section>
      </Card>
    </div>
  );
}
