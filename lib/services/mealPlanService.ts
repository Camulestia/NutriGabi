import { prisma } from "@/lib/prisma";
import { MealPlan } from "@/lib/types";
import { recordAuditLog } from "@/lib/services/auditLogService";
import { enforceFeatureAccess } from "@/lib/services/billingService";
import { mapMealPlanRecord, toMealPlanCreateInput, toMealPlanUpdateInput } from "@/lib/services/data-mappers";
import { getMockStateForUser } from "@/lib/services/mock-store";
import { withUserScopedAccess } from "@/lib/services/service-runtime";

export async function listMealPlans(patientId: string) {
  await enforceFeatureAccess("mealPlans");

  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          userId: userProfile.id,
          deletedAt: null
        },
        select: { id: true }
      });

      if (!patient) {
        return [];
      }

      const plans = await prisma.mealPlan.findMany({
        where: {
          userId: userProfile.id,
          patientId
        },
        orderBy: { updatedAt: "desc" }
      });

      return plans.map(mapMealPlanRecord);
    },
    fallback: async (actor) =>
      getMockStateForUser(actor.clerkUserId).mealPlans
        .filter((plan) => plan.patientId === patientId)
        .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime())
  });
}

export async function getMealPlanById(patientId: string, planId: string) {
  await enforceFeatureAccess("mealPlans");

  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const plan = await prisma.mealPlan.findFirst({
        where: {
          id: planId,
          patientId,
          userId: userProfile.id
        }
      });

      return plan ? mapMealPlanRecord(plan) : null;
    },
    fallback: async (actor) => getMockStateForUser(actor.clerkUserId).mealPlans.find((plan) => plan.patientId === patientId && plan.id === planId) ?? null
  });
}

export async function saveMealPlan(plan: MealPlan) {
  await enforceFeatureAccess("mealPlans");

  const savedPlan = await withUserScopedAccess({
    db: async ({ userProfile }) => {
      const patient = await prisma.patient.findFirst({
        where: {
          id: plan.patientId,
          userId: userProfile.id,
          deletedAt: null
        },
        select: { id: true }
      });

      if (!patient) {
        throw new Error("PATIENT_NOT_FOUND");
      }

      const existing = await prisma.mealPlan.findFirst({
        where: {
          id: plan.id,
          patientId: plan.patientId,
          userId: userProfile.id
        }
      });

      const saved = existing
        ? await prisma.mealPlan.update({
            where: { id: existing.id },
            data: toMealPlanUpdateInput({ ...plan, updatedAt: new Date().toISOString() })
          })
        : await prisma.mealPlan.create({
            data: toMealPlanCreateInput(userProfile.id, {
              ...plan,
              updatedAt: new Date().toISOString()
            })
          });

      return mapMealPlanRecord(saved);
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      const exists = state.mealPlans.some((item) => item.id === plan.id);
      const nextPlan = {
        ...plan,
        updatedAt: new Date().toISOString()
      };

      state.mealPlans = exists ? state.mealPlans.map((item) => (item.id === plan.id ? nextPlan : item)) : [nextPlan, ...state.mealPlans];

      return nextPlan;
    }
  });

  await recordAuditLog({
    action: "meal-plan.save",
    entityType: "meal-plan",
    entityId: savedPlan.id,
    metadata: { patientId: savedPlan.patientId }
  });

  return savedPlan;
}

export async function duplicateMealPlan(patientId: string, planId: string) {
  await enforceFeatureAccess("mealPlans");

  const original = await getMealPlanById(patientId, planId);
  if (!original) return null;

  const timestamp = Date.now();
  const now = new Date().toISOString();
  const duplicate: MealPlan = {
    ...structuredClone(original),
    id: `plan-${timestamp}`,
    title: `${original.title} (cópia)`,
    status: "rascunho",
    consultationId: undefined,
    createdAt: now,
    updatedAt: now,
    meals: original.meals.map((meal, mealIndex) => ({
      ...meal,
      id: `meal-${timestamp}-${mealIndex}`,
      items: meal.items.map((item, itemIndex) => ({
        ...item,
        id: `item-${timestamp}-${mealIndex}-${itemIndex}`
      }))
    }))
  };

  return saveMealPlan(duplicate);
}

export async function setMealPlanStatus(patientId: string, planId: string, status: MealPlan["status"]) {
  await enforceFeatureAccess("mealPlans");

  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const plan = await prisma.mealPlan.findFirst({
        where: {
          id: planId,
          patientId,
          userId: userProfile.id
        }
      });

      if (!plan) return null;

      if (status === "ativo") {
        await prisma.mealPlan.updateMany({
          where: {
            userId: userProfile.id,
            patientId,
            status: "ativo",
            NOT: { id: planId }
          },
          data: {
            status: "rascunho"
          }
        });
      }

      const updated = await prisma.mealPlan.update({
        where: { id: plan.id },
        data: {
          status,
          updatedAt: new Date()
        }
      });

      return mapMealPlanRecord(updated);
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      let updated: MealPlan | null = null;

      state.mealPlans = state.mealPlans.map((plan) => {
        if (plan.patientId !== patientId) return plan;

        if (status === "ativo" && plan.id !== planId && plan.status === "ativo") {
          return {
            ...plan,
            status: "rascunho",
            updatedAt: new Date().toISOString()
          };
        }

        if (plan.id !== planId) return plan;

        updated = {
          ...plan,
          status,
          updatedAt: new Date().toISOString()
        };

        return updated;
      });

      return updated;
    }
  });
}
