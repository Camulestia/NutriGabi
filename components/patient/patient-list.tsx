import Link from "next/link";
import { ArrowRight, Plus, Stethoscope } from "lucide-react";

import { PatientIntakeForm } from "@/components/patient/patient-intake-form";
import { calculateAnthropometricMetrics } from "@/lib/anthropometry";
import { Patient } from "@/lib/types";
import { calculateAge } from "@/lib/utils";

export function PatientList({ patients }: { patients: Patient[] }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel overflow-hidden rounded-[2rem] border p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-moss/70">Painel clínico</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-moss">
                Atendimento nutricional com jornada guiada, cálculo automático e interpretação assistida.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70">
                O MVP prioriza operação rápida em consultório: cadastro do paciente, nova avaliação, leitura antropométrica,
                IA clínica com linguagem segura e relatório profissional em PDF.
              </p>
            </div>

            <Link
              href="/patients/pat-001/consultations/new"
              className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-medium text-white transition hover:bg-[#163f39]"
            >
              <Plus className="h-4 w-4" />
              Nova avaliação
            </Link>
          </div>
        </div>

        <div className="panel rounded-[2rem] border p-6">
          <p className="text-sm uppercase tracking-[0.28em] text-moss/70">Resumo do MVP</p>
          <div className="mt-6 grid gap-4">
            {[
              "Prontuário por paciente",
              "Wizard por etapas com autosave",
              "Interpretação IA com fallback local",
              "Relatório PDF e evolução visual"
            ].map((item) => (
              <div key={item} className="rounded-3xl bg-sand p-4 text-sm text-ink/75">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <PatientIntakeForm />

      <section className="grid gap-5 xl:grid-cols-2">
        {patients.map((patient) => {
          const latest = patient.consultations[0];
          const metrics = latest ? calculateAnthropometricMetrics(latest.anthropometry) : null;

          return (
            <article key={patient.id} className="panel rounded-[2rem] border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-moss/70">{patient.profession}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-moss">{patient.name}</h3>
                  <p className="mt-2 text-sm text-ink/70">
                    {calculateAge(patient.birthDate)} anos • {patient.sex} • {patient.phone}
                  </p>
                </div>
                <div className="rounded-full bg-sage p-3 text-moss">
                  <Stethoscope className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl bg-sand p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-moss/60">Objetivo principal</p>
                  <p className="mt-2 text-sm leading-6 text-ink/75">{patient.mainObjective}</p>
                </div>
                <div className="rounded-3xl bg-white/70 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-moss/60">Última leitura</p>
                  {metrics ? (
                    <div className="mt-2 space-y-1 text-sm text-ink/75">
                      <p>IMC: {metrics.bmi.toFixed(1)}</p>
                      <p>RCQ: {metrics.waistHipRatio.toFixed(2)}</p>
                      <p>Alertas: {metrics.alerts.length || 0}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-ink/60">Sem consulta registrada.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/patients/${patient.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-moss/20 bg-white px-4 py-2 text-sm text-moss transition hover:bg-sage"
                >
                  Ver perfil
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/patients/${patient.id}/consultations/new`}
                  className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm text-ink transition hover:opacity-90"
                >
                  Nova consulta
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
