import { jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { handleApiError } from "@/lib/errors";
import { cancelCurrentSubscriptionForUser } from "@/lib/services/billingService";

export async function POST() {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    return jsonUtf8(await cancelCurrentSubscriptionForUser());
  } catch (error) {
    return handleApiError(error, {
      fallbackKey: "billingProcess",
      context: { action: "billing.cancel", route: "/api/billing/cancel", status: "failed" }
    });
  }
}
