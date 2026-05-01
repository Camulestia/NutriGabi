import { foodDatabase } from "@/lib/meal-plan/food-database";
import { calculateItemFromFood, round1 } from "@/lib/meal-plan/macros";
import { MealItem, MealPlan, Patient, Substitution } from "@/lib/types";

type SuggestionMode = "calorias" | "macro" | "objetivo";

function buildRestrictionSet(patient: Patient) {
  const allTerms = [
    ...patient.rejectedFoods,
    ...patient.allergies,
    ...patient.intolerances,
    patient.foodRestrictions
  ]
    .join(",")
    .toLowerCase();

  return allTerms;
}

function getPrimaryMacro(item: MealItem) {
  const pairs = [
    { key: "protein", value: item.protein },
    { key: "carbs", value: item.carbs },
    { key: "fat", value: item.fat }
  ] as const;

  return [...pairs].sort((a, b) => b.value - a.value)[0].key;
}

function preferenceBoost(patient: Patient, foodName: string) {
  return patient.preferredFoods.some((preferred) => foodName.toLowerCase().includes(preferred.toLowerCase())) ? -15 : 0;
}

export function suggestSubstitutions({
  item,
  patient,
  plan,
  mode
}: {
  item: MealItem;
  patient: Patient;
  plan: MealPlan;
  mode: SuggestionMode;
}) {
  const restrictionTerms = buildRestrictionSet(patient);
  const primaryMacro = getPrimaryMacro(item);

  return foodDatabase
    .filter((food) => food.name !== item.name)
    .filter((food) => food.category === item.group || food.tags.some((tag) => item.tags.includes(tag)))
    .filter((food) => !restrictionTerms.includes(food.name.toLowerCase()))
    .map((food) => {
      const referencePer100 =
        mode === "calorias"
          ? item.calories
          : primaryMacro === "protein"
            ? item.protein
            : primaryMacro === "carbs"
              ? item.carbs
              : item.fat;

      const foodPer100 =
        mode === "calorias"
          ? food.kcalPer100g
          : primaryMacro === "protein"
            ? food.proteinPer100g
            : primaryMacro === "carbs"
              ? food.carbsPer100g
              : food.fatPer100g;

      const grams = foodPer100 > 0 ? (referencePer100 / foodPer100) * 100 : 100;
      const substitute = calculateItemFromFood(food.id, food.name, round1(grams), "g");
      const score =
        Math.abs(substitute.calories - item.calories) +
        Math.abs(substitute.protein - item.protein) +
        Math.abs(substitute.carbs - item.carbs) +
        Math.abs(substitute.fat - item.fat) +
        preferenceBoost(patient, food.name) +
        (mode === "objetivo" && plan.strategy === "emagrecimento" ? -1 * (substitute.fibers ?? 0) : 0) +
        (mode === "objetivo" && plan.strategy === "hipertrofia" ? -1 * substitute.protein : 0);

      const suggestion: Substitution = {
        originalFood: item.name,
        substituteFood: food.name,
        originalQuantity: item.quantity,
        substituteQuantity: round1(grams),
        unit: "g",
        macroDifference: {
          calories: round1(substitute.calories - item.calories),
          protein: round1(substitute.protein - item.protein),
          carbs: round1(substitute.carbs - item.carbs),
          fat: round1(substitute.fat - item.fat)
        },
        reason:
          mode === "calorias"
            ? "Equivalência calórica aproximada."
            : mode === "macro"
              ? `Prioriza equivalência do macronutriente principal (${primaryMacro}).`
              : `Sugestão ajustada ao objetivo ${plan.strategy}.`
      };

      return { score, suggestion };
    })
    .sort((first, second) => first.score - second.score)
    .slice(0, 4)
    .map((entry) => entry.suggestion);
}
