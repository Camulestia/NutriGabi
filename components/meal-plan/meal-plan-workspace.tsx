"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, BrainCircuit, Copy, FileText, LoaderCircle, Plus, RefreshCw, Save, Sparkles, Trash2, TriangleAlert, UtensilsCrossed, Wand2 } from "lucide-react";

import { MealPlanPdfDownload } from "@/components/meal-plan/meal-plan-pdf";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { Section } from "@/components/ui/section";
import { findFoodByName, foodDatabase, getFoodById } from "@/lib/meal-plan/food-database";
import { calculateItemFromFood, getMacroDifference, sumMeal, sumPlan } from "@/lib/meal-plan/macros";
import { suggestSubstitutions } from "@/lib/meal-plan/substitutions";
import { buildEmptyMealPlan } from "@/lib/meal-plan/templates";
import { Consultation, Meal, MealItem, MealPlan, MealPlanStrategy, Patient, Substitution } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const strategyOptions: MealPlanStrategy[] = ["emagrecimento", "hipertrofia", "manutenção", "performance", "saúde metabólica", "saúde intestinal", "reeducação alimentar"];
const seedStorageKey = (patientId: string) => `meal-plan-seed-${patientId}`;

type MealPlanSeed = {
  consultationId?: string;
  title?: string;
  goal?: string;
  strategy?: MealPlanStrategy;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  notes?: string;
  internalNotes?: string;
};

type MacroSuggestion = {
  id: string;
  title: string;
  description: string;
  impact: string;
  apply: (plan: MealPlan) => MealPlan;
};

function cloneMeal(source: Meal): Meal {
  return {
    ...source,
    id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    items: source.items.map((item) => ({
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      substitutions: item.substitutions.map((substitution) => ({ ...substitution }))
    }))
  };
}

function recalculateItem(item: MealItem) {
  const matchedFood = item.foodId ? getFoodById(item.foodId) : findFoodByName(item.name);
  const recalculated = calculateItemFromFood(matchedFood?.id, matchedFood?.name ?? item.name, Number(item.quantity) || 0, item.unit || "g");
  return { ...recalculated, id: item.id, notes: item.notes, substitutions: item.substitutions } satisfies MealItem;
}

function recalculatePlan(plan: MealPlan) {
  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    meals: plan.meals.map((meal) => ({ ...meal, items: meal.items.map(recalculateItem) }))
  } satisfies MealPlan;
}

function buildPlanFromContext(patient: Patient, consultation?: Consultation | null, seed?: MealPlanSeed | null) {
  const base = buildEmptyMealPlan({
    patient,
    consultationId: seed?.consultationId ?? consultation?.id,
    title: seed?.title,
    goal: seed?.goal ?? consultation?.objective,
    strategy: seed?.strategy
  });

  return {
    ...base,
    targetCalories: seed?.targetCalories ?? base.targetCalories,
    targetProtein: seed?.targetProtein ?? base.targetProtein,
    targetCarbs: seed?.targetCarbs ?? base.targetCarbs,
    targetFat: seed?.targetFat ?? base.targetFat,
    notes: [patient.foodNotes, consultation?.chiefComplaint, seed?.notes].filter(Boolean).join("\n\n"),
    internalNotes: [consultation?.professionalDiagnosis, consultation?.conduct, consultation?.goals, seed?.internalNotes].filter(Boolean).join("\n\n")
  } satisfies MealPlan;
}

function findRestrictionAlerts(patient: Patient, plan: MealPlan) {
  const restrictionTerms = [...patient.rejectedFoods, ...patient.allergies, ...patient.intolerances, patient.foodRestrictions].join(",").toLowerCase();
  const alerts: string[] = [];

  plan.meals.forEach((meal) => {
    meal.items.forEach((item) => {
      if (restrictionTerms && restrictionTerms.includes(item.name.toLowerCase())) {
        alerts.push(`${item.name} conflita com restrições persistentes do paciente.`);
      }
    });
  });

  const totals = sumPlan(plan);
  const diff = getMacroDifference(totals, plan);
  if (Math.abs(diff.protein) > 20) alerts.push(`Proteína fora da meta em ${Math.abs(diff.protein)} g.`);
  if (Math.abs(diff.carbs) > 30) alerts.push(`Carboidratos fora da meta em ${Math.abs(diff.carbs)} g.`);
  if (Math.abs(diff.fat) > 15) alerts.push(`Gorduras fora da meta em ${Math.abs(diff.fat)} g.`);
  if (plan.professionalReviewRequired) alerts.push("Plano gerado com auxílio de IA. Revisão profissional obrigatória antes da entrega ao paciente.");
  return alerts;
}

