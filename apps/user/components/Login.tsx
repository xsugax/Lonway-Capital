'use client';
import React, { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (user: { name: string; token: string; role: string }) => void;
  onClose?: () => void;
  modal?: boolean;
  mode?: 'login' | 'register';
  onSwitchMode?: (mode: 'login' | 'register') => void;
}

// Registered accounts stored in localStorage
const ACCOUNTS_KEY = 'londway_accounts';

function getAccounts(): { email: string; password: string; name: string; role: string }[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  const defaults = [
    { email: 'user@londwaycapital.com', password: 'password123', name: 'Jane Doe', role: 'user' },
    { email: 'admin@londwaycapital.com', password: 'admin123', name: 'Admin', role: 'admin' },
  ];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveAccount(account: { email: string; password: string; name: string; role: string }) {
  const accounts = getAccounts();
  accounts.push(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export default function Login({ onLogin, onClose, modal = false, mode = 'login', onSwitchMode }: LoginProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const isRegister = mode === 'register';

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setError(null);
    setName(''); setEmail(''); setPassword(''); setConfirmPassword('');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 600));

    if (isRegister) {
      if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
      const accounts = getAccounts();
      if (accounts.find(a => a.email === email)) { setError('An account with this email already exists.'); setLoading(false); return; }
      const newAccount = { email, password, name: name || email.split('@')[0], role: 'user' };
      saveAccount(newAccount);
      setLoading(false);
      onLogin({ name: newAccount.name, token: 'token-' + Date.now(), role: 'user' });
    } else {
      const accounts = getAccounts();
      const match = accounts.find(a => a.email === email && a.password === password);
      setLoading(false);
      if (match) {
        onLogin({ name: match.name, token: 'token-' + Date.now(), role: match.role });
      } else {
        setError('Invalid email or password.');
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.8rem 1rem', borderRadius: 10, boxSizing: 'border-box',
    border: '1.5px solid rgba(196,160,82,0.1)', background: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'Inter, sans-serif',
  };

  const formContent = (
    <div style={{
      background: 'linear-gradient(160deg, #12172e 0%, #0d1020 100%)',
      border: '1px solid rgba(196,160,82,0.14)',
      borderRadius: 20, padding: '2.8rem', width: '100%', maxWidth: 420,
      boxShadow: '0 30px 100px rgba(0,0,0,0.8), 0 0 60px rgba(196,160,82,0.06)',
      position: 'relative' as const,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
      opacity: visible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {modal && onClose && (
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 18, background: 'none', border: 'none',
          color: '#555', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: 4, transition: 'color 0.2s',
        }}
          onMouseOver={e => (e.currentTarget.style.color = '#fff')}
          onMouseOut={e => (e.currentTarget.style.color = '#555')}
        >✕</button>
      )}

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '2rem' }}>
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="15.5" stroke="#C4A052" strokeWidth="1.3" fill="none"/>
          <path d="M11,27 V15 C11,6.5 25,6.5 25,15 V27" stroke="#C4A052" strokeWidth="2" fill="#C4A05208" strokeLinejoin="round"/>
          <line x1="7.5" y1="27" x2="28.5" y2="27" stroke="#C4A052" strokeWidth="1" strokeLinecap="round"/>
        </svg>
        <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', letterSpacing: '0.05em' }}>
          LONDWAY <span style={{ color: '#C4A052' }}>CAPITAL</span>
        </span>
      </div>

      <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.6rem', marginBottom: 6, textAlign: 'center' }}>
        {isRegister ? 'Create your account' : 'Welcome back'}
      </h2>
      <p style={{ color: '#556', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        {isRegister ? 'Open your private banking account today' : 'Sign in to your private banking dashboard'}
      </p>

      {/* Demo credentials — only on login */}
      {!isRegister && (
        <div style={{ background: 'rgba(196,160,82,0.05)', border: '1px solid rgba(196,160,82,0.15)', borderRadius: 10, padding: '0.9rem 1.1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#C4A052', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>Demo Access</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '0.82rem', color: '#A2B2BF', lineHeight: 1.7 }}>
              <span style={{ color: '#EAE0D0' }}>Email:</span> user@londwaycapital.com<br/>
              <span style={{ color: '#EAE0D0' }}>Password:</span> password123
            </div>
            <button type="button" onClick={() => { setEmail('user@londwaycapital.com'); setPassword('password123'); }} style={{ background: 'rgba(196,160,82,0.12)', border: '1px solid rgba(196,160,82,0.22)', color: '#C4A052', borderRadius: 7, padding: '0.35rem 0.75rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,160,82,0.2)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,160,82,0.12)'; }}>
              Fill →
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isRegister && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#889', fontWeight: 600, marginBottom: 7, letterSpacing: '0.05em' }}>FULL NAME</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(196,160,82,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(196,160,82,0.1)')} />
          </div>
        )}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#889', fontWeight: 600, marginBottom: 7, letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'rgba(196,160,82,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(196,160,82,0.1)')} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <label style={{ fontSize: '0.8rem', color: '#889', fontWeight: 600, letterSpacing: '0.05em' }}>PASSWORD</label>
            {!isRegister && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(196,160,82,0.55)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.color = '#C4A052')}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(196,160,82,0.55)')}>Forgot password?</span>
            )}
          </div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'rgba(196,160,82,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(196,160,82,0.1)')} />
        </div>
        {isRegister && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#889', fontWeight: 600, marginBottom: 7, letterSpacing: '0.05em' }}>CONFIRM PASSWORD</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(196,160,82,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(196,160,82,0.1)')} />
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.2)', borderRadius: 8, padding: '0.7rem 1rem', color: '#ff7875', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1rem' }}>⚠</span> {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          background: loading ? 'rgba(196,160,82,0.5)' : '#C4A052',
          color: '#060913', border: 'none', borderRadius: 10, padding: '0.9rem',
          fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 0 30px rgba(196,160,82,0.3)',
          transition: 'all 0.25s', letterSpacing: '0.01em',
        }}
          onMouseOver={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 40px rgba(196,160,82,0.5)'; }}
          onMouseOut={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(196,160,82,0.3)'; }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ width: 16, height: 16, border: '2px solid #070910', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              {isRegister ? 'Creating account...' : 'Authenticating...'}
            </span>
          ) : isRegister ? 'Create Account' : 'Sign In to Londway'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: '#445' }}>
        {isRegister ? 'Already have an account? ' : 'New to Londway? '}
        <span
          onClick={() => onSwitchMode?.(isRegister ? 'login' : 'register')}
          style={{ color: 'rgba(196,160,82,0.6)', cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseOver={e => (e.currentTarget.style.color = '#C4A052')}
          onMouseOut={e => (e.currentTarget.style.color = 'rgba(196,160,82,0.6)')} 
        >{isRegister ? 'Sign in →' : 'Open an account →'}</span>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: 16, opacity: 0.4, fontSize: '0.72rem', color: '#888' }}>
        <span>🔒 256-bit SSL</span><span>✦ FDIC Insured</span><span>✦ SOC 2</span>
      </div>
    </div>
  );

  if (modal) {
    return (
      <div onClick={handleBackdropClick} style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(4,5,10,0.85)',
        backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease',
      }}>
        {formContent}
      </div>
    );
  }

  return (
    <main style={{
      background: '#070910', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(196,160,82,0.05) 0%, transparent 70%)',
    }}>
      {formContent}
    </main>
  );
}
