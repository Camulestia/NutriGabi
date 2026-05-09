import { jsonError, jsonUtf8 } from "@/lib/api-response";
import { requireApiUser } from "@/lib/clerk-auth";
import { updateUserSettings } from "@/lib/services/repository";
import { UserSettings } from "@/lib/types";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const payload = (await request.json()) as Pick<UserSettings, "name" | "crn" | "clinicName" | "professionalPhone" | "clinicLogoUrl" | "specialty" | "acceptedTermsAt">;

    const updated = await updateUserSettings({
      ...payload,
      reportSignature: payload.name,
      defaultReturnInterval: 30,
      defaultConsultationTime: "08:00",
      defaultPdfFooter: "",
      locale: "pt-BR",
      onboardingCompleted: true
    });

    return jsonUtf8(updated);
  } catch (error) {
    return jsonError(error, "Não foi possível concluir o onboarding.");
  }
}
