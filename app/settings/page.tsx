import { SettingsForm } from "@/components/account/settings-form";
import { requireUser } from "@/lib/clerk-auth";
import { requireCompletedOnboarding } from "@/lib/onboarding";
import { getBillingSummary } from "@/lib/services/billingService";
import { listAuditLogs } from "@/lib/services/repository";
import { getUserSettings } from "@/lib/services/userSettingsService";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireUser();
  await requireCompletedOnboarding();

  const [settings, billing, auditLogs] = await Promise.all([getUserSettings(), getBillingSummary(), listAuditLogs(12)]);

  return <SettingsForm settings={settings} billing={billing} auditLogs={auditLogs} />;
}
