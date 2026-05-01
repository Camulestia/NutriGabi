import { jsonUtf8 } from "@/lib/api-response";
import { listMealPlans, saveMealPlan } from "@/lib/services/repository";
import { MealPlan } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return jsonUtf8({ message: "patientId é obrigatório" }, { status: 400 });
  }

  return jsonUtf8(await listMealPlans(patientId));
}

export async function POST(request: Request) {
  const payload = (await request.json()) as MealPlan;
  const saved = await saveMealPlan(payload);
  return jsonUtf8(saved, { status: 201 });
}
