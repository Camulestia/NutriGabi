import { getFoodById } from "@/lib/meal-plan/food-database";
import { Food, MacroDifference, Meal, MealItem, MealPlan } from "@/lib/types";

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibers: number;
};

export function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function getUnitWeight(food: Food | undefined, unit: string) {
  if (!food) return unit === "g" || unit === "ml" ? 1 : 100;
  return food.commonUnits?.[unit] ?? (unit === "g" || unit === "ml" ? 1 : 100);
}

export function calculateItemFromFood(foodId: string | undefined, name: string, quantity: number, unit: string): MealItem {
  const food = getFoodById(foodId);
  const namedFood = food ?? undefined;
  const weight = quantity * getUnitWeight(namedFood, unit);
  const base = namedFood
    ? {
        calories: (namedFood.kcalPer100g * weight) / 100,
        protein: (namedFood.proteinPer100g * weight) / 100,
        carbs: (namedFood.carbsPer100g * weight) / 100,
        fat: (namedFood.fatPer100g * weight) / 100,
        fibers: ((namedFood.fiberPer100g ?? 0) * weight) / 100,
        group: namedFood.category,
        tags: namedFood.tags
      }
    : {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fibers: 0,
        group: "Personalizado",
        tags: []
      };

  return {
    id: `meal-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    foodId,
    name,
    quantity,
    unit,
    calories: round1(base.calories),
    protein: round1(base.protein),
    carbs: round1(base.carbs),
    fat: round1(base.fat),
    fibers: round1(base.fibers),
    group: base.group,
    tags: base.tags,
    notes: "",
    substitutions: []
  };
}

export function sumMealItems(items: MealItem[]): MacroTotals {
  return items.reduce(
    (totals, item) => ({
      calories: round1(totals.calories + item.calories),
      protein: round1(totals.protein + item.protein),
      carbs: round1(totals.carbs + item.carbs),
      fat: round1(totals.fat + item.fat),
      fibers: round1(totals.fibers + (item.fibers ?? 0))
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibers: 0 }
  );
}

export function sumMeal(meal: Meal) {
  return sumMealItems(meal.items);
}

export function sumPlan(plan: MealPlan) {
  return plan.meals.reduce(
    (totals, meal) => {
      const mealTotals = sumMeal(meal);
      return {
        calories: round1(totals.calories + mealTotals.calories),
        protein: round1(totals.protein + mealTotals.protein),
        carbs: round1(totals.carbs + mealTotals.carbs),
        fat: round1(totals.fat + mealTotals.fat),
        fibers: round1(totals.fibers + mealTotals.fibers)
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibers: 0 }
  );
}

export function getMacroDifference(current: MacroTotals, target: Pick<MealPlan, "targetCalories" | "targetProtein" | "targetCarbs" | "targetFat">): MacroDifference {
  return {
    calories: round1(current.calories - target.targetCalories),
    protein: round1(current.protein - target.targetProtein),
    carbs: round1(current.carbs - target.targetCarbs),
    fat: round1(current.fat - target.targetFat)
  };
}
