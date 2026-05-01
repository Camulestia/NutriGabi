"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, BrainCircuit, CheckCircle2, ChevronLeft, ChevronRight, Save, X } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Section } from "@/components/ui/section";
import { ReportPdfDownload } from "@/components/report/report-pdf";
import { calculateAnthropometricMetrics } from "@/lib/anthropometry";
import { getConsultationDateValue, toConsultationIsoDate } from "@/lib/consultation-date";
import { Consultation, Patient } from "@/lib/types";

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

const visitReasons = [
  "Primeira consulta",
  "Retorno",
  "Avaliação física",
  "Reavaliação",
  "Ajuste de plano alimentar"
] as const;

const binaryChoiceOptions = [
  { label: "Sim", value: "Sim" },
  { label: "Não", value: "Não" }
] as const;

function normalizeBinaryChoice(value?: string) {
  const normalized = (value ?? "").trim().toLowerCase();

  if (!normalized || normalized === "não" || normalized === "nao" || normalized === "nega") {
    return "Não";
  }

  if (normalized === "sim" || normalized === "s" || normalized.includes("veg") || normalized.includes("cel")) {
    return "Sim";
  }

  return "Não";
}

function normalizeAnamnesisChoices(consultation: Consultation): Consultation {
  return {
    ...consultation,
    anamnesis: {
      ...consultation.anamnesis,
      vegetarianPattern: normalizeBinaryChoice(consultation.anamnesis.vegetarianPattern),
      celiacDisease: normalizeBinaryChoice(consultation.anamnesis.celiacDisease)
    }
  };
}

