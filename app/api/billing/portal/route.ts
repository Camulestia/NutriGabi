import { jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { handleApiError } from "@/lib/errors";
import { createCustomerPortalSessionForCurrentUser } from "@/lib/services/billingService";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const session = await createCustomerPortalSessionForCurrentUser(new URL(request.url).origin);
    return jsonUtf8(session);
  } catch (error) {
    return handleApiError(error, {
      fallbackKey: "billingProcess",
      context: { action: "billing.portal", route: "/api/billing/portal", status: "failed" }
    });
  }
}
