import helmet from 'helmet';

export const helmetMiddleware = helmet({
  hsts: { maxAge: 31_536_000, includeSubDomains: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: false, // API-only server, no HTML served
});
