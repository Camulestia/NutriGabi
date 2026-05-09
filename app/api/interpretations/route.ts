import { jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { AppError, handleApiError } from "@/lib/errors";
import { checkRateLimit, buildRateLimitKey } from "@/lib/rate-limit";
import { generateAiInterpretation } from "@/lib/services/ai";
import { getCurrentActor } from "@/lib/services/user-profile-service";
import { getPatientById } from "@/lib/services/repository";
import { Consultation } from "@/lib/types";

const MAX_INTERPRETATION_PAYLOAD_CHARS = 30_000;

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const actor = await getCurrentActor();
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey({ scope: "ai:interpretation", userId: actor.clerkUserId, ip }),
      limit: 10,
      windowMs: 60_000
    });

    if (!rateLimit.ok) {
      throw new AppError("Muitas tentativas em sequência. Aguarde um instante e tente novamente.", {
        statusCode: 429,
        code: "RATE_LIMITED",
        exposeMessage: true
      });
    }

    const body = (await request.json()) as { patientId: string; consultation: Consultation };
    if (JSON.stringify(body.consultation).length > MAX_INTERPRETATION_PAYLOAD_CHARS) {
      throw new AppError("Não foi possível gerar a interpretação agora. Tente novamente ou preencha manualmente.", {
        statusCode: 413,
        code: "AI_PAYLOAD_TOO_LARGE",
        exposeMessage: true
      });
    }

    const patient = await getPatientById(body.patientId);
    if (!patient) {
      return jsonUtf8({ message: "Paciente não encontrado" }, { status: 404 });
    }

    return jsonUtf8(await generateAiInterpretation(patient, body.consultation));
  } catch (error) {
    return handleApiError(error, {
      fallbackKey: "aiRequest",
      context: { action: "ai.interpretation", route: "/api/interpretations", status: "failed" }
    });
  }
}
