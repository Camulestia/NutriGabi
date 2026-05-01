import { notFound } from "next/navigation";

import { MealPlanWorkspace } from "@/components/meal-plan/meal-plan-workspace";
import { getPatientById, listMealPlans } from "@/lib/services/repository";

export const dynamic = "force-dynamic";

export default async function MealPlansPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ consultationId?: string; mode?: string }>;
}) {
  const { id } = await params;
  const { consultationId, mode } = await searchParams;
  const patient = await getPatientById(id);

  if (!patient) notFound();

  const mealPlans = await listMealPlans(patient.id);

  return <MealPlanWorkspace patient={patient} initialMealPlans={mealPlans} initialConsultationId={consultationId} initialMode={mode} />;
}
