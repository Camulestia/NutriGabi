import { expect, test } from "@playwright/test";

import { completeOnboardingViaApi, createPatientViaApi, upgradeToProViaApi } from "./helpers";

test.describe("meal plan flow", () => {
  test("opens the meal plan workspace and shows macro controls", async ({ page, request }) => {
    await completeOnboardingViaApi(request);
    await upgradeToProViaApi(request);
    const patient = await createPatientViaApi(request, `Plano E2E ${Date.now()}`);

    await page.goto(`/patients/${patient.id}/meal-plans`);
    await expect(page.getByRole("button", { name: /recalcular plano/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /criar novo plano alimentar/i })).toBeVisible();
  });
});
