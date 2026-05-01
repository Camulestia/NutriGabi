import { Meal, MealPlan, MealPlanStrategy, Patient } from "@/lib/types";

const defaultMealNames = ["Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar", "Ceia"];

export function buildDefaultMeals() {
  return defaultMealNames.map<Meal>((name, index) => ({
    id: `meal-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    time: ["07:00", "10:00", "12:30", "16:00", "19:30", "22:00"][index] ?? "",
    items: [],
    notes: "",
    order: index
  }));
}

export function buildEmptyMealPlan({
  patient,
  consultationId,
  title,
  goal,
  strategy
}: {
  patient: Patient;
  consultationId?: string;
  title?: string;
  goal?: string;
  strategy?: MealPlanStrategy;
}): MealPlan {
  const now = new Date().toISOString();
  return {
    id: `plan-${Date.now()}`,
    patientId: patient.id,
    consultationId,
    title: title ?? `Plano alimentar - ${patient.name}`,
    goal: goal ?? patient.mainObjective,
    strategy: strategy ?? "reeducação alimentar",
    status: "rascunho",
    targetCalories: 1800,
    targetProtein: 120,
    targetCarbs: 180,
    targetFat: 60,
    meals: buildDefaultMeals(),
    notes: patient.foodNotes ?? "",
    internalNotes: "",
    createdAt: now,
    updatedAt: now,
    professionalReviewRequired: true
  };
}
