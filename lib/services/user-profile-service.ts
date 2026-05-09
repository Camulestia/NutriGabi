import { auth, currentUser } from "@clerk/nextjs/server";
import type { UserProfile } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { isTestHarnessEnabled } from "@/lib/test-runtime";

export type CurrentActor = {
  clerkUserId: string;
  email: string;
  name: string;
};

function getDevelopmentActorOverride(): CurrentActor | null {
  if (!isTestHarnessEnabled()) {
    return null;
  }

  const clerkUserId = process.env.NUTRI_TEST_CLERK_USER_ID;
  if (!clerkUserId) {
    return null;
  }

  return {
    clerkUserId,
    email: process.env.NUTRI_TEST_USER_EMAIL ?? `${clerkUserId}@test.local`,
    name: process.env.NUTRI_TEST_USER_NAME ?? clerkUserId
  };
}

export async function getCurrentActor(): Promise<CurrentActor> {
  const override = getDevelopmentActorOverride();
  if (override) {
    return override;
  }

  const authState = await auth();

  if (!authState.userId) {
    throw new Error("UNAUTHENTICATED");
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? `${authState.userId}@clerk.local`;
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() || clerkUser?.username || email;

  return {
    clerkUserId: authState.userId,
    email,
    name
  };
}

export async function getCurrentUserProfile(actor?: CurrentActor): Promise<UserProfile> {
  const currentActor = actor ?? (await getCurrentActor());

  const profile = await prisma.userProfile.upsert({
    where: {
      clerkUserId: currentActor.clerkUserId
    },
    update: {
      email: currentActor.email,
      name: currentActor.name
    },
    create: {
      clerkUserId: currentActor.clerkUserId,
      email: currentActor.email,
      name: currentActor.name
    }
  });

  if (isStripeConfigured()) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: profile.id }
    });

    if (!subscription?.stripeCustomerId) {
      const stripe = getStripeClient();
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.name,
        metadata: {
          userId: profile.id,
          clerkUserId: profile.clerkUserId
        }
      });

      await prisma.subscription.upsert({
        where: { userId: profile.id },
        update: {
          stripeCustomerId: customer.id,
          plan: profile.plan,
          status: subscription?.status ?? "inactive"
        },
        create: {
          userId: profile.id,
          stripeCustomerId: customer.id,
          plan: profile.plan,
          status: "inactive"
        }
      });
    }
  }

  return profile;
}
