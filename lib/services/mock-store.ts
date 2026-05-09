import { mockMealPlans, mockPatients } from "@/lib/mock/data";
import { normalizeScheduleDateKey } from "@/lib/consultation-date";
import { AuditLogEntry, BillingSummary, MealPlan, Patient, ScheduleItem, UserSettings } from "@/lib/types";

type MockUserState = {
  patients: Patient[];
  schedule: ScheduleItem[];
  mealPlans: MealPlan[];
  auditLogs: AuditLogEntry[];
  billing: Pick<BillingSummary, "plan" | "status" | "currentPeriodEnd" | "stripeCustomerId" | "stripeSubscriptionId">;
  userSettings: UserSettings;
};

declare global {
  // eslint-disable-next-line no-var
  var __nutriConsultaMockStates: Record<string, MockUserState> | undefined;
}

function createInitialState(clerkUserId: string): MockUserState {
  const shouldSeedDemoData = clerkUserId === "dev-seed-user";

  return {
    patients: shouldSeedDemoData ? (structuredClone(mockPatients) as Patient[]) : [],
    schedule: [],
    mealPlans: shouldSeedDemoData ? (structuredClone(mockMealPlans) as MealPlan[]) : [],
    auditLogs: [],
    billing: {
      plan: "free",
      status: "inactive",
      currentPeriodEnd: null,
      stripeCustomerId: shouldSeedDemoData ? "cus_dev_seed" : null,
      stripeSubscriptionId: null
    },
    userSettings: {
      name: shouldSeedDemoData ? "Usuário de desenvolvimento" : "",
      email: shouldSeedDemoData ? "dev@nutriconsulta.local" : "",
      plan: shouldSeedDemoData ? "pro" : "free",
      crn: "",
      clinicName: "",
      professionalPhone: "",
      clinicLogoUrl: "",
      specialty: "",
      reportSignature: "",
      defaultReturnInterval: 30,
      defaultConsultationTime: "08:00",
      defaultPdfFooter: "",
      locale: "pt-BR",
      onboardingCompleted: shouldSeedDemoData,
      acceptedTermsAt: shouldSeedDemoData ? new Date().toISOString() : undefined
    }
  };
}

export function getMockStateForUser(clerkUserId: string) {
  if (!globalThis.__nutriConsultaMockStates) {
    globalThis.__nutriConsultaMockStates = {};
  }

  if (!globalThis.__nutriConsultaMockStates[clerkUserId]) {
    globalThis.__nutriConsultaMockStates[clerkUserId] = createInitialState(clerkUserId);
  }

  return globalThis.__nutriConsultaMockStates[clerkUserId];
}

export function sortScheduleItems(items: ScheduleItem[]) {
  return items.slice().sort((first, second) => {
    const firstDate = `${first.date}T${first.time}`;
    const secondDate = `${second.date}T${second.time}`;
    return new Date(firstDate).getTime() - new Date(secondDate).getTime();
  });
}

export function normalizeScheduleDate(value: string) {
  return normalizeScheduleDateKey(value);
}
