import { Prisma } from "@prisma/client";

import {
  AIInterpretation,
  Anamnesis,
  Bioimpedance,
  Consultation,
  LabExam,
  Meal,
  MealPlan,
  Patient,
  ScheduleItem,
  Semiology,
  UserSettings
} from "@/lib/types";

const emptyAnamnesis: Anamnesis = {
  recall24h: "",
  foodFrequency: "",
  waterIntake: "",
  foodRestriction: "",
  vegetarianPattern: "Não",
  celiacDisease: "Não",
  supplements: "",
  gastrointestinalSymptoms: "",
  sleep: "",
  physicalActivity: ""
};

const emptyBioimpedance: Bioimpedance = {
  bodyFatPercent: 0,
  fatMass: 0,
  leanMass: 0,
  muscleMass: 0,
  totalBodyWater: 0,
  intracellularWater: 0,
  extracellularWater: 0,
  visceralFat: 0,
  phaseAngle: 0,
  bmr: 0
};

const emptyLabExam: LabExam = {
  vitaminD: "",
  b12: "",
  iron: "",
  ferritin: "",
  zinc: "",
  folate: "",
  glucose: "",
  insulin: "",
  homaIr: "",
  lipidProfile: "",
  crp: "",
  tshT4: "",
  albumin: "",
  notes: ""
};

const emptySemiology: Semiology = {
  hairs: { label: "Cabelos", severity: "normal", observation: "" },
  skin: { label: "Pele", severity: "normal", observation: "" },
  nails: { label: "Unhas", severity: "normal", observation: "" },
  oralMucosa: { label: "Mucosa oral", severity: "normal", observation: "" },
  eyes: { label: "Olhos", severity: "normal", observation: "" },
  edema: { label: "Edema", severity: "normal", observation: "" },
  muscleMass: { label: "Massa muscular", severity: "normal", observation: "" },
  adiposeTissue: { label: "Tecido adiposo", severity: "normal", observation: "" }
};

function calculateAge(birthDate?: string | null) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

function asTypedObject<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  return {
    ...fallback,
    ...(value as Record<string, unknown>)
  } as T;
}

function asTypedArray<T>(value: Prisma.JsonValue | null | undefined): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as T[];
}

export type PatientFormPayload = Omit<Patient, "id" | "consultations" | "reports">;

export function toPatientCreateInput(userId: string, payload: PatientFormPayload): Prisma.PatientUncheckedCreateInput {
  const birthDate = payload.birthDate ? new Date(payload.birthDate) : null;

  return {
    userId,
    name: payload.name,
    birthDate,
    age: calculateAge(payload.birthDate),
    sex: payload.sex,
    phone: payload.phone,
    email: payload.email || null,
    profession: payload.profession,
    mainGoal: payload.mainObjective,
    mainComplaint: payload.chiefComplaint,
    clinicalHistory: payload.clinicalHistory,
    medications: payload.medications,
    supplements: payload.supplements,
    foodRestrictions: payload.foodRestrictions,
    notes: payload.notes,
    preferredFoods: payload.preferredFoods,
    rejectedFoods: payload.rejectedFoods,
    allergies: payload.allergies,
    intolerances: payload.intolerances,
    culturalPreferences: payload.culturalPreferences,
    foodNotes: payload.foodNotes,
    consentToStoreHealthData: payload.consentToStoreHealthData,
    consentDate: payload.consentDate ? new Date(payload.consentDate) : payload.consentToStoreHealthData ? new Date() : null
  };
}

export function toPatientUpdateInput(payload: PatientFormPayload): Prisma.PatientUncheckedUpdateInput {
  const birthDate = payload.birthDate ? new Date(payload.birthDate) : null;

  return {
    name: payload.name,
    birthDate,
    age: calculateAge(payload.birthDate),
    sex: payload.sex,
    phone: payload.phone,
    email: payload.email || null,
    profession: payload.profession,
    mainGoal: payload.mainObjective,
    mainComplaint: payload.chiefComplaint,
    clinicalHistory: payload.clinicalHistory,
    medications: payload.medications,
    supplements: payload.supplements,
    foodRestrictions: payload.foodRestrictions,
    notes: payload.notes,
    preferredFoods: payload.preferredFoods,
    rejectedFoods: payload.rejectedFoods,
    allergies: payload.allergies,
    intolerances: payload.intolerances,
    culturalPreferences: payload.culturalPreferences,
    foodNotes: payload.foodNotes,
    consentToStoreHealthData: payload.consentToStoreHealthData,
    consentDate: payload.consentDate ? new Date(payload.consentDate) : payload.consentToStoreHealthData ? new Date() : null
  };
}

