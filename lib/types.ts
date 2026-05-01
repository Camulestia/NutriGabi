export type Severity = "normal" | "leve" | "moderado" | "grave";

export type Anthropometry = {
  currentWeight: number;
  habitualWeight: number;
  desiredWeight: number;
  height: number;
  waist: number;
  hip: number;
  arm: number;
  calf: number;
  wrist: number;
  skinfolds: {
    tricipital: number;
    subscapular: number;
    suprailiac: number;
    abdominal: number;
  };
};

export type Anamnesis = {
  recall24h: string;
  foodFrequency: string;
  waterIntake: string;
  foodRestriction: string;
  vegetarianPattern: string;
  celiacDisease: string;
  supplements: string;
  gastrointestinalSymptoms: string;
  sleep: string;
  physicalActivity: string;
};

export type SemiologyItem = {
  label: string;
  severity: Severity;
  observation: string;
};

export type Semiology = {
  hairs: SemiologyItem;
  skin: SemiologyItem;
  nails: SemiologyItem;
  oralMucosa: SemiologyItem;
  eyes: SemiologyItem;
  edema: SemiologyItem;
  muscleMass: SemiologyItem;
  adiposeTissue: SemiologyItem;
};

export type Bioimpedance = {
  bodyFatPercent: number;
  fatMass: number;
  leanMass: number;
  muscleMass: number;
  totalBodyWater: number;
  intracellularWater: number;
  extracellularWater: number;
  visceralFat: number;
  phaseAngle: number;
  bmr: number;
};

export type LabExam = {
  vitaminD: string;
  b12: string;
  iron: string;
  ferritin: string;
  zinc: string;
  folate: string;
  glucose: string;
  insulin: string;
  homaIr: string;
  lipidProfile: string;
  crp: string;
  tshT4: string;
  albumin: string;
  notes: string;
};

export type AIInterpretation = {
  summary: string;
  keyFindings: string[];
  nutritionalRisks: string[];
  possibleDeficiencies: string[];
  correlations: string[];
  attentionPoints: string[];
  conductSuggestions: string[];
  nextConsultationSuggestions: string[];
  generatedAt: string;
};

export type Consultation = {
  id: string;
  patientId: string;
  createdAt: string;
  visitReason?: string;
  objective: string;
  chiefComplaint: string;
  anamnesis: Anamnesis;
  anthropometry: Anthropometry;
  semiology: Semiology;
  bioimpedance: Bioimpedance;
  labExam: LabExam;
  aiInterpretation?: AIInterpretation;
  professionalDiagnosis: string;
  conduct: string;
  goals: string;
  followUp: string;
  patientNotes?: string;
  internalNotes?: string;
  nextVisitPriorities?: string;
};

export type Patient = {
  id: string;
  name: string;
  birthDate: string;
  sex: "Feminino" | "Masculino" | "Outro";
  phone: string;
  email: string;
  profession: string;
  mainObjective: string;
  chiefComplaint: string;
  clinicalHistory: string;
  medications: string;
  supplements: string;
  foodRestrictions: string;
  notes: string;
  consultations: Consultation[];
  reports: {
    id: string;
    consultationId: string;
    createdAt: string;
    title: string;
  }[];
};

export type AnthropometricMetrics = {
  bmi: number;
  bmiClassification: string;
  waistHipRatio: number;
  waistHipRisk: string;
  weightLossPercent: number;
  idealWeight: number;
  weightAdequacy: number;
  estimatedBodyFatPercent: number;
  alerts: string[];
};

export type EvolutionPoint = {
  date: string;
  weight: number;
  bmi: number;
  waist: number;
  bodyFatPercent: number;
  leanMass: number;
  calf: number;
  phaseAngle: number;
};

export type ScheduleStatus = "agendada" | "concluída" | "cancelada";

export type ScheduleType = "primeira consulta" | "retorno" | "avaliação" | "reavaliação" | "ajuste de plano alimentar";

export type ScheduleItem = {
  id: string;
  patientId: string;
  patientName: string;
  consultationId?: string;
  date: string;
  time: string;
  reason: string;
  type: ScheduleType;
  status: ScheduleStatus;
};
