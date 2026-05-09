import { test, expect } from "@playwright/test";

const requiresRealAuth = process.env.E2E_REAL_AUTH === "1";

test.describe("auth flow", () => {
  test("redirects unauthenticated users to sign-in", async ({ page }) => {
    test.skip(!requiresRealAuth, "Fluxo de autenticação real depende de um ambiente com Clerk ativo e sem override local.");
    await page.goto("/patients");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("allows authenticated users to access the dashboard", async ({ page }) => {
    test.skip(!requiresRealAuth, "Fluxo de autenticação real depende de uma conta de teste do Clerk.");
    await page.goto("/dashboard");
    await expect(page.getByText("Busca de pacientes")).toBeVisible();
  });
});
