/**
 * CSRF Protection — Origin/Referer Header Verification
 * Validates that mutating requests (POST, PUT, DELETE, PATCH) originate from the same site.
 */

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://queenscare.in',
  'https://www.queenscare.in',
];

export function verifyCsrf(request: Request): { valid: boolean; error?: string } {
  const method = request.method.toUpperCase();
  // Only check mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Origin header is the most reliable
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) return { valid: true };
    return { valid: false, error: 'Origin not allowed' };
  }

  // Fallback to Referer
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (ALLOWED_ORIGINS.includes(refOrigin)) return { valid: true };
    } catch {
      // Invalid referer URL
    }
    return { valid: false, error: 'Referer origin not allowed' };
  }

  // If neither Origin nor Referer is present, allow the request.
  // Some legitimate requests (e.g., from API clients, webhooks) don't send these headers.
  // Webhook routes have their own signature verification.
  return { valid: true };
}
