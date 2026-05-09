import { Prisma } from "@prisma/client";
import OpenAI from "openai";

import { calculateAnthropometricMetrics } from "@/lib/anthropometry";
import { AppError } from "@/lib/errors";
import { findFoodByName, foodDatabase } from "@/lib/meal-plan/food-database";
import { calculateItemFromFood } from "@/lib/meal-plan/macros";
import { buildDefaultMeals } from "@/lib/meal-plan/templates";
import { AIInterpretation, Consultation, MealPlan, MealPlanStrategy, Patient } from "@/lib/types";

const AI_TIMEOUT_MS = 20_000;

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

function buildSafeInterpretationPayload(patient: Patient, consultation: Consultation) {
  return {
    patient: {
      id: patient.id,
      sex: patient.sex,
      age: patient.birthDate,
      mainObjective: patient.mainObjective,
      foodRestrictions: patient.foodRestrictions,
      allergies: patient.allergies,
      intolerances: patient.intolerances,
      preferredFoods: patient.preferredFoods,
      rejectedFoods: patient.rejectedFoods,
      foodNotes: patient.foodNotes
    },
    consultation: {
      visitReason: consultation.visitReason,
      objective: consultation.objective,
      chiefComplaint: consultation.chiefComplaint,
      anamnesis: consultation.anamnesis,
      anthropometry: consultation.anthropometry,
      semiology: consultation.semiology,
      bioimpedance: consultation.bioimpedance,
      labExam: consultation.labExam
    }
  };
}

function buildSafeMealPlanPayload(patient: Patient, consultation: Consultation | null | undefined) {
  return {
    patient: {
      id: patient.id,
      sex: patient.sex,
      mainObjective: patient.mainObjective,
      foodRestrictions: patient.foodRestrictions,
      allergies: patient.allergies,
      intolerances: patient.intolerances,
      preferredFoods: patient.preferredFoods,
      rejectedFoods: patient.rejectedFoods,
      foodNotes: patient.foodNotes
    },
    consultation: consultation
      ? {
          id: consultation.id,
          objective: consultation.objective,
          chiefComplaint: consultation.chiefComplaint,
          anthropometry: consultation.anthropometry,
          bioimpedance: consultation.bioimpedance,
          labExam: consultation.labExam
        }
      : null
  };
}

async function withAiTimeout<T>(promise: Promise<T>) {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new AppError("Não foi possível gerar a interpretação agora. Tente novamente ou preencha manualmente.", {
            statusCode: 504,
            code: "AI_TIMEOUT",
            exposeMessage: true
          }));
        }, AI_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function generateAiInterpretation(patient: Patient, consultation: Consultation) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackInterpretation(patient, consultation);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const sanitizedPayload = buildSafeInterpretationPayload(patient, consultation);

    const response = await withAiTimeout(
      client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Voce e um assistente clinico para nutricionistas. Nao forneca diagnostico medico definitivo. Use linguagem como sugere, pode estar associado e avaliar."
          },
          {
            role: "user",
            content: JSON.stringify(sanitizedPayload)
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
      })
    );

    const parsed = JSON.parse(response.output_text);
    return {
      ...parsed,
      generatedAt: new Date().toISOString()
    } as AIInterpretation;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Não foi possível gerar a interpretação agora. Tente novamente ou preencha manualmente.", {
      statusCode: 502,
      code: "AI_GENERATION_FAILED",
      exposeMessage: true
    });
  }
}

function buildFallbackMealPlan({
  patient,
  consultation,
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  strategy,
  numberOfMeals
}: {
  patient: Patient;
  consultation?: Consultation | null;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  strategy: MealPlanStrategy;
  numberOfMeals: number;
}): MealPlan {
  const templates = buildDefaultMeals().slice(0, Math.max(3, Math.min(numberOfMeals, 6)));
  const baseItems = [
    calculateItemFromFood("food-egg", "Ovo", 2, "unidade"),
    calculateItemFromFood("food-banana", "Banana", 1, "unidade"),
    calculateItemFromFood("food-chicken", "Frango grelhado", 140, "g"),
    calculateItemFromFood("food-rice", "Arroz cozido", 120, "g"),
    calculateItemFromFood("food-beans", "Feijão cozido", 100, "g"),
    calculateItemFromFood("food-yogurt", "Iogurte natural", 1, "pote"),
    calculateItemFromFood("food-whey", "Whey protein", 1, "scoop"),
    calculateItemFromFood("food-sweet-potato", "Batata doce", 140, "g")
  ];

  const meals = templates.map((meal, index) => ({
    ...meal,
    items:
      index === 0
        ? [baseItems[0], baseItems[1]]
        : index === 1
          ? [baseItems[5]]
          : index === 2
            ? [baseItems[2], baseItems[3], baseItems[4]]
            : index === 3
              ? [baseItems[6], baseItems[1]]
              : [baseItems[2], baseItems[7]],
    notes: index === 0 ? "Manter preparo prático e boa proteína logo cedo." : ""
  }));

  return {
    id: `plan-${Date.now()}`,
    patientId: patient.id,
    consultationId: consultation?.id,
    title: `Plano alimentar - ${strategy}`,
    goal: consultation?.objective || patient.mainObjective,
    strategy,
    status: "rascunho",
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    meals,
    notes: patient.foodNotes || "Plano gerado com auxílio de IA para revisão profissional.",
    internalNotes: consultation?.conduct || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    professionalReviewRequired: true
  };
}

