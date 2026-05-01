import { notFound } from "next/navigation";

import { PatientProfileV2 } from "@/components/patient/patient-profile-v2";
import { calculateAnthropometricMetrics } from "@/lib/anthropometry";
import { getPatientById } from "@/lib/services/repository";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) notFound();

  const latest = patient.consultations[0];
  const history = patient.consultations.map((consultation) => ({
    consultation,
    bmi: calculateAnthropometricMetrics(consultation.anthropometry).bmi
  }));

  const evolutionData = patient.consultations
    .slice()
    .reverse()
    .map((consultation) => {
      const metrics = calculateAnthropometricMetrics(consultation.anthropometry);
      return {
        date: formatDate(consultation.createdAt),
        weight: consultation.anthropometry.currentWeight,
        bmi: Number(metrics.bmi.toFixed(1)),
        waist: consultation.anthropometry.waist,
        bodyFatPercent: consultation.bioimpedance.bodyFatPercent,
        leanMass: consultation.bioimpedance.leanMass,
        calf: consultation.anthropometry.calf,
        phaseAngle: consultation.bioimpedance.phaseAngle
      };
    });

  const alertItems = latest
    ? calculateAnthropometricMetrics(latest.anthropometry).alerts.map((label) => ({
        label,
        tone: label.includes("extrema") ? ("rose" as const) : ("amber" as const)
      }))
    : [];

  return <PatientProfileV2 patient={patient} latest={latest} history={history} evolutionData={evolutionData} alertItems={alertItems} />;
}
