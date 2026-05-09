import { expect, Page, APIRequestContext } from "@playwright/test";

export async function completeOnboardingViaApi(request: APIRequestContext) {
  const response = await request.post("/api/onboarding", {
    data: {
      name: "E2E User",
      crn: "",
      clinicName: "",
      professionalPhone: "",
      clinicLogoUrl: "",
      specialty: "nutrição clínica",
      acceptedTermsAt: new Date().toISOString()
    }
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function upgradeToProViaApi(request: APIRequestContext) {
  const response = await request.post("/api/billing/checkout", {
    data: {
      plan: "pro"
    }
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function createPatientViaApi(request: APIRequestContext, name: string) {
  const response = await request.post("/api/patients", {
    data: {
      name,
      birthDate: "1990-01-01",
      sex: "Feminino",
      phone: "(85) 99999-0000",
      email: `${name.toLowerCase().replaceAll(" ", ".")}@test.local`,
      profession: "Professora",
      mainObjective: "Emagrecimento",
      chiefComplaint: "Queixa inicial",
      clinicalHistory: "Sem histórico relevante",
      medications: "Nenhum",
      supplements: "Creatina",
      foodRestrictions: "Nenhuma",
      preferredFoods: ["ovo"],
      rejectedFoods: ["fígado"],
      allergies: [],
      intolerances: [],
      culturalPreferences: "",
      foodNotes: "Paciente prefere refeições simples",
      consentToStoreHealthData: true,
      consentDate: "2026-05-06",
      notes: "Criado via e2e"
    }
  });

  expect(response.ok()).toBeTruthy();
  return response.json();
}

export async function openPatientsPage(page: Page) {
  await page.goto("/patients");
  await expect(page.getByText("Novo prontuário")).toBeVisible();
}
