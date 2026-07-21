import crypto from 'crypto';

// Admin panel session auth — entirely separate from Clerk. Credentials come
// from env vars only (ADMIN_USERNAME / ADMIN_PASSWORD), never hardcoded.
export const ADMIN_COOKIE_NAME = 'quizzviz_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET (or ADMIN_PASSWORD) is not configured in environment variables');
  }
  return secret;
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  return timingSafeEqualStr(username, expectedUser) && timingSafeEqualStr(password, expectedPass);
}

// Opaque, HMAC-signed session token: "<expiryTimestamp>.<signature>".
// Nothing in the payload is sensitive (no username/password embedded) — the
// signature alone proves it was issued by this server and hasn't expired.
export function createSessionToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${expires}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;

  let expected: string;
  try {
    expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  } catch {
    return false;
  }

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  const expires = parseInt(payload, 10);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  return true;
}
