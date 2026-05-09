import { BillingPageView } from "@/components/billing/billing-page";
import { requireUser } from "@/lib/clerk-auth";
import { requireCompletedOnboarding } from "@/lib/onboarding";
import { getBillingSummary } from "@/lib/services/billingService";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams
}: {
  searchParams: Promise<{ checkout?: string; mock?: string; portal?: string }>;
}) {
  await requireUser();
  await requireCompletedOnboarding();
  const summary = await getBillingSummary();
  const query = await searchParams;

  return <BillingPageView initialSummary={summary} searchState={query} />;
}
