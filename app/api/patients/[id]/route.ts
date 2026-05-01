import { jsonUtf8 } from "@/lib/api-response";
import { getPatientById, updatePatient } from "@/lib/services/repository";
import { Patient } from "@/lib/types";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) {
    return jsonUtf8({ message: "Paciente não encontrado" }, { status: 404 });
  }

  return jsonUtf8(patient);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = (await request.json()) as Omit<Patient, "id" | "consultations" | "reports">;
  const updated = await updatePatient(id, payload);

  if (!updated) {
    return jsonUtf8({ message: "Paciente não encontrado" }, { status: 404 });
  }

  return jsonUtf8(updated);
}
