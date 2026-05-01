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

export type MealPlanStatus = "rascunho" | "ativo" | "arquivado";

export type MealPlanStrategy =
  | "emagrecimento"
  | "hipertrofia"
  | "manutenção"
  | "performance"
  | "saúde metabólica"
  | "saúde intestinal"
  | "reeducação alimentar";

export type FoodTag =
  | "proteína"
  | "carboidrato"
  | "gordura"
  | "vegetal"
  | "fruta"
  | "laticínio"
  | "bebida"
  | "fibra"
  | "leguminosa";

export type Food = {
  id: string;
  name: string;
  category: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  tags: FoodTag[];
  commonUnits?: Record<string, number>;
};

export type MacroDifference = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Substitution = {
  originalFood: string;
  substituteFood: string;
  originalQuantity: number;
  substituteQuantity: number;
  unit: string;
  macroDifference: MacroDifference;
  reason: string;
};

export type MealItem = {
  id: string;
  foodId?: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibers?: number;
  group: string;
  tags: FoodTag[];
  notes: string;
  substitutions: Substitution[];
};

export type Meal = {
  id: string;
  name: string;
  time: string;
  items: MealItem[];
  notes: string;
  order: number;
};

export type MealPlan = {
  id: string;
  patientId: string;
  consultationId?: string;
  title: string;
  goal: string;
  strategy: MealPlanStrategy;
  status: MealPlanStatus;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: Meal[];
  notes: string;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  professionalReviewRequired: boolean;
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
  preferredFoods: string[];
  rejectedFoods: string[];
  allergies: string[];
  intolerances: string[];
  culturalPreferences: string;
  foodNotes: string;
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
  notes?: string;
};
