import { jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { handleApiError } from "@/lib/errors";
import { createConsultation } from "@/lib/services/repository";
import { Consultation } from "@/lib/types";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as Consultation;
    const created = await createConsultation(payload);
    return jsonUtf8(created, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      fallbackKey: "consultationLoad",
      context: { action: "consultation.save", route: "/api/consultations", status: "failed" }
    });
  }
}