export function toConsultationCreateInput(userId: string, payload: Consultation): Prisma.ConsultationUncheckedCreateInput {
  return {
    id: payload.id,
    userId,
    patientId: payload.patientId,
    consultationDate: new Date(payload.createdAt),
    reason: payload.visitReason ?? null,
    mainComplaint: payload.chiefComplaint,
    mainGoal: payload.objective,
    anamnesis: payload.anamnesis as Prisma.InputJsonValue,
    anthropometry: payload.anthropometry as Prisma.InputJsonValue,
    semiology: payload.semiology as Prisma.InputJsonValue,
    bioimpedance: payload.bioimpedance as Prisma.InputJsonValue,
    labExams: payload.labExam as Prisma.InputJsonValue,
    aiInterpretation: payload.aiInterpretation ? (payload.aiInterpretation as Prisma.InputJsonValue) : Prisma.JsonNull,
    professionalAssessment: {
      professionalDiagnosis: payload.professionalDiagnosis,
      conduct: payload.conduct,
      goals: payload.goals,
      followUp: payload.followUp,
      patientNotes: payload.patientNotes ?? "",
      internalNotes: payload.internalNotes ?? "",
      nextVisitPriorities: payload.nextVisitPriorities ?? ""
    } as Prisma.InputJsonValue
  };
}

export function toConsultationUpdateInput(payload: Consultation): Prisma.ConsultationUncheckedUpdateInput {
  return {
    consultationDate: new Date(payload.createdAt),
    reason: payload.visitReason ?? null,
    mainComplaint: payload.chiefComplaint,
    mainGoal: payload.objective,
    anamnesis: payload.anamnesis as Prisma.InputJsonValue,
    anthropometry: payload.anthropometry as Prisma.InputJsonValue,
    semiology: payload.semiology as Prisma.InputJsonValue,
    bioimpedance: payload.bioimpedance as Prisma.InputJsonValue,
    labExams: payload.labExam as Prisma.InputJsonValue,
    aiInterpretation: payload.aiInterpretation ? (payload.aiInterpretation as Prisma.InputJsonValue) : Prisma.JsonNull,
    professionalAssessment: {
      professionalDiagnosis: payload.professionalDiagnosis,
      conduct: payload.conduct,
      goals: payload.goals,
      followUp: payload.followUp,
      patientNotes: payload.patientNotes ?? "",
      internalNotes: payload.internalNotes ?? "",
      nextVisitPriorities: payload.nextVisitPriorities ?? ""
    } as Prisma.InputJsonValue
  };
}

export function toMealPlanCreateInput(userId: string, payload: MealPlan): Prisma.MealPlanUncheckedCreateInput {
  return {
    id: payload.id,
    userId,
    patientId: payload.patientId,
    consultationId: payload.consultationId ?? null,
    title: payload.title,
    goal: payload.goal,
    strategy: payload.strategy,
    status: payload.status,
    targetCalories: payload.targetCalories,
    targetProtein: payload.targetProtein,
    targetCarbs: payload.targetCarbs,
    targetFat: payload.targetFat,
    meals: payload.meals as Prisma.InputJsonValue,
    notes: payload.notes,
    internalNotes: payload.internalNotes,
    professionalReviewRequired: payload.professionalReviewRequired,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt)
  };
}

export function toMealPlanUpdateInput(payload: MealPlan): Prisma.MealPlanUncheckedUpdateInput {
  return {
    consultationId: payload.consultationId ?? null,
    title: payload.title,
    goal: payload.goal,
    strategy: payload.strategy,
    status: payload.status,
    targetCalories: payload.targetCalories,
    targetProtein: payload.targetProtein,
    targetCarbs: payload.targetCarbs,
    targetFat: payload.targetFat,
    meals: payload.meals as Prisma.InputJsonValue,
    notes: payload.notes,
    internalNotes: payload.internalNotes,
    professionalReviewRequired: payload.professionalReviewRequired,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt)
  };
}

