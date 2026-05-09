import { expect, test } from "@playwright/test";

const userABaseUrl = process.env.E2E_MULTIUSER_BASE_URL_A;
const userBBaseUrl = process.env.E2E_MULTIUSER_BASE_URL_B;

test.describe("data isolation", () => {
  test("user B does not see user A patients", async ({ browser }) => {
    test.skip(!userABaseUrl || !userBBaseUrl, "Isolamento e2e multiusuário depende de duas instâncias com usuários de teste distintos.");

    const contextA = await browser.newContext({ baseURL: userABaseUrl });
    const pageA = await contextA.newPage();
    await pageA.goto("/patients");
    await expect(pageA.getByText("Prontuários ativos")).toBeVisible();

    const contextB = await browser.newContext({ baseURL: userBBaseUrl });
    const pageB = await contextB.newPage();
    await pageB.goto("/patients");
    await expect(pageB.getByText("Prontuários ativos")).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
