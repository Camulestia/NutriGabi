import { prisma } from "@/lib/prisma";
import { normalizeScheduleDateKey } from "@/lib/consultation-date";
import { Consultation } from "@/lib/types";
import { recordAuditLog } from "@/lib/services/auditLogService";
import { buildConsultationReportContent, mapConsultationRecord, mapPatientRecord, toConsultationCreateInput, toConsultationUpdateInput } from "@/lib/services/data-mappers";
import { getMockStateForUser } from "@/lib/services/mock-store";
import { withUserScopedAccess } from "@/lib/services/service-runtime";

export async function getConsultationById(patientId: string, consultationId: string) {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const consultation = await prisma.consultation.findFirst({
        where: {
          id: consultationId,
          patientId,
          userId: userProfile.id
        }
      });

      return consultation ? mapConsultationRecord(consultation) : null;
    },
    fallback: async (actor) => {
      const patient = getMockStateForUser(actor.clerkUserId).patients.find((item) => item.id === patientId);
      if (!patient) return null;
      return patient.consultations.find((consultation) => consultation.id === consultationId) ?? null;
    }
  });
}

export async function createConsultation(payload: Consultation) {
  const saved = await withUserScopedAccess({
    db: async ({ userProfile }) => {
      const patient = await prisma.patient.findFirst({
        where: {
          id: payload.patientId,
          userId: userProfile.id,
          deletedAt: null
        },
        include: {
          consultations: { orderBy: { consultationDate: "desc" } },
          reports: { orderBy: { createdAt: "desc" } }
        }
      });

      if (!patient) {
        throw new Error("PATIENT_NOT_FOUND");
      }

      const existing = await prisma.consultation.findFirst({
        where: {
          id: payload.id,
          userId: userProfile.id,
          patientId: payload.patientId
        }
      });

      const consultation = existing
        ? await prisma.consultation.update({
            where: { id: existing.id },
            data: toConsultationUpdateInput(payload)
          })
        : await prisma.consultation.create({
            data: toConsultationCreateInput(userProfile.id, payload)
          });

      const mappedPatient = mapPatientRecord(patient);
      const mappedConsultation = mapConsultationRecord(consultation);
      const reportTitle = `Relatório ${new Date(mappedConsultation.createdAt).toLocaleDateString("pt-BR")}`;
      const existingReport = await prisma.report.findFirst({
        where: {
          userId: userProfile.id,
          patientId: payload.patientId,
          consultationId: payload.id,
          type: "consulta"
        }
      });

      if (existingReport) {
        await prisma.report.update({
          where: { id: existingReport.id },
          data: {
            title: reportTitle,
            content: buildConsultationReportContent(mappedPatient, mappedConsultation)
          }
        });
      } else {
        await prisma.report.create({
          data: {
            userId: userProfile.id,
            patientId: payload.patientId,
            consultationId: payload.id,
            type: "consulta",
            title: reportTitle,
            content: buildConsultationReportContent(mappedPatient, mappedConsultation)
          }
        });
      }

      await prisma.appointment.updateMany({
        where: {
          userId: userProfile.id,
          patientId: payload.patientId,
          status: "agendada",
          date: new Date(normalizeScheduleDateKey(payload.createdAt))
        },
        data: {
          status: "concluída",
          reason: payload.visitReason ?? undefined
        }
      });

      return mappedConsultation;
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);

      state.patients = state.patients.map((patient) => {
        if (patient.id !== payload.patientId) return patient;

        const consultations = [payload, ...patient.consultations.filter((consultation) => consultation.id !== payload.id)].sort(
          (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        );

        const reports = patient.reports.filter((report) => report.consultationId !== payload.id);

        return {
          ...patient,
          consultations,
          reports: [
            {
              id: `rep-${payload.id}`,
              consultationId: payload.id,
              createdAt: payload.createdAt,
              title: `Relatório ${new Date(payload.createdAt).toLocaleDateString("pt-BR")}`
            },
            ...reports
          ]
        };
      });

      const consultationDay = normalizeScheduleDateKey(payload.createdAt);

      state.schedule = state.schedule.map((item) => {
        if (item.patientId !== payload.patientId) return item;
        if (item.status !== "agendada") return item;
        if (item.date !== consultationDay) return item;

        return {
          ...item,
          consultationId: payload.id,
          reason: payload.visitReason ?? item.reason,
          status: "concluída"
        };
      });

      return payload;
    }
  });

  await recordAuditLog({
    action: "consultation.save",
    entityType: "consultation",
    entityId: saved.id,
    metadata: { patientId: saved.patientId }
  });

  return saved;
}
