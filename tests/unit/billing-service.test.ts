import { describe, expect, it } from "vitest";

import { canCreatePatientForPlan, getPlanAccess } from "@/lib/services/billingService";

describe("billing access rules", () => {
  it("limits patient creation on the free plan", () => {
    expect(getPlanAccess("free").patientLimit).toBe(5);
    expect(canCreatePatientForPlan("free", 4)).toBe(true);
    expect(canCreatePatientForPlan("free", 5)).toBe(false);
  });

  it("unlocks patient creation on paid plans", () => {
    expect(getPlanAccess("pro").patientLimit).toBeNull();
    expect(canCreatePatientForPlan("pro", 999)).toBe(true);
    expect(canCreatePatientForPlan("clinic", 999)).toBe(true);
  });
});
