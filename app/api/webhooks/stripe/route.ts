import type Stripe from "stripe";

import { jsonUtf8 } from "@/lib/api-response";
import { extractSubscriptionStateFromStripe, syncStripeSubscriptionFromEvent } from "@/lib/services/billingService";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const state = extractSubscriptionStateFromStripe(subscription);
  await syncStripeSubscriptionFromEvent(state);
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return jsonUtf8({ message: "Webhook Stripe não configurado." }, { status: 503 });
  }

  const payload = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return jsonUtf8({ message: "Assinatura do webhook inválida." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription") {
        await syncStripeSubscriptionFromEvent({
          userId: session.metadata?.userId,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
          plan: session.metadata?.plan === "clinic" ? "clinic" : session.metadata?.plan === "pro" ? "pro" : "free",
          status: "active"
        });
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const linkedSubscription = invoice.parent?.subscription_details?.subscription;
      const subscriptionId =
        typeof linkedSubscription === "string" ? linkedSubscription : linkedSubscription?.id;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await handleSubscriptionChange(subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    }
    default:
      break;
  }

  return jsonUtf8({ received: true });
}
