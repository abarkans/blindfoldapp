import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // No session replay — avoids capturing DOM/input data (GDPR)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  debug: false,
});
