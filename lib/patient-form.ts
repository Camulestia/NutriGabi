import { Patient } from "@/lib/types";

export type PatientFormState = {
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
  preferredFoods: string;
  rejectedFoods: string;
  allergies: string;
  intolerances: string;
  culturalPreferences: string;
  foodNotes: string;
  notes: string;
  consentToStoreHealthData: boolean;
  consentDate: string;
};

export const initialPatientFormState: PatientFormState = {
  name: "",
  birthDate: "",
  sex: "Feminino",
  phone: "",
  email: "",
  profession: "",
  mainObjective: "",
  chiefComplaint: "",
  clinicalHistory: "",
  medications: "",
  supplements: "",
  foodRestrictions: "",
  preferredFoods: "",
  rejectedFoods: "",
  allergies: "",
  intolerances: "",
  culturalPreferences: "",
  foodNotes: "",
  notes: "",
  consentToStoreHealthData: false,
  consentDate: ""
};

export function listToText(values: string[]) {
  return values.join(", ");
}

export function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toPatientFormState(patient?: Patient): PatientFormState {
  if (!patient) return initialPatientFormState;

  return {
    name: patient.name,
    birthDate: patient.birthDate,
    sex: patient.sex,
    phone: patient.phone,
    email: patient.email,
    profession: patient.profession,
    mainObjective: patient.mainObjective,
    chiefComplaint: patient.chiefComplaint,
    clinicalHistory: patient.clinicalHistory,
    medications: patient.medications,
    supplements: patient.supplements,
    foodRestrictions: patient.foodRestrictions,
    preferredFoods: listToText(patient.preferredFoods),
    rejectedFoods: listToText(patient.rejectedFoods),
    allergies: listToText(patient.allergies),
    intolerances: listToText(patient.intolerances),
    culturalPreferences: patient.culturalPreferences,
    foodNotes: patient.foodNotes,
    notes: patient.notes,
    consentToStoreHealthData: patient.consentToStoreHealthData,
    consentDate: patient.consentDate ? patient.consentDate.slice(0, 10) : ""
  };
}

export function getEmailWarning(email: string) {
  if (!email.trim()) return null;
  return email.includes("@") ? null : "E-mail parece inválido. Verifique se contém @.";
}

export function validatePatientForm(form: Pick<PatientFormState, "name" | "birthDate">) {
  if (!form.name.trim()) return "Informe o nome do paciente.";
  if (!form.birthDate.trim()) return "Informe a data de nascimento.";
  return null;
}
