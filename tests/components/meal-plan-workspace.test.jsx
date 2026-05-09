import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MealPlanWorkspace } from "@/components/meal-plan/meal-plan-workspace";
import { createConsultation, createMealPlan, createPatient } from "@/tests/factories";
import { renderComponent } from "@/tests/test-utils";

vi.mock("@/components/meal-plan/meal-plan-pdf", () => ({
  MealPlanPdfDownload: ({ label = "Exportar plano em PDF" }) => <button>{label}</button>
}));

describe("MealPlanWorkspace", () => {
  it("renders the meal plan editor and the professional review alert", () => {
    const consultation = createConsultation();
    const patient = createPatient({ consultations: [consultation] });
    const plan = createMealPlan({
      consultationId: consultation.id,
      meals: [],
      professionalReviewRequired: true
    });

    renderComponent(
      <MealPlanWorkspace
        patient={patient}
        initialMealPlans={[plan]}
        initialConsultationId={consultation.id}
      />
    );

    expect(screen.getAllByText("Plano gerado com auxílio de IA. Revisão profissional obrigatória antes da entrega ao paciente.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /exportar plano em pdf/i })).toBeInTheDocument();
  });
});
