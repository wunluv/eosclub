import { defineMiddleware } from 'astro:middleware';

/**
 * Workaround for Keystatic GitHub auth redirect URI resolving to localhost
 * behind reverse proxies (DigitalOcean Docker + Nginx).
 *
 * For Keystatic OAuth routes only, rewrite context.url/context.request using
 * forwarded headers so redirect_uri uses the public domain.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const isKeystaticOAuthRoute =
    path.includes('/api/keystatic/github/login') ||
    path.includes('/api/keystatic/github/oauth/') ||
    path.includes('/api/keystatic/github/callback');

  if (!isKeystaticOAuthRoute) {
    return next();
  }

  const forwardedHost = context.request.headers.get('x-forwarded-host');
  const forwardedProto = context.request.headers.get('x-forwarded-proto');
  const host = context.request.headers.get('host');

  const targetHost = forwardedHost ?? host;
  const targetProto = forwardedProto ?? (context.url.protocol.replace(':', '') || 'https');

  if (!targetHost || !targetProto) {
    return next();
  }

  const correctedUrl = new URL(context.url);
  correctedUrl.host = targetHost;
  correctedUrl.protocol = `${targetProto}:`;

  const method = context.request.method.toUpperCase();
  const init: RequestInit = {
    method: context.request.method,
    headers: context.request.headers,
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = context.request.body;
    init.duplex = 'half';
  }

  const correctedRequest = new Request(correctedUrl.toString(), init);

  Object.defineProperty(context, 'url', {
    value: correctedUrl,
    writable: false,
  });

  Object.defineProperty(context, 'request', {
    value: correctedRequest,
    writable: false,
  });

  return next();
});
