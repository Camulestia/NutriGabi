import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPatient } from "@/tests/factories";

const mockState = {
  patients: [] as ReturnType<typeof createPatient>[],
  billing: {
    plan: "free" as const,
    status: "inactive" as const,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  },
  schedule: [],
  mealPlans: [],
  auditLogs: []
};

vi.mock("@/lib/services/service-runtime", () => ({
  withUserScopedAccess: ({ fallback }: { fallback: (actor: { clerkUserId: string }) => unknown }) =>
    fallback({ clerkUserId: "test-user" })
}));

vi.mock("@/lib/services/mock-store", () => ({
  getMockStateForUser: () => mockState
}));

vi.mock("@/lib/services/auditLogService", () => ({
  recordAuditLog: vi.fn()
}));

describe("patient service fallback", () => {
  beforeEach(() => {
    mockState.patients = [createPatient()];
  });

  it("preserves consultations and reports when editing patient data", async () => {
    const existing = mockState.patients[0];
    const { updatePatient } = await import("@/lib/services/patientService");

    const updated = await updatePatient(existing.id, {
      ...existing,
      name: "Maria Atualizada"
    });

    expect(updated?.name).toBe("Maria Atualizada");
    expect(updated?.consultations).toEqual(existing.consultations);
    expect(updated?.reports).toEqual(existing.reports);
  });
});