export function ConsultationWizardV3({
  patient,
  initialConsultation,
  draftKey,
  initialStep = 0
}: {
  patient: Patient;
  initialConsultation: Consultation;
  draftKey?: string;
  initialStep?: number;
}) {
  const [step, setStep] = useState(initialStep);
  const [status, setStatus] = useState("Rascunho local ativo");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState(initialConsultation);
  const storageKey = draftKey ?? `consultation-draft-${patient.id}`;

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
      setStatus(`Salvo automaticamente às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`);
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

  const normalizedForm = useMemo(
    () => ({
      ...normalizeAnamnesisChoices(form),
      createdAt: toConsultationIsoDate(form.createdAt)
    }),
    [form]
  );

  const persistConsultation = async ({
    clearDraft,
    successMessage
  }: {
    clearDraft: boolean;
    successMessage: string;
  }) => {
    setSaving(true);
    const response = await fetch("/api/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedForm)
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível salvar a consulta. Tente novamente.");
      setSaving(false);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(normalizedForm));
    if (clearDraft) {
      window.localStorage.removeItem(storageKey);
    }

    setStatus(successMessage);
    setErrorMessage(null);
    setSaving(false);
  };

  const generateInterpretation = async () => {
    setSaving(true);
    const response = await fetch("/api/interpretations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: patient.id, consultation: normalizedForm })
    });
    if (!response.ok) {
      setErrorMessage("Não foi possível gerar a interpretação com IA agora.");
      setSaving(false);
      return;
    }
    const interpretation = await response.json();
    startTransition(() => {
      setForm((current) => ({ ...current, aiInterpretation: interpretation }));
      setStep(6);
      setErrorMessage(null);
      setSaving(false);
    });
  };

  const saveDraftNow = async () => {
    await persistConsultation({
      clearDraft: false,
      successMessage: `Avaliação salva às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    });
  };

  const saveConsultation = async () => {
    await persistConsultation({
      clearDraft: true,
      successMessage: "Consulta finalizada com sucesso"
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-moss">Consulta em andamento</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{patient.name}</h1>
            <p className="mt-2 text-sm text-muted">{patient.mainObjective}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-sage px-4 py-2 text-sm font-medium text-moss">{status}</div>
            <Link href={`/patients/${patient.id}`} aria-label="Cancelar consulta atual" className={buttonStyles({ variant: "secondary" })}>
              <X className="h-4 w-4" />
              Cancelar
            </Link>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-[#f2d1d5] bg-[#fff1f1] px-4 py-3 text-sm text-[#b42318]">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        ) : null}

        <ProgressBar steps={steps} currentStep={step} onStepClick={setStep} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <Card className="p-6">
          <StepContent
            step={step}
            form={form}
            patient={patient}
            updateField={updateField}
            metrics={metrics}
            saving={saving}
            generateInterpretation={generateInterpretation}
            saveConsultation={saveConsultation}
            saveDraftNow={saveDraftNow}
          />
        </Card>

        <div className="space-y-6">
          <Card>
            <Section eyebrow="Resultados automáticos" title="Leitura antropométrica" description="Os cálculos são atualizados em tempo real durante a consulta.">
              <div className="grid gap-3">
                <MetricCard label="IMC" value={metrics.bmi.toFixed(1)} subtitle={metrics.bmiClassification} tone="mint" tooltip="Índice de massa corporal calculado automaticamente." />
                <MetricCard label="Relação cintura-quadril" value={metrics.waistHipRatio.toFixed(2)} subtitle={metrics.waistHipRisk} tooltip="Ajuda a monitorar risco metabólico." />
                <MetricCard label="% perda de peso" value={`${metrics.weightLossPercent.toFixed(1)}%`} subtitle="Comparado ao peso habitual" />
                <MetricCard label="Peso ideal" value={`${metrics.idealWeight.toFixed(1)} kg`} subtitle="Estimativa com IMC de referência" />
                <MetricCard label="Adequação do peso" value={`${metrics.weightAdequacy.toFixed(1)}%`} subtitle="Peso atual em relação ao ideal" />
                <MetricCard label="Alerta" value={metrics.alerts.length ? `${metrics.alerts.length} sinalização(ões)` : "Sem alertas"} subtitle="Monitoramento automático" tone={metrics.alerts.length ? "amber" : "mint"} />
              </div>
            </Section>
          </Card>

          <Card>
            <Section eyebrow="Alertas clínicos" title="Pontos de atenção" description="Feedback visual para apoiar a priorização da conduta.">
              <div className="space-y-3">
                {metrics.alerts.length ? (
                  metrics.alerts.map((alert) => (
                    <div key={alert} className="flex items-start gap-3 rounded-3xl border border-[#f7dbad] bg-[#fff7eb] p-4 text-sm text-[#b45309]">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{alert}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-3 rounded-3xl border border-[#caece6] bg-[#effbf8] p-4 text-sm text-[#0f766e]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Sem alertas antropométricos críticos neste momento.</span>
                  </div>
                )}
              </div>
            </Section>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setStep((current) => Math.max(current - 1, 0))} aria-label="Voltar para a etapa anterior">
          <ChevronLeft className="h-4 w-4" />
          Etapa anterior
        </Button>
        <Button className="px-5" onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))} aria-label="Avançar para a próxima etapa">
          Próxima etapa
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
function StepContent({
  step,
  form,
  patient,
  updateField,
  metrics,
  saving,
  generateInterpretation,
  saveConsultation,
  saveDraftNow
}: {
  step: number;
  form: Consultation;
  patient: Patient;
  updateField: (path: string, value: string) => void;
  metrics: ReturnType<typeof calculateAnthropometricMetrics>;
  saving: boolean;
  generateInterpretation: () => Promise<void>;
  saveConsultation: () => Promise<void>;
  saveDraftNow: () => void;
}) {
  if (step === 0) {
    return (
      <StepSection eyebrow="Etapa 1" title="Identificação" description="Registre a data e o contexto principal desta consulta.">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Data da consulta" type="date" value={getConsultationDateValue(form.createdAt)} hint="A data da consulta será usada para histórico, agenda e lembrete automático de retorno." onChange={(value) => updateField("createdAt", value)} />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Motivo da visita</span>
            <select className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10" value={form.visitReason ?? "Retorno"} onChange={(event) => updateField("visitReason", event.target.value)}>
              {visitReasons.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <InputField label="Queixa principal" value={form.chiefComplaint} textarea placeholder="Descreva a principal queixa ou demanda trazida pelo paciente." onChange={(value) => updateField("chiefComplaint", value)} />
          <InputField label="Objetivo principal" value={form.objective} textarea placeholder="Ex.: emagrecimento, ganho de massa, melhora de exames, performance, saúde intestinal." onChange={(value) => updateField("objective", value)} />
        </div>
      </StepSection>
    );
  }

  if (step === 1) {
    const fields = [
      ["Recordatório 24h", "anamnesis.recall24h", form.anamnesis.recall24h, true, "Descreva refeições, horários e contexto do dia anterior."],
      ["Frequência alimentar", "anamnesis.foodFrequency", form.anamnesis.foodFrequency, true, "Padrão semanal de grupos alimentares."],
      ["Consumo de água", "anamnesis.waterIntake", form.anamnesis.waterIntake, false, "Ex.: 1,8 L/dia"],
      ["Restrição alimentar", "anamnesis.foodRestriction", form.anamnesis.foodRestriction, false, "Ex.: lactose, glúten, aversões"],
      ["Suplementos", "anamnesis.supplements", form.anamnesis.supplements, false, "Produtos e posologia"],
      ["Sintomas gastrointestinais", "anamnesis.gastrointestinalSymptoms", form.anamnesis.gastrointestinalSymptoms, true, "Distensão, dor, evacuação, refluxo e outros."],
      ["Sono", "anamnesis.sleep", form.anamnesis.sleep, false, "Horas, qualidade e despertares"],
      ["Atividade física", "anamnesis.physicalActivity", form.anamnesis.physicalActivity, false, "Modalidade, frequência e intensidade"]
    ] as const;

    return (
      <StepSection eyebrow="Etapa 2" title="Anamnese" description="Campos amplos para registrar hábitos, sintomas e rotina do paciente.">
        <div className="grid gap-4 md:grid-cols-2">
          <BinaryChoiceField label="Vegetariana/vegana" value={normalizeBinaryChoice(form.anamnesis.vegetarianPattern)} hint="Selecione se o paciente segue padrão vegetariano ou vegano." onChange={(nextValue) => updateField("anamnesis.vegetarianPattern", nextValue)} />
          <BinaryChoiceField label="Doença celíaca" value={normalizeBinaryChoice(form.anamnesis.celiacDisease)} hint="Selecione se há relato ou diagnóstico prévio." onChange={(nextValue) => updateField("anamnesis.celiacDisease", nextValue)} />
          {fields.map(([label, path, value, textarea, placeholder]) => <InputField key={path} label={label} value={value} textarea={textarea} placeholder={placeholder} onChange={(nextValue) => updateField(path, nextValue)} />)}
        </div>
      </StepSection>
    );
  }

  if (step === 2) {
    return (
      <StepSection eyebrow="Etapa 3" title="Antropometria" description="Agrupe medidas corporais e dobras cutâneas com leitura visual imediata dos resultados.">
        <div className="grid gap-6">
          <FieldGrid title="Medidas corporais" fields={[["Peso atual (kg)", "anthropometry.currentWeight", form.anthropometry.currentWeight, "Ex.: 72.4"], ["Peso habitual (kg)", "anthropometry.habitualWeight", form.anthropometry.habitualWeight, "Ex.: 78"], ["Peso desejado (kg)", "anthropometry.desiredWeight", form.anthropometry.desiredWeight, "Ex.: 68"], ["Altura (m)", "anthropometry.height", form.anthropometry.height, "Ex.: 1.68"], ["Cintura (cm)", "anthropometry.waist", form.anthropometry.waist, "Ex.: 84"], ["Quadril (cm)", "anthropometry.hip", form.anthropometry.hip, "Ex.: 102"], ["Braço (cm)", "anthropometry.arm", form.anthropometry.arm, "Ex.: 30"], ["Panturrilha (cm)", "anthropometry.calf", form.anthropometry.calf, "Ex.: 36"], ["Punho (cm)", "anthropometry.wrist", form.anthropometry.wrist, "Ex.: 16"]]} updateField={updateField} />
          <FieldGrid title="Dobras cutâneas" fields={[["Dobra tricipital", "anthropometry.skinfolds.tricipital", form.anthropometry.skinfolds.tricipital, "Ex.: 22"], ["Subescapular", "anthropometry.skinfolds.subscapular", form.anthropometry.skinfolds.subscapular, "Ex.: 25"], ["Supra-ilíaca", "anthropometry.skinfolds.suprailiac", form.anthropometry.skinfolds.suprailiac, "Ex.: 27"], ["Abdominal", "anthropometry.skinfolds.abdominal", form.anthropometry.skinfolds.abdominal, "Ex.: 30"]]} updateField={updateField} />
        </div>
      </StepSection>
    );
  }

  if (step === 3) {
    return (
      <StepSection eyebrow="Etapa 4" title="Semiologia" description="Checklist por região com gradação de intensidade e espaço para observações clínicas.">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(form.semiology).map(([key, item]) => (
            <div key={key} className="rounded-3xl border border-line bg-white p-4">
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <select className="mt-3 h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10" value={item.severity} onChange={(event) => updateField(`semiology.${key}.severity`, event.target.value)}>
                <option value="normal">Normal</option>
                <option value="leve">Leve</option>
                <option value="moderado">Moderado</option>
                <option value="grave">Grave</option>
              </select>
              <InputField label="Observações" value={item.observation} textarea placeholder="Registre sinais observados, distribuição ou contexto clínico." onChange={(value) => updateField(`semiology.${key}.observation`, value)} className="mt-2" />
            </div>
          ))}
        </div>
      </StepSection>
    );
  }

  if (step === 4) {
    return (
      <StepSection eyebrow="Etapa 5" title="Bioimpedância" description="Registre composição corporal, compartimentos hídricos e indicadores funcionais.">
        <FieldGrid title="Resultados de bioimpedância" fields={[["% gordura", "bioimpedance.bodyFatPercent", form.bioimpedance.bodyFatPercent, "Ex.: 29.4"], ["Massa gorda", "bioimpedance.fatMass", form.bioimpedance.fatMass, "Ex.: 21.8"], ["Massa magra", "bioimpedance.leanMass", form.bioimpedance.leanMass, "Ex.: 48.6"], ["Massa muscular", "bioimpedance.muscleMass", form.bioimpedance.muscleMass, "Ex.: 26.1"], ["Água total", "bioimpedance.totalBodyWater", form.bioimpedance.totalBodyWater, "Ex.: 35.9"], ["Água intracelular", "bioimpedance.intracellularWater", form.bioimpedance.intracellularWater, "Ex.: 21.0"], ["Água extracelular", "bioimpedance.extracellularWater", form.bioimpedance.extracellularWater, "Ex.: 14.9"], ["Gordura visceral", "bioimpedance.visceralFat", form.bioimpedance.visceralFat, "Ex.: 9"], ["Ângulo de fase", "bioimpedance.phaseAngle", form.bioimpedance.phaseAngle, "Ex.: 5.8"], ["TMB", "bioimpedance.bmr", form.bioimpedance.bmr, "Ex.: 1480"]]} updateField={updateField} />
      </StepSection>
    );
  }

  if (step === 5) {
    return (
      <StepSection eyebrow="Etapa 6" title="Exames" description="Organize marcadores laboratoriais com campos claros e espaço livre para complementar.">
        <div className="grid gap-4 md:grid-cols-2">
          {[ ["Vitamina D", "labExam.vitaminD", form.labExam.vitaminD], ["B12", "labExam.b12", form.labExam.b12], ["Ferro", "labExam.iron", form.labExam.iron], ["Ferritina", "labExam.ferritin", form.labExam.ferritin], ["Zinco", "labExam.zinc", form.labExam.zinc], ["Folato", "labExam.folate", form.labExam.folate], ["Glicemia", "labExam.glucose", form.labExam.glucose], ["Insulina", "labExam.insulin", form.labExam.insulin], ["HOMA-IR", "labExam.homaIr", form.labExam.homaIr], ["Perfil lipídico", "labExam.lipidProfile", form.labExam.lipidProfile], ["PCR", "labExam.crp", form.labExam.crp], ["TSH / T4", "labExam.tshT4", form.labExam.tshT4], ["Albumina", "labExam.albumin", form.labExam.albumin], ["Campo livre", "labExam.notes", form.labExam.notes] ].map(([label, path, value]) => <InputField key={path} label={label} value={String(value)} textarea={path === "labExam.notes"} placeholder="Informe o resultado ou a observação clínica." onChange={(nextValue) => updateField(path, nextValue)} />)}
        </div>
      </StepSection>
    );
  }
  if (step === 6) {
    return (
      <StepSection eyebrow="Etapa 7" title="Interpretação IA" description="A IA consolida os dados da avaliação com linguagem segura e orientada à conduta nutricional.">
        <div className="space-y-5">
          <div className="rounded-3xl border border-[#caece6] bg-sage p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink">Interpretação clínica assistida</p>
                <p className="mt-1 text-sm text-muted">Usa linguagem como “sugere”, “pode estar associado” e “avaliar”.</p>
              </div>
              <Button onClick={generateInterpretation} disabled={saving}>
                <BrainCircuit className="h-4 w-4" />
                {saving ? "Gerando..." : "Gerar interpretação com IA"}
              </Button>
            </div>
          </div>

          {form.aiInterpretation ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-line bg-white p-5 md:col-span-2">
                <p className="text-sm font-semibold text-ink">Resumo clínico</p>
                <p className="mt-3 text-sm leading-7 text-muted">{form.aiInterpretation.summary}</p>
              </div>
              <ListCard title="Principais achados" items={form.aiInterpretation.keyFindings} />
              <ListCard title="Riscos nutricionais" items={form.aiInterpretation.nutritionalRisks} />
              <ListCard title="Possíveis deficiências" items={form.aiInterpretation.possibleDeficiencies} />
              <ListCard title="Correlações" items={form.aiInterpretation.correlations} />
              <ListCard title="Pontos de atenção" items={form.aiInterpretation.attentionPoints} />
              <ListCard title="Conduta sugerida" items={form.aiInterpretation.conductSuggestions} />
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-white p-8 text-sm text-muted">
              Gere a interpretação para consolidar antropometria, semiologia, bioimpedância, exames, sintomas e objetivo do paciente.
            </div>
          )}
        </div>
      </StepSection>
    );
  }

  return (
    <StepSection eyebrow="Etapa 8" title="Relatório final" description="Revise o resumo da consulta e finalize o registro com segurança.">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Objetivo" value={form.objective || "A preencher"} className="md:col-span-2 xl:col-span-1" />
          <MetricCard label="IMC" value={`${metrics.bmi.toFixed(1)} (${metrics.bmiClassification})`} />
          <MetricCard label="Alertas" value={metrics.alerts.length ? `${metrics.alerts.length} sinalização(ões)` : "Sem alertas"} tone={metrics.alerts.length ? "amber" : "mint"} />
          <MetricCard label="Interpretação IA" value={form.aiInterpretation ? "Gerada" : "Pendente"} tone={form.aiInterpretation ? "mint" : "amber"} />
        </div>

        {(!form.professionalDiagnosis.trim() || !form.conduct.trim()) ? (
          <div className="rounded-3xl border border-[#f7dbad] bg-[#fff7eb] p-4 text-sm text-[#b45309]">Relatório sem avaliação profissional completa.</div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-line bg-white p-5">
              <p className="text-sm font-semibold text-ink">Avaliação do nutricionista</p>
              <p className="mt-1 text-sm text-muted">Registre o julgamento profissional separadamente da interpretação assistida por IA.</p>
              <div className="mt-5 grid gap-4">
                <InputField label="Diagnóstico do profissional" value={form.professionalDiagnosis} textarea placeholder="Registre sua avaliação nutricional, hipótese principal e interpretação clínica." onChange={(value) => updateField("professionalDiagnosis", value)} />
                <InputField label="Conduta" value={form.conduct} textarea placeholder="Descreva a conduta nutricional proposta, ajustes alimentares, suplementação quando aplicável e orientações gerais." onChange={(value) => updateField("conduct", value)} />
                <InputField label="Metas" value={form.goals} textarea placeholder="Ex.: reduzir circunferência abdominal, melhorar exames, aumentar massa magra, regular sintomas intestinais." onChange={(value) => updateField("goals", value)} />
                <InputField label="Acompanhamento" value={form.followUp} textarea placeholder="Defina prazo de retorno, parâmetros a acompanhar e próximos passos." onChange={(value) => updateField("followUp", value)} />
                <InputField label="Observações para o paciente" value={form.patientNotes ?? ""} textarea placeholder="Mensagem resumida e compreensível para o paciente." onChange={(value) => updateField("patientNotes", value)} />
                <InputField label="Observações internas" value={form.internalNotes ?? ""} textarea placeholder="Anotações privadas do profissional, não necessariamente exibidas ao paciente." onChange={(value) => updateField("internalNotes", value)} />
                <InputField label="Prioridades para próxima consulta" value={form.nextVisitPriorities ?? ""} textarea placeholder="Liste os pontos principais que devem ser reavaliados no próximo atendimento." onChange={(value) => updateField("nextVisitPriorities", value)} />
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-white p-5 text-sm leading-7 text-muted">
              O salvamento final mantém o comportamento atual da aplicação e remove o rascunho local. Você pode salvar a avaliação, exportar o PDF e finalizar a consulta sem sair desta etapa.
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-line bg-white p-5">
              <p className="text-sm font-semibold text-ink">Interpretação assistida por IA</p>
              <p className="mt-1 text-sm text-muted">Mantenha a análise assistida como apoio, sem substituir o julgamento clínico do nutricionista.</p>
              {form.aiInterpretation ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-[#f7f9fa] p-4">
                    <p className="text-sm font-medium text-ink">Resumo clínico</p>
                    <p className="mt-2 text-sm leading-7 text-muted">{form.aiInterpretation.summary}</p>
                  </div>
                  <ListCard title="Conduta sugerida" items={form.aiInterpretation.conductSuggestions} />
                  <ListCard title="Próxima consulta" items={form.aiInterpretation.nextConsultationSuggestions} />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-line bg-[#f7f9fa] p-4 text-sm text-muted">Gere a interpretação na etapa anterior para complementar o relatório final.</div>
              )}
            </div>

            <div className="rounded-3xl border border-line bg-white p-5">
              <p className="text-sm font-semibold text-ink">Ações do relatório</p>
              <div className="mt-4 flex flex-col gap-3">
                <Button variant="secondary" onClick={saveDraftNow}><Save className="h-4 w-4" />Salvar avaliação</Button>
                <ReportPdfDownload patient={patient} consultation={form} label="Exportar PDF" className="inline-flex w-full items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-moss/30 hover:bg-[#effbf8] disabled:opacity-60" />
                <Button onClick={saveConsultation} disabled={saving} className="px-5"><Save className="h-4 w-4" />{saving ? "Finalizando..." : "Finalizar consulta"}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StepSection>
  );
}

function StepSection({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode; }) {
  return <Section eyebrow={eyebrow} title={title} description={description}>{children}</Section>;
}

function FieldGrid({ title, fields, updateField }: { title: string; fields: ReadonlyArray<readonly [string, string, number, string]>; updateField: (path: string, value: string) => void; }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <p className="mb-4 text-sm font-semibold text-ink">{title}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([label, path, value, placeholder]) => <InputField key={path} label={label} value={String(value)} placeholder={placeholder} tooltip="Campo numérico usado nos cálculos automáticos." onChange={(nextValue) => updateField(path, nextValue)} />)}
      </div>
    </div>
  );
}

function BinaryChoiceField({ label, value, hint, onChange }: { label: string; value: string; hint: string; onChange: (value: string) => void; }) {
  return (
    <fieldset className="rounded-3xl border border-line bg-white p-4">
      <legend className="px-1 text-sm font-medium text-ink">{label}</legend>
      <p className="mt-1 text-xs text-muted">{hint}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {binaryChoiceOptions.map((option) => {
          const checked = value === option.value;
          return (
            <label key={option.value} className={`flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3 text-sm font-medium transition ${checked ? "border-moss bg-[#effbf8] text-moss shadow-sm" : "border-line bg-white text-muted hover:border-moss/30 hover:text-ink"}`}>
              <input type="radio" name={label} value={option.value} checked={checked} onChange={(event) => onChange(event.target.value)} className="sr-only" />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
        {items.map((item) => <p key={item}>• {item}</p>)}
      </div>
    </div>
  );
}
