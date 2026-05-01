import { jsonUtf8 } from "@/lib/api-response";
import { createConsultation } from "@/lib/services/repository";
import { Consultation } from "@/lib/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as Consultation;
  const created = await createConsultation(payload);
  return jsonUtf8(created, { status: 201 });
}
