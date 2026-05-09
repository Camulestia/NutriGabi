import { describe, expect, it } from "vitest";

import {
  getNextReturnDate,
  isSameScheduleDay,
  mapVisitReasonToScheduleType,
  normalizeScheduleDateKey,
  shouldAppearInReturnList,
  toConsultationIsoDate
} from "@/lib/consultation-date";

describe("consultation date helpers", () => {
  it("normalizes schedule dates and ignores time in same-day comparisons", () => {
    expect(normalizeScheduleDateKey("2026-05-06T08:00:00.000Z")).toBe("2026-05-06");
    expect(isSameScheduleDay("2026-05-06T08:00:00.000Z", "2026-05-06T20:15:00.000Z")).toBe(true);
    expect(isSameScheduleDay("2026-05-06T08:00:00.000Z", "2026-05-07T16:00:00.000Z")).toBe(false);
  });

  it("calculates return visibility after 30 days", () => {
    const nextReturnDate = getNextReturnDate("2026-05-01");
    expect(nextReturnDate.toISOString()).toContain("2026-05-31");
    expect(shouldAppearInReturnList("2026-05-01", new Date("2026-05-30T12:00:00.000Z"))).toBe(false);
    expect(shouldAppearInReturnList("2026-05-01", new Date("2026-05-31T16:00:00.000Z"))).toBe(true);
  });

  it("maps visit reasons to schedule types", () => {
    expect(mapVisitReasonToScheduleType("Primeira consulta")).toBe("primeira consulta");
    expect(mapVisitReasonToScheduleType("Avaliação física")).toBe("avaliação");
    expect(mapVisitReasonToScheduleType("Ajuste de plano alimentar")).toBe("ajuste de plano alimentar");
  });

  it("converts plain date values into consultation ISO timestamps", () => {
    expect(toConsultationIsoDate("2026-05-06")).toContain("2026-05-06T");
  });
});
