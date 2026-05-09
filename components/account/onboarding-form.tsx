"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { Section } from "@/components/ui/section";
import { SpecialtyFocus, UserSettings } from "@/lib/types";

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

export function OnboardingForm({ settings }: { settings: UserSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: settings.name,
    crn: settings.crn,
    clinicName: settings.clinicName,
    professionalPhone: settings.professionalPhone,
    clinicLogoUrl: settings.clinicLogoUrl,
    specialty: settings.specialty,
    acceptedTerms: Boolean(settings.acceptedTermsAt)
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    if (!form.name.trim()) {
      setError("Informe seu nome profissional para concluir o onboarding.");
      return;
    }

    if (!form.acceptedTerms) {
      setError("Você precisa declarar ciência dos Termos de Uso e da Política de Privacidade.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          crn: form.crn,
          clinicName: form.clinicName,
          professionalPhone: form.professionalPhone,
          clinicLogoUrl: form.clinicLogoUrl,
          specialty: form.specialty,
          acceptedTermsAt: new Date().toISOString()
        })
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? "Não foi possível concluir o onboarding.");
        setSaving(false);
        return;
      }

      setFeedback("Onboarding concluído com sucesso. Abrindo seu dashboard...");
      router.refresh();
      router.push("/");
    } catch {
      setError("Não foi possível concluir o onboarding.");
      setSaving(false);
    }
  };

  return (
    <Card className="mx-auto max-w-4xl p-8">
      <form onSubmit={submit} className="space-y-6">
        <Section
          eyebrow="Primeiro acesso"
          title="Configure seu perfil profissional"
          description="Esses dados ajudam a personalizar relatórios, PDFs e a experiência clínica desde o primeiro uso."
        >
          {feedback ? <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#caece6] bg-[#effbf8] px-4 py-3 text-sm text-[#0f766e]"><CheckCircle2 className="h-4 w-4" />{feedback}</div> : null}
          {error ? <div className="mb-4 rounded-2xl border border-[#f2d1d5] bg-[#fff1f1] px-4 py-3 text-sm text-[#b42318]">{error}</div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Nome profissional" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            <InputField label="CRN" value={form.crn} onChange={(value) => setForm((current) => ({ ...current, crn: value }))} />
            <InputField label="Nome da clínica" value={form.clinicName} onChange={(value) => setForm((current) => ({ ...current, clinicName: value }))} />
            <InputField label="Telefone profissional" value={form.professionalPhone} onChange={(value) => setForm((current) => ({ ...current, professionalPhone: value }))} />
            <InputField label="Logo da clínica (URL)" value={form.clinicLogoUrl} onChange={(value) => setForm((current) => ({ ...current, clinicLogoUrl: value }))} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink">Especialidade ou foco</span>
              <select className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10" value={form.specialty} onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value as SpecialtyFocus | "" }))}>
                {specialtyOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-3xl border border-line bg-white p-4 text-sm text-ink">
            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-line text-moss focus:ring-moss" checked={form.acceptedTerms} onChange={(event) => setForm((current) => ({ ...current, acceptedTerms: event.target.checked }))} />
            <span>Declaro estar ciente dos <a href="/terms" className="text-moss underline">Termos de Uso</a> e da <a href="/privacy" className="text-moss underline">Política de Privacidade</a>.</span>
          </label>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[220px]">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Concluindo..." : "Concluir onboarding"}
            </Button>
          </div>
        </Section>
      </form>
    </Card>
  );
}
