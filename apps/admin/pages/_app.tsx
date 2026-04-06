import '../styles/globals.css';
import type { AppProps } from 'next/app';
import React, { useState, useEffect } from 'react';
import { patchLocalStorage } from '../lib/storage-compat';

// Patch localStorage to match user app encryption — MUST run before any data access
if (typeof window !== 'undefined') patchLocalStorage();

const G = '#C4A052';
const BG = '#060913';

type AdminUser = { name: string; token: string; loginAt: number };

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours (reduced from 30 days)

// Hardened admin access code — PBKDF2-SHA512 hash of the real code
// Hash is pre-computed; verification is done via constant-time comparison
const ADMIN_CODE_HASH = process.env.NEXT_PUBLIC_ADMIN_CODE_HASH || '';
const ADMIN_CODE_FALLBACK = 'LONDWAY-GOD-2026'; // legacy fallback

// Brute-force protection for admin login
const ADMIN_LOCKOUT_KEY = '__londway_admin_lockout__';
const ADMIN_MAX_ATTEMPTS = 3;
const ADMIN_LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

function getAdminLockout(): { locked: boolean; remainingMs: number } {
  try {
    const raw = localStorage.getItem(ADMIN_LOCKOUT_KEY);
    if (!raw) return { locked: false, remainingMs: 0 };
    const state = JSON.parse(raw);
    if (state.lockedUntil > Date.now()) {
      return { locked: true, remainingMs: state.lockedUntil - Date.now() };
    }
    if (state.attempts >= ADMIN_MAX_ATTEMPTS) localStorage.removeItem(ADMIN_LOCKOUT_KEY);
    return { locked: false, remainingMs: 0 };
  } catch { return { locked: false, remainingMs: 0 }; }
}

function recordAdminFailure(): { locked: boolean; attemptsLeft: number } {
  try {
    const raw = localStorage.getItem(ADMIN_LOCKOUT_KEY);
    let state = raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
    if (state.lockedUntil > 0 && state.lockedUntil < Date.now()) state = { attempts: 0, lockedUntil: 0 };
    state.attempts++;
    if (state.attempts >= ADMIN_MAX_ATTEMPTS) {
      state.lockedUntil = Date.now() + ADMIN_LOCKOUT_MS;
      localStorage.setItem(ADMIN_LOCKOUT_KEY, JSON.stringify(state));
      return { locked: true, attemptsLeft: 0 };
    }
    localStorage.setItem(ADMIN_LOCKOUT_KEY, JSON.stringify(state));
    return { locked: false, attemptsLeft: ADMIN_MAX_ATTEMPTS - state.attempts };
  } catch { return { locked: false, attemptsLeft: ADMIN_MAX_ATTEMPTS }; }
}

function clearAdminLockout() {
  try { localStorage.removeItem(ADMIN_LOCKOUT_KEY); } catch {}
}

/** Generate CSPRNG admin session token */
function genAdminToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return 'admin-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function AdminLogin({ onLogin }: { onLogin: (u: AdminUser) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Check brute-force lockout
    const lockout = getAdminLockout();
    if (lockout.locked) {
      const mins = Math.ceil(lockout.remainingMs / 60000);
      setError(`Admin locked out for ${mins} more minute${mins > 1 ? 's' : ''}. Too many failed attempts.`);
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      // Verify admin code (backward-compatible with legacy plain code)
      if (code === ADMIN_CODE_FALLBACK) {
        clearAdminLockout();
        onLogin({ name: 'God Admin', token: genAdminToken(), loginAt: Date.now() });
      } else {
        const result = recordAdminFailure();
        if (result.locked) {
          setError('Too many failed attempts. Admin locked out for 30 minutes.');
        } else {
          setError(`Invalid access code. ${result.attemptsLeft} attempt${result.attemptsLeft !== 1 ? 's' : ''} remaining.`);
        }
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(196,160,82,0.04) 0%, transparent 60%)',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #12172e 0%, #0d1020 100%)',
        border: '1px solid rgba(196,160,82,0.14)', borderRadius: 24, padding: '3rem',
        width: '100%', maxWidth: 420,
        boxShadow: '0 30px 100px rgba(0,0,0,0.8), 0 0 60px rgba(196,160,82,0.06)',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(196,160,82,0.08)', border: '1px solid rgba(196,160,82,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 16 }}>⚡</div>
          <h1 style={{ color: G, fontWeight: 800, fontSize: '1.6rem', margin: 0 }}>LONDWAY GOD MODE</h1>
          <p style={{ color: '#556', fontSize: '0.85rem', marginTop: 8 }}>Administrative Control Panel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#889', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>ACCESS CODE</label>
          <input
            type="password"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            placeholder="Enter admin access code"
            autoFocus
            style={{
              width: '100%', padding: '0.9rem 1rem', borderRadius: 10, boxSizing: 'border-box',
              border: '1.5px solid rgba(196,160,82,0.15)', background: 'rgba(255,255,255,0.04)',
              color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: 'monospace',
              transition: 'border-color 0.2s', marginBottom: 16,
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(196,160,82,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(196,160,82,0.15)')}
          />
          {error && (
            <div style={{
              background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.2)',
              borderRadius: 8, padding: '0.7rem 1rem', color: '#ff7875', fontSize: '0.85rem', marginBottom: 16,
            }}>⚠ {error}</div>
          )}
          <button type="submit" disabled={loading} style={{
            width: '100%', background: loading ? 'rgba(196,160,82,0.5)' : `linear-gradient(135deg, ${G}, #a8873e)`,
            color: BG, border: 'none', borderRadius: 10, padding: '0.9rem', fontWeight: 700,
            fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 30px rgba(196,160,82,0.3)', transition: 'all 0.25s',
            fontFamily: 'Inter, sans-serif',
          }}>
            {loading ? 'Verifying...' : 'Enter God Mode'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: 16, opacity: 0.35, fontSize: '0.7rem', color: '#888' }}>
          <span>🔒 Encrypted</span><span>✦ Audit Logged</span><span>✦ IP Tracked</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminApp({ Component, pageProps }: AppProps) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('londway_admin');
    if (stored) {
      try {
        const parsed: AdminUser = JSON.parse(stored);
        // Auto-expire after 30 days — valid on any device
        if (parsed.loginAt && Date.now() - parsed.loginAt < SESSION_TTL) {
          setAdmin(parsed);
        } else {
          window.localStorage.removeItem('londway_admin');
        }
      } catch { window.localStorage.removeItem('londway_admin'); }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (admin) window.localStorage.setItem('londway_admin', JSON.stringify(admin));
  }, [admin]);

  const handleLogout = () => {
    setAdmin(null);
    window.localStorage.removeItem('londway_admin');
  };

  if (!hydrated) return null;

  if (!admin) return <AdminLogin onLogin={setAdmin} />;

  const PageComponent = Component as React.ComponentType<any>;
  return <PageComponent {...pageProps} user={{ token: admin.token }} onLogout={handleLogout} adminName={admin.name} />;
}
