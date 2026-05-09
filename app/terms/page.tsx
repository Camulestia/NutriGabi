import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card className="p-8">
        <Section
          eyebrow="Termos de Uso"
          title="Condições básicas de uso do NutriConsulta IA"
          description="Este texto é uma base operacional inicial e deve ser validado juridicamente antes da disponibilização comercial definitiva."
          action={<Link href="/sign-up" className={buttonStyles({ variant: "secondary" })}>Voltar ao cadastro</Link>}
        >
          <div className="space-y-5 text-sm leading-7 text-ink">
            <p>O NutriConsulta IA é uma ferramenta de apoio para nutricionistas e não substitui julgamento clínico, responsabilidade profissional, obrigação documental ou requisitos regulatórios aplicáveis.</p>
            <p>O usuário se compromete a utilizar a plataforma apenas para fins legítimos, protegendo credenciais, sigilo profissional e acesso aos dados clínicos de seus pacientes.</p>
            <p>Recursos assistidos por IA devem sempre ser revisados por profissional habilitado antes de qualquer conduta, entrega ao paciente ou tomada de decisão clínica.</p>
            <p>O uso do sistema pode estar sujeito a limites de plano, regras de assinatura, disponibilidade técnica e integrações de terceiros como autenticação e pagamentos.</p>
            <p>Ao utilizar a plataforma, o usuário declara ciência de que deverá adaptar seus fluxos internos para LGPD, documentação clínica e retenção segura de dados conforme sua realidade profissional.</p>
          </div>
        </Section>
      </Card>
    </div>
  );
}
