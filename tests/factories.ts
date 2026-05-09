import { BillingSummary, Consultation, MealPlan, Patient, ScheduleItem, UserSettings } from "@/lib/types";

export function createConsultation(overrides: Partial<Consultation> = {}): Consultation {
  return {
    id: "cons-1",
    patientId: "pat-1",
    createdAt: "2026-05-06T12:00:00.000Z",
    visitReason: "Retorno",
    objective: "Emagrecimento",
    chiefComplaint: "Inchaço abdominal",
    anamnesis: {
      recall24h: "Café, almoço e jantar",
      foodFrequency: "3 refeições",
      waterIntake: "2 L/dia",
      foodRestriction: "Nenhuma",
      vegetarianPattern: "Não",
      celiacDisease: "Não",
      supplements: "Creatina",
      gastrointestinalSymptoms: "Distensão leve",
      sleep: "7 horas",
      physicalActivity: "Musculação"
    },
    anthropometry: {
      currentWeight: 72,
      habitualWeight: 74,
      desiredWeight: 68,
      height: 1.65,
      waist: 88,
      hip: 104,
      arm: 31,
      calf: 37,
      wrist: 16,
      skinfolds: {
        tricipital: 20,
        subscapular: 18,
        suprailiac: 22,
        abdominal: 24
      }
    },
    semiology: {
      hairs: { label: "Cabelos", severity: "normal", observation: "" },
      skin: { label: "Pele", severity: "normal", observation: "" },
      nails: { label: "Unhas", severity: "normal", observation: "" },
      oralMucosa: { label: "Mucosa oral", severity: "normal", observation: "" },
      eyes: { label: "Olhos", severity: "normal", observation: "" },
      edema: { label: "Edema", severity: "normal", observation: "" },
      muscleMass: { label: "Massa muscular", severity: "leve", observation: "Leve redução percebida" },
      adiposeTissue: { label: "Tecido adiposo", severity: "moderado", observation: "Acúmulo abdominal" }
    },
    bioimpedance: {
      bodyFatPercent: 31,
      fatMass: 22,
      leanMass: 50,
      muscleMass: 27,
      totalBodyWater: 34,
      intracellularWater: 20,
      extracellularWater: 14,
      visceralFat: 12,
      phaseAngle: 5.8,
      bmr: 1450
    },
    labExam: {
      vitaminD: "24 ng/mL",
      b12: "410 pg/mL",
      iron: "85 ug/dL",
      ferritin: "45 ng/mL",
      zinc: "80 ug/dL",
      folate: "6 ng/mL",
      glucose: "92 mg/dL",
      insulin: "11 uIU/mL",
      homaIr: "2,5",
      lipidProfile: "LDL 125 mg/dL",
      crp: "0,4 mg/dL",
      tshT4: "Normal",
      albumin: "4,2 g/dL",
      notes: "Sem observações adicionais"
    },
    professionalDiagnosis: "",
    conduct: "",
    goals: "",
    followUp: "",
    aiInterpretation: {
      summary: "Resumo clínico assistido.",
      keyFindings: ["IMC elevado."],
      nutritionalRisks: ["Risco metabólico aumentado."],
      possibleDeficiencies: ["Avaliar vitamina D."],
      correlations: ["Sintomas podem estar associados ao padrão alimentar."],
      attentionPoints: ["Reforçar hidratação."],
      conductSuggestions: ["Organizar refeições."],
      nextConsultationSuggestions: ["Reavaliar cintura e bioimpedância."],
      generatedAt: "2026-05-06T12:00:00.000Z"
    },
    ...overrides
  };
}

export function createPatient(overrides: Partial<Patient> = {}): Patient {
  const consultation = overrides.consultations?.[0] ?? createConsultation();
  return {
    id: "pat-1",
    name: "Maria Silva",
    birthDate: "1990-01-01",
    sex: "Feminino",
    phone: "(85) 99999-0000",
    email: "maria@example.com",
    profession: "Professora",
    mainObjective: "Emagrecimento",
    chiefComplaint: "Inchaço abdominal",
    clinicalHistory: "Sem histórico relevante",
    medications: "Nenhum",
    supplements: "Creatina",
    foodRestrictions: "Nenhuma",
    preferredFoods: ["ovo", "frango"],
    rejectedFoods: ["fígado"],
    allergies: ["camarão"],
    intolerances: ["lactose"],
    culturalPreferences: "",
    foodNotes: "Prefere refeições simples",
    consentToStoreHealthData: true,
    consentDate: "2026-05-01T10:00:00.000Z",
    notes: "Paciente organizada",
    deletedAt: undefined,
    consultations: [consultation],
    reports: [
      {
        id: "rep-1",
        consultationId: consultation.id,
        createdAt: consultation.createdAt,
        title: "Relatório 06/05/2026"
      }
    ],
    ...overrides
  };
}

export function createScheduleItem(overrides: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    id: "sched-1",
    patientId: "pat-1",
    patientName: "Maria Silva",
    consultationId: "cons-1",
    date: "2026-05-06",
    time: "08:00",
    reason: "Retorno",
    type: "retorno",
    status: "agendada",
    notes: "",
    ...overrides
  };
}

export function createMealPlan(overrides: Partial<MealPlan> = {}): MealPlan {
  return {
    id: "plan-1",
    patientId: "pat-1",
    consultationId: "cons-1",
    title: "Plano alimentar",
    goal: "Redução de gordura corporal",
    strategy: "emagrecimento",
    status: "rascunho",
    targetCalories: 1800,
    targetProtein: 140,
    targetCarbs: 180,
    targetFat: 55,
    meals: [],
    notes: "Plano inicial",
    internalNotes: "",
    createdAt: "2026-05-06T12:00:00.000Z",
    updatedAt: "2026-05-06T12:00:00.000Z",
    professionalReviewRequired: true,
    ...overrides
  };
}

export function createBillingSummary(overrides: Partial<BillingSummary> = {}): BillingSummary {
  return {
    plan: "free",
    status: "inactive",
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    patientCount: 2,
    patientLimit: 5,
    canCreatePatient: true,
    access: {
      plan: "free",
      patientLimit: 5,
      canUseAdvancedAgenda: false,
      canUseMealPlans: false,
      canExportPdf: false,
      canUseFullReports: false
    },
    ...overrides
  };
}

export function createUserSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    name: "Nutri Exemplo",
    email: "nutri@example.com",
    plan: "pro",
    crn: "",
    clinicName: "",
    professionalPhone: "",
    clinicLogoUrl: "",
    specialty: "nutrição clínica",
    reportSignature: "Nutri Exemplo",
    defaultReturnInterval: 30,
    defaultConsultationTime: "08:00",
    defaultPdfFooter: "Documento para uso clínico.",
    locale: "pt-BR",
    onboardingCompleted: true,
    ...overrides
  };
}
