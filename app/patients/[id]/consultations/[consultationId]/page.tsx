import { notFound } from "next/navigation";

import { ConsultationWizardV3 } from "@/components/consultation/consultation-wizard-v3";
import { requireUser } from "@/lib/clerk-auth";
import { requireCompletedOnboarding } from "@/lib/onboarding";
import { getConsultationById, getPatientById } from "@/lib/services/repository";

export default async function ConsultationDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string; consultationId: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  await requireUser();
  await requireCompletedOnboarding();
  const { id, consultationId } = await params;
  const { step } = await searchParams;
  const [patient, consultation] = await Promise.all([getPatientById(id), getConsultationById(id, consultationId)]);
  const parsedStep = Number(step);
  const initialStep = Number.isFinite(parsedStep) ? Math.min(Math.max(parsedStep, 0), 7) : 0;

  if (!patient || !consultation) notFound();

  return (
    <ConsultationWizardV3
      patient={patient}
      initialConsultation={consultation}
      draftKey={`consultation-draft-edit-${consultation.id}`}
      initialStep={initialStep}
    />
  );
}
