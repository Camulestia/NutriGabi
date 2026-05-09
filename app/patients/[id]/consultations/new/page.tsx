import { notFound } from "next/navigation";

import { ConsultationWizardV3 } from "@/components/consultation/consultation-wizard-v3";
import { requireUser } from "@/lib/clerk-auth";
import { requireCompletedOnboarding } from "@/lib/onboarding";
import { getPatientById } from "@/lib/services/repository";
import { Consultation } from "@/lib/types";

function buildInitialConsultation(patientId: string): Consultation {
  return {
    id: `cons-${Date.now()}`,
    patientId,
    createdAt: new Date().toISOString(),
    visitReason: "Retorno",
    objective: "",
    chiefComplaint: "",
    anamnesis: {
      recall24h: "",
      foodFrequency: "",
      waterIntake: "",
      foodRestriction: "",
      vegetarianPattern: "",
      celiacDisease: "",
      supplements: "",
      gastrointestinalSymptoms: "",
      sleep: "",
      physicalActivity: ""
    },
    anthropometry: {
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
    },
    semiology: {
      hairs: { label: "Cabelos", severity: "normal", observation: "" },
      skin: { label: "Pele", severity: "normal", observation: "" },
      nails: { label: "Unhas", severity: "normal", observation: "" },
      oralMucosa: { label: "Mucosa oral", severity: "normal", observation: "" },
      eyes: { label: "Olhos", severity: "normal", observation: "" },
      edema: { label: "Edema", severity: "normal", observation: "" },
      muscleMass: { label: "Massa muscular", severity: "normal", observation: "" },
      adiposeTissue: { label: "Tecido adiposo", severity: "normal", observation: "" }
    },
    bioimpedance: {
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
    },
    labExam: {
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
    },
    professionalDiagnosis: "",
    conduct: "",
    goals: "",
    followUp: "",
    patientNotes: "",
    internalNotes: "",
    nextVisitPriorities: ""
  };
}

export default async function NewConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  await requireCompletedOnboarding();
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) notFound();

  return (
    <ConsultationWizardV3
      patient={patient}
      initialConsultation={buildInitialConsultation(patient.id)}
      draftKey={`consultation-draft-new-${patient.id}`}
    />
  );
}
