"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, UserPlus } from "lucide-react";

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

export function PatientIntakeForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof PatientFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const created = (await response.json()) as { id: string };
    setSaving(false);

    if (response.ok) {
      setForm(initialState);
      router.refresh();
      router.push(`/patients/${created.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel rounded-[2rem] border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-moss/70">Cadastro de paciente</p>
          <h2 className="mt-2 text-2xl font-semibold text-moss">Novo prontuário</h2>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {saving ? "Salvando..." : "Cadastrar paciente"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Nome" value={form.name} onChange={(value) => handleChange("name", value)} />
        <Field label="Data de nascimento" value={form.birthDate} type="date" onChange={(value) => handleChange("birthDate", value)} />
        <Field label="Telefone" value={form.phone} onChange={(value) => handleChange("phone", value)} />
        <Field label="E-mail" value={form.email} onChange={(value) => handleChange("email", value)} />
        <Field label="Profissão" value={form.profession} onChange={(value) => handleChange("profession", value)} />
        <Field label="Objetivo principal" value={form.mainObjective} onChange={(value) => handleChange("mainObjective", value)} />
        <Field label="Queixa principal" value={form.chiefComplaint} onChange={(value) => handleChange("chiefComplaint", value)} textarea />
        <Field label="Histórico clínico" value={form.clinicalHistory} onChange={(value) => handleChange("clinicalHistory", value)} textarea />
        <Field label="Medicamentos" value={form.medications} onChange={(value) => handleChange("medications", value)} />
        <Field label="Suplementos" value={form.supplements} onChange={(value) => handleChange("supplements", value)} />
        <Field label="Restrições alimentares" value={form.foodRestrictions} onChange={(value) => handleChange("foodRestrictions", value)} />
        <Field label="Observações gerais" value={form.notes} onChange={(value) => handleChange("notes", value)} textarea />

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-moss">Sexo</span>
          <select
            className="w-full rounded-3xl border border-moss/15 bg-white px-4 py-3 text-sm text-ink transition focus:border-moss/35 focus:outline-none"
            value={form.sex}
            onChange={(event) => handleChange("sex", event.target.value as PatientFormState["sex"])}
          >
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
          </select>
        </label>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  type
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  type?: string;
}) {
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
          type={type ?? "text"}
          className="w-full rounded-3xl border border-moss/15 bg-white px-4 py-3 text-sm text-ink transition focus:border-moss/35 focus:outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}
