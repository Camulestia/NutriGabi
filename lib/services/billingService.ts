import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { getMockStateForUser } from "@/lib/services/mock-store";
import { withUserScopedAccess } from "@/lib/services/service-runtime";
import { getCurrentUserProfile } from "@/lib/services/user-profile-service";
import { BillingSummary, PlanAccess, SubscriptionStatus, UserPlan } from "@/lib/types";
import { getStripeClient, getStripePlanPriceId, isStripeConfigured, resolveAppUrl } from "@/lib/stripe";
import { isTestHarnessEnabled } from "@/lib/test-runtime";

const FREE_PATIENT_LIMIT = 5;

export const planAccessMap: Record<UserPlan, PlanAccess> = {
  free: {
    plan: "free",
    patientLimit: FREE_PATIENT_LIMIT,
    canUseAdvancedAgenda: false,
    canUseMealPlans: false,
    canExportPdf: false,
    canUseFullReports: false
  },
  pro: {
    plan: "pro",
    patientLimit: null,
    canUseAdvancedAgenda: true,
    canUseMealPlans: true,
    canExportPdf: true,
    canUseFullReports: true
  },
  clinic: {
    plan: "clinic",
    patientLimit: null,
    canUseAdvancedAgenda: true,
    canUseMealPlans: true,
    canExportPdf: true,
    canUseFullReports: true
  }
};

type FeatureKey = "patients" | "mealPlans" | "agenda" | "pdf";

const featureMessages: Record<FeatureKey, string> = {
  patients: "Você atingiu o limite do plano gratuito. Faça upgrade para continuar.",
  mealPlans: "Planejamento alimentar é um recurso do plano Pro. Faça upgrade para continuar.",
  agenda: "A agenda completa está disponível no plano Pro. Faça upgrade para continuar.",
  pdf: "Exportação em PDF está disponível no plano Pro. Faça upgrade para continuar."
};

export class BillingFeatureError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, code = "PLAN_UPGRADE_REQUIRED", statusCode = 403) {
    super(message);
    this.name = "BillingFeatureError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function normalizePlan(plan?: string | null): UserPlan {
  if (plan === "pro" || plan === "clinic") {
    return plan;
  }

  return "free";
}

function normalizeStatus(status?: string | null): SubscriptionStatus {
  switch (status) {
    case "incomplete":
    case "incomplete_expired":
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
      return status;
    default:
      return "inactive";
  }
}

function buildBillingSummary(input: {
  plan: UserPlan;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date | string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  patientCount: number;
}): BillingSummary {
  const access = getPlanAccess(input.plan);
  const patientLimit = access.patientLimit;

  return {
    plan: input.plan,
    status: input.status,
    currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd).toISOString() : null,
    stripeCustomerId: input.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    patientCount: input.patientCount,
    patientLimit,
    canCreatePatient: canCreatePatientForPlan(input.plan, input.patientCount),
    access
  };
}

export function getPlanAccess(plan: UserPlan) {
  return planAccessMap[plan];
}

export function canCreatePatientForPlan(plan: UserPlan, patientCount: number) {
  const patientLimit = getPlanAccess(plan).patientLimit;
  return patientLimit === null || patientCount < patientLimit;
}

function getFeatureMessage(feature: FeatureKey) {
  return featureMessages[feature];
}

function validateStripeCheckoutConfiguration(plan: Extract<UserPlan, "pro" | "clinic">, origin?: string) {
  const targetPriceId = getStripePlanPriceId(plan);
  const appUrl = resolveAppUrl(origin);

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Missing STRIPE_SECRET_KEY");
    throw new BillingFeatureError("A cobrança ainda não está configurada neste ambiente.", "BILLING_NOT_CONFIGURED", 503);
  }

  if (!targetPriceId) {
    console.error(`Missing ${plan === "pro" ? "STRIPE_PRO_PRICE_ID" : "STRIPE_CLINIC_PRICE_ID"}`);
    throw new BillingFeatureError("O preço do plano ainda não foi configurado no Stripe.", "BILLING_NOT_CONFIGURED", 503);
  }

  if (!process.env.APP_URL && !process.env.NEXT_PUBLIC_APP_URL && !origin) {
    console.error("Missing APP_URL");
    throw new BillingFeatureError("A URL do aplicativo ainda não está configurada para o pagamento.", "APP_URL_MISSING", 503);
  }

  return {
    targetPriceId,
    appUrl
  };
}

function getPlanForPriceId(priceId?: string | null): UserPlan {
  if (priceId && process.env.STRIPE_CLINIC_PRICE_ID && priceId === process.env.STRIPE_CLINIC_PRICE_ID) {
    return "clinic";
  }

  if (
    priceId &&
    ((process.env.STRIPE_PRO_PRICE_ID && priceId === process.env.STRIPE_PRO_PRICE_ID) ||
      (process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID && priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID))
  ) {
    return "pro";
  }

  return "free";
}

function getPlanFromSubscription(subscription: Stripe.Subscription): UserPlan {
  const priceId = subscription.items.data[0]?.price?.id;
  return getPlanForPriceId(priceId);
}

