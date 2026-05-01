import { NextResponse } from "next/server";

import { createConsultation } from "@/lib/services/repository";
import { Consultation } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as Consultation;
  const created = await createConsultation(payload);
  return NextResponse.json(created, { status: 201 });
}
