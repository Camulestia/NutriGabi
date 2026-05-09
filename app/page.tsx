import { PatientListV2 } from "@/components/patient/patient-list-v2";
import { requireUser } from "@/lib/clerk-auth";
import { requireCompletedOnboarding } from "@/lib/onboarding";
import { listPatients } from "@/lib/services/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireUser();
  await requireCompletedOnboarding();
  const patients = await listPatients();
  return <PatientListV2 patients={patients} mode="overview" />;
}
