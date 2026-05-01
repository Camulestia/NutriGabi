import { jsonUtf8 } from "@/lib/api-response";
import { generateAiMealPlan } from "@/lib/services/ai";
import { getConsultationById, getPatientById } from "@/lib/services/repository";
import { MealPlanStrategy } from "@/lib/types";

export async function POST(request: Request) {
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
}
