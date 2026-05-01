import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";

import { OverviewDashboard } from "@/components/patient/overview-dashboard";
import { PatientIntakeFormV2 } from "@/components/patient/patient-intake-form-v2";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Section } from "@/components/ui/section";
import { calculateAnthropometricMetrics } from "@/lib/anthropometry";
import { Patient } from "@/lib/types";
import { calculateAge } from "@/lib/utils";

export function PatientListV2({ patients, mode = "overview" }: { patients: Patient[]; mode?: "overview" | "patients" }) {
  return (
    <div className="space-y-6">
      {mode === "overview" ? <OverviewDashboard patients={patients} /> : null}

      <PatientIntakeFormV2 />

      <Section
        className="scroll-mt-24"
        eyebrow="Pacientes"
        title="Prontuários ativos"
        description="Cartões compactos com contexto clínico e acesso rápido ao perfil e à próxima consulta."
      >
        <div id="pacientes" className="grid gap-5 xl:grid-cols-2">
          {patients.map((patient) => {
            const latest = patient.consultations[0];
            const metrics = latest ? calculateAnthropometricMetrics(latest.anthropometry) : null;

            return (
              <Card key={patient.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{patient.profession}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{patient.name}</h3>
                    <p className="mt-2 text-sm text-muted">
                      {calculateAge(patient.birthDate)} anos • {patient.sex} • {patient.phone}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage text-moss">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-[#caece6] bg-[#effbf8] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Objetivo principal</p>
                    <p className="mt-3 text-base font-semibold leading-7 text-ink">{patient.mainObjective}</p>
                    <p className="mt-1 text-sm text-muted">Foco atual do plano nutricional</p>
                  </div>
                  {metrics ? (
                    <MetricCard
                      label="Última leitura"
                      value={`IMC ${metrics.bmi.toFixed(1)}`}
                      subtitle={`RCQ ${metrics.waistHipRatio.toFixed(2)} • ${metrics.alerts.length} alerta(s)`}
                    />
                  ) : (
                    <MetricCard label="Última leitura" value="Sem consulta" subtitle="Ainda não há avaliação registrada." />
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/patients/${patient.id}`}
                    aria-label={`Abrir perfil de ${patient.name}`}
                    className={buttonStyles({ variant: "secondary" })}
                  >
                    Ver perfil
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/patients/${patient.id}/consultations/new`}
                    aria-label={`Iniciar nova consulta para ${patient.name}`}
                    className={buttonStyles({})}
                  >
                    Nova avaliação
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