function buildMacroSuggestions(plan: MealPlan): MacroSuggestion[] {
  const totals = sumPlan(plan);
  const suggestions: MacroSuggestion[] = [];
  const proteinGap = plan.targetProtein - totals.protein;
  const carbsExcess = totals.carbs - plan.targetCarbs;
  const fatExcess = totals.fat - plan.targetFat;

  if (proteinGap > 12) {
    suggestions.push({
      id: "protein",
      title: "Proteína abaixo da meta",
      description: "Adicionar uma fonte proteica rápida em uma refeição de adesão fácil.",
      impact: "+24 g proteína • +120 kcal estimados",
      apply: (current) => {
        const next = structuredClone(current);
        const targetMeal = next.meals.find((meal) => meal.name.toLowerCase().includes("lanche")) ?? next.meals[0];
        targetMeal.items.push(calculateItemFromFood("food-whey", "Whey protein", 1, "scoop"));
        return recalculatePlan(next);
      }
    });
  }

  if (carbsExcess > 25) {
    suggestions.push({
      id: "carbs",
      title: "Carboidratos acima da meta",
      description: "Reduzir a maior porção concentrada de carboidratos mantendo saciedade com fibras.",
      impact: "-11 g carboidratos • -50 kcal estimados",
      apply: (current) => {
        const next = structuredClone(current);
        const meal = next.meals.find((candidate) => candidate.items.some((item) => item.name.toLowerCase().includes("arroz")));
        const item = meal?.items.find((candidate) => candidate.name.toLowerCase().includes("arroz"));
        if (item) item.quantity = Math.max(40, item.quantity - 40);
        return recalculatePlan(next);
      }
    });
  }

  if (fatExcess > 10) {
    suggestions.push({
      id: "fat",
      title: "Gorduras acima da meta",
      description: "Rever azeite, castanhas ou cortes mais gordos para equilibrar o total diário.",
      impact: "-8 g gordura • -70 kcal estimados",
      apply: (current) => {
        const next = structuredClone(current);
        const item = next.meals.flatMap((meal) => meal.items).find((candidate) => candidate.name.toLowerCase().includes("azeite") || candidate.name.toLowerCase().includes("castanha"));
        if (item) item.quantity = Math.max(1, item.quantity - 1);
        return recalculatePlan(next);
      }
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      id: "balanced",
      title: "Macros próximos da meta",
      description: "O plano já está equilibrado; use apenas para recalcular e revisar as porções.",
      impact: "Sem alteração automática relevante",
      apply: (current) => recalculatePlan(current)
    });
  }

  return suggestions;
}

function FoodOptions() {
  return (
    <datalist id="food-options">
      {foodDatabase.map((food) => (
        <option key={food.id} value={food.name} />
      ))}
    </datalist>
  );
}

