import { jsonError, jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { listMealPlans, saveMealPlan } from "@/lib/services/repository";
import { MealPlan } from "@/lib/types";

export async function GET(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return jsonUtf8({ message: "patientId é obrigatório" }, { status: 400 });
  }

  try {
    return jsonUtf8(await listMealPlans(patientId));
  } catch (error) {
    return jsonError(error, "Não foi possível carregar os planos alimentares.");
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as MealPlan;
    const saved = await saveMealPlan(payload);
    return jsonUtf8(saved, { status: 201 });
  } catch (error) {
    return jsonError(error, "Não foi possível salvar o plano alimentar.");
  }
}
