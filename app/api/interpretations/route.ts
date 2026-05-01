import { NextResponse } from "next/server";

import { generateAiInterpretation } from "@/lib/services/ai";
import { getPatientById } from "@/lib/services/repository";
import { Consultation } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { patientId: string; consultation: Consultation };
  const patient = await getPatientById(body.patientId);

  if (!patient) {
    return NextResponse.json({ message: "Paciente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(await generateAiInterpretation(patient, body.consultation));
}
