"use client";

import { useState } from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

import { sumMeal, sumPlan } from "@/lib/meal-plan/macros";
import { MealPlan, Patient } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, color: "#1f2937", fontFamily: "Helvetica" },
  section: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#d9e2dd" },
  title: { fontSize: 18, color: "#21544d", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280" },
  sectionTitle: { fontSize: 12, color: "#21544d", marginBottom: 8 },
  line: { marginBottom: 4, lineHeight: 1.4 },
  mealBlock: { marginBottom: 10, padding: 10, borderWidth: 1, borderColor: "#d9e2dd", borderRadius: 8 },
  note: { marginTop: 6, fontSize: 10, color: "#8b6b20" }
});

function MealPlanDocument({ patient, plan, professionalName }: { patient: Patient; plan: MealPlan; professionalName?: string }) {
  const totals = sumPlan(plan);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Plano alimentar</Text>
          <Text style={styles.subtitle}>{patient.name} • {formatDate(plan.updatedAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <Text style={styles.line}>Objetivo: {plan.goal || "Não informado"}</Text>
          <Text style={styles.line}>Estratégia: {plan.strategy}</Text>
          <Text style={styles.line}>Status: {plan.status}</Text>
          <Text style={styles.line}>Meta nutricional: {plan.targetCalories} kcal • P {plan.targetProtein}g • C {plan.targetCarbs}g • G {plan.targetFat}g</Text>
          <Text style={styles.line}>Planejado: {totals.calories} kcal • P {totals.protein}g • C {totals.carbs}g • G {totals.fat}g</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refeições</Text>
          {plan.meals.map((meal) => {
            const mealTotals = sumMeal(meal);
            return (
              <View key={meal.id} style={styles.mealBlock}>
                <Text style={styles.line}>{meal.name} {meal.time ? `• ${meal.time}` : ""}</Text>
                {meal.items.map((item) => (
                  <Text key={item.id} style={styles.line}>
                    {item.name}: {item.quantity} {item.unit} • {item.calories} kcal • P {item.protein}g • C {item.carbs}g • G {item.fat}g
                  </Text>
                ))}
                {meal.items.some((item) => item.substitutions.length) ? (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.line}>Substituições sugeridas:</Text>
                    {meal.items.flatMap((item) =>
                      item.substitutions.map((substitution) => (
                        <Text key={`${item.id}-${substitution.substituteFood}`} style={styles.line}>
                          {substitution.originalFood} → {substitution.substituteFood} ({substitution.substituteQuantity} {substitution.unit})
                        </Text>
                      ))
                    )}
                  </View>
                ) : null}
                {meal.notes ? <Text style={styles.line}>Observações: {meal.notes}</Text> : null}
                <Text style={styles.line}>Total da refeição: {mealTotals.calories} kcal • P {mealTotals.protein}g • C {mealTotals.carbs}g • G {mealTotals.fat}g</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <Text style={styles.line}>{plan.notes || "Sem observações adicionais."}</Text>
          {plan.professionalReviewRequired ? (
            <Text style={styles.note}>Plano gerado com auxílio de IA. Revisão profissional obrigatória antes da entrega ao paciente.</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assinatura</Text>
          <Text style={styles.line}>{professionalName ?? "Nutricionista responsável"}</Text>
        </View>
      </Page>
    </Document>
  );
}

export function MealPlanPdfDownload({
  patient,
  plan,
  label = "Exportar plano em PDF",
  className,
  professionalName
}: {
  patient: Patient;
  plan: MealPlan;
  label?: string;
  className?: string;
  professionalName?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await pdf(<MealPlanDocument patient={patient} plan={plan} professionalName={professionalName} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `plano-${patient.name.toLowerCase().replaceAll(" ", "-")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-moss/30 hover:bg-[#effbf8] disabled:opacity-60"
      }
    >
      {loading ? "Preparando PDF..." : label}
    </button>
  );
}
