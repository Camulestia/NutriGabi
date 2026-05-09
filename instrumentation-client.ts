import * as Sentry from "@sentry/nextjs";

function sanitizeEvent(event: Sentry.ErrorEvent) {
  const nextEvent = {
    ...event,
    request: event.request
      ? {
          ...event.request,
          headers: undefined,
          cookies: undefined,
          data: undefined,
          env: undefined,
          url: event.request.url
        }
      : undefined,
    user: event.user
      ? {
          id: event.user.id
        }
      : undefined,
    extra: undefined,
    contexts: undefined,
    breadcrumbs: event.breadcrumbs?.map((breadcrumb) => ({
      category: breadcrumb.category,
      level: breadcrumb.level,
      message: breadcrumb.message,
      timestamp: breadcrumb.timestamp,
      type: breadcrumb.type
    }))
  } satisfies Sentry.ErrorEvent;

  return nextEvent;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment: process.env.NODE_ENV,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  sendDefaultPii: false,
  beforeSend(event) {
    return sanitizeEvent(event);
  }
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
