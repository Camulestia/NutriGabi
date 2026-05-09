import { prisma } from "@/lib/prisma";
import { Patient } from "@/lib/types";
import { enforceFeatureAccess } from "@/lib/services/billingService";
import { mapAppointmentRecord, mapMealPlanRecord, mapPatientRecord, PatientFormPayload, toPatientCreateInput, toPatientUpdateInput } from "@/lib/services/data-mappers";
import { recordAuditLog } from "@/lib/services/auditLogService";
import { getMockStateForUser } from "@/lib/services/mock-store";
import { withUserScopedAccess } from "@/lib/services/service-runtime";

function sortPatients(patients: Patient[]) {
  return patients.slice().sort((first, second) => {
    const firstDate = first.consultations[0]?.createdAt ?? first.birthDate;
    const secondDate = second.consultations[0]?.createdAt ?? second.birthDate;
    return new Date(secondDate || 0).getTime() - new Date(firstDate || 0).getTime();
  });
}

export async function listPatients(options?: { search?: string; page?: number; pageSize?: number }) {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const page = Math.max(1, options?.page ?? 1);
      const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 50));
      const search = options?.search?.trim();
      const patients = await prisma.patient.findMany({
        where: {
          userId: userProfile.id,
          deletedAt: null,
          ...(search
            ? {
                name: {
                  contains: search,
                  mode: "insensitive"
                }
              }
            : {})
        },
        include: {
          consultations: {
            orderBy: { consultationDate: "desc" }
          },
          reports: {
            orderBy: { createdAt: "desc" }
          }
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      return patients.map(mapPatientRecord);
    },
    fallback: async (actor) => {
      const search = options?.search?.trim().toLowerCase();
      const page = Math.max(1, options?.page ?? 1);
      const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 50));
      const filtered = sortPatients(
        getMockStateForUser(actor.clerkUserId).patients.filter((patient) => !patient.deletedAt && (!search || patient.name.toLowerCase().includes(search)))
      );
      return filtered.slice((page - 1) * pageSize, page * pageSize);
    }
  });
}

export async function getPatientById(id: string, includeDeleted = false) {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const patient = await prisma.patient.findFirst({
        where: {
          id,
          userId: userProfile.id,
          ...(includeDeleted ? {} : { deletedAt: null })
        },
        include: {
          consultations: {
            orderBy: { consultationDate: "desc" }
          },
          reports: {
            orderBy: { createdAt: "desc" }
          }
        }
      });

      return patient ? mapPatientRecord(patient) : null;
    },
    fallback: async (actor) =>
      getMockStateForUser(actor.clerkUserId).patients.find((patient) => patient.id === id && (includeDeleted || !patient.deletedAt)) ?? null
  });
}

export async function createPatient(payload: PatientFormPayload & { id?: string }) {
  await enforceFeatureAccess("patients");

  const created = await withUserScopedAccess({
    db: async ({ userProfile }) => {
      const patient = await prisma.patient.create({
        data: {
          id: payload.id,
          ...toPatientCreateInput(userProfile.id, payload)
        },
        include: {
          consultations: true,
          reports: true
        }
      });

      return mapPatientRecord(patient);
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      const newPatient: Patient = {
        ...payload,
        id: payload.id ?? `pat-${Date.now()}`,
        consultations: [],
        reports: []
      };
      state.patients = [newPatient, ...state.patients];
      return newPatient;
    }
  });

  await recordAuditLog({
    action: "patient.create",
    entityType: "patient",
    entityId: created.id,
    metadata: { consent: created.consentToStoreHealthData }
  });

  return created;
}