export function MealPlanWorkspace({ patient, initialMealPlans, initialConsultationId, initialMode }: { patient: Patient; initialMealPlans: MealPlan[]; initialConsultationId?: string; initialMode?: string; }) {
  const consultationFromQuery = patient.consultations.find((consultation) => consultation.id === initialConsultationId);
  const [plans, setPlans] = useState<MealPlan[]>(initialMealPlans);
  const [currentPlan, setCurrentPlan] = useState<MealPlan>(() => initialMode === "new" || !initialMealPlans.length ? buildPlanFromContext(patient, consultationFromQuery) : structuredClone(initialMealPlans[0]));
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<null | "save" | "ai" | "history">(null);
  const [activeSubstitutionItemId, setActiveSubstitutionItemId] = useState<string | null>(null);
  const [substitutionMode, setSubstitutionMode] = useState<"calorias" | "macro" | "objetivo">("objetivo");
  const [copySourcePlanId, setCopySourcePlanId] = useState<string>(initialMealPlans[0]?.id ?? "");
  const [copySourceMealId, setCopySourceMealId] = useState<string>(initialMealPlans[0]?.meals[0]?.id ?? "");

  useEffect(() => {
    setExpandedMeals((current) => {
      const next = { ...current };
      currentPlan.meals.forEach((meal) => {
        if (!(meal.id in next)) next[meal.id] = true;
      });
      return next;
    });
  }, [currentPlan.meals]);

  useEffect(() => {
    const raw = window.localStorage.getItem(seedStorageKey(patient.id));
    if (!raw) return;
    try {
      const seed = JSON.parse(raw) as MealPlanSeed;
      const consultation = patient.consultations.find((item) => item.id === (seed.consultationId ?? initialConsultationId));
      setCurrentPlan(buildPlanFromContext(patient, consultation, seed));
      setFeedback("Dados da consulta importados para um novo plano alimentar.");
      window.localStorage.removeItem(seedStorageKey(patient.id));
    } catch {
      window.localStorage.removeItem(seedStorageKey(patient.id));
    }
  }, [initialConsultationId, patient]);

  const planTotals = useMemo(() => sumPlan(currentPlan), [currentPlan]);
  const macroDifference = useMemo(() => getMacroDifference(planTotals, currentPlan), [planTotals, currentPlan]);
  const alerts = useMemo(() => findRestrictionAlerts(patient, currentPlan), [patient, currentPlan]);
  const suggestions = useMemo(() => buildMacroSuggestions(currentPlan), [currentPlan]);
  const currentConsultation = patient.consultations.find((consultation) => consultation.id === currentPlan.consultationId);
  const copySourcePlan = plans.find((plan) => plan.id === copySourcePlanId);
  const copySourceMeals = copySourcePlan?.meals ?? [];

  const updatePlan = (updater: (plan: MealPlan) => MealPlan) => {
    setCurrentPlan((plan) => ({ ...updater(plan), updatedAt: new Date().toISOString() }));
    setFeedback(null);
  };

  const updateMeal = (mealId: string, updater: (meal: Meal) => Meal) => {
    updatePlan((plan) => ({ ...plan, meals: plan.meals.map((meal) => (meal.id === mealId ? updater(meal) : meal)) }));
  };
  const savePlan = async () => {
    setLoading("save");
    try {
      const payload = recalculatePlan(currentPlan);
      const response = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const saved = (await response.json()) as MealPlan;
      if (!response.ok) throw new Error();
      setCurrentPlan(saved);
      setPlans((current) => [saved, ...current.filter((plan) => plan.id !== saved.id)].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      setFeedback("Plano alimentar salvo com sucesso.");
    } catch {
      setFeedback("Não foi possível salvar o plano alimentar agora.");
    } finally {
      setLoading(null);
    }
  };

  const changePlanStatus = async (planId: string, status: MealPlan["status"]) => {
    setLoading("history");
    try {
      const response = await fetch(`/api/meal-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, action: "set-status", status })
      });
      const updated = (await response.json()) as MealPlan;
      if (!response.ok) throw new Error();
      setPlans((current) => current.map((plan) => plan.id === updated.id ? updated : status === "ativo" && plan.status === "ativo" ? { ...plan, status: "rascunho" } : plan));
      if (currentPlan.id === updated.id) setCurrentPlan(updated);
      setFeedback(`Plano marcado como ${status}.`);
    } catch {
      setFeedback("Não foi possível atualizar o status do plano.");
    } finally {
      setLoading(null);
    }
  };

  const duplicatePlan = async (planId: string) => {
    setLoading("history");
    try {
      const response = await fetch(`/api/meal-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, action: "duplicate" })
      });
      const duplicated = (await response.json()) as MealPlan;
      if (!response.ok) throw new Error();
      setPlans((current) => [duplicated, ...current]);
      setCurrentPlan(duplicated);
      setFeedback("Plano duplicado e aberto para edição.");
    } catch {
      setFeedback("Não foi possível duplicar o plano agora.");
    } finally {
      setLoading(null);
    }
  };

  const generateWithAi = async () => {
    setLoading("ai");
    try {
      const response = await fetch("/api/meal-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          consultationId: currentPlan.consultationId,
          targetCalories: currentPlan.targetCalories,
          targetProtein: currentPlan.targetProtein,
          targetCarbs: currentPlan.targetCarbs,
          targetFat: currentPlan.targetFat,
          strategy: currentPlan.strategy,
          numberOfMeals: currentPlan.meals.length,
          notes: currentPlan.notes
        })
      });
      const generated = (await response.json()) as MealPlan;
      if (!response.ok) throw new Error();
      setCurrentPlan(generated);
      setFeedback("Plano estruturado com IA gerado. Revise antes de salvar ou entregar ao paciente.");
    } catch {
      setFeedback("Não foi possível gerar o plano com IA agora.");
    } finally {
      setLoading(null);
    }
  };

  const createNewPlan = () => {
    setCurrentPlan(buildPlanFromContext(patient, consultationFromQuery));
    setFeedback("Novo plano alimentar iniciado.");
  };

  const fillSubstitutions = () => {
    updatePlan((plan) => ({
      ...plan,
      meals: plan.meals.map((meal) => ({
        ...meal,
        items: meal.items.map((item) => ({ ...item, substitutions: suggestSubstitutions({ item, patient, plan, mode: "objetivo" }) }))
      }))
    }));
    setFeedback("Substituições inteligentes sugeridas para o plano atual.");
  };

  const copyMealFromHistory = () => {
    const meal = copySourcePlan?.meals.find((item) => item.id === copySourceMealId);
    if (!meal) return;
    updatePlan((plan) => ({ ...plan, meals: [...plan.meals, { ...cloneMeal(meal), order: plan.meals.length }] }));
  };

  const reorderMeal = (mealId: string, direction: -1 | 1) => {
    updatePlan((plan) => {
      const currentIndex = plan.meals.findIndex((meal) => meal.id === mealId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= plan.meals.length) return plan;
      const meals = [...plan.meals];
      const [moved] = meals.splice(currentIndex, 1);
      meals.splice(nextIndex, 0, moved);
      return { ...plan, meals: meals.map((meal, index) => ({ ...meal, order: index })) };
    });
  };

  const applySubstitution = (mealId: string, itemId: string, substitution: Substitution) => {
    updateMeal(mealId, (meal) => ({
      ...meal,
      items: meal.items.map((item) =>
        item.id === itemId
          ? { ...calculateItemFromFood(findFoodByName(substitution.substituteFood)?.id, substitution.substituteFood, substitution.substituteQuantity, substitution.unit), id: item.id, notes: item.notes, substitutions: item.substitutions }
          : item
      )
    }));
    setActiveSubstitutionItemId(null);
  };

  return (
    <div className="space-y-6">
      <FoodOptions />

      <Card className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link href={`/patients/${patient.id}`} className={buttonStyles({ variant: "secondary" })}>
              <ArrowLeft className="h-4 w-4" />
              Voltar ao perfil
            </Link>
            <div>
              <p className="text-sm font-semibold text-moss">Planejamento alimentar</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{patient.name}</h1>
              <p className="mt-2 text-sm text-muted">Histórico de planos, metas de macros, IA estruturada e substituições inteligentes sem sair do prontuário.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={createNewPlan}>
              <Plus className="h-4 w-4" />
              Criar novo plano alimentar
            </Button>
            <Button onClick={generateWithAi} disabled={loading === "ai"}>
              {loading === "ai" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
              Gerar plano com IA
            </Button>
          </div>
        </div>
      </Card>

      {feedback ? <div className="rounded-2xl border border-[#caece6] bg-[#effbf8] px-4 py-3 text-sm text-[#0f766e]">{feedback}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
        <div className="space-y-6">
          <Card>
            <Section
              eyebrow="Editor"
              title={currentPlan.title || "Novo plano alimentar"}
              description="Monte o plano em refeições editáveis, com cálculo automático de macros por alimento, refeição e total diário."
              action={<span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentPlan.status === "ativo" ? "bg-[#effbf8] text-[#0f766e]" : currentPlan.status === "arquivado" ? "bg-[#f7f9fa] text-muted" : "bg-[#fff7eb] text-[#b45309]"}`}>{currentPlan.status}</span>}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InputField label="Título do plano" value={currentPlan.title} onChange={(value) => updatePlan((plan) => ({ ...plan, title: value }))} />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink">Consulta vinculada (opcional)</span>
                  <select className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10" value={currentPlan.consultationId ?? ""} onChange={(event) => updatePlan((plan) => ({ ...plan, consultationId: event.target.value || undefined }))}>
                    <option value="">Sem vínculo específico</option>
                    {patient.consultations.map((consultation) => <option key={consultation.id} value={consultation.id}>{formatDate(consultation.createdAt)} • {consultation.objective}</option>)}
                  </select>
                </label>
                <InputField label="Objetivo do plano" value={currentPlan.goal} textarea placeholder="Meta clínica e nutricional principal deste plano." onChange={(value) => updatePlan((plan) => ({ ...plan, goal: value }))} />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink">Estratégia</span>
                  <select className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10" value={currentPlan.strategy} onChange={(event) => updatePlan((plan) => ({ ...plan, strategy: event.target.value as MealPlanStrategy }))}>
                    {strategyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <InputField label="Observações gerais" value={currentPlan.notes} textarea placeholder="Contexto do plano, rotina, orientações de adesão e observações úteis ao paciente." onChange={(value) => updatePlan((plan) => ({ ...plan, notes: value }))} />
                <InputField label="Observações internas" value={currentPlan.internalNotes} textarea placeholder="Anotações privadas do profissional que não entram no PDF do paciente." onChange={(value) => updatePlan((plan) => ({ ...plan, internalNotes: value }))} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InputField label="Calorias alvo" value={String(currentPlan.targetCalories)} onChange={(value) => updatePlan((plan) => ({ ...plan, targetCalories: Number(value) || 0 }))} />
                <InputField label="Proteínas alvo" value={String(currentPlan.targetProtein)} onChange={(value) => updatePlan((plan) => ({ ...plan, targetProtein: Number(value) || 0 }))} />
                <InputField label="Carboidratos alvo" value={String(currentPlan.targetCarbs)} onChange={(value) => updatePlan((plan) => ({ ...plan, targetCarbs: Number(value) || 0 }))} />
                <InputField label="Gorduras alvo" value={String(currentPlan.targetFat)} onChange={(value) => updatePlan((plan) => ({ ...plan, targetFat: Number(value) || 0 }))} />
              </div>

              {currentConsultation ? <div className="mt-5 rounded-3xl border border-[#caece6] bg-[#effbf8] p-4 text-sm text-[#0f766e]">Plano vinculado à consulta de {formatDate(currentConsultation.createdAt)}. Objetivo importado: {currentConsultation.objective || "não informado"}.</div> : null}
            </Section>
          </Card>

          <Card>
            <Section eyebrow="Preferências e restrições" title="Alertas persistentes do paciente" description="Esses dados entram automaticamente na IA, nas substituições e na revisão clínica do plano." action={<Link href={`/patients/${patient.id}/edit`} className={buttonStyles({ variant: "secondary" })}>Editar dados do paciente</Link>}>
              <div className="grid gap-4 md:grid-cols-2">
                <PreferenceCard label="Alimentos indispensáveis" value={patient.preferredFoods.join(", ")} />
                <PreferenceCard label="Alimentos não aceitos" value={patient.rejectedFoods.join(", ")} />
                <PreferenceCard label="Alergias" value={patient.allergies.join(", ")} />
                <PreferenceCard label="Intolerâncias" value={patient.intolerances.join(", ")} />
                <PreferenceCard label="Preferências culturais/religiosas" value={patient.culturalPreferences} />
                <PreferenceCard label="Observações alimentares importantes" value={patient.foodNotes} />
              </div>
            </Section>
          </Card>
          <Card>
            <Section eyebrow="Refeições" title="Estrutura do plano" description="Adicione refeições, edite alimentos com autocomplete e gere substituições diretamente no card da refeição." action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => updatePlan((plan) => ({ ...plan, meals: [...plan.meals, { id: `meal-${Date.now()}`, name: `Refeição ${plan.meals.length + 1}`, time: "", items: [], notes: "", order: plan.meals.length }] }))}><Plus className="h-4 w-4" />Adicionar refeição</Button><Button variant="secondary" onClick={() => updatePlan((plan) => recalculatePlan(plan))}><RefreshCw className="h-4 w-4" />Recalcular plano</Button><Button variant="secondary" onClick={fillSubstitutions}><Sparkles className="h-4 w-4" />Sugerir substituições</Button></div>}>
              <div className="mb-4 grid gap-3 rounded-3xl border border-dashed border-line bg-[#f7f9fa] p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink">Copiar refeição de outro plano</span>
                  <select className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink" value={copySourcePlanId} onChange={(event) => { setCopySourcePlanId(event.target.value); setCopySourceMealId(plans.find((plan) => plan.id === event.target.value)?.meals[0]?.id ?? ""); }}>
                    <option value="">Selecione um plano</option>
                    {plans.filter((plan) => plan.id !== currentPlan.id).map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-ink">Refeição de origem</span>
                  <select className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink" value={copySourceMealId} onChange={(event) => setCopySourceMealId(event.target.value)}>
                    <option value="">Selecione uma refeição</option>
                    {copySourceMeals.map((meal) => <option key={meal.id} value={meal.id}>{meal.name} {meal.time ? `• ${meal.time}` : ""}</option>)}
                  </select>
                </label>
                <div className="flex items-end"><Button variant="secondary" onClick={copyMealFromHistory} disabled={!copySourcePlanId || !copySourceMealId}><Copy className="h-4 w-4" />Copiar refeição</Button></div>
              </div>

              <div className="space-y-4">
                {currentPlan.meals.map((meal, mealIndex) => {
                  const totals = sumMeal(meal);
                  const expanded = expandedMeals[meal.id] ?? true;
                  return (
                    <div key={meal.id} className="rounded-3xl border border-line bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-1 items-center gap-3">
                          <button type="button" className="rounded-full border border-line px-3 py-1 text-sm text-ink transition hover:border-moss/30 hover:bg-[#effbf8]" onClick={() => setExpandedMeals((current) => ({ ...current, [meal.id]: !expanded }))}>{expanded ? "Ocultar" : "Expandir"}</button>
                          <div className="flex-1"><InputField label="Nome da refeição" value={meal.name} onChange={(value) => updateMeal(meal.id, (current) => ({ ...current, name: value }))} /></div>
                          <div className="w-[150px]"><InputField label="Horário" value={meal.time} type="time" onChange={(value) => updateMeal(meal.id, (current) => ({ ...current, time: value }))} /></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => reorderMeal(meal.id, -1)} disabled={mealIndex === 0}><ArrowUp className="h-4 w-4" /></Button>
                          <Button variant="secondary" onClick={() => reorderMeal(meal.id, 1)} disabled={mealIndex === currentPlan.meals.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                          <Button variant="secondary" onClick={() => updatePlan((plan) => ({ ...plan, meals: [...plan.meals, { ...cloneMeal(meal), order: plan.meals.length }] }))}><Copy className="h-4 w-4" />Duplicar refeição</Button>
                          <Button variant="secondary" onClick={() => updatePlan((plan) => ({ ...plan, meals: plan.meals.filter((item) => item.id !== meal.id).map((item, index) => ({ ...item, order: index })) }))}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>

                      {expanded ? <div className="mt-4 space-y-4"><div className="rounded-2xl bg-[#f7f9fa] p-4 text-sm text-muted">Total da refeição: {totals.calories} kcal • P {totals.protein}g • C {totals.carbs}g • G {totals.fat}g</div><div className="space-y-3">{meal.items.map((item) => {
                        const matchedFood = item.foodId ? getFoodById(item.foodId) : findFoodByName(item.name);
                        const availableUnits = Object.keys(matchedFood?.commonUnits ?? { g: 1, unidade: 1, ml: 1 });
                        const substitutionSuggestions = suggestSubstitutions({ item, patient, plan: currentPlan, mode: substitutionMode });
                        return (
                          <div key={item.id} className="rounded-3xl border border-line/80 p-4">
                            <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_120px_120px_auto]">
                              <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Alimento</span><input list="food-options" value={item.name} onChange={(event) => updateMeal(meal.id, (current) => ({ ...current, items: current.items.map((entry) => entry.id === item.id ? recalculateItem({ ...entry, foodId: findFoodByName(event.target.value)?.id, name: event.target.value }) : entry) }))} className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10" placeholder="Digite para buscar alimento" /></label>
                              <InputField label="Quantidade" value={String(item.quantity)} onChange={(value) => updateMeal(meal.id, (current) => ({ ...current, items: current.items.map((entry) => entry.id === item.id ? recalculateItem({ ...entry, quantity: Number(value) || 0 }) : entry) }))} />
                              <label className="block"><span className="mb-2 block text-sm font-medium text-ink">Unidade</span><select className="h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink shadow-sm outline-none transition focus:border-moss focus:ring-4 focus:ring-moss/10" value={item.unit} onChange={(event) => updateMeal(meal.id, (current) => ({ ...current, items: current.items.map((entry) => entry.id === item.id ? recalculateItem({ ...entry, unit: event.target.value }) : entry) }))}>{availableUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label>
                              <div className="flex items-end gap-2"><Button variant="secondary" onClick={() => setActiveSubstitutionItemId(activeSubstitutionItemId === item.id ? null : item.id)}><Wand2 className="h-4 w-4" />Substituir</Button><Button variant="secondary" onClick={() => updateMeal(meal.id, (current) => ({ ...current, items: current.items.filter((entry) => entry.id !== item.id) }))}><Trash2 className="h-4 w-4" /></Button></div>
                            </div>
                            <div className="mt-3 rounded-2xl bg-[#f7f9fa] px-4 py-3 text-sm text-muted">{item.calories} kcal • P {item.protein}g • C {item.carbs}g • G {item.fat}g {item.fibers ? `• Fibras ${item.fibers}g` : ""}</div>
                            <InputField label="Observações" value={item.notes} placeholder="Observações específicas deste alimento ou da porção." onChange={(value) => updateMeal(meal.id, (current) => ({ ...current, items: current.items.map((entry) => entry.id === item.id ? { ...entry, notes: value } : entry) }))} className="mt-3" />
                            {activeSubstitutionItemId === item.id ? <div className="mt-3 rounded-3xl border border-[#caece6] bg-[#f8fdfc] p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-ink">Substituições inteligentes</p><select className="h-10 rounded-2xl border border-line bg-white px-3 text-sm text-ink" value={substitutionMode} onChange={(event) => setSubstitutionMode(event.target.value as typeof substitutionMode)}><option value="calorias">Equivalência calórica</option><option value="macro">Macronutriente principal</option><option value="objetivo">Respeitando objetivo</option></select></div><div className="space-y-3">{substitutionSuggestions.map((suggestion) => <div key={suggestion.substituteFood} className="rounded-2xl border border-line bg-white p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium text-ink">{suggestion.originalFood} → {suggestion.substituteFood}</p><p className="mt-1 text-sm text-muted">{suggestion.substituteQuantity} {suggestion.unit} • {suggestion.reason}</p><p className="mt-1 text-xs text-muted">Δ kcal {suggestion.macroDifference.calories} • Δ P {suggestion.macroDifference.protein} • Δ C {suggestion.macroDifference.carbs} • Δ G {suggestion.macroDifference.fat}</p></div><Button variant="secondary" onClick={() => applySubstitution(meal.id, item.id, suggestion)}>Aplicar substituição</Button></div></div>)}</div></div> : null}
                          </div>
                        );
                      })}</div><div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={() => updateMeal(meal.id, (current) => ({ ...current, items: [...current.items, calculateItemFromFood("food-egg", "Ovo", 1, "unidade")] }))}><Plus className="h-4 w-4" />Adicionar alimento</Button></div><InputField label="Observações da refeição" value={meal.notes} textarea placeholder="Orientações dessa refeição, janela alimentar, preparo ou contexto de adesão." onChange={(value) => updateMeal(meal.id, (current) => ({ ...current, notes: value }))} /></div> : null}
                    </div>
                  );
                })}
              </div>
            </Section>
          </Card>
        </div>

        <div className="space-y-6">
          <Card><Section eyebrow="Resumo diário" title="Macros do plano" description="Compare rapidamente meta, valor atual e diferença absoluta do plano em edição."><div className="grid gap-3"><MetricCard label="Kcal" value={`${planTotals.calories}`} subtitle={`Meta ${currentPlan.targetCalories} • Δ ${macroDifference.calories > 0 ? "+" : ""}${macroDifference.calories}`} tone={Math.abs(macroDifference.calories) > 120 ? "amber" : "mint"} /><MetricCard label="Proteínas" value={`${planTotals.protein} g`} subtitle={`Meta ${currentPlan.targetProtein} • Δ ${macroDifference.protein > 0 ? "+" : ""}${macroDifference.protein}`} tone={Math.abs(macroDifference.protein) > 15 ? "amber" : "mint"} /><MetricCard label="Carboidratos" value={`${planTotals.carbs} g`} subtitle={`Meta ${currentPlan.targetCarbs} • Δ ${macroDifference.carbs > 0 ? "+" : ""}${macroDifference.carbs}`} tone={Math.abs(macroDifference.carbs) > 20 ? "amber" : "mint"} /><MetricCard label="Gorduras" value={`${planTotals.fat} g`} subtitle={`Meta ${currentPlan.targetFat} • Δ ${macroDifference.fat > 0 ? "+" : ""}${macroDifference.fat}`} tone={Math.abs(macroDifference.fat) > 10 ? "amber" : "mint"} /></div></Section></Card>
          <Card><Section eyebrow="Ajuste automático" title="Sugestões de macros" description="O ajuste é sempre sugestão. Você decide se aplica ou não no plano atual."><div className="space-y-3">{suggestions.map((suggestion) => <div key={suggestion.id} className="rounded-3xl border border-line bg-white p-4"><p className="text-sm font-semibold text-ink">{suggestion.title}</p><p className="mt-1 text-sm text-muted">{suggestion.description}</p><p className="mt-1 text-xs text-muted">Impacto estimado: {suggestion.impact}</p><div className="mt-3"><Button variant="secondary" onClick={() => setCurrentPlan(suggestion.apply(currentPlan))}>Aplicar</Button></div></div>)}</div></Section></Card>
          <Card><Section eyebrow="Alertas" title="Segurança clínica" description="Sinais de atenção para restrições, revisão profissional e desequilíbrio importante de macros."><div className="space-y-3">{alerts.length ? alerts.map((alert) => <div key={alert} className="flex items-start gap-3 rounded-3xl border border-[#f7dbad] bg-[#fff7eb] p-4 text-sm text-[#b45309]"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{alert}</span></div>) : <div className="rounded-3xl border border-[#caece6] bg-[#effbf8] p-4 text-sm text-[#0f766e]">Sem alertas importantes para o plano atual.</div>}</div></Section></Card>
          <Card><Section eyebrow="Ações" title="Salvar, revisar e exportar" description="O plano permanece editável mesmo após salvar. A entrega ao paciente exige revisão profissional."><div className="space-y-3"><Button onClick={savePlan} disabled={loading === "save"} className="w-full justify-center">{loading === "save" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar plano alimentar</Button><MealPlanPdfDownload patient={patient} plan={currentPlan} className="inline-flex w-full items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-moss/30 hover:bg-[#effbf8]" /><div className="rounded-3xl border border-[#caece6] bg-[#f8fdfc] p-4 text-sm text-muted">Plano gerado com auxílio de IA. Revisão profissional obrigatória antes da entrega ao paciente.</div></div></Section></Card>
        </div>
      </div>
      <Card>
        <Section eyebrow="Planos anteriores" title="Histórico de planos alimentares" description="Acompanhe versões anteriores, duplique estratégias e marque qual plano está ativo no momento.">
          <div className="space-y-3">
            {plans.length ? plans.map((plan) => (
              <div key={plan.id} className="rounded-3xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{plan.title}</p>
                    <p className="mt-1 text-sm text-muted">{formatDate(plan.createdAt)} • {plan.goal}</p>
                    <p className="mt-1 text-xs text-muted">{plan.status} • {plan.targetCalories} kcal • P {plan.targetProtein}g • C {plan.targetCarbs}g • G {plan.targetFat}g</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setCurrentPlan(structuredClone(plan))}><UtensilsCrossed className="h-4 w-4" />Ver</Button>
                    <Button variant="secondary" onClick={() => setCurrentPlan(structuredClone(plan))}>Editar</Button>
                    <Button variant="secondary" onClick={() => duplicatePlan(plan.id)} disabled={loading === "history"}><Copy className="h-4 w-4" />Duplicar</Button>
                    <MealPlanPdfDownload patient={patient} plan={plan} label="Exportar PDF" className="inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-moss/30 hover:bg-[#effbf8]" />
                    <Button variant="secondary" onClick={() => changePlanStatus(plan.id, "ativo")} disabled={plan.status === "ativo" || loading === "history"}><Sparkles className="h-4 w-4" />Tornar plano ativo</Button>
                    <Button variant="secondary" onClick={() => changePlanStatus(plan.id, "arquivado")} disabled={plan.status === "arquivado" || loading === "history"}><FileText className="h-4 w-4" />Arquivar</Button>
                  </div>
                </div>
              </div>
            )) : <div className="rounded-3xl border border-dashed border-line bg-white p-6 text-sm text-muted">Nenhum plano alimentar salvo até o momento.</div>}
          </div>
        </Section>
      </Card>
    </div>
  );
}

function PreferenceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6 text-ink">{value || "Não informado"}</p>
    </div>
  );
}
