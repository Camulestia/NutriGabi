import Stripe from "stripe";

declare global {
  // eslint-disable-next-line no-var
  var __nutriConsultaStripeClient: Stripe | undefined;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  if (!globalThis.__nutriConsultaStripeClient) {
    globalThis.__nutriConsultaStripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia"
    });
  }

  return globalThis.__nutriConsultaStripeClient;
}

export function getStripePlanPriceId(plan: "pro" | "clinic") {
  const map = {
    pro: process.env.STRIPE_PRO_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    clinic: process.env.STRIPE_CLINIC_PRICE_ID
  } as const;

  return map[plan] ?? null;
}

export function resolveAppUrl(origin?: string) {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000";
}
