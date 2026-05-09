import { describe, expect, it } from "vitest";

import { calculateItemFromFood, getMacroDifference, sumMeal, sumPlan } from "@/lib/meal-plan/macros";
import { createMealPlan } from "@/tests/factories";

describe("meal plan macros", () => {
  it("calculates macros for an individual food item", () => {
    const item = calculateItemFromFood("food-rice", "Arroz cozido", 100, "g");

    expect(item.calories).toBeGreaterThan(100);
    expect(item.carbs).toBeGreaterThan(20);
  });

  it("sums macros by meal and by full plan", () => {
    const breakfast = {
      id: "meal-1",
      name: "Café da manhã",
      time: "07:00",
      order: 0,
      notes: "",
      items: [calculateItemFromFood("food-egg", "Ovo", 2, "unidade"), calculateItemFromFood("food-banana", "Banana", 1, "unidade")]
    };
    const lunch = {
      id: "meal-2",
      name: "Almoço",
      time: "12:00",
      order: 1,
      notes: "",
      items: [calculateItemFromFood("food-chicken", "Frango grelhado", 140, "g"), calculateItemFromFood("food-rice", "Arroz cozido", 120, "g")]
    };

    const breakfastTotals = sumMeal(breakfast);
    expect(breakfastTotals.protein).toBeGreaterThan(10);

    const plan = createMealPlan({ meals: [breakfast, lunch] });
    const totals = sumPlan(plan);
    const difference = getMacroDifference(totals, plan);

    expect(totals.calories).toBeGreaterThan(breakfastTotals.calories);
    expect(typeof difference.protein).toBe("number");
  });
});