export async function generateAiMealPlan({
  patient,
  consultation,
  targetCalories,
  targetProtein,
  targetCarbs,
  targetFat,
  strategy,
  numberOfMeals,
  notes
}: {
  patient: Patient;
  consultation?: Consultation | null;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  strategy: MealPlanStrategy;
  numberOfMeals: number;
  notes?: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    return buildFallbackMealPlan({ patient, consultation, targetCalories, targetProtein, targetCarbs, targetFat, strategy, numberOfMeals });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const safePayload = buildSafeMealPlanPayload(patient, consultation);

    const response = await withAiTimeout(
      client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Voce cria planos alimentares estruturados em JSON para nutricionistas. Nunca prometa cura ou tratamento medico. Respeite alergias, intolerancias, alimentos rejeitados e marque sempre revisao profissional obrigatoria."
          },
          {
            role: "user",
            content: JSON.stringify({
              ...safePayload,
              targets: { targetCalories, targetProtein, targetCarbs, targetFat },
              strategy,
              numberOfMeals,
              notes,
              foodBase: foodDatabase.map((food) => ({
                id: food.id,
                name: food.name,
                category: food.category,
                kcalPer100g: food.kcalPer100g,
                proteinPer100g: food.proteinPer100g,
                carbsPer100g: food.carbsPer100g,
                fatPer100g: food.fatPer100g
              }))
            })
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "meal_plan",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                goal: { type: "string" },
                generalNotes: { type: "string" },
                professionalReviewRequired: { type: "boolean" },
                meals: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      name: { type: "string" },
                      time: { type: "string" },
                      notes: { type: "string" },
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            food: { type: "string" },
                            quantity: { type: "number" },
                            unit: { type: "string" },
                            notes: { type: "string" }
                          },
                          required: ["food", "quantity", "unit", "notes"]
                        }
                      }
                    },
                    required: ["name", "time", "notes", "items"]
                  }
                }
              },
              required: ["title", "goal", "generalNotes", "professionalReviewRequired", "meals"]
            }
          }
        }
      })
    );

    const parsed = JSON.parse(response.output_text) as {
      title: string;
      goal: string;
      generalNotes: string;
      professionalReviewRequired: boolean;
      meals: Array<{
        name: string;
        time: string;
        notes: string;
        items: Array<{ food: string; quantity: number; unit: string; notes: string }>;
      }>;
    };

    return {
      id: `plan-${Date.now()}`,
      patientId: patient.id,
      consultationId: consultation?.id,
      title: parsed.title,
      goal: parsed.goal,
      strategy,
      status: "rascunho",
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      meals: parsed.meals.map((meal, mealIndex) => ({
        id: `meal-${Date.now()}-${mealIndex}`,
        name: meal.name,
        time: meal.time,
        notes: meal.notes,
        order: mealIndex,
        items: meal.items.map((item, itemIndex) => {
          const matchedFood = findFoodByName(item.food);
          const calculated = calculateItemFromFood(matchedFood?.id, matchedFood?.name ?? item.food, item.quantity, item.unit);
          return {
            ...calculated,
            id: `item-${Date.now()}-${mealIndex}-${itemIndex}`,
            name: matchedFood?.name ?? item.food,
            notes: item.notes,
            substitutions: []
          };
        })
      })),
      notes: parsed.generalNotes,
      internalNotes: notes ?? "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      professionalReviewRequired: parsed.professionalReviewRequired
    } satisfies MealPlan;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw error;
    }

    throw new AppError("Não foi possível gerar a interpretação agora. Tente novamente ou preencha manualmente.", {
      statusCode: 502,
      code: "AI_GENERATION_FAILED",
      exposeMessage: true
    });
  }
}
