import { PatientListV2 } from "@/components/patient/patient-list-v2";
import { requireUser } from "@/lib/clerk-auth";
import { requireCompletedOnboarding } from "@/lib/onboarding";
import { listPatients } from "@/lib/services/repository";

export const dynamic = "force-dynamic";

export default async function PatientsPage({
  searchParams
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  await requireUser();
  await requireCompletedOnboarding();
  const { archived } = await searchParams;
  const patients = await listPatients();
  return <PatientListV2 patients={patients} mode="patients" archivedFeedback={archived === "1"} />;
}
