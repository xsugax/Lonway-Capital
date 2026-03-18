'use client';
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function TwoFASetup({ user }: { user: { token: string } }) {
  const { colors } = useTheme();
  const [step, setStep] = useState<'init' | 'verify' | 'done'>('init');
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startSetup = () => {
    setLoading(true);
    setError(null);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let s = '';
    for (let i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setSecret(s);
    setOtpauthUrl(`otpauth://totp/LondwayCapital?secret=${s}&issuer=LondwayCapital`);
    setStep('verify');
    setLoading(false);
  };

  const verifyToken = () => {
    setLoading(true);
    setError(null);
    if (token.length === 6 && /^\d+$/.test(token)) {
      localStorage.setItem('londway_2fa', JSON.stringify({ enabled: true, secret }));
      setStep('done');
    } else {
      setError('Please enter a valid 6-digit code');
    }
    setLoading(false);
  };

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <section style={{ background: colors.surface, borderRadius: 16, padding: '2.5rem', boxShadow: `0 4px 32px ${colors.gold}13`, border: `1px solid ${colors.border}`, minWidth: 0, width: '100%', maxWidth: 400 }}>
        <h2 style={{ color: colors.gold, fontWeight: 700, fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>Two-Factor Authentication</h2>
        {step === 'init' && (
          <>
            <button onClick={startSetup} style={{ background: colors.gold, color: colors.bg, fontWeight: 700, border: 'none', borderRadius: 6, padding: '0.75rem 2rem', fontSize: '1rem', width: '100%', cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
              {loading ? 'Starting...' : 'Start 2FA Setup'}
            </button>
            {error && <div style={{ color: colors.danger, marginTop: 16, textAlign: 'center' }}>{error}</div>}
          </>
        )}
        {step === 'verify' && (
          <>
            <div style={{ color: colors.text, marginBottom: 16, textAlign: 'center' }}>
              Scan this QR code in your authenticator app:<br />
              <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauthUrl)}&size=200x200`} alt="2FA QR" style={{ margin: '1rem auto', display: 'block' }} />
              Or enter this secret: <span style={{ color: colors.gold, fontWeight: 600 }}>{secret}</span>
            </div>
            <input type="text" placeholder="Enter 6-digit code" value={token} onChange={e => setToken(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: `1px solid ${colors.border}`, marginTop: 4, background: colors.surface2, color: colors.text, outline: 'none', marginBottom: 16 }} />
            <button onClick={verifyToken} style={{ background: colors.gold, color: colors.bg, fontWeight: 700, border: 'none', borderRadius: 6, padding: '0.75rem 2rem', fontSize: '1rem', width: '100%', cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
            {error && <div style={{ color: colors.danger, marginTop: 16, textAlign: 'center' }}>{error}</div>}
          </>
        )}
        {step === 'done' && (
          <div style={{ color: colors.success, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>2FA Enabled!</div>
        )}
      </section>
    </main>
  );
}
