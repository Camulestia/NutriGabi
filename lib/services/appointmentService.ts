import { prisma } from "@/lib/prisma";
import { normalizeScheduleDateKey } from "@/lib/consultation-date";
import { ScheduleItem } from "@/lib/types";
import { enforceFeatureAccess } from "@/lib/services/billingService";
import { mapAppointmentRecord } from "@/lib/services/data-mappers";
import { getMockStateForUser, normalizeScheduleDate, sortScheduleItems } from "@/lib/services/mock-store";
import { withUserScopedAccess } from "@/lib/services/service-runtime";

export async function listScheduleItems(date?: string) {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const where = {
        userId: userProfile.id,
        ...(date ? { date: new Date(normalizeScheduleDateKey(date)) } : {})
      };

      const items = await prisma.appointment.findMany({
        where,
        orderBy: [{ date: "asc" }, { time: "asc" }]
      });

      return items.map(mapAppointmentRecord);
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      const items = date ? state.schedule.filter((item) => item.date === normalizeScheduleDate(date)) : state.schedule;
      return sortScheduleItems(items);
    }
  });
}

export async function listAppointmentDaysWithItems(month?: string) {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const items = await prisma.appointment.findMany({
        where: { userId: userProfile.id },
        select: { date: true }
      });

      const normalized = Array.from(new Set(items.map((item) => item.date.toISOString().slice(0, 10))));
      return month ? normalized.filter((value) => value.startsWith(month)) : normalized;
    },
    fallback: async (actor) => {
      const values = Array.from(new Set(getMockStateForUser(actor.clerkUserId).schedule.map((item) => item.date)));
      return month ? values.filter((value) => value.startsWith(month)) : values;
    }
  });
}

export async function createScheduleItem(
  payload: Omit<ScheduleItem, "id" | "patientName"> & {
    patientId: string;
  }
) {
  await enforceFeatureAccess("agenda");

  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const patient = await prisma.patient.findFirst({
        where: {
          id: payload.patientId,
          userId: userProfile.id
        }
      });

      if (!patient) return null;

      const created = await prisma.appointment.create({
        data: {
          userId: userProfile.id,
          patientId: payload.patientId,
          patientName: patient.name,
          date: new Date(normalizeScheduleDateKey(payload.date)),
          time: payload.time,
          reason: payload.reason,
          type: payload.type,
          status: payload.status,
          notes: payload.notes ?? null
        }
      });

      return mapAppointmentRecord(created);
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      const patient = state.patients.find((item) => item.id === payload.patientId);
      if (!patient) return null;

      const created: ScheduleItem = {
        id: `sched-${Date.now()}`,
        patientName: patient.name,
        ...payload,
        date: normalizeScheduleDate(payload.date)
      };

      state.schedule = sortScheduleItems([...state.schedule, created]);
      return created;
    }
  });
}

export async function updateAppointmentStatus(id: string, status: ScheduleItem["status"]) {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const appointment = await prisma.appointment.findFirst({
        where: { id, userId: userProfile.id }
      });

      if (!appointment) return null;

      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status }
      });

      return mapAppointmentRecord(updated);
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      let updatedItem: ScheduleItem | null = null;
      state.schedule = state.schedule.map((item) => {
        if (item.id !== id) return item;
        updatedItem = { ...item, status };
        return updatedItem;
      });
      return updatedItem;
    }
  });
}
