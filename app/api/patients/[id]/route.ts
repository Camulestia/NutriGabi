import { NextResponse } from "next/server";

import { getPatientById } from "@/lib/services/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) {
    return NextResponse.json({ message: "Paciente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(patient);
}
