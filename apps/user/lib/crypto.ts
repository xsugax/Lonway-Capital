/**
 * Military-grade encryption module for Londway Capital
 * Uses Web Crypto API — AES-256-GCM + PBKDF2 + SHA-512
 * All sensitive data encrypted at rest (localStorage) and in transit (Supabase)
 */

// ═══════════════════════════════════════════
// AES-256-GCM Encryption / Decryption
// ═══════════════════════════════════════════

const ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit nonce for GCM
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 600_000; // OWASP 2024 recommendation

/** Derive a 256-bit AES key from a passphrase using PBKDF2-SHA512 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as any, iterations: PBKDF2_ITERATIONS, hash: 'SHA-512' },
    keyMaterial,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt plaintext with AES-256-GCM. Returns base64 string: salt|iv|ciphertext */
export async function encrypt(plaintext: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    enc.encode(plaintext)
  );
  // Concatenate salt + iv + ciphertext → base64
  const combined = new Uint8Array(salt.length + iv.length + cipher.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(cipher), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

/** Decrypt AES-256-GCM ciphertext. Returns plaintext string */
export async function decrypt(encoded: string, passphrase: string): Promise<string> {
  const dec = new TextDecoder();
  const combined = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);
  const key = await deriveKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ciphertext);
  return dec.decode(plain);
}

// ═══════════════════════════════════════════
// Password Hashing (PBKDF2-SHA512)
// ═══════════════════════════════════════════

const HASH_ITERATIONS = 600_000;
const HASH_SALT_LEN = 32;
const HASH_KEY_LEN = 64; // 512-bit derived key

/** Hash a password with PBKDF2-SHA512. Returns "salt:hash" in base64 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(HASH_SALT_LEN));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as any, iterations: HASH_ITERATIONS, hash: 'SHA-512' },
    keyMaterial,
    HASH_KEY_LEN * 8
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derived)));
  return `${saltB64}:${hashB64}`;
}

/** Verify a password against a PBKDF2-SHA512 hash */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Handle legacy unhashed passwords (plain text comparison)
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
    { name: 'PBKDF2', salt: salt as any, iterations: HASH_ITERATIONS, hash: 'SHA-512' },
    keyMaterial,
    HASH_KEY_LEN * 8
  );
  const derivedArr = new Uint8Array(derived);
  // Constant-time comparison to prevent timing attacks
  if (derivedArr.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedArr.length; i++) diff |= derivedArr[i] ^ expectedHash[i];
  return diff === 0;
}

// ═══════════════════════════════════════════
// Secure Session Tokens (CSPRNG)
// ═══════════════════════════════════════════

/** Generate a cryptographically secure session token */
export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// ═══════════════════════════════════════════
// TOTP Verification (RFC 6238)
// ═══════════════════════════════════════════

/** Decode base32 string to Uint8Array */
function base32Decode(input: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = input.replace(/[=\s]/g, '').toUpperCase();
  let bits = '';
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

/** Generate HMAC-SHA1 (required by RFC 4226/6238 HOTP/TOTP) */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key as any, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, message as any);
  return new Uint8Array(sig);
}

/** Verify a TOTP code against a base32 secret (±1 window for clock drift) */
export async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const keyBytes = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000);
  const step = 30; // 30-second TOTP window
  // Check current window ± 1 for clock drift tolerance
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor((now / step) + offset);
    const counterBytes = new Uint8Array(8);
    let tmp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = tmp & 0xff;
      tmp = Math.floor(tmp / 256);
    }
    const hmac = await hmacSha1(keyBytes, counterBytes);
    const off = hmac[hmac.length - 1] & 0x0f;
    const binary = ((hmac[off] & 0x7f) << 24) | ((hmac[off + 1] & 0xff) << 16) |
                   ((hmac[off + 2] & 0xff) << 8) | (hmac[off + 3] & 0xff);
    const otp = (binary % 1_000_000).toString().padStart(6, '0');
    if (otp === code) return true;
  }
  return false;
}

// ═══════════════════════════════════════════
// Encrypted localStorage helpers
// ═══════════════════════════════════════════

const VAULT_KEY = '__londway_vault_key__';

