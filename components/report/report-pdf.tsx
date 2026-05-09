"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import { calculateAnthropometricMetrics } from "@/lib/anthropometry";
import { BillingSummary, Consultation, Patient, UserSettings } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, color: "#1f2937", fontFamily: "Helvetica" },
  header: { marginBottom: 16 },
  title: { fontSize: 20, marginBottom: 6, color: "#21544d" },
  subtitle: { fontSize: 10, color: "#52606d" },
  section: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#d9e2dd" },
  sectionTitle: { fontSize: 12, marginBottom: 8, color: "#21544d" },
  line: { marginBottom: 4, lineHeight: 1.4 },
  listItem: { marginBottom: 4, lineHeight: 1.4 },
  note: { marginTop: 6, fontSize: 10, color: "#8b6b20" }
});

function printableValue(value?: string | number) {
  if (typeof value === "number") {
    return value ? String(value) : "Não informado";
  }

  return value && value.trim() ? value : "Não informado";
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length ? (
        items.map((item) => (
          <Text key={`${title}-${item}`} style={styles.listItem}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={styles.line}>Não informado.</Text>
      )}
    </View>
  );
}

function ReportDocument({
  patient,
  consultation,
  professionalName,
  showProfessionalWarning,
  pdfFooter
}: {
  patient: Patient;
  consultation: Consultation;
  professionalName?: string;
  showProfessionalWarning?: boolean;
  pdfFooter?: string;
}) {
  const metrics = calculateAnthropometricMetrics(consultation.anthropometry);
  const semiologyEntries = Object.values(consultation.semiology);
  const labEntries = [
    ["Vitamina D", consultation.labExam.vitaminD],
    ["B12", consultation.labExam.b12],
    ["Ferro", consultation.labExam.iron],
    ["Ferritina", consultation.labExam.ferritin],
    ["Zinco", consultation.labExam.zinc],
    ["Folato", consultation.labExam.folate],
    ["Glicemia", consultation.labExam.glucose],
    ["Insulina", consultation.labExam.insulin],
    ["HOMA-IR", consultation.labExam.homaIr],
    ["Perfil lipídico", consultation.labExam.lipidProfile],
    ["PCR", consultation.labExam.crp],
    ["TSH / T4", consultation.labExam.tshT4],
    ["Albumina", consultation.labExam.albumin],
    ["Campo livre", consultation.labExam.notes]
  ] as const;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>NutriConsulta IA</Text>
          <Text style={styles.subtitle}>Relatório nutricional profissional • {formatDate(consultation.createdAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação</Text>
          <Text style={styles.line}>Paciente: {patient.name}</Text>
          <Text style={styles.line}>Data da consulta: {formatDate(consultation.createdAt)}</Text>
          <Text style={styles.line}>Motivo da visita: {printableValue(consultation.visitReason)}</Text>
          <Text style={styles.line}>Queixa principal: {printableValue(consultation.chiefComplaint)}</Text>
          <Text style={styles.line}>Objetivo principal: {printableValue(consultation.objective)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Antropometria</Text>
          <Text style={styles.line}>Peso atual: {printableValue(consultation.anthropometry.currentWeight)} kg</Text>
          <Text style={styles.line}>Peso habitual: {printableValue(consultation.anthropometry.habitualWeight)} kg</Text>
          <Text style={styles.line}>Peso desejado: {printableValue(consultation.anthropometry.desiredWeight)} kg</Text>
          <Text style={styles.line}>Altura: {printableValue(consultation.anthropometry.height)} m</Text>
          <Text style={styles.line}>Cintura: {printableValue(consultation.anthropometry.waist)} cm</Text>
          <Text style={styles.line}>Quadril: {printableValue(consultation.anthropometry.hip)} cm</Text>
          <Text style={styles.line}>IMC: {metrics.bmi.toFixed(1)} ({metrics.bmiClassification})</Text>
          <Text style={styles.line}>RCQ: {metrics.waistHipRatio.toFixed(2)} • Risco {metrics.waistHipRisk}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bioimpedância</Text>
          <Text style={styles.line}>% gordura: {printableValue(consultation.bioimpedance.bodyFatPercent)}</Text>
          <Text style={styles.line}>Massa gorda: {printableValue(consultation.bioimpedance.fatMass)} kg</Text>
          <Text style={styles.line}>Massa magra: {printableValue(consultation.bioimpedance.leanMass)} kg</Text>
          <Text style={styles.line}>Massa muscular: {printableValue(consultation.bioimpedance.muscleMass)} kg</Text>
          <Text style={styles.line}>Água total: {printableValue(consultation.bioimpedance.totalBodyWater)}</Text>
          <Text style={styles.line}>Ângulo de fase: {printableValue(consultation.bioimpedance.phaseAngle)}</Text>
          <Text style={styles.line}>TMB: {printableValue(consultation.bioimpedance.bmr)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exames laboratoriais</Text>
          {labEntries.map(([label, value]) => (
            <Text key={label} style={styles.line}>
              {label}: {printableValue(value)}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Semiologia nutricional</Text>
          {semiologyEntries.map((item) => (
            <Text key={item.label} style={styles.line}>
              {item.label}: {item.severity} • {printableValue(item.observation)}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interpretação assistida por IA</Text>
          <Text style={styles.line}>{consultation.aiInterpretation?.summary ?? "Interpretação ainda não gerada."}</Text>
          {(consultation.aiInterpretation?.keyFindings ?? []).map((item) => (
            <Text key={item} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliação do nutricionista</Text>
          <Text style={styles.line}>Diagnóstico do profissional: {printableValue(consultation.professionalDiagnosis)}</Text>
          <Text style={styles.line}>Conduta: {printableValue(consultation.conduct)}</Text>
          <Text style={styles.line}>Metas: {printableValue(consultation.goals)}</Text>
          <Text style={styles.line}>Acompanhamento: {printableValue(consultation.followUp)}</Text>
          <Text style={styles.line}>Observações para o paciente: {printableValue(consultation.patientNotes)}</Text>
          {showProfessionalWarning ? <Text style={styles.note}>Relatório sem avaliação profissional completa.</Text> : null}
        </View>

        <ReportList title="Prioridades para próxima consulta" items={consultation.nextVisitPriorities ? [consultation.nextVisitPriorities] : []} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assinatura</Text>
          <Text style={styles.line}>{professionalName ?? "Nutricionista responsável"}</Text>
        </View>

        {pdfFooter?.trim() ? (
          <View>
            <Text style={styles.subtitle}>{pdfFooter}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export function ReportPdfDownload({
  patient,
  consultation,
  label = "Ver relatório",
  className,
  professionalName
}: {
  patient: Patient;
  consultation: Consultation;
  label?: string;
  className?: string;
  professionalName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [canExport, setCanExport] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<Pick<UserSettings, "reportSignature" | "defaultPdfFooter"> | null>(null);
  const hasReportContent = Boolean(consultation.objective || consultation.professionalDiagnosis || consultation.aiInterpretation || consultation.chiefComplaint);
  const showProfessionalWarning = !consultation.professionalDiagnosis?.trim() || !consultation.conduct?.trim();

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/billing", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          setCanExport(true);
          return;
        }
        const payload = (await response.json()) as BillingSummary;
        setCanExport(Boolean(payload.access.canExportPdf));
      })
      .catch(() => setCanExport(true));

    fetch("/api/settings", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as UserSettings;
        setSettings({
          reportSignature: payload.reportSignature,
          defaultPdfFooter: payload.defaultPdfFooter
        });
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const resolvedProfessionalName = professionalName ?? settings?.reportSignature;
      const blob = await pdf(
        <ReportDocument
          patient={patient}
          consultation={consultation}
          professionalName={resolvedProfessionalName}
          showProfessionalWarning={showProfessionalWarning}
          pdfFooter={settings?.defaultPdfFooter}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-${patient.name.toLowerCase().replaceAll(" ", "-")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  if (!hasReportContent) {
    return <span className="text-sm text-muted">Relatório ainda não disponível para esta consulta.</span>;
  }

  if (canExport === false) {
    return (
      <div className="space-y-2">
        <Link
          href="/billing"
          className={
            className ??
            "inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-moss/30 hover:bg-[#effbf8]"
          }
        >
          Atualizar plano para liberar PDF
        </Link>
        <p className="text-xs text-[#b45309]">Relatórios em PDF fazem parte do plano Profissional.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || canExport === null}
        className={
          className ??
          "inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-moss/30 hover:bg-[#effbf8] disabled:opacity-60"
        }
        aria-label={label}
      >
        {canExport === null ? "Verificando acesso..." : loading ? "Preparando PDF..." : label}
      </button>
      {showProfessionalWarning ? <p className="text-xs text-[#b45309]">Relatório sem avaliação profissional completa.</p> : null}
    </div>
  );
}
