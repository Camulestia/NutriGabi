import * as Sentry from "@sentry/nextjs";

function sanitizeServerEvent(event: Sentry.ErrorEvent) {
  return {
    ...event,
    request: event.request
      ? {
          ...event.request,
          headers: undefined,
          cookies: undefined,
          data: undefined,
          env: undefined,
          query_string: undefined
        }
      : undefined,
    user: event.user
      ? {
          id: event.user.id
        }
      : undefined,
    extra: undefined,
    contexts: undefined
  } satisfies Sentry.ErrorEvent;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment: process.env.NODE_ENV,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  sendDefaultPii: false,
  beforeSend(event) {
    return sanitizeServerEvent(event);
  }
});
