// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || "";
const isProd = process.env.NODE_ENV === "production";

Sentry.init({
    dsn: dsn || undefined,
    enabled: Boolean(dsn),

    // Add optional integrations for additional features
    integrations: [Sentry.replayIntegration()],

    // Define how likely traces are sampled. Adjust this value in production.
    tracesSampleRate: isProd ? 0.1 : 1,
    // Enable logs only in non-production to reduce noise/cost.
    enableLogs: !isProd,

    // Define how likely Replay events are sampled.
    replaysSessionSampleRate: isProd ? 0.05 : 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Avoid sending PII by default in production.
    sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
