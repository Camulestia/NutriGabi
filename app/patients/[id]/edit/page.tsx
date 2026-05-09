import { notFound } from "next/navigation";

import { PatientIntakeFormV2 } from "@/components/patient/patient-intake-form-v2";
import { requireUser } from "@/lib/clerk-auth";
import { requireCompletedOnboarding } from "@/lib/onboarding";
import { getPatientById } from "@/lib/services/repository";

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  await requireCompletedOnboarding();
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) notFound();

  return <PatientIntakeFormV2 mode="edit" patient={patient} cancelHref={`/patients/${patient.id}`} />;
}
