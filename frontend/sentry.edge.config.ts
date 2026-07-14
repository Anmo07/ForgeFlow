import * as Sentry from "@sentry/nextjs";

function scrubSensitiveData(data: any): any {
  const sensitiveKeys = ["password", "token", "secret", "mfa_secret", "api_key", "cookie", "authorization"];
  if (data && typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(scrubSensitiveData);
    }
    const newObj: any = {};
    for (const key of Object.keys(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        newObj[key] = "[SCRUBBED]";
      } else {
        newObj[key] = scrubSensitiveData(data[key]);
      }
    }
    return newObj;
  }
  return data;
}

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    debug: false,
    sendDefaultPii: false,
    environment: process.env.SENTRY_ENVIRONMENT || "production",
    beforeSend(event) {
      return scrubSensitiveData(event);
    },
  });
}
