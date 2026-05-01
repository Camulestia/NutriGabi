"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Save } from "lucide-react";

import { calculateAnthropometricMetrics } from "@/lib/anthropometry";
import { Consultation, Patient } from "@/lib/types";
import { cn } from "@/lib/utils";

const steps = [
  "Identificação",
  "Anamnese",
  "Antropometria",
  "Semiologia",
  "Bioimpedância",
  "Exames",
  "Interpretação IA",
  "Relatório final"
] as const;

const numericFields = new Set([
  "currentWeight",
  "habitualWeight",
  "desiredWeight",
  "height",
  "waist",
  "hip",
  "arm",
  "calf",
  "wrist",
  "tricipital",
  "subscapular",
  "suprailiac",
  "abdominal",
  "bodyFatPercent",
  "fatMass",
  "leanMass",
  "muscleMass",
  "totalBodyWater",
  "intracellularWater",
  "extracellularWater",
  "visceralFat",
  "phaseAngle",
  "bmr"
]);

export function ConsultationWizard({ patient, initialConsultation }: { patient: Patient; initialConsultation: Consultation }) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("Rascunho local ativo");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialConsultation);
  const storageKey = `consultation-draft-${patient.id}`;

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      setForm(JSON.parse(raw) as Consultation);
      setStatus("Rascunho recuperado automaticamente");
    }
  }, [storageKey]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(form));
      setStatus(`Salvamento automático às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
    }, 500);
    return () => window.clearTimeout(id);
  }, [form, storageKey]);

  const metrics = useMemo(() => calculateAnthropometricMetrics(form.anthropometry), [form.anthropometry]);

  const updateField = (path: string, value: string) => {
    setForm((current) => {
      const draft = structuredClone(current) as Record<string, unknown>;
      const segments = path.split(".");
      let cursor: Record<string, unknown> = draft;

      for (let index = 0; index < segments.length - 1; index += 1) {
        cursor = cursor[segments[index]] as Record<string, unknown>;
      }

      const key = segments[segments.length - 1];
      cursor[key] = numericFields.has(key) ? Number(value) : value;
      return draft as Consultation;
    });
  };

  const generateInterpretation = async () => {
    setSaving(true);
    const response = await fetch("/api/interpretations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, consultation: form })
    });
    const interpretation = await response.json();
    startTransition(() => {
      setForm((current) => ({ ...current, aiInterpretation: interpretation }));
      setStep(6);
      setSaving(false);
    });
  };

  const saveConsultation = async () => {
    setSaving(true);
    const response = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      window.localStorage.removeItem(storageKey);
      setStatus("Consulta salva com sucesso");
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <section className="panel rounded-[2rem] border p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-moss/70">Consulta em andamento</p>
            <h1 className="mt-2 text-3xl font-semibold text-moss">{patient.name}</h1>
            <p className="mt-2 text-sm text-ink/70">{patient.mainObjective}</p>
          </div>
          <div className="rounded-full bg-sage px-4 py-2 text-sm text-moss">{status}</div>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-sage">
          <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-4 xl:grid-cols-8">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "rounded-2xl px-3 py-3 text-left text-sm transition",
                index === step ? "bg-moss text-white" : "bg-white/70 text-ink hover:bg-sage"
              )}
            >
              <span className="block text-[11px] uppercase tracking-[0.2em] opacity-70">Etapa {index + 1}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="panel rounded-[2rem] border p-6">{renderStep(step, form, updateField, generateInterpretation, saveConsultation, saving, metrics)}</div>

        <aside className="space-y-5">
          <div className="panel rounded-[2rem] border p-5">
            <p className="text-sm uppercase tracking-[0.28em] text-moss/70">Cálculo automático</p>
            <div className="mt-4 grid gap-3">
              <Metric label="IMC" value={`${metrics.bmi.toFixed(1)} • ${metrics.bmiClassification}`} />
              <Metric label="RCQ" value={`${metrics.waistHipRatio.toFixed(2)} • ${metrics.waistHipRisk}`} />
              <Metric label="% perda de peso" value={`${metrics.weightLossPercent.toFixed(1)}%`} />
              <Metric label="Peso ideal estimado" value={`${metrics.idealWeight.toFixed(1)} kg`} />
              <Metric label="Adequação do peso" value={`${metrics.weightAdequacy.toFixed(1)}%`} />
              <Metric label="% gordura estimada" value={`${metrics.estimatedBodyFatPercent.toFixed(1)}%`} />
            </div>
          </div>

          <div className="panel rounded-[2rem] border p-5">
            <p className="text-sm uppercase tracking-[0.28em] text-moss/70">Alertas e atenção</p>
            <div className="mt-4 space-y-3">
              {metrics.alerts.length ? (
                metrics.alerts.map((alert) => (
                  <div key={alert} className="flex gap-3 rounded-3xl bg-[#fff3e8] p-4 text-sm text-ink/80">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#d78331]" />
                    <span>{alert}</span>
                  </div>
                ))
              ) : (
                <div className="flex gap-3 rounded-3xl bg-sage p-4 text-sm text-moss">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Sem alertas antropométricos críticos neste momento.</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          className="inline-flex items-center gap-2 rounded-full border border-moss/20 bg-white px-4 py-2 text-sm text-moss"
        >
          <ArrowLeft className="h-4 w-4" />
          Etapa anterior
        </button>

        <button
          type="button"
          onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}
          className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm text-white"
        >
          Próxima etapa
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function renderStep(
  step: number,
  form: Consultation,
  updateField: (path: string, value: string) => void,
  generateInterpretation: () => Promise<void>,
  saveConsultation: () => Promise<void>,
  saving: boolean,
  metrics: ReturnType<typeof calculateAnthropometricMetrics>
) {
  if (step === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Objetivo da consulta" value={form.objective} onChange={(value) => updateField("objective", value)} />
        <Field label="Queixa principal" value={form.chiefComplaint} onChange={(value) => updateField("chiefComplaint", value)} />
        <Field label="Diagnóstico profissional" value={form.professionalDiagnosis} onChange={(value) => updateField("professionalDiagnosis", value)} />
        <Field label="Conduta" value={form.conduct} onChange={(value) => updateField("conduct", value)} />
        <Field label="Metas" value={form.goals} onChange={(value) => updateField("goals", value)} />
        <Field label="Acompanhamento" value={form.followUp} onChange={(value) => updateField("followUp", value)} />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Recordatório 24h" value={form.anamnesis.recall24h} onChange={(value) => updateField("anamnesis.recall24h", value)} textarea />
        <Field label="Frequência alimentar" value={form.anamnesis.foodFrequency} onChange={(value) => updateField("anamnesis.foodFrequency", value)} textarea />
        <Field label="Consumo de água" value={form.anamnesis.waterIntake} onChange={(value) => updateField("anamnesis.waterIntake", value)} />
        <Field label="Restrição alimentar" value={form.anamnesis.foodRestriction} onChange={(value) => updateField("anamnesis.foodRestriction", value)} />
        <Field label="Vegetariana/vegana" value={form.anamnesis.vegetarianPattern} onChange={(value) => updateField("anamnesis.vegetarianPattern", value)} />
        <Field label="Doença celíaca" value={form.anamnesis.celiacDisease} onChange={(value) => updateField("anamnesis.celiacDisease", value)} />
        <Field label="Suplementos" value={form.anamnesis.supplements} onChange={(value) => updateField("anamnesis.supplements", value)} />
        <Field label="Sintomas gastrointestinais" value={form.anamnesis.gastrointestinalSymptoms} onChange={(value) => updateField("anamnesis.gastrointestinalSymptoms", value)} textarea />
        <Field label="Sono" value={form.anamnesis.sleep} onChange={(value) => updateField("anamnesis.sleep", value)} />
        <Field label="Atividade física" value={form.anamnesis.physicalActivity} onChange={(value) => updateField("anamnesis.physicalActivity", value)} />
      </div>
    );
  }

  if (step === 2) {
    const fields = [
      ["Peso atual (kg)", "anthropometry.currentWeight", form.anthropometry.currentWeight],
      ["Peso habitual (kg)", "anthropometry.habitualWeight", form.anthropometry.habitualWeight],
      ["Peso desejado (kg)", "anthropometry.desiredWeight", form.anthropometry.desiredWeight],
      ["Altura (m)", "anthropometry.height", form.anthropometry.height],
      ["Cintura (cm)", "anthropometry.waist", form.anthropometry.waist],
      ["Quadril (cm)", "anthropometry.hip", form.anthropometry.hip],
      ["Braço (cm)", "anthropometry.arm", form.anthropometry.arm],
      ["Panturrilha (cm)", "anthropometry.calf", form.anthropometry.calf],
      ["Punho (cm)", "anthropometry.wrist", form.anthropometry.wrist],
      ["Dobra tricipital", "anthropometry.skinfolds.tricipital", form.anthropometry.skinfolds.tricipital],
      ["Subescapular", "anthropometry.skinfolds.subscapular", form.anthropometry.skinfolds.subscapular],
      ["Supra-ilíaca", "anthropometry.skinfolds.suprailiac", form.anthropometry.skinfolds.suprailiac],
      ["Abdominal", "anthropometry.skinfolds.abdominal", form.anthropometry.skinfolds.abdominal]
    ] as const;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([label, path, value]) => (
          <Field key={path} label={label} value={String(value)} onChange={(nextValue) => updateField(path, nextValue)} />
        ))}
      </div>
    );
  }

  return <StepRemainder form={form} updateField={updateField} generateInterpretation={generateInterpretation} saveConsultation={saveConsultation} saving={saving} step={step} metrics={metrics} />;
}

function StepRemainder({
  form,
  updateField,
  generateInterpretation,
  saveConsultation,
  saving,
  step,
  metrics
}: {
  form: Consultation;
  updateField: (path: string, value: string) => void;
  generateInterpretation: () => Promise<void>;
  saveConsultation: () => Promise<void>;
  saving: boolean;
  step: number;
  metrics: ReturnType<typeof calculateAnthropometricMetrics>;
}) {
  if (step === 3) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(form.semiology).map(([key, item]) => (
          <div key={key} className="rounded-3xl border border-moss/10 bg-white/70 p-4">
            <p className="text-sm font-medium text-moss">{item.label}</p>
            <select
              className="mt-3 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
              value={item.severity}
              onChange={(event) => updateField(`semiology.${key}.severity`, event.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="grave">Grave</option>
            </select>
            <textarea
              className="mt-3 min-h-24 w-full rounded-2xl border border-moss/15 bg-white px-4 py-3 text-sm"
              value={item.observation}
              onChange={(event) => updateField(`semiology.${key}.observation`, event.target.value)}
            />
          </div>
        ))}
      </div>
    );
  }

  if (step === 4) {
    const fields = [
      ["% gordura", "bioimpedance.bodyFatPercent", form.bioimpedance.bodyFatPercent],
      ["Massa gorda", "bioimpedance.fatMass", form.bioimpedance.fatMass],
      ["Massa magra", "bioimpedance.leanMass", form.bioimpedance.leanMass],
      ["Massa muscular", "bioimpedance.muscleMass", form.bioimpedance.muscleMass],
      ["Água total", "bioimpedance.totalBodyWater", form.bioimpedance.totalBodyWater],
      ["Água intracelular", "bioimpedance.intracellularWater", form.bioimpedance.intracellularWater],
      ["Água extracelular", "bioimpedance.extracellularWater", form.bioimpedance.extracellularWater],
      ["Gordura visceral", "bioimpedance.visceralFat", form.bioimpedance.visceralFat],
      ["Ângulo de fase", "bioimpedance.phaseAngle", form.bioimpedance.phaseAngle],
      ["TMB", "bioimpedance.bmr", form.bioimpedance.bmr]
    ] as const;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([label, path, value]) => (
          <Field key={path} label={label} value={String(value)} onChange={(nextValue) => updateField(path, nextValue)} />
        ))}
      </div>
    );
  }

  if (step === 5) {
    const fields = [
      ["Vitamina D", "labExam.vitaminD", form.labExam.vitaminD],
      ["B12", "labExam.b12", form.labExam.b12],
      ["Ferro", "labExam.iron", form.labExam.iron],
      ["Ferritina", "labExam.ferritin", form.labExam.ferritin],
      ["Zinco", "labExam.zinc", form.labExam.zinc],
      ["Folato", "labExam.folate", form.labExam.folate],
      ["Glicemia", "labExam.glucose", form.labExam.glucose],
      ["Insulina", "labExam.insulin", form.labExam.insulin],
      ["HOMA-IR", "labExam.homaIr", form.labExam.homaIr],
      ["Perfil lipídico", "labExam.lipidProfile", form.labExam.lipidProfile],
      ["PCR", "labExam.crp", form.labExam.crp],
      ["TSH / T4", "labExam.tshT4", form.labExam.tshT4],
      ["Albumina", "labExam.albumin", form.labExam.albumin],
      ["Campo livre", "labExam.notes", form.labExam.notes]
    ] as const;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([label, path, value]) => (
          <Field key={path} label={label} value={String(value)} onChange={(nextValue) => updateField(path, nextValue)} textarea={path === "labExam.notes"} />
        ))}
      </div>
    );
  }

  if (step === 6) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-sand p-5">
          <div>
            <p className="text-sm font-medium text-moss">Interpretação clínica assistida</p>
            <p className="mt-1 text-sm text-ink/70">A IA usa linguagem segura e evita diagnóstico médico definitivo.</p>
          </div>
          <button
            type="button"
            onClick={generateInterpretation}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            <BrainCircuit className="h-4 w-4" />
            {saving ? "Gerando..." : "Gerar interpretação com IA"}
          </button>
        </div>

        {form.aiInterpretation ? (
          <div className="grid gap-4 md:grid-cols-2">
            <InsightCard title="Resumo clínico" items={[form.aiInterpretation.summary]} />
            <InsightCard title="Principais achados" items={form.aiInterpretation.keyFindings} />
            <InsightCard title="Riscos nutricionais" items={form.aiInterpretation.nutritionalRisks} />
            <InsightCard title="Possíveis deficiências" items={form.aiInterpretation.possibleDeficiencies} />
            <InsightCard title="Correlações" items={form.aiInterpretation.correlations} />
            <InsightCard title="Conduta sugerida" items={form.aiInterpretation.conductSuggestions} />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-moss/20 bg-white/70 p-8 text-sm text-ink/65">
            Gere a interpretação para consolidar antropometria, sintomas, semiologia, bioimpedância e exames.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl bg-sand p-5">
        <p className="text-sm uppercase tracking-[0.28em] text-moss/70">Checklist final</p>
        <div className="mt-4 space-y-3 text-sm text-ink/75">
          <p>Objetivo: {form.objective || "A preencher"}</p>
          <p>IMC calculado: {metrics.bmi.toFixed(1)} ({metrics.bmiClassification})</p>
          <p>Alertas: {metrics.alerts.length ? metrics.alerts.join(" ") : "Sem alertas críticos automáticos."}</p>
          <p>Interpretação IA: {form.aiInterpretation ? "Gerada" : "Pendente"}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={saveConsultation}
        disabled={saving}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-medium text-ink disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Salvando..." : "Salvar consulta"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (value: string) => void; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-moss">{label}</span>
      {textarea ? (
        <textarea
          className="min-h-28 w-full rounded-3xl border border-moss/15 bg-white px-4 py-3 text-sm text-ink transition focus:border-moss/35 focus:outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className="w-full rounded-3xl border border-moss/15 bg-white px-4 py-3 text-sm text-ink transition focus:border-moss/35 focus:outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-sand p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-moss/60">{label}</p>
      <p className="mt-2 text-sm text-ink/80">{value}</p>
    </div>
  );
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-moss/10 bg-white/75 p-5">
      <p className="text-sm font-medium text-moss">{title}</p>
      <div className="mt-3 space-y-2 text-sm leading-6 text-ink/75">
        {items.map((item) => (
          <p key={item}>• {item}</p>
        ))}
      </div>
    </div>
  );
}
