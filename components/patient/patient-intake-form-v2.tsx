"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LoaderCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { Section } from "@/components/ui/section";

type PatientFormState = {
  name: string;
  birthDate: string;
  sex: "Feminino" | "Masculino" | "Outro";
  phone: string;
  email: string;
  profession: string;
  mainObjective: string;
  chiefComplaint: string;
  clinicalHistory: string;
  medications: string;
  supplements: string;
  foodRestrictions: string;
  notes: string;
};

const initialState: PatientFormState = {
  name: "",
  birthDate: "",
  sex: "Feminino",
  phone: "",
  email: "",
  profession: "",
  mainObjective: "",
  chiefComplaint: "",
  clinicalHistory: "",
  medications: "",
  supplements: "",
  foodRestrictions: "",
  notes: ""
};

export function PatientIntakeFormV2() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (field: keyof PatientFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (feedback) setFeedback(null);
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Informe o nome do paciente.";
    if (!form.birthDate.trim()) return "Informe a data de nascimento.";
    if (!form.mainObjective.trim()) return "Informe o objetivo principal.";
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const response = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const created = (await response.json()) as { id: string };
    setSaving(false);

    if (response.ok) {
      setForm(initialState);
      setFeedback({ type: "success", message: "Paciente cadastrado com sucesso. Abrindo prontuário..." });
      router.refresh();
      router.push(`/patients/${created.id}`);
    } else {
      setFeedback({ type: "error", message: "Não foi possível cadastrar o paciente. Tente novamente." });
    }
  };

  return (
    <Card className="p-0">
      <form onSubmit={handleSubmit} className="p-6">
        <Section
          eyebrow="Cadastro de paciente"
          title="Novo prontuário"
          description="Campos grandes, diretos e organizados para agilizar o início de uma consulta."
          action={
            <Button type="submit" className="min-w-[180px]" disabled={saving} aria-label="Cadastrar paciente">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {saving ? "Salvando..." : "Cadastrar paciente"}
            </Button>
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
            <InputField label="E-mail" value={form.email} placeholder="paciente@email.com" onChange={(value) => handleChange("email", value)} />
            <InputField label="Profissão" value={form.profession} placeholder="Ex.: advogada, professora, médica" onChange={(value) => handleChange("profession", value)} />
            <InputField label="Objetivo principal" value={form.mainObjective} placeholder="Ex.: emagrecimento, performance, ganho de massa" error={!form.mainObjective.trim() && feedback?.type === "error" ? "Campo obrigatório." : undefined} onChange={(value) => handleChange("mainObjective", value)} />
            <InputField label="Queixa principal" value={form.chiefComplaint} textarea placeholder="Sintomas, dificuldades ou demandas trazidas pelo paciente." onChange={(value) => handleChange("chiefComplaint", value)} />
            <InputField label="Histórico clínico" value={form.clinicalHistory} textarea placeholder="Doenças prévias, histórico familiar, observações importantes." onChange={(value) => handleChange("clinicalHistory", value)} />
            <InputField label="Medicamentos" value={form.medications} placeholder="Uso atual e frequência" onChange={(value) => handleChange("medications", value)} />
            <InputField label="Suplementos" value={form.supplements} placeholder="Ex.: creatina 5g/dia" onChange={(value) => handleChange("supplements", value)} />
            <InputField label="Restrições alimentares" value={form.foodRestrictions} placeholder="Lactose, glúten, alergias, preferências" onChange={(value) => handleChange("foodRestrictions", value)} />
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
        </Section>
      </form>
    </Card>
  );
}
