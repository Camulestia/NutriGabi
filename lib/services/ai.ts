import OpenAI from "openai";

import { calculateAnthropometricMetrics } from "@/lib/anthropometry";
import { AIInterpretation, Consultation, Patient } from "@/lib/types";

function buildFallbackInterpretation(patient: Patient, consultation: Consultation): AIInterpretation {
  const metrics = calculateAnthropometricMetrics(consultation.anthropometry);
  const hydrationLow = consultation.anamnesis.waterIntake.includes("1,") || consultation.anamnesis.waterIntake.includes("1.");
  const symptoms = consultation.anamnesis.gastrointestinalSymptoms;

  return {
    summary:
      `A avaliação de ${patient.name} sugere foco prioritário em ${consultation.objective.toLowerCase()}, com atenção para composição corporal, rotina alimentar e sinais clínicos que podem estar associados ao quadro atual.`,
    keyFindings: [
      `IMC em ${metrics.bmiClassification.toLowerCase()} (${metrics.bmi.toFixed(1)}).`,
      `Relação cintura-quadril em ${metrics.waistHipRatio.toFixed(2)}, com risco ${metrics.waistHipRisk.toLowerCase()}.`,
      `Bioimpedância aponta gordura corporal de ${consultation.bioimpedance.bodyFatPercent.toFixed(1)}% e ângulo de fase de ${consultation.bioimpedance.phaseAngle.toFixed(1)}.`
    ],
    nutritionalRisks: [
      ...(metrics.alerts.length ? metrics.alerts : ["Monitorar risco nutricional conforme evolução clínica."]),
      hydrationLow ? "Ingestão hídrica pode estar abaixo do ideal para a rotina relatada." : "Hidratação em evolução, seguir acompanhando."
    ],
    possibleDeficiencies: [
      "Correlacionar sinais clínicos e exames para avaliar possíveis insuficiências de micronutrientes.",
      consultation.labExam.vitaminD ? `Vitamina D: ${consultation.labExam.vitaminD}.` : "Sem valor de vitamina D informado."
    ],
    correlations: [
      `Sintomas gastrointestinais (${symptoms}) podem estar associados ao padrão alimentar descrito.`,
      "Sono, estresse e regularidade das refeições merecem avaliação integrada com os objetivos do paciente."
    ],
    attentionPoints: [
      "Evitar interpretar este retorno como diagnóstico médico definitivo.",
      "Revisar adesão prática à conduta e barreiras de rotina na próxima consulta."
    ],
    conductSuggestions: [
      "Estruturar plano alimentar compatível com a agenda do paciente.",
      "Acompanhar ingestão proteica, hídrica e distribuição das refeições.",
      "Reavaliar medidas centrais e sintomas em curto prazo."
    ],
    nextConsultationSuggestions: [
      "Comparar peso, IMC, cintura e gordura corporal.",
      "Atualizar exames relevantes conforme necessidade clínica.",
      "Registrar percepção de energia, sono e sintomas digestivos."
    ],
    generatedAt: new Date().toISOString()
  };
}

export async function generateAiInterpretation(patient: Patient, consultation: Consultation) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackInterpretation(patient, consultation);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Voce e um assistente clinico para nutricionistas. Nao forneca diagnostico medico definitivo. Use linguagem como sugere, pode estar associado e avaliar."
      },
      {
        role: "user",
        content: JSON.stringify({ patient, consultation })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "nutrition_interpretation",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            keyFindings: { type: "array", items: { type: "string" } },
            nutritionalRisks: { type: "array", items: { type: "string" } },
            possibleDeficiencies: { type: "array", items: { type: "string" } },
            correlations: { type: "array", items: { type: "string" } },
            attentionPoints: { type: "array", items: { type: "string" } },
            conductSuggestions: { type: "array", items: { type: "string" } },
            nextConsultationSuggestions: { type: "array", items: { type: "string" } }
          },
          required: [
            "summary",
            "keyFindings",
            "nutritionalRisks",
            "possibleDeficiencies",
            "correlations",
            "attentionPoints",
            "conductSuggestions",
            "nextConsultationSuggestions"
          ]
        }
      }
    }
  });

  const parsed = JSON.parse(response.output_text);
  return {
    ...parsed,
    generatedAt: new Date().toISOString()
  } as AIInterpretation;
}