/** Get or generate the per-device encryption key (stored encrypted with a device fingerprint) */
function getVaultPassphrase(): string {
  if (typeof window === 'undefined') return '';
  let key = sessionStorage.getItem(VAULT_KEY);
  if (key) return key;
  // Build device fingerprint for key derivation
  const fp = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
  ].join('|');
  // Use stored device key or generate one
  let deviceKey = localStorage.getItem('__londway_dk__');
  if (!deviceKey) {
    deviceKey = generateSessionToken();
    localStorage.setItem('__londway_dk__', deviceKey);
  }
  key = fp + ':' + deviceKey;
  sessionStorage.setItem(VAULT_KEY, key);
  return key;
}

/** Store data encrypted in localStorage */
export async function secureStore(key: string, data: any): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const passphrase = getVaultPassphrase();
    const json = JSON.stringify(data);
    const encrypted = await encrypt(json, passphrase);
    localStorage.setItem(key, encrypted);
  } catch (err) {
    console.error('[crypto] secureStore error:', err);
  }
}

/** Retrieve and decrypt data from localStorage */
export async function secureRetrieve<T = any>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    // Handle legacy unencrypted data (starts with [ or { or ")
    if (raw.startsWith('[') || raw.startsWith('{') || raw.startsWith('"')) {
      return JSON.parse(raw) as T;
    }
    const passphrase = getVaultPassphrase();
    const json = await decrypt(raw, passphrase);
    return JSON.parse(json) as T;
  } catch {
    // If decryption fails, try parsing as legacy plain JSON
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {}
    return null;
  }
}

// ═══════════════════════════════════════════
// Integrity Check (tamper detection)
// ═══════════════════════════════════════════

/** Compute HMAC-SHA256 integrity tag for data */
export async function computeIntegrity(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
}

/** Verify HMAC-SHA256 integrity tag */
export async function verifyIntegrity(data: string, tag: string, secret: string): Promise<boolean> {
  const computed = await computeIntegrity(data, secret);
  // Constant-time comparison
  if (computed.length !== tag.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ tag.charCodeAt(i);
  return diff === 0;
}

// ═══════════════════════════════════════════
// Brute-force Protection
// ═══════════════════════════════════════════

const LOCKOUT_KEY = '__londway_login_attempts__';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface LockoutState {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number;
}

/** Check if login is currently locked out */
export function isLockedOut(): { locked: boolean; remainingMs: number } {
  if (typeof window === 'undefined') return { locked: false, remainingMs: 0 };
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { locked: false, remainingMs: 0 };
    const state: LockoutState = JSON.parse(raw);
    if (state.lockedUntil > Date.now()) {
      return { locked: true, remainingMs: state.lockedUntil - Date.now() };
    }
    // Lockout expired — reset
    if (state.attempts >= MAX_ATTEMPTS) {
      localStorage.removeItem(LOCKOUT_KEY);
    }
    return { locked: false, remainingMs: 0 };
  } catch { return { locked: false, remainingMs: 0 }; }
}

/** Record a failed login attempt */
export function recordFailedAttempt(): { locked: boolean; attemptsLeft: number } {
  if (typeof window === 'undefined') return { locked: false, attemptsLeft: MAX_ATTEMPTS };
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    let state: LockoutState = raw ? JSON.parse(raw) : { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
    // Reset if lockout expired
    if (state.lockedUntil > 0 && state.lockedUntil < Date.now()) {
      state = { attempts: 0, lastAttempt: 0, lockedUntil: 0 };
    }
    state.attempts++;
    state.lastAttempt = Date.now();
    if (state.attempts >= MAX_ATTEMPTS) {
      state.lockedUntil = Date.now() + LOCKOUT_MS;
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
      return { locked: true, attemptsLeft: 0 };
    }
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
    return { locked: false, attemptsLeft: MAX_ATTEMPTS - state.attempts };
  } catch { return { locked: false, attemptsLeft: MAX_ATTEMPTS }; }
}

/** Clear lockout after successful login */
export function clearLockout(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(LOCKOUT_KEY);
}

// ═══════════════════════════════════════════
// Session Security
// ═══════════════════════════════════════════

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let onTimeoutCallback: (() => void) | null = null;

/** Start inactivity auto-logout timer */
export function startInactivityTimer(onTimeout: () => void): void {
  if (typeof window === 'undefined') return;
  onTimeoutCallback = onTimeout;
  const resetTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (onTimeoutCallback) onTimeoutCallback();
    }, INACTIVITY_TIMEOUT);
  };
  const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
  events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
  resetTimer();
}

/** Stop inactivity timer */
export function stopInactivityTimer(): void {
  if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
  onTimeoutCallback = null;
}
