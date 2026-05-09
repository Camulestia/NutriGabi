"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, PencilLine, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { Section } from "@/components/ui/section";
import {
  getEmailWarning,
  PatientFormState,
  textToList,
  toPatientFormState,
  validatePatientForm
} from "@/lib/patient-form";
import { Patient } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function PatientIntakeFormV2({
  mode = "create",
  patient,
  cancelHref
}: {
  mode?: "create" | "edit";
  patient?: Patient;
  cancelHref?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PatientFormState>(() => toPatientFormState(patient));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const emailWarning = useMemo(() => getEmailWarning(form.email), [form.email]);

  const handleChange = (field: keyof PatientFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validatePatientForm(form);
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(mode === "create" ? "/api/patients" : `/api/patients/${patient?.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          preferredFoods: textToList(form.preferredFoods),
          rejectedFoods: textToList(form.rejectedFoods),
          allergies: textToList(form.allergies),
          intolerances: textToList(form.intolerances),
          consentDate: form.consentToStoreHealthData ? form.consentDate || undefined : undefined
        })
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json") ? ((await response.json()) as { id?: string; message?: string }) : null;

      if (!response.ok || !payload?.id) {
        setFeedback({
          type: "error",
          message:
            payload?.message ??
            (mode === "create"
              ? "Não foi possível cadastrar o paciente. Tente novamente."
              : "Não foi possível atualizar os dados do paciente. Tente novamente.")
        });
        setSaving(false);
        return;
      }

      setFeedback({
        type: "success",
        message:
          mode === "create"
            ? "Paciente cadastrado com sucesso. Abrindo prontuário..."
            : "Dados atualizados com sucesso. Voltando ao perfil..."
      });
      setSaving(false);
      router.push(mode === "create" ? `/patients/${payload.id}` : `/patients/${payload.id}?updated=1`);
      if (mode === "edit") {
        router.refresh();
      }
    } catch {
      setSaving(false);
      setFeedback({
        type: "error",
        message:
          mode === "create"
            ? "Não foi possível cadastrar o paciente. Tente novamente."
            : "Não foi possível atualizar os dados do paciente. Tente novamente."
      });
    }
  };

  const title = mode === "create" ? "Novo prontuário" : "Editar dados do paciente";
  const description =
    mode === "create"
      ? "Campos grandes, diretos e organizados para agilizar o início de uma consulta."
      : "Atualize os dados cadastrais sem afetar o histórico de consultas do paciente.";

  return (
    <Card className="p-0">
      <form onSubmit={handleSubmit} className="p-6">
        <Section
          eyebrow={mode === "create" ? "Cadastro de paciente" : "Edição de cadastro"}
          title={title}
          description={description}
          action={
            <div className="flex flex-wrap items-center gap-3">
              {mode === "edit" && cancelHref ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push(cancelHref)}
                  aria-label="Cancelar edição do paciente"
                >
                  Cancelar
                </Button>
              ) : null}
              <Button
                type="submit"
                className="min-w-[180px]"
                disabled={saving}
                aria-label={mode === "create" ? "Cadastrar paciente" : "Salvar alterações do paciente"}
                data-testid={mode === "create" ? "patient-submit-button" : "patient-save-button"}
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : mode === "create" ? (
                  <UserPlus className="h-4 w-4" />
                ) : (
                  <PencilLine className="h-4 w-4" />
                )}
                {saving ? "Salvando..." : mode === "create" ? "Cadastrar paciente" : "Salvar alterações"}
              </Button>
            </div>
          }
        >
          {feedback ? (
            <div
              className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-[#caece6] bg-[#effbf8] text-[#0f766e]"
                  : "border-[#f2d1d5] bg-[#fff1f1] text-[#b42318]"
              }`}
            >
              {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {feedback.message}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Nome" value={form.name} placeholder="Nome completo do paciente" error={!form.name.trim() && feedback?.type === "error" ? "Campo obrigatório." : undefined} onChange={(value) => handleChange("name", value)} />
            <InputField label="Data de nascimento" value={form.birthDate} type="date" hint="A idade é calculada automaticamente no perfil." error={!form.birthDate.trim() && feedback?.type === "error" ? "Campo obrigatório." : undefined} onChange={(value) => handleChange("birthDate", value)} />
            <InputField label="Telefone" value={form.phone} placeholder="(00) 00000-0000" onChange={(value) => handleChange("phone", value)} />
            <InputField label="E-mail" value={form.email} placeholder="paciente@email.com" warning={emailWarning ?? undefined} onChange={(value) => handleChange("email", value)} />
            <InputField label="Profissão" value={form.profession} placeholder="Ex.: advogada, professora, médica" onChange={(value) => handleChange("profession", value)} />
            <InputField label="Objetivo principal" value={form.mainObjective} placeholder="Ex.: emagrecimento, performance, ganho de massa" onChange={(value) => handleChange("mainObjective", value)} />
            <InputField label="Queixa principal" value={form.chiefComplaint} textarea placeholder="Sintomas, dificuldades ou demandas trazidas pelo paciente." onChange={(value) => handleChange("chiefComplaint", value)} />
            <InputField label="Histórico clínico" value={form.clinicalHistory} textarea placeholder="Doenças prévias, histórico familiar, observações importantes." onChange={(value) => handleChange("clinicalHistory", value)} />
            <InputField label="Medicamentos" value={form.medications} placeholder="Uso atual e frequência" onChange={(value) => handleChange("medications", value)} />
            <InputField label="Suplementos" value={form.supplements} placeholder="Ex.: creatina 5g/dia" onChange={(value) => handleChange("supplements", value)} />
            <InputField label="Restrições alimentares" value={form.foodRestrictions} placeholder="Lactose, glúten, alergias, preferências" onChange={(value) => handleChange("foodRestrictions", value)} />
            <InputField label="Alimentos indispensáveis" value={form.preferredFoods} textarea placeholder="Separe por vírgula os alimentos que ajudam na adesão do plano." onChange={(value) => handleChange("preferredFoods", value)} />
            <InputField label="Alimentos não aceitos" value={form.rejectedFoods} textarea placeholder="Separe por vírgula os alimentos recusados ou aversões importantes." onChange={(value) => handleChange("rejectedFoods", value)} />
            <InputField label="Alergias alimentares" value={form.allergies} textarea placeholder="Separe por vírgula os alimentos/alérgenos." onChange={(value) => handleChange("allergies", value)} />
            <InputField label="Intolerâncias alimentares" value={form.intolerances} textarea placeholder="Separe por vírgula as intolerâncias relatadas." onChange={(value) => handleChange("intolerances", value)} />
            <InputField label="Preferências culturais/religiosas" value={form.culturalPreferences} textarea placeholder="Ex.: kosher, halal, tradições familiares, jejuns." onChange={(value) => handleChange("culturalPreferences", value)} />
            <InputField label="Observações alimentares importantes" value={form.foodNotes} textarea placeholder="Pontos que devem aparecer automaticamente em todo novo plano." onChange={(value) => handleChange("foodNotes", value)} />
            <InputField label="Observações gerais" value={form.notes} textarea placeholder="Observações operacionais ou clínicas relevantes." onChange={(value) => handleChange("notes", value)} />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Sexo</span>
              <select
                className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10"
                value={form.sex}
                onChange={(event) => handleChange("sex", event.target.value as PatientFormState["sex"])}
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-3xl border border-line bg-[#fbfdfd] p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-sage text-moss">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Consentimento para dados sensíveis</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Registre se o paciente consentiu com o armazenamento de dados sensíveis de saúde para adequação básica à LGPD.
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-line text-moss focus:ring-moss"
                    checked={form.consentToStoreHealthData}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      handleChange("consentToStoreHealthData", checked);
                      if (checked && !form.consentDate) {
                        handleChange("consentDate", new Date().toISOString().slice(0, 10));
                      }
                      if (!checked) {
                        handleChange("consentDate", "");
                      }
                    }}
                  />
                  <span>Este paciente consentiu com o armazenamento de dados sensíveis de saúde.</span>
                </label>

                <p className={`text-xs ${form.consentToStoreHealthData ? "text-[#0f766e]" : "text-[#b45309]"}`}>
                  {form.consentToStoreHealthData
                    ? `Consentimento registrado${form.consentDate ? ` em ${formatDate(form.consentDate)}` : ""}.`
                    : "Cadastro permitido, mas a pendência de consentimento ficará destacada no perfil do paciente."}
                </p>
              </div>
            </div>
          </div>
        </Section>
      </form>
    </Card>
  );
}
