import Link from "next/link";
import { notFound } from "next/navigation";

import { MealPlanWorkspace } from "@/components/meal-plan/meal-plan-workspace";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { requireUser } from "@/lib/clerk-auth";
import { requireCompletedOnboarding } from "@/lib/onboarding";
import { getBillingSummary } from "@/lib/services/billingService";
import { getPatientById, listMealPlans } from "@/lib/services/repository";

export const dynamic = "force-dynamic";

export default async function MealPlansPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ consultationId?: string; mode?: string }>;
}) {
  await requireUser();
  await requireCompletedOnboarding();
  const { id } = await params;
  const { consultationId, mode } = await searchParams;
  const patient = await getPatientById(id);

  if (!patient) notFound();

  const billing = await getBillingSummary();

  if (!billing.access.canUseMealPlans) {
    return (
      <Card className="p-8">
        <Section
          eyebrow="Plano Profissional"
          title="Planejamento alimentar disponível no upgrade"
          description="O prontuário do paciente continua intacto. Atualize o plano para liberar planejamento alimentar, substituições inteligentes e PDF do plano."
        >
          <div className="flex flex-wrap gap-3">
            <Link href={`/patients/${patient.id}`} className={buttonStyles({ variant: "secondary" })}>
              Voltar ao perfil
            </Link>
            <Link href="/billing" className={buttonStyles({ className: "px-5 py-3" })}>
              Atualizar plano
            </Link>
          </div>
        </Section>
      </Card>
    );
  }

  const mealPlans = await listMealPlans(patient.id);

  return <MealPlanWorkspace patient={patient} initialMealPlans={mealPlans} initialConsultationId={consultationId} initialMode={mode} />;
}
