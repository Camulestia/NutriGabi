import { jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { AppError, handleApiError } from "@/lib/errors";
import { checkRateLimit, buildRateLimitKey } from "@/lib/rate-limit";
import { enforceFeatureAccess } from "@/lib/services/billingService";
import { generateAiMealPlan } from "@/lib/services/ai";
import { getCurrentActor } from "@/lib/services/user-profile-service";
import { getConsultationById, getPatientById } from "@/lib/services/repository";
import { MealPlanStrategy } from "@/lib/types";

const MAX_MEAL_PLAN_NOTES_CHARS = 5_000;

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    await enforceFeatureAccess("mealPlans");

    const actor = await getCurrentActor();
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey({ scope: "ai:meal-plan", userId: actor.clerkUserId, ip }),
      limit: 6,
      windowMs: 60_000
    });

    if (!rateLimit.ok) {
      throw new AppError("Muitas tentativas em sequência. Aguarde um instante e tente novamente.", {
        statusCode: 429,
        code: "RATE_LIMITED",
        exposeMessage: true
      });
    }

    const payload = (await request.json()) as {
      patientId: string;
      consultationId?: string;
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFat: number;
      strategy: MealPlanStrategy;
      numberOfMeals: number;
      notes?: string;
    };

    if ((payload.notes ?? "").length > MAX_MEAL_PLAN_NOTES_CHARS) {
      throw new AppError("Não foi possível gerar a interpretação agora. Tente novamente ou preencha manualmente.", {
        statusCode: 413,
        code: "AI_PAYLOAD_TOO_LARGE",
        exposeMessage: true
      });
    }

    const patient = await getPatientById(payload.patientId);
    if (!patient) {
      return jsonUtf8({ message: "Paciente não encontrado" }, { status: 404 });
    }

    const consultation = payload.consultationId ? await getConsultationById(payload.patientId, payload.consultationId) : null;
    const plan = await generateAiMealPlan({
      patient,
      consultation,
      targetCalories: payload.targetCalories,
      targetProtein: payload.targetProtein,
      targetCarbs: payload.targetCarbs,
      targetFat: payload.targetFat,
      strategy: payload.strategy,
      numberOfMeals: payload.numberOfMeals,
      notes: payload.notes
    });

    return jsonUtf8(plan);
  } catch (error) {
    return handleApiError(error, {
      fallbackKey: "aiRequest",
      context: { action: "ai.meal-plan", route: "/api/meal-plans/generate", status: "failed" }
    });
  }
}