export function toAppointmentCreateInput(userId: string, payload: Omit<ScheduleItem, "id" | "patientName"> & { patientName: string }): Prisma.AppointmentUncheckedCreateInput {
  return {
    userId,
    patientId: payload.patientId,
    patientName: payload.patientName,
    date: new Date(payload.date),
    time: payload.time,
    reason: payload.reason,
    type: payload.type,
    status: payload.status,
    notes: payload.notes ?? null,
    consultationId: undefined
  } as Prisma.AppointmentUncheckedCreateInput;
}

export function mapConsultationRecord(record: {
  id: string;
  patientId: string;
  consultationDate: Date;
  reason: string | null;
  mainComplaint: string;
  mainGoal: string;
  anamnesis: Prisma.JsonValue;
  anthropometry: Prisma.JsonValue;
  semiology: Prisma.JsonValue;
  bioimpedance: Prisma.JsonValue;
  labExams: Prisma.JsonValue;
  aiInterpretation: Prisma.JsonValue | null;
  professionalAssessment: Prisma.JsonValue;
}): Consultation {
  const assessment = asTypedObject<{
    professionalDiagnosis: string;
    conduct: string;
    goals: string;
    followUp: string;
    patientNotes?: string;
    internalNotes?: string;
    nextVisitPriorities?: string;
  }>(record.professionalAssessment, {
    professionalDiagnosis: "",
    conduct: "",
    goals: "",
    followUp: "",
    patientNotes: "",
    internalNotes: "",
    nextVisitPriorities: ""
  });

  return {
    id: record.id,
    patientId: record.patientId,
    createdAt: record.consultationDate.toISOString(),
    visitReason: record.reason ?? undefined,
    objective: record.mainGoal,
    chiefComplaint: record.mainComplaint,
    anamnesis: asTypedObject(record.anamnesis, emptyAnamnesis),
    anthropometry: asTypedObject(record.anthropometry, {
      currentWeight: 0,
      habitualWeight: 0,
      desiredWeight: 0,
      height: 0,
      waist: 0,
      hip: 0,
      arm: 0,
      calf: 0,
      wrist: 0,
      skinfolds: {
        tricipital: 0,
        subscapular: 0,
        suprailiac: 0,
        abdominal: 0
      }
    }),
    semiology: asTypedObject(record.semiology, emptySemiology),
    bioimpedance: asTypedObject(record.bioimpedance, emptyBioimpedance),
    labExam: asTypedObject(record.labExams, emptyLabExam),
    aiInterpretation: record.aiInterpretation ? asTypedObject<AIInterpretation>(record.aiInterpretation, {
      summary: "",
      keyFindings: [],
      nutritionalRisks: [],
      possibleDeficiencies: [],
      correlations: [],
      attentionPoints: [],
      conductSuggestions: [],
      nextConsultationSuggestions: [],
      generatedAt: ""
    }) : undefined,
    professionalDiagnosis: assessment.professionalDiagnosis,
    conduct: assessment.conduct,
    goals: assessment.goals,
    followUp: assessment.followUp,
    patientNotes: assessment.patientNotes ?? "",
    internalNotes: assessment.internalNotes ?? "",
    nextVisitPriorities: assessment.nextVisitPriorities ?? ""
  };
}

export function mapPatientRecord(record: {
  id: string;
  name: string;
  birthDate: Date | null;
  sex: string;
  phone: string;
  email: string | null;
  profession: string;
  mainGoal: string;
  mainComplaint: string;
  clinicalHistory: string;
  medications: string;
  supplements: string;
  foodRestrictions: string;
  preferredFoods: string[];
  rejectedFoods: string[];
  allergies: string[];
  intolerances: string[];
  culturalPreferences: string;
  foodNotes: string;
  consentToStoreHealthData: boolean;
  consentDate: Date | null;
  deletedAt: Date | null;
  notes: string;
  consultations: Array<Parameters<typeof mapConsultationRecord>[0]>;
  reports: Array<{ id: string; consultationId: string | null; createdAt: Date; title: string }>;
}): Patient {
  return {
    id: record.id,
    name: record.name,
    birthDate: record.birthDate ? record.birthDate.toISOString().slice(0, 10) : "",
    sex: (record.sex || "Outro") as Patient["sex"],
    phone: record.phone,
    email: record.email ?? "",
    profession: record.profession,
    mainObjective: record.mainGoal,
    chiefComplaint: record.mainComplaint,
    clinicalHistory: record.clinicalHistory,
    medications: record.medications,
    supplements: record.supplements,
    foodRestrictions: record.foodRestrictions,
    preferredFoods: record.preferredFoods,
    rejectedFoods: record.rejectedFoods,
    allergies: record.allergies,
    intolerances: record.intolerances,
    culturalPreferences: record.culturalPreferences,
    foodNotes: record.foodNotes,
    consentToStoreHealthData: record.consentToStoreHealthData,
    consentDate: record.consentDate ? record.consentDate.toISOString() : undefined,
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : undefined,
    notes: record.notes,
    consultations: record.consultations.map(mapConsultationRecord),
    reports: record.reports.map((report) => ({
      id: report.id,
      consultationId: report.consultationId ?? "",
      createdAt: report.createdAt.toISOString(),
      title: report.title
    }))
  };
}

