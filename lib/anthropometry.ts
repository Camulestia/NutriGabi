import { AnthropometricMetrics, Anthropometry } from "@/lib/types";

function classifyBmi(bmi: number) {
  if (bmi < 18.5) return "Baixo peso";
  if (bmi < 25) return "Eutrofia";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade grau I";
  if (bmi < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

export function calculateAnthropometricMetrics(data: Anthropometry): AnthropometricMetrics {
  const bmi = data.currentWeight / (data.height * data.height);
  const waistHipRatio = data.hip > 0 ? data.waist / data.hip : 0;
  const weightLossPercent =
    data.habitualWeight > 0 ? ((data.habitualWeight - data.currentWeight) / data.habitualWeight) * 100 : 0;
  const idealWeight = 22 * (data.height * data.height);
  const weightAdequacy = idealWeight > 0 ? (data.currentWeight / idealWeight) * 100 : 0;
  const estimatedBodyFatPercent =
    (data.skinfolds.tricipital + data.skinfolds.subscapular + data.skinfolds.suprailiac + data.skinfolds.abdominal) *
    0.28;

  const alerts: string[] = [];
  if (weightLossPercent > 10) alerts.push("Perda de peso acima de 10% do habitual.");
  if (bmi < 16 || bmi > 40) alerts.push("IMC em faixa extrema, requerendo análise clínica cuidadosa.");
  if (waistHipRatio >= 0.85) alerts.push("Relação cintura-quadril sugere maior risco cardiometabólico.");

  return {
    bmi,
    bmiClassification: classifyBmi(bmi),
    waistHipRatio,
    waistHipRisk: waistHipRatio >= 0.85 ? "Elevado" : "Monitorar",
    weightLossPercent,
    idealWeight,
    weightAdequacy,
    estimatedBodyFatPercent,
    alerts
  };
}
