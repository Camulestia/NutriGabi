import { jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { getBillingSummary } from "@/lib/services/billingService";

export async function GET() {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  return jsonUtf8(await getBillingSummary());
}