export function mapAppointmentRecord(record: {
  id: string;
  patientId: string;
  patientName: string;
  date: Date;
  time: string;
  reason: string | null;
  type: string;
  status: string;
  notes: string | null;
  consultationId?: string | null;
}): ScheduleItem {
  return {
    id: record.id,
    patientId: record.patientId,
    patientName: record.patientName,
    consultationId: record.consultationId ?? undefined,
    date: record.date.toISOString().slice(0, 10),
    time: record.time,
    reason: record.reason ?? "",
    type: record.type as ScheduleItem["type"],
    status: record.status as ScheduleItem["status"],
    notes: record.notes ?? undefined
  };
}

export function mapMealPlanRecord(record: {
  id: string;
  patientId: string;
  consultationId: string | null;
  title: string;
  goal: string;
  strategy: string;
  status: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: Prisma.JsonValue;
  notes: string;
  internalNotes: string;
  professionalReviewRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MealPlan {
  return {
    id: record.id,
    patientId: record.patientId,
    consultationId: record.consultationId ?? undefined,
    title: record.title,
    goal: record.goal,
    strategy: record.strategy as MealPlan["strategy"],
    status: record.status as MealPlan["status"],
    targetCalories: record.targetCalories,
    targetProtein: record.targetProtein,
    targetCarbs: record.targetCarbs,
    targetFat: record.targetFat,
    meals: asTypedArray<Meal>(record.meals),
    notes: record.notes,
    internalNotes: record.internalNotes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    professionalReviewRequired: record.professionalReviewRequired
  };
}

export function buildConsultationReportContent(patient: Patient, consultation: Consultation) {
  return {
    patient: {
      id: patient.id,
      name: patient.name,
      mainObjective: patient.mainObjective
    },
    consultation: {
      id: consultation.id,
      consultationDate: consultation.createdAt,
      reason: consultation.visitReason ?? "",
      mainComplaint: consultation.chiefComplaint,
      mainGoal: consultation.objective,
      anthropometry: consultation.anthropometry,
      bioimpedance: consultation.bioimpedance,
      semiology: consultation.semiology,
      labExam: consultation.labExam,
      aiInterpretation: consultation.aiInterpretation,
      professionalAssessment: {
        professionalDiagnosis: consultation.professionalDiagnosis,
        conduct: consultation.conduct,
        goals: consultation.goals,
        followUp: consultation.followUp,
        patientNotes: consultation.patientNotes ?? "",
        nextVisitPriorities: consultation.nextVisitPriorities ?? ""
      }
    }
  };
}

export function mapUserSettings(record: {
  name: string;
  email: string;
  plan: string;
  crn: string | null;
  clinicName: string | null;
  professionalPhone: string | null;
  clinicLogoUrl: string | null;
  specialty: string | null;
  reportSignature: string | null;
  defaultReturnInterval: number;
  defaultConsultationTime: string;
  defaultPdfFooter: string;
  locale: string;
  onboardingCompleted: boolean;
  acceptedTermsAt: Date | null;
}): UserSettings {
  return {
    name: record.name,
    email: record.email,
    plan: (record.plan || "free") as UserSettings["plan"],
    crn: record.crn ?? "",
    clinicName: record.clinicName ?? "",
    professionalPhone: record.professionalPhone ?? "",
    clinicLogoUrl: record.clinicLogoUrl ?? "",
    specialty: (record.specialty ?? "") as UserSettings["specialty"],
    reportSignature: record.reportSignature ?? "",
    defaultReturnInterval: record.defaultReturnInterval,
    defaultConsultationTime: record.defaultConsultationTime,
    defaultPdfFooter: record.defaultPdfFooter,
    locale: "pt-BR",
    onboardingCompleted: record.onboardingCompleted,
    acceptedTermsAt: record.acceptedTermsAt?.toISOString()
  };
}