export async function updatePatient(id: string, payload: PatientFormPayload) {
  const updated = await withUserScopedAccess({
    db: async ({ userProfile }) => {
      const existing = await prisma.patient.findFirst({
        where: { id, userId: userProfile.id, deletedAt: null },
        include: { consultations: true, reports: true }
      });

      if (!existing) {
        return null;
      }

      const nextConsentDate = payload.consentToStoreHealthData
        ? payload.consentDate
          ? new Date(payload.consentDate)
          : existing.consentDate ?? new Date()
        : null;

      const updatedPatient = await prisma.patient.update({
        where: { id: existing.id },
        data: {
          ...toPatientUpdateInput(payload),
          consentDate: nextConsentDate
        },
        include: {
          consultations: {
            orderBy: { consultationDate: "desc" }
          },
          reports: {
            orderBy: { createdAt: "desc" }
          }
        }
      });

      return mapPatientRecord(updatedPatient);
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      let updatedPatient: Patient | null = null;

      state.patients = state.patients.map((patient) => {
        if (patient.id !== id) {
          return patient;
        }

        updatedPatient = {
          ...patient,
          ...payload,
          consentDate: payload.consentToStoreHealthData ? payload.consentDate ?? patient.consentDate ?? new Date().toISOString() : undefined,
          id: patient.id,
          consultations: patient.consultations,
          reports: patient.reports
        };

        return updatedPatient;
      });

      return updatedPatient;
    }
  });

  if (updated) {
    await recordAuditLog({
      action: "patient.update",
      entityType: "patient",
      entityId: updated.id,
      metadata: { consent: updated.consentToStoreHealthData }
    });
  }

  return updated;
}

export async function archivePatient(id: string) {
  const archived = await withUserScopedAccess({
    db: async ({ userProfile }) => {
      const patient = await prisma.patient.findFirst({
        where: { id, userId: userProfile.id, deletedAt: null },
        include: {
          consultations: { orderBy: { consultationDate: "desc" } },
          reports: { orderBy: { createdAt: "desc" } }
        }
      });

      if (!patient) {
        return null;
      }

      const updated = await prisma.patient.update({
        where: { id: patient.id },
        data: { deletedAt: new Date() },
        include: {
          consultations: { orderBy: { consultationDate: "desc" } },
          reports: { orderBy: { createdAt: "desc" } }
        }
      });

      return mapPatientRecord(updated);
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      let archivedPatient: Patient | null = null;
      state.patients = state.patients.map((patient) => {
        if (patient.id !== id) return patient;
        archivedPatient = { ...patient, deletedAt: new Date().toISOString() };
        return archivedPatient;
      });
      return archivedPatient;
    }
  });

  if (archived) {
    await recordAuditLog({
      action: "patient.archive",
      entityType: "patient",
      entityId: archived.id,
      metadata: null
    });
  }

  return archived;
}

export async function exportPatientData(id: string) {
  const exported = await withUserScopedAccess<{
    patient: Patient;
    appointments: ReturnType<typeof mapAppointmentRecord>[];
    mealPlans: ReturnType<typeof mapMealPlanRecord>[];
    exportedAt: string;
  } | null>({
    db: async ({ userProfile }) => {
      const patient = await prisma.patient.findFirst({
        where: { id, userId: userProfile.id },
        include: {
          consultations: { orderBy: { consultationDate: "desc" } },
          reports: { orderBy: { createdAt: "desc" } },
          appointments: { orderBy: [{ date: "desc" }, { time: "desc" }] },
          mealPlans: { orderBy: { updatedAt: "desc" } }
        }
      });

      if (!patient) return null;

      return {
        patient: mapPatientRecord(patient),
        appointments: patient.appointments.map(mapAppointmentRecord),
        mealPlans: patient.mealPlans.map(mapMealPlanRecord),
        exportedAt: new Date().toISOString()
      };
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      const patient = state.patients.find((item) => item.id === id);
      if (!patient) return null;
      return {
        patient,
        appointments: state.schedule.filter((item) => item.patientId === id),
        mealPlans: state.mealPlans.filter((item) => item.patientId === id),
        exportedAt: new Date().toISOString()
      };
    }
  });

  if (exported) {
    await recordAuditLog({
      action: "patient.export",
      entityType: "patient",
      entityId: id,
      metadata: { exportedSections: ["patient", "consultations", "appointments", "reports", "mealPlans"] }
    });
  }

  return exported;
}


