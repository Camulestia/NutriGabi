"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, LoaderCircle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { Section } from "@/components/ui/section";
import { AuditLogEntry, BillingSummary, SpecialtyFocus, UserSettings } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const specialtyOptions: Array<{ label: string; value: SpecialtyFocus | "" }> = [
  { label: "Selecione", value: "" },
  { label: "Emagrecimento", value: "emagrecimento" },
  { label: "Hipertrofia", value: "hipertrofia" },
  { label: "Nutrição clínica", value: "nutrição clínica" },
  { label: "Esportiva", value: "esportiva" },
  { label: "Comportamento alimentar", value: "comportamento alimentar" },
  { label: "Saúde intestinal", value: "saúde intestinal" },
  { label: "Outro", value: "outro" }
];

const planLabels: Record<string, string> = {
  free: "Gratuito",
  pro: "Profissional",
  clinic: "Clínica"
};

const statusLabels: Record<string, string> = {
  active: "Ativa",
  inactive: "Inativa",
  canceled: "Cancelada",
  canceling: "Cancelamento agendado",
  past_due: "Pagamento pendente",
  unpaid: "Não paga",
  trialing: "Em teste"
};

export function SettingsForm({
  settings,
  billing,
  auditLogs
}: {
  settings: UserSettings;
  billing: BillingSummary;
  auditLogs: AuditLogEntry[];
}) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = <K extends keyof UserSettings>(field: K, value: UserSettings[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = (await response.json().catch(() => null)) as UserSettings | { message?: string } | null;
      if (!response.ok || !payload || ("message" in payload && !("plan" in payload))) {
        setFeedback({ type: "error", message: payload && "message" in payload ? payload.message ?? "Erro ao salvar." : "Erro ao salvar." });
        setSaving(false);
        return;
      }

      setForm(payload as UserSettings);
      setFeedback({ type: "success", message: "Configurações salvas com sucesso." });
    } catch {
      setFeedback({ type: "error", message: "Erro ao salvar. Verifique sua conexão e tente novamente." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <Section
          eyebrow="Configurações da conta"
          title="Conta profissional"
          description="Ajuste os dados usados em PDFs, retornos padrão e identidade do seu ambiente clínico."
        >
          {feedback ? (
            <div
              className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-[#caece6] bg-[#effbf8] text-[#0f766e]"
                  : "border-[#f2d1d5] bg-[#fff1f1] text-[#b42318]"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {feedback.message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <Card className="p-5">
                  <Section eyebrow="Perfil profissional" title="Assinatura e identificação" description="Esses dados alimentam PDFs, cabeçalhos e sua apresentação no sistema.">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InputField label="Nome profissional" value={form.name} onChange={(value) => handleChange("name", value)} />
                      <InputField label="CRN" value={form.crn} onChange={(value) => handleChange("crn", value)} />
                      <InputField label="Nome da clínica" value={form.clinicName} onChange={(value) => handleChange("clinicName", value)} />
                      <InputField label="Telefone profissional" value={form.professionalPhone} onChange={(value) => handleChange("professionalPhone", value)} />
                      <InputField label="Logo da clínica (URL)" value={form.clinicLogoUrl} onChange={(value) => handleChange("clinicLogoUrl", value)} />
                      <InputField label="Assinatura para relatórios" value={form.reportSignature} onChange={(value) => handleChange("reportSignature", value)} />
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-ink">Especialidade ou foco</span>
                        <select
                          className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
                          value={form.specialty}
                          onChange={(event) => handleChange("specialty", event.target.value as SpecialtyFocus | "")}
                        >
                          {specialtyOptions.map((option) => (
                            <option key={option.label} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </Section>
                </Card>

                <Card className="p-5">
                  <Section eyebrow="Preferências do sistema" title="Padrões clínicos" description="Use esses campos para acelerar consultas e padronizar a entrega de relatórios.">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Intervalo padrão de retorno (dias)"
                        type="number"
                        value={String(form.defaultReturnInterval)}
                        onChange={(value) => handleChange("defaultReturnInterval", Number(value) || 30)}
                      />
                      <InputField
                        label="Horário padrão de consulta"
                        type="time"
                        value={form.defaultConsultationTime}
                        onChange={(value) => handleChange("defaultConsultationTime", value)}
                      />
                      <InputField
                        label="Idioma"
                        value={form.locale}
                        onChange={() => undefined}
                        hint="Nesta etapa o idioma do produto permanece em pt-BR."
                        className="bg-slate-50"
                      />
                      <InputField
                        label="Texto padrão de rodapé do PDF"
                        value={form.defaultPdfFooter}
                        textarea
                        placeholder="Ex.: documento confidencial, válido apenas com revisão profissional."
                        onChange={(value) => handleChange("defaultPdfFooter", value)}
                      />
                    </div>
                  </Section>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-5">
                  <Section eyebrow="Conta" title="Assinatura e acesso" description="Resumo rápido do seu plano atual e acesso à área de assinatura.">
                    <div className="space-y-4">
                      <InfoRow label="E-mail" value={form.email} />
                      <InfoRow label="Plano atual" value={planLabels[billing.plan] ?? billing.plan} />
                      <InfoRow label="Status da assinatura" value={statusLabels[billing.status] ?? billing.status} />
                      <InfoRow
                        label="Próxima cobrança"
                        value={billing.currentPeriodEnd ? formatDate(billing.currentPeriodEnd) : "Sem cobrança ativa"}
                      />
                      <Link href="/billing" className="inline-flex items-center rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-moss hover:text-moss">
                        Ir para assinatura
                      </Link>
                    </div>
                  </Section>
                </Card>

                <Card className="p-5">
                  <Section eyebrow="Auditoria básica" title="Últimas ações registradas" description="Logs resumidos para rastrear ações relevantes sem expor dados clínicos completos.">
                    <div className="space-y-3">
                      {auditLogs.length ? (
                        auditLogs.map((log) => (
                          <div key={log.id} className="rounded-2xl border border-line bg-white px-4 py-3">
                            <p className="text-sm font-medium text-ink">{log.action}</p>
                            <p className="mt-1 text-xs text-muted">
                              {log.entityType} • {log.entityId} • {formatDate(log.createdAt)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-line bg-white px-4 py-4 text-sm text-muted">
                          Nenhuma ação auditável registrada ainda.
                        </div>
                      )}
                    </div>
                  </Section>
                </Card>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="min-w-[200px]">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Salvando..." : "Salvar configurações"}
              </Button>
            </div>
          </form>
        </Section>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-sm text-ink">
        <Clock3 className="h-4 w-4 text-moss" />
        {value}
      </p>
    </div>
  );
}
