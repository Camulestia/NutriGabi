import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { jsonUtf8 } from "@/lib/api-response";
import { isTestHarnessEnabled } from "@/lib/test-runtime";

function hasDevelopmentActorOverride() {
  return isTestHarnessEnabled();
}

export async function requireUser() {
  if (hasDevelopmentActorOverride()) {
    return { userId: process.env.NUTRI_TEST_CLERK_USER_ID };
  }

  try {
    const authState = await auth();

    if (!authState.userId) {
      redirect("/sign-in");
    }

    return authState;
  } catch {
    redirect("/sign-in");
  }
}

export async function requireApiUser() {
  if (hasDevelopmentActorOverride()) {
    return null;
  }

  try {
    const authState = await auth();

    if (!authState.userId) {
      return jsonUtf8({ message: "Não autenticado" }, { status: 401 });
    }

    return null;
  } catch {
    return jsonUtf8({ message: "Não autenticado" }, { status: 401 });
  }
}
