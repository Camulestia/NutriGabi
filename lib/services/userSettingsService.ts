import { prisma } from "@/lib/prisma";
import { mapUserSettings } from "@/lib/services/data-mappers";
import { getMockStateForUser } from "@/lib/services/mock-store";
import { withUserScopedAccess } from "@/lib/services/service-runtime";
import { UserSettings } from "@/lib/types";

export type UserSettingsPayload = Omit<UserSettings, "email" | "plan">;

export async function getUserSettings() {
  return withUserScopedAccess({
    db: async ({ userProfile }) => mapUserSettings(userProfile),
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      return {
        ...state.userSettings,
        email: actor.email,
        name: state.userSettings.name || actor.name,
        plan: state.billing.plan
      } satisfies UserSettings;
    }
  });
}

export async function updateUserSettings(payload: Partial<UserSettingsPayload>) {
  return withUserScopedAccess({
    db: async ({ userProfile }) => {
      const updated = await prisma.userProfile.update({
        where: { id: userProfile.id },
        data: {
          name: payload.name,
          crn: payload.crn,
          clinicName: payload.clinicName,
          professionalPhone: payload.professionalPhone,
          clinicLogoUrl: payload.clinicLogoUrl,
          specialty: payload.specialty || null,
          reportSignature: payload.reportSignature,
          defaultReturnInterval: payload.defaultReturnInterval,
          defaultConsultationTime: payload.defaultConsultationTime,
          defaultPdfFooter: payload.defaultPdfFooter,
          locale: payload.locale,
          onboardingCompleted: payload.onboardingCompleted,
          acceptedTermsAt: payload.acceptedTermsAt ? new Date(payload.acceptedTermsAt) : userProfile.acceptedTermsAt
        }
      });

      return mapUserSettings(updated);
    },
    fallback: async (actor) => {
      const state = getMockStateForUser(actor.clerkUserId);
      state.userSettings = {
        ...state.userSettings,
        ...payload,
        email: actor.email,
        name: payload.name ?? state.userSettings.name ?? actor.name,
        plan: state.billing.plan
      };

      return state.userSettings;
    }
  });
}
