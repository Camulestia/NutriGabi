import { mockMealPlans, mockPatients } from "@/lib/mock/data";
import { normalizeScheduleDateKey } from "@/lib/consultation-date";
import { Consultation, MealPlan, Patient, ScheduleItem } from "@/lib/types";

type RepositoryState = {
  patients: Patient[];
  schedule: ScheduleItem[];
  mealPlans: MealPlan[];
};

declare global {
  var __nutriConsultaState: RepositoryState | undefined;
}

function getState() {
  if (!globalThis.__nutriConsultaState) {
    globalThis.__nutriConsultaState = {
      patients: structuredClone(mockPatients) as Patient[],
      schedule: [],
      mealPlans: structuredClone(mockMealPlans) as MealPlan[]
    };
  }

  return globalThis.__nutriConsultaState;
}

export async function listPatients() {
  return getState().patients;
}

export async function getPatientById(id: string) {
  return getState().patients.find((patient) => patient.id === id) ?? null;
}

export async function getConsultationById(patientId: string, consultationId: string) {
  const patient = getState().patients.find((item) => item.id === patientId);
  if (!patient) return null;

  return patient.consultations.find((consultation) => consultation.id === consultationId) ?? null;
}

export async function createPatient(patient: Omit<Patient, "consultations" | "reports">) {
  const state = getState();
  const newPatient: Patient = {
    ...patient,
    consultations: [],
    reports: []
  };
  state.patients = [newPatient, ...state.patients];
  return newPatient;
}

export async function updatePatient(id: string, payload: Omit<Patient, "id" | "consultations" | "reports">) {
  const state = getState();
  let updatedPatient: Patient | null = null;

  state.patients = state.patients.map((patient) => {
    if (patient.id !== id) return patient;

    updatedPatient = {
      ...patient,
      ...payload,
      id: patient.id,
      consultations: patient.consultations,
      reports: patient.reports
    };

    return updatedPatient;
  });

  return updatedPatient;
}

export async function listScheduleItems() {
  return getState().schedule;
}

export async function createScheduleItem(
  payload: Omit<ScheduleItem, "id" | "patientName"> & {
    patientId: string;
  }
) {
  const state = getState();
  const patient = state.patients.find((item) => item.id === payload.patientId);
  if (!patient) return null;

  const created: ScheduleItem = {
    id: `sched-${Date.now()}`,
    patientName: patient.name,
    ...payload,
    date: normalizeScheduleDateKey(payload.date)
  };

  state.schedule = [...state.schedule, created].sort((first, second) => {
    const firstDate = `${first.date}T${first.time}`;
    const secondDate = `${second.date}T${second.time}`;
    return new Date(firstDate).getTime() - new Date(secondDate).getTime();
  });

  return created;
}

export async function listMealPlans(patientId: string) {
  return getState().mealPlans
    .filter((plan) => plan.patientId === patientId)
    .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
}

export async function getMealPlanById(patientId: string, planId: string) {
  return getState().mealPlans.find((plan) => plan.patientId === patientId && plan.id === planId) ?? null;
}

export async function saveMealPlan(plan: MealPlan) {
  const state = getState();
  const exists = state.mealPlans.some((item) => item.id === plan.id);
  const nextPlan = {
    ...plan,
    updatedAt: new Date().toISOString()
  };

  state.mealPlans = exists
    ? state.mealPlans.map((item) => (item.id === plan.id ? nextPlan : item))
    : [nextPlan, ...state.mealPlans];

  return nextPlan;
}

export async function duplicateMealPlan(patientId: string, planId: string) {
  const original = await getMealPlanById(patientId, planId);
  if (!original) return null;

  const now = new Date().toISOString();
  const duplicate: MealPlan = {
    ...structuredClone(original),
    id: `plan-${Date.now()}`,
    title: `${original.title} (cópia)`,
    status: "rascunho",
    consultationId: undefined,
    createdAt: now,
    updatedAt: now,
    meals: original.meals.map((meal, mealIndex) => ({
      ...meal,
      id: `meal-${Date.now()}-${mealIndex}`,
      items: meal.items.map((item, itemIndex) => ({ ...item, id: `item-${Date.now()}-${mealIndex}-${itemIndex}` }))
    }))
  };

  return saveMealPlan(duplicate);
}

export async function setMealPlanStatus(patientId: string, planId: string, status: MealPlan["status"]) {
  const state = getState();
  let updated: MealPlan | null = null;

  state.mealPlans = state.mealPlans.map((plan) => {
    if (plan.patientId !== patientId) return plan;

    if (status === "ativo" && plan.id !== planId && plan.status === "ativo") {
      return {
        ...plan,
        status: "rascunho",
        updatedAt: new Date().toISOString()
      };
    }

    if (plan.id !== planId) return plan;

    updated = {
      ...plan,
      status,
      updatedAt: new Date().toISOString()
    };

    return updated;
  });

  return updated;
}

export async function createConsultation(payload: Consultation) {
  const state = getState();

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
