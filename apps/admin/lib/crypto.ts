/**
 * Crypto utilities for admin panel
 * Mirrors the user-side crypto module for password hashing verification
 */

const HASH_ITERATIONS = 600_000;
const HASH_SALT_LEN = 32;
const HASH_KEY_LEN = 64;

/** Hash a password with PBKDF2-SHA512. Returns "salt:hash" in base64 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(HASH_SALT_LEN));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: HASH_ITERATIONS, hash: 'SHA-512' },
    keyMaterial,
    HASH_KEY_LEN * 8
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derived)));
  return `${saltB64}:${hashB64}`;
}

/** Verify a password against a PBKDF2-SHA512 hash */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.includes(':') || storedHash.length < 60) {
    return password === storedHash;
  }
  const enc = new TextEncoder();
  const [saltB64, hashB64] = storedHash.split(':');
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const expectedHash = Uint8Array.from(atob(hashB64), c => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: HASH_ITERATIONS, hash: 'SHA-512' },
    keyMaterial,
    HASH_KEY_LEN * 8
  );
  const derivedArr = new Uint8Array(derived);
  if (derivedArr.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedArr.length; i++) diff |= derivedArr[i] ^ expectedHash[i];
  return diff === 0;
}

/** Generate a cryptographically secure token */
export function generateSecureToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
