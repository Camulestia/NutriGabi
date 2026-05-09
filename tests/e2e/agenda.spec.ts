import { expect, test } from "@playwright/test";

import { completeOnboardingViaApi, createPatientViaApi, upgradeToProViaApi } from "./helpers";

test.describe("agenda flow", () => {
  test("creates an appointment and shows it on the selected day", async ({ page, request }) => {
    await completeOnboardingViaApi(request);
    await upgradeToProViaApi(request);
    const patient = await createPatientViaApi(request, `Agenda E2E ${Date.now()}`);

    await page.goto("/");
    await page.waitForResponse((response) => response.url().includes("/api/billing") && response.request().method() === "GET");
    await expect(page.getByTestId("new-appointment-button")).toBeEnabled();
    await page.getByTestId("new-appointment-button").click();
    await expect(page.getByTestId("appointment-modal")).toBeVisible();
    await page.getByTestId("appointment-patient-select").selectOption(patient.id);
    await page.locator('input[type="date"]').last().fill("2026-05-06");
    await page.locator('input[type="time"]').fill("09:30");
    await page.getByTestId("appointment-save-button").click();

    const scheduleCard = page.getByRole("button", { name: `Abrir perfil de ${patient.name}` });
    await expect(scheduleCard).toBeVisible();
    await expect(scheduleCard.getByText(patient.name)).toBeVisible();
    await expect(page.getByText("09:30")).toBeVisible();
  });
});
