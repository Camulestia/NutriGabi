import { jsonUtf8 } from "@/lib/api-response";
import { createPatient, listPatients } from "@/lib/services/repository";
import { Patient } from "@/lib/types";

export async function GET() {
  return jsonUtf8(await listPatients());
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Omit<Patient, "id" | "consultations" | "reports">;
  const created = await createPatient({
    id: `pat-${Date.now()}`,
    ...payload
  });

  return jsonUtf8(created, { status: 201 });
}
