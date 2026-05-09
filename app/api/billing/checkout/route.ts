import { jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { handleApiError } from "@/lib/errors";
import { createCheckoutSessionForCurrentUser } from "@/lib/services/billingService";
import { UserPlan } from "@/lib/types";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as { plan?: UserPlan };
    const plan = payload.plan === "clinic" ? "clinic" : "pro";
    const session = await createCheckoutSessionForCurrentUser(plan, new URL(request.url).origin);
    return jsonUtf8(session);
  } catch (error) {
    return handleApiError(error, {
      fallbackKey: "billingProcess",
      context: { action: "billing.checkout", route: "/api/billing/checkout", status: "failed" }
    });
  }
}
