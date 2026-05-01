import { NextResponse } from "next/server";

import { createPatient, listPatients } from "@/lib/services/repository";
import { Patient } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await listPatients());
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Omit<Patient, "id" | "consultations" | "reports">;
  const created = await createPatient({
    id: `pat-${Date.now()}`,
    ...payload
  });

  return NextResponse.json(created, { status: 201 });
}
