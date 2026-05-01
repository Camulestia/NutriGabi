import { jsonUtf8 } from "@/lib/api-response";
import { generateAiInterpretation } from "@/lib/services/ai";
import { getPatientById } from "@/lib/services/repository";
import { Consultation } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { patientId: string; consultation: Consultation };
  const patient = await getPatientById(body.patientId);

  if (!patient) {
    return jsonUtf8({ message: "Paciente não encontrado" }, { status: 404 });
  }

  return jsonUtf8(await generateAiInterpretation(patient, body.consultation));
}
