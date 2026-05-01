import { PatientListV2 } from "@/components/patient/patient-list-v2";
import { listPatients } from "@/lib/services/repository";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const patients = await listPatients();
  return <PatientListV2 patients={patients} mode="patients" />;
}
