import * as Sentry from '@sentry/node';
import { env } from '@ujuz/config';

const enabled = Boolean(env.SENTRY_DSN);

if (enabled) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Strip sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['x-partner-key'];
        delete event.request.headers['x-admin-key'];
        delete event.request.headers['authorization'];
        // M2: Additional sensitive headers
        delete event.request.headers['x-user-id'];
        delete event.request.headers['x-device-id'];
        delete event.request.headers['x-referral-code'];
      }
      return event;
    },
  });
}

export { Sentry, enabled as sentryEnabled };
