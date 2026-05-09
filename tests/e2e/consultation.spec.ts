import { expect, test } from "@playwright/test";

import { completeOnboardingViaApi, createPatientViaApi } from "./helpers";

test.describe("consultation flow", () => {
  test("creates a consultation and reaches step 8", async ({ page, request }) => {
    await completeOnboardingViaApi(request);
    const patient = await createPatientViaApi(request, `Consulta E2E ${Date.now()}`);

    await page.goto(`/patients/${patient.id}/consultations/new`);
    await page.locator('input[type="date"]').first().fill("2026-05-06");
    await page.locator("select").first().selectOption({ label: "Retorno" });
    await page.getByPlaceholder("Descreva a principal queixa ou demanda trazida pelo paciente.").fill("Queixa de teste");
    await page.getByPlaceholder("Ex.: emagrecimento, ganho de massa, melhora de exames, performance, saúde intestinal.").fill("Objetivo de teste");

    for (let index = 0; index < 7; index += 1) {
      await page.getByRole("button", { name: /próxima etapa/i }).click();
    }

    await expect(page.getByText("Avaliação do nutricionista")).toBeVisible();
    await page.getByPlaceholder("Registre sua avaliação nutricional, hipótese principal e interpretação clínica.").fill("Diagnóstico nutricional de teste");
    await page.getByPlaceholder("Descreva a conduta nutricional proposta, ajustes alimentares, suplementação quando aplicável e orientações gerais.").fill("Conduta registrada no e2e");
    await page.getByRole("button", { name: /salvar avaliação/i }).click();
    await expect(page.getByRole("button", { name: /exportar pdf/i })).toBeVisible();
  });
});
