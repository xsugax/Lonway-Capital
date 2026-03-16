'use client';
import React, { useState } from 'react';
import { API_URL } from '../lib/api';

export default function TwoFASetup({ user }: { user: { token: string } }) {
  const [step, setStep] = useState<'init' | 'verify' | 'done'>('init');
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/security/twofa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      setSecret(data.secret);
      setOtpauthUrl(data.otpauth_url);
      setStep('verify');
    } catch (err: any) {
      setError('Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/security/twofa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('done');
      } else {
        setError(data.message || 'Invalid token');
      }
    } catch (err: any) {
      setError('Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ background: '#060913', minHeight: '100vh', color: '#EAE0D0', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <section style={{ background: '#0D1628', borderRadius: 16, padding: '2.5rem', boxShadow: '0 4px 32px rgba(196,160,82,0.13)', border: '1px solid rgba(196,160,82,0.15)', minWidth: 340 }}>
        <h2 style={{ color: '#C4A052', fontWeight: 700, fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>Two-Factor Authentication</h2>
        {step === 'init' && (
          <>
            <button onClick={startSetup} style={{ background: '#C4A052', color: '#060913', fontWeight: 700, border: 'none', borderRadius: 6, padding: '0.75rem 2rem', fontSize: '1rem', width: '100%', cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
              {loading ? 'Starting...' : 'Start 2FA Setup'}
            </button>
            {error && <div style={{ color: '#ff4d4f', marginTop: 16, textAlign: 'center' }}>{error}</div>}
          </>
        )}
        {step === 'verify' && (
          <>
            <div style={{ color: '#EAE0D0', marginBottom: 16, textAlign: 'center' }}>
              Scan this QR code in your authenticator app:<br />
              <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauthUrl)}&size=200x200`} alt="2FA QR" style={{ margin: '1rem auto', display: 'block' }} />
              Or enter this secret: <span style={{ color: '#C4A052', fontWeight: 600 }}>{secret}</span>
            </div>
            <input type="text" placeholder="Enter 6-digit code" value={token} onChange={e => setToken(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid rgba(196,160,82,0.2)', marginTop: 4, background: '#09101F', color: '#EAE0D0', outline: 'none', marginBottom: 16 }} />
            <button onClick={verifyToken} style={{ background: '#C4A052', color: '#060913', fontWeight: 700, border: 'none', borderRadius: 6, padding: '0.75rem 2rem', fontSize: '1rem', width: '100%', cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
            {error && <div style={{ color: '#ff4d4f', marginTop: 16, textAlign: 'center' }}>{error}</div>}
          </>
        )}
        {step === 'done' && (
          <div style={{ color: '#7fffd4', fontWeight: 700, textAlign: 'center', fontSize: '1.2rem' }}>
            2FA is now enabled for your account!
          </div>
        )}
      </section>
    </main>
  );
}
