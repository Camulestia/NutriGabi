import { auth } from "@clerk/nextjs/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { isTestHarnessEnabled } from "@/lib/test-runtime";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/privacy(.*)", "/terms(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (authObject, request) => {
  if (isTestHarnessEnabled()) {
    return;
  }

  if (isPublicRoute(request) || isApiRoute(request)) {
    return;
  }

  await authObject.protect({
    unauthenticatedUrl: new URL("/sign-in", request.url).toString()
  });
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"]
};
