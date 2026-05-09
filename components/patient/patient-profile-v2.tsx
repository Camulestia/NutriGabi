"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BrainCircuit,
  CheckCircle2,
  Download,
  FileText,
  PencilLine,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UtensilsCrossed
} from "lucide-react";

import { EvolutionChartV2 } from "@/components/charts/evolution-chart-v2";
import { ReportPdfDownload } from "@/components/report/report-pdf";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Section } from "@/components/ui/section";
import { Consultation, EvolutionPoint, Patient } from "@/lib/types";
import { calculateAge, formatDate } from "@/lib/utils";

type Props = {
  patient: Patient;
  latest: Consultation | undefined;
  history: Array<{
    consultation: Consultation;
    bmi: number;
  }>;
  evolutionData: EvolutionPoint[];
  alertItems: Array<{ label: string; tone: "mint" | "amber" | "rose" }>;
  showUpdatedFeedback?: boolean;
};

export function PatientProfileV2({ patient, latest, history, evolutionData, alertItems, showUpdatedFeedback }: Props) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<"export" | "archive" | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleExport = async () => {
    setBusyAction("export");
    setFeedback(null);

    try {
      const response = await fetch(`/api/patients/${patient.id}/export`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Não foi possível exportar os dados do paciente.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `paciente-${patient.name.toLowerCase().replaceAll(" ", "-")}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setFeedback({ type: "success", message: "Exportação concluída com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível exportar os dados do paciente."
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleArchive = async () => {
    const confirmation = window.prompt(`Digite o nome do paciente para confirmar o arquivamento seguro:\n\n${patient.name}`);
    if (confirmation !== patient.name) {
      setFeedback({ type: "error", message: "O nome digitado não confere. O paciente não foi arquivado." });
      return;
    }

    setBusyAction("archive");
    setFeedback(null);

    try {
      const response = await fetch(`/api/patients/${patient.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? "Não foi possível arquivar o paciente.");
      }

      router.refresh();
      router.push("/patients?archived=1");
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível arquivar o paciente."
      });
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/patients" aria-label="Voltar para a lista de pacientes" className={buttonStyles({ variant: "secondary" })}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-moss">Perfil do paciente</span>
            </div>

            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-ink">{patient.name}</h1>
              <p className="mt-2 text-base text-muted">
                {calculateAge(patient.birthDate)} anos • {patient.sex} • Objetivo: {patient.mainObjective}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/patients/${patient.id}/edit`}
              aria-label={`Editar dados de ${patient.name}`}
              className={buttonStyles({ variant: "secondary", className: "px-5 py-3" })}
            >
              <PencilLine className="h-4 w-4" />
              Editar dados
            </Link>
            <Link
              href={`/patients/${patient.id}/consultations/new`}
              aria-label={`Iniciar nova avaliação para ${patient.name}`}
              className={buttonStyles({ className: "px-5 py-3" })}
            >
              Nova avaliação
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/patients/${patient.id}/meal-plans`}
              aria-label={`Abrir planejamento alimentar de ${patient.name}`}
              className={buttonStyles({ variant: "secondary", className: "px-5 py-3" })}
            >
              <UtensilsCrossed className="h-4 w-4" />
              Planejamento alimentar
            </Link>
          </div>
        </div>
      </Card>

      {showUpdatedFeedback ? (
        <div className="flex items-center gap-2 rounded-2xl border border-[#caece6] bg-[#effbf8] px-4 py-3 text-sm text-[#0f766e]">
          <CheckCircle2 className="h-4 w-4" />
          Dados atualizados com sucesso.
        </div>
      ) : null}

      {feedback ? (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-[#caece6] bg-[#effbf8] text-[#0f766e]"
              : "border-[#f2d1d5] bg-[#fff1f1] text-[#b42318]"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          {feedback.message}
        </div>
      ) : null}

      <div
        className={`flex items-start gap-3 rounded-3xl border px-5 py-4 ${
          patient.consentToStoreHealthData
            ? "border-[#caece6] bg-[#effbf8] text-[#0f766e]"
            : "border-[#f7dbad] bg-[#fff7eb] text-[#b45309]"
        }`}
      >
        {patient.consentToStoreHealthData ? <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />}
        <div>
          <p className="text-sm font-semibold">
            {patient.consentToStoreHealthData
              ? "Este paciente consentiu com o armazenamento de dados sensíveis de saúde."
              : "Consentimento de dados sensíveis ainda pendente."}
          </p>
          <p className="mt-1 text-sm leading-6 opacity-90">
            {patient.consentToStoreHealthData && patient.consentDate
              ? `Consentimento registrado em ${formatDate(patient.consentDate)}.`
              : "O cadastro continua disponível, mas vale registrar o consentimento assim que possível para manter o prontuário alinhado à LGPD básica."}
          </p>
        </div>
      </div>

      {latest ? (
        <div className="grid gap-4 lg:grid-cols-4">
          <MetricCard label="IMC" value={history[0]?.bmi.toFixed(1) ?? "--"} subtitle="Leitura mais recente" tone="mint" />
          <MetricCard label="Peso" value={`${latest.anthropometry.currentWeight} kg`} subtitle="Peso atual" />
          <MetricCard label="Cintura" value={`${latest.anthropometry.waist} cm`} subtitle="Medida abdominal" />
          <MetricCard label="Gordura corporal" value={`${latest.bioimpedance.bodyFatPercent}%`} subtitle="Bioimpedância" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.02fr_1fr]">
        <div className="space-y-6">
          <Card>
            <Section eyebrow="Dados cadastrais" title="Informações do prontuário" description="Dados centrais para consulta e acompanhamento do paciente.">
              <div className="grid gap-4 md:grid-cols-2">
                <ProfileItem label="Contato" value={`${patient.phone || "Não informado"} • ${patient.email || "Não informado"}`} />
                <ProfileItem label="Profissão" value={patient.profession} />
                <ProfileItem label="Queixa principal" value={patient.chiefComplaint} />
                <ProfileItem label="Histórico clínico" value={patient.clinicalHistory} />
                <ProfileItem label="Medicamentos" value={patient.medications} />
                <ProfileItem label="Suplementos" value={patient.supplements} />
                <ProfileItem label="Restrições alimentares" value={patient.foodRestrictions} />
                <ProfileItem label="Observações gerais" value={patient.notes} />
              </div>
            </Section>
          </Card>

          <Card>
            <Section
              eyebrow="Preferências e restrições alimentares"
              title="Base persistente para novos planos"
              description="Essas informações acompanham a IA, as substituições e todo novo planejamento alimentar."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <ProfileItem label="Alimentos indispensáveis" value={patient.preferredFoods.join(", ")} />
                <ProfileItem label="Alimentos não aceitos" value={patient.rejectedFoods.join(", ")} />
                <ProfileItem label="Alergias alimentares" value={patient.allergies.join(", ")} />
                <ProfileItem label="Intolerâncias alimentares" value={patient.intolerances.join(", ")} />
                <ProfileItem label="Preferências culturais/religiosas" value={patient.culturalPreferences} />
                <ProfileItem label="Observações alimentares importantes" value={patient.foodNotes} />
              </div>
            </Section>
          </Card>

          <Card>
            <Section eyebrow="Histórico longitudinal" title="Consultas registradas" description="Linha do tempo compacta com acesso direto ao relatório de cada avaliação.">
              <div className="space-y-3">
                {history.length ? (
                  history.map(({ consultation, bmi }) => (
                    <div key={consultation.id} className="rounded-3xl border border-line bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-ink">{formatDate(consultation.createdAt)}</p>
                          <p className="mt-1 text-sm text-muted">{consultation.objective}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/patients/${patient.id}/consultations/${consultation.id}?step=7`}
                            aria-label={`Abrir consulta de ${formatDate(consultation.createdAt)}`}
                            className={buttonStyles({ variant: "secondary" })}
                          >
                            Abrir consulta
                          </Link>
                          <ReportPdfDownload patient={patient} consultation={consultation} label="Ver relatório" />
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <MetricCard label="Peso" value={`${consultation.anthropometry.currentWeight} kg`} className="p-3" />
                        <MetricCard label="IMC" value={bmi.toFixed(1)} className="p-3" />
                        <MetricCard label="Cintura" value={`${consultation.anthropometry.waist} cm`} className="p-3" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-line bg-white p-6 text-sm text-muted">
                    Nenhuma consulta registrada até o momento.
                  </div>
                )}
              </div>
            </Section>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <Section eyebrow="Evolução" title="Visualização longitudinal" description="Leitura rápida das principais variáveis acompanhadas ao longo do tempo.">
              <EvolutionChartV2 data={evolutionData} />
              <div className="mt-4 flex justify-end">
                <Button
                  variant="secondary"
                  disabled
                  aria-label="Analisar evolução com IA"
                  title="A análise de evolução com IA depende da próxima etapa funcional."
                >
                  <BrainCircuit className="h-4 w-4" />
                  Analisar evolução com IA
                </Button>
              </div>
            </Section>
          </Card>

          <Card>
            <Section
              eyebrow="Alertas clínicos"
              title="Atenção automatizada"
              description="Sinalização visual pensada para reforçar prioridades de acompanhamento."
              action={<Bell className="h-5 w-5 text-moss" />}
            >
              <div className="space-y-3">
                {alertItems.length ? (
                  alertItems.map((item) => <AlertRow key={item.label} label={item.label} tone={item.tone} />)
                ) : (
                  <AlertRow label="Sem alertas automáticos relevantes no momento." tone="mint" />
                )}
              </div>
            </Section>
          </Card>

          <Card>
            <Section
              eyebrow="Privacidade e dados"
              title="Ações seguras do prontuário"
              description="Exporte o histórico completo do paciente ou arquive o prontuário com confirmação."
            >
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={handleExport} disabled={busyAction !== null} aria-label="Exportar dados do paciente">
                  <Download className="h-4 w-4" />
                  {busyAction === "export" ? "Exportando..." : "Exportar dados do paciente"}
                </Button>
                <Button type="button" variant="ghost" onClick={handleArchive} disabled={busyAction !== null} aria-label="Excluir paciente">
                  <Trash2 className="h-4 w-4" />
                  {busyAction === "archive" ? "Arquivando..." : "Excluir paciente"}
                </Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                A exclusão funciona como arquivamento seguro. O paciente sai da lista padrão, mas o histórico clínico continua preservado.
              </p>
            </Section>
          </Card>

          {latest ? (
            <Card>
              <Section eyebrow="Relatório" title="Documento profissional" description="Baixe o PDF consolidado da avaliação mais recente.">
                <div className="flex items-center justify-between rounded-3xl border border-line bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage text-moss">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">Relatório atual</p>
                      <p className="text-xs text-muted">{formatDate(latest.createdAt)}</p>
                    </div>
                  </div>
                  <ReportPdfDownload patient={patient} consultation={latest} label="Gerar relatório PDF" />
                </div>
              </Section>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6 text-ink">{value || "Não informado"}</p>
    </div>
  );
}

function AlertRow({ label, tone }: { label: string; tone: "mint" | "amber" | "rose" }) {
  const styles = {
    mint: "border-[#caece6] bg-[#effbf8] text-[#0f766e]",
    amber: "border-[#f7dbad] bg-[#fff7eb] text-[#b45309]",
    rose: "border-[#f2d1d5] bg-[#fff1f1] text-[#b42318]"
  };

  return (
    <div className={`flex items-start gap-3 rounded-3xl border p-4 ${styles[tone]}`}>
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="text-sm leading-6">{label}</span>
    </div>
  );
}
