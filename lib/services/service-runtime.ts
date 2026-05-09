import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CurrentActor, getCurrentActor, getCurrentUserProfile } from "@/lib/services/user-profile-service";
import { isTestHarnessEnabled } from "@/lib/test-runtime";

export type ServiceContext = {
  actor: CurrentActor;
  userProfile: Awaited<ReturnType<typeof getCurrentUserProfile>>;
};

function canUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function canFallbackToMock() {
  return process.env.NODE_ENV !== "production" || isTestHarnessEnabled();
}

function isRecoverablePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1000", "P1001", "P1003", "P2021", "P2022"].includes(error.code);
  }

  return false;
}

export async function withUserScopedAccess<T>(handlers: {
  db: (context: ServiceContext) => Promise<T>;
  fallback: (actor: CurrentActor) => Promise<T> | T;
}) {
  const actor = await getCurrentActor();

  if (!canUseDatabase()) {
    return handlers.fallback(actor);
  }

  try {
    await prisma.$connect();
    const userProfile = await getCurrentUserProfile(actor);
    return await handlers.db({ actor, userProfile });
  } catch (error) {
    if (canFallbackToMock() && isRecoverablePrismaError(error)) {
      return handlers.fallback(actor);
    }

    throw error;
  }
}
