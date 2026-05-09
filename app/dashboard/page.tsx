import { redirect } from "next/navigation";

import { requireUser } from "@/lib/clerk-auth";
import { requireCompletedOnboarding } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireUser();
  await requireCompletedOnboarding();
  redirect("/");
}
