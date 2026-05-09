import { expect, test } from "@playwright/test";

import { completeOnboardingViaApi, openPatientsPage } from "./helpers";

test.describe("patient flow", () => {
  test("creates a patient, opens the profile and finds it in the list", async ({ page, request }) => {
    const uniqueName = `Paciente E2E ${Date.now()}`;

    await completeOnboardingViaApi(request);
    await openPatientsPage(page);
    await page.getByLabel("Nome").fill(uniqueName);
    await page.getByLabel("Data de nascimento").fill("1990-01-01");
    const createResponsePromise = page.waitForResponse((response) => response.url().includes("/api/patients") && response.request().method() === "POST");
    await page.getByTestId("patient-submit-button").click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBeTruthy();
    const createdPatient = (await createResponse.json()) as { id: string; name: string };

    await page.waitForURL(new RegExp(`/patients/${createdPatient.id}`), { timeout: 20000 });
    await expect(page.getByRole("heading", { name: createdPatient.name })).toBeVisible();

    await page.goto("/patients");
    await expect(page.getByText(uniqueName)).toBeVisible();
  });
});
