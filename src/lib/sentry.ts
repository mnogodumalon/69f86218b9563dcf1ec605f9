import * as Sentry from '@sentry/react';

const DSN = "https://a0a6a937e751b39ecf7303042f45cd6e@sentry.livinglogic.de/42";
const ENVIRONMENT = "dashboard-69f86218b9563dcf1ec605f9";
const RELEASE = "0.0.113";
const APPGROUP_ID = "69f86218b9563dcf1ec605f9";

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: ENVIRONMENT || undefined,
    release: RELEASE || undefined,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
  if (APPGROUP_ID) {
    Sentry.setTag('appgroup_id', APPGROUP_ID);
  }
}

export { Sentry };