function toDateFromUnix(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000) : null;
}

function getSubscriptionCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const timestamps = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");

  if (!timestamps.length) {
    return null;
  }

  return toDateFromUnix(Math.max(...timestamps));
}

async function setUserBillingState(args: {
  userId: string;
  plan: UserPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
}) {
  await prisma.subscription.upsert({
    where: { userId: args.userId },
    update: {
      plan: args.plan,
      status: args.status,
      stripeCustomerId: args.stripeCustomerId ?? undefined,
      stripeSubscriptionId: args.stripeSubscriptionId ?? undefined,
      currentPeriodEnd: args.currentPeriodEnd ?? null
    },
    create: {
      userId: args.userId,
      plan: args.plan,
      status: args.status,
      stripeCustomerId: args.stripeCustomerId ?? undefined,
      stripeSubscriptionId: args.stripeSubscriptionId ?? undefined,
      currentPeriodEnd: args.currentPeriodEnd ?? null
    }
  });

  await prisma.userProfile.update({
    where: { id: args.userId },
    data: {
      plan: args.plan
    }
  });
}

export async function getBillingSummary() {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const [subscription, patientCount] = await Promise.all([
        prisma.subscription.findUnique({
          where: { userId: userProfile.id }
        }),
        prisma.patient.count({
          where: { userId: userProfile.id }
        })
      ]);

      return buildBillingSummary({
        plan: normalizePlan(userProfile.plan),
        status: normalizeStatus(subscription?.status),
        currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
        stripeCustomerId: subscription?.stripeCustomerId ?? null,
        stripeSubscriptionId: subscription?.stripeSubscriptionId ?? null,
        patientCount
      });
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      return buildBillingSummary({
        plan: state.billing.plan,
        status: state.billing.status,
        currentPeriodEnd: state.billing.currentPeriodEnd,
        stripeCustomerId: state.billing.stripeCustomerId,
        stripeSubscriptionId: state.billing.stripeSubscriptionId,
        patientCount: state.patients.length
      });
    }
  });
}

export async function checkUserPlan() {
  const summary = await getBillingSummary();
  return summary.access;
}

export async function ensureStripeCustomerForCurrentUser() {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      if (!isStripeConfigured()) {
        return null;
      }

      const existing = await prisma.subscription.findUnique({
        where: { userId: userProfile.id }
      });

      if (existing?.stripeCustomerId) {
        return {
          stripeCustomerId: existing.stripeCustomerId
        };
      }

      const stripe = getStripeClient();
      const customer = await stripe.customers.create({
        email: userProfile.email,
        name: userProfile.name,
        metadata: {
          userId: userProfile.id,
          clerkUserId: userProfile.clerkUserId
        }
      });

      const subscription = await prisma.subscription.upsert({
        where: { userId: userProfile.id },
        update: {
          stripeCustomerId: customer.id,
          plan: normalizePlan(userProfile.plan),
          status: existing?.status ?? "inactive"
        },
        create: {
          userId: userProfile.id,
          stripeCustomerId: customer.id,
          plan: normalizePlan(userProfile.plan),
          status: "inactive"
        }
      });

      return {
        stripeCustomerId: subscription.stripeCustomerId
      };
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      if (!state.billing.stripeCustomerId) {
        state.billing.stripeCustomerId = `cus_mock_${actor.clerkUserId}`;
      }

      return {
        stripeCustomerId: state.billing.stripeCustomerId
      };
    }
  });
}

export async function createCheckoutSessionForCurrentUser(plan: Extract<UserPlan, "pro" | "clinic">, origin?: string) {
  return withUserScopedAccess({
    db: async ({ actor, userProfile }) => {
      if (!isStripeConfigured()) {
        if (process.env.NODE_ENV !== "production" || isTestHarnessEnabled()) {
          const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await setUserBillingState({
            userId: userProfile.id,
            plan,
            status: "active",
            stripeCustomerId: `cus_mock_${actor.clerkUserId}`,
            stripeSubscriptionId: `sub_mock_${actor.clerkUserId}`,
            currentPeriodEnd: periodEnd
          });

          return {
            url: `${resolveAppUrl(origin)}/billing?checkout=success&mock=1`
          };
        }

        throw new BillingFeatureError("Stripe não configurado no ambiente.", "BILLING_NOT_CONFIGURED", 503);
      }

      const { targetPriceId, appUrl } = validateStripeCheckoutConfiguration(plan, origin);

      const ensured = await ensureStripeCustomerForCurrentUser();
      const stripeCustomerId = "stripeCustomerId" in (ensured ?? {}) ? ensured?.stripeCustomerId : null;
      if (!stripeCustomerId) {
        throw new BillingFeatureError("Não foi possível preparar o cliente Stripe.", "STRIPE_CUSTOMER_ERROR", 500);
      }

      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        success_url: `${appUrl}/billing?checkout=success`,
        cancel_url: `${appUrl}/billing?checkout=canceled`,
        line_items: [
          {
            price: targetPriceId,
            quantity: 1
          }
        ],
        metadata: {
          userId: userProfile.id,
          clerkUserId: actor.clerkUserId,
          plan
        }
      });

      if (!session.url) {
        throw new BillingFeatureError("Não foi possível iniciar o checkout agora.", "CHECKOUT_URL_MISSING", 500);
      }

      return {
        url: session.url
      };
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      state.billing = {
        plan,
        status: "active",
        currentPeriodEnd: periodEnd,
        stripeCustomerId: state.billing.stripeCustomerId ?? `cus_mock_${actor.clerkUserId}`,
        stripeSubscriptionId: `sub_mock_${actor.clerkUserId}`
      };

      return {
        url: `${resolveAppUrl(origin)}/billing?checkout=success&mock=1`
      };
    }
  });
}

