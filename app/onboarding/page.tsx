import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/account/onboarding-form";
import { requireUser } from "@/lib/clerk-auth";
import { getUserSettings } from "@/lib/services/userSettingsService";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  await requireUser();
  const settings = await getUserSettings();

  if (settings.onboardingCompleted) {
    redirect("/");
  }

  return (
    <div className="px-4 py-8 lg:px-6">
      <OnboardingForm settings={settings} />
    </div>
  );
}
