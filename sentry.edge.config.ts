// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn =
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "";
const isProd = process.env.NODE_ENV === "production";

Sentry.init({
    dsn: dsn || undefined,
    enabled: Boolean(dsn),

    // Define how likely traces are sampled. Adjust this value in production.
    tracesSampleRate: isProd ? 0.1 : 1,

    // Enable logs only in non-production to reduce noise/cost.
    enableLogs: !isProd,

    // Avoid sending PII by default in production.
    sendDefaultPii: false,
});
