import { redirect } from "next/navigation";

import { getUserSettings } from "@/lib/services/userSettingsService";

export async function requireCompletedOnboarding() {
  const settings = await getUserSettings();

  if (!settings.onboardingCompleted) {
    redirect("/onboarding");
  }

  return settings;
}
