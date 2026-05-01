import { mockPatients } from "@/lib/mock/data";
import { Consultation, Patient } from "@/lib/types";

let patientsStore = structuredClone(mockPatients) as Patient[];

export async function listPatients() {
  return patientsStore;
}

export async function getPatientById(id: string) {
  return patientsStore.find((patient) => patient.id === id) ?? null;
}

export async function getConsultationById(patientId: string, consultationId: string) {
  const patient = patientsStore.find((item) => item.id === patientId);
  if (!patient) return null;

  return patient.consultations.find((consultation) => consultation.id === consultationId) ?? null;
}

export async function createPatient(patient: Omit<Patient, "consultations" | "reports">) {
  const newPatient: Patient = {
    ...patient,
    consultations: [],
    reports: []
  };
  patientsStore = [newPatient, ...patientsStore];
  return newPatient;
}

export async function createConsultation(payload: Consultation) {
  patientsStore = patientsStore.map((patient) => {
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

  return payload;
}
