import { describe, expect, it } from "vitest";

import { calculateItemFromFood } from "@/lib/meal-plan/macros";
import { suggestSubstitutions } from "@/lib/meal-plan/substitutions";
import { createMealPlan, createPatient } from "@/tests/factories";

describe("meal plan substitutions", () => {
  it("filters out restricted foods from substitution suggestions", () => {
    const patient = createPatient({
      allergies: ["frango"],
      rejectedFoods: ["arroz"],
      intolerances: []
    });
    const plan = createMealPlan();
    const item = calculateItemFromFood("food-rice", "Arroz cozido", 100, "g");

    const suggestions = suggestSubstitutions({
      item,
      patient,
      plan,
      mode: "objetivo"
    });

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((suggestion) => suggestion.substituteFood.toLowerCase().includes("arroz"))).toBe(false);
    expect(suggestions.some((suggestion) => suggestion.substituteFood.toLowerCase().includes("frango"))).toBe(false);
  });
});