export async function createCustomerPortalSessionForCurrentUser(origin?: string) {
  return withUserScopedAccess({
    db: async () => {
      if (!isStripeConfigured()) {
        return {
          url: `${resolveAppUrl(origin)}/billing?portal=unavailable${process.env.NODE_ENV !== "production" || isTestHarnessEnabled() ? "&mock=1" : ""}`
        };
      }

      const ensured = await ensureStripeCustomerForCurrentUser();
      const stripeCustomerId = "stripeCustomerId" in (ensured ?? {}) ? ensured?.stripeCustomerId : null;
      if (!stripeCustomerId) {
        throw new BillingFeatureError("Cliente Stripe indisponível para o portal.", "STRIPE_CUSTOMER_ERROR", 500);
      }

      const stripe = getStripeClient();
      const portal = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${resolveAppUrl(origin)}/billing`
      });

      return {
        url: portal.url
      };
    },
    fallback: async () => ({
      url: `${resolveAppUrl(origin)}/billing?portal=unavailable&mock=1`
    })
  });
}

export async function cancelCurrentSubscriptionForUser() {
  return withUserScopedAccess({
    db: async ({ actor, userProfile }) => {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: userProfile.id }
      });

      if (!subscription?.stripeSubscriptionId) {
        if (process.env.NODE_ENV !== "production" || isTestHarnessEnabled()) {
          await setUserBillingState({
            userId: userProfile.id,
            plan: "free",
            status: "canceled",
            stripeCustomerId: subscription?.stripeCustomerId ?? `cus_mock_${actor.clerkUserId}`,
            stripeSubscriptionId: subscription?.stripeSubscriptionId ?? null,
            currentPeriodEnd: null
          });
          return getBillingSummary();
        }

        throw new BillingFeatureError("Nenhuma assinatura ativa encontrada para cancelamento.", "SUBSCRIPTION_NOT_FOUND", 404);
      }

      if (!isStripeConfigured()) {
        throw new BillingFeatureError("Stripe não configurado no ambiente.", "BILLING_NOT_CONFIGURED", 503);
      }

      const stripe = getStripeClient();
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      const refreshed = (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)) as Stripe.Subscription;

      await setUserBillingState({
        userId: userProfile.id,
        plan: normalizePlan(userProfile.plan),
        status: normalizeStatus(refreshed.status),
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        currentPeriodEnd: getSubscriptionCurrentPeriodEnd(refreshed)
      });

      return getBillingSummary();
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      state.billing.status = "canceled";
      state.billing.currentPeriodEnd = state.billing.currentPeriodEnd ?? new Date().toISOString();
      return getBillingSummary();
    }
  });
}

export async function enforceFeatureAccess(feature: FeatureKey) {
  const summary = await getBillingSummary();

  const allowed =
    feature === "patients"
      ? summary.canCreatePatient
      : feature === "mealPlans"
        ? summary.access.canUseMealPlans
        : feature === "agenda"
          ? summary.access.canUseAdvancedAgenda
          : summary.access.canExportPdf;

  if (!allowed) {
    throw new BillingFeatureError(getFeatureMessage(feature));
  }

  return summary;
}

export async function syncStripeSubscriptionFromEvent(input: {
  userId?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan?: UserPlan;
  status?: SubscriptionStatus;
  currentPeriodEnd?: Date | null;
}) {
  const userProfile = input.userId
    ? await prisma.userProfile.findUnique({ where: { id: input.userId } })
    : input.stripeCustomerId
      ? await prisma.userProfile.findFirst({
          where: {
            subscription: {
              stripeCustomerId: input.stripeCustomerId
            }
          }
        })
      : null;

  if (!userProfile) {
    return null;
  }

  const nextPlan = input.status === "canceled" || input.status === "inactive" ? "free" : normalizePlan(input.plan ?? userProfile.plan);

  await setUserBillingState({
    userId: userProfile.id,
    plan: nextPlan,
    status: normalizeStatus(input.status),
    stripeCustomerId: input.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null
  });

  return prisma.subscription.findUnique({
    where: { userId: userProfile.id }
  });
}

export function extractSubscriptionStateFromStripe(subscription: Stripe.Subscription) {
  return {
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    plan: getPlanFromSubscription(subscription),
    status: normalizeStatus(subscription.status),
    currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription)
  };
}

export async function createOrSyncCurrentUserProfile() {
  return getCurrentUserProfile();
}



