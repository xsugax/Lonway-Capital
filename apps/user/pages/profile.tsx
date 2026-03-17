import React, { useState, useEffect } from 'react';

function HeroBg() {
  return (
    <svg viewBox="0 0 900 220" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '100%', opacity: 0.04, pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="pglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C4A052" stopOpacity="1"/>
          <stop offset="100%" stopColor="#C4A052" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {[25, 55, 88, 124, 164].map((r, i) => (
        <circle key={i} cx="80" cy="110" r={r} stroke="#C4A052" strokeWidth="1" fill="none"/>
      ))}
      {[25, 55, 88, 124, 164].map((r, i) => (
        <circle key={i + 10} cx="820" cy="110" r={r} stroke="#C4A052" strokeWidth="1" fill="none"/>
      ))}
      <line x1="0" y1="110" x2="900" y2="110" stroke="#C4A052" strokeWidth="0.5"/>
      <line x1="450" y1="0" x2="450" y2="220" stroke="#C4A052" strokeWidth="0.5"/>
    </svg>
  );
}

function KycBadge() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(62,158,122,0.1)', border: '1px solid rgba(62,158,122,0.3)', borderRadius: 20, padding: '3px 10px' }}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="6" fill="#3D9E7A" fillOpacity="0.2" stroke="#3D9E7A" strokeWidth="1"/>
        <path d="M3.5 6.5l2 2 4-4" stroke="#3D9E7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ color: '#3D9E7A', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em' }}>KYC VERIFIED</span>
    </div>
  );
}

const G = '#C4A052';
const GBD = 'rgba(196,160,82,0.15)';

const TABS = ['Personal Information', 'Account Details', 'Security'];

function formatDob(dob?: string): string {
  if (!dob) return '—';
  try {
    return new Date(dob + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dob; }
}

export default function Profile({ user }: { user?: { name: string; email: string; token: string; role: string } }) {
  const [activeTab, setActiveTab] = useState('Personal Information');
  const [account, setAccount] = useState<any>(null);
  const [memberSince, setMemberSince] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.email) {
      try {
        const raw = localStorage.getItem('londway_accounts');
        if (raw) {
          const accounts = JSON.parse(raw);
          const found = accounts.find((a: any) => a.email === user.email);
          setAccount(found || null);
        }
      } catch {}
      // Estimate member since from stored date or use current year
      const storedDate = localStorage.getItem('londway_member_since_' + user.email);
      if (storedDate) {
        setMemberSince(storedDate);
      } else {
        const d = new Date();
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        setMemberSince(label);
        localStorage.setItem('londway_member_since_' + user.email, label);
      }
    }
  }, [user?.email]);

  const name = account?.name || user?.name || '—';
  const email = account?.email || user?.email || '—';
  const phone = account?.phone || '—';
  const dob = formatDob(account?.dob);
  const hasPin = !!account?.pin;
  const hasFace = !!account?.faceData;
  const lastLogin = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const sectionStyle: React.CSSProperties = { background: '#0D1628', borderRadius: 16, border: '1px solid rgba(196,160,82,0.1)', padding: '1.6rem', marginBottom: '1.4rem' };
  const fieldRow = (label: string, value: React.ReactNode, badge?: boolean) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid rgba(196,160,82,0.05)' }}>
      <span style={{ color: '#60707E', fontSize: '0.82rem', fontWeight: 600 }}>{label}</span>
      {badge ? value : <span style={{ color: '#EAE0D0', fontSize: '0.9rem', fontWeight: 500 }}>{value}</span>}
    </div>
  );

  const renderSection = () => {
    if (activeTab === 'Personal Information') return (
      <div style={sectionStyle}>
        <h3 style={{ color: G, fontWeight: 700, fontSize: '0.88rem', margin: '0 0 4px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Personal Information</h3>
        {account?.idVerified && <div style={{ marginBottom: 12 }}><KycBadge /></div>}
        {fieldRow('Full Name', name)}
        {fieldRow('Email Address', email)}
        {fieldRow('Phone Number', phone)}
        {fieldRow('Date of Birth', dob)}
      </div>
    );
    if (activeTab === 'Account Details') return (
      <div style={sectionStyle}>
        <h3 style={{ color: G, fontWeight: 700, fontSize: '0.88rem', margin: '0 0 16px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Account Details</h3>
        {fieldRow('Account Holder', name)}
        {fieldRow('Member Since', memberSince || '—')}
        {fieldRow('Account Tier', 'Londway Premium')}
        {fieldRow('Default Currency', 'USD')}
        {fieldRow('Account Status', <span style={{ color: '#50C878', fontWeight: 600, fontSize: '0.85rem' }}>● Active</span>, true)}
      </div>
    );
    return (
      <div style={sectionStyle}>
        <h3 style={{ color: G, fontWeight: 700, fontSize: '0.88rem', margin: '0 0 16px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Security</h3>
        {fieldRow('Email Verification', <span style={{ color: '#50C878', fontWeight: 600, fontSize: '0.85rem' }}>✓ Enabled</span>, true)}
        {fieldRow('Transfer PIN', hasPin
          ? <span style={{ color: '#50C878', fontWeight: 600, fontSize: '0.85rem' }}>✓ Set</span>
          : <span style={{ color: '#C4A052', fontWeight: 600, fontSize: '0.85rem' }}>— Not set</span>, true)}
        {fieldRow('Face ID', hasFace
          ? <span style={{ color: '#50C878', fontWeight: 600, fontSize: '0.85rem' }}>✓ Enrolled</span>
          : <span style={{ color: '#60707E', fontSize: '0.85rem' }}>Not enrolled</span>, true)}
        {fieldRow('Last Login', lastLogin)}
      </div>
    );
  };

  return (
    <main style={{ background: '#060913', minHeight: '100vh', color: '#EAE0D0', fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, #0a1020 0%, #060913 100%)', borderBottom: '1px solid rgba(196,160,82,0.07)', padding: '3rem 2rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <HeroBg />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(196,160,82,0.25), rgba(196,160,82,0.05))', border: `2px solid ${GBD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
              {hasFace && account?.faceData ? (
                <img src={account.faceData} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: G }}>👤</span>
              )}
            </div>
            <div>
              <h1 style={{ color: '#EAE0D0', fontWeight: 800, fontSize: '1.7rem', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{name}</h1>
              <p style={{ color: '#60707E', fontSize: '0.85rem', margin: '0 0 8px' }}>{email}</p>
              {account?.idVerified && <KycBadge />}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '1.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: '1px solid rgba(196,160,82,0.08)' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', transition: 'all 0.2s', background: activeTab === tab ? 'linear-gradient(135deg, #C4A052, #a8873e)' : 'transparent', color: activeTab === tab ? '#060913' : '#60707E' }}>
              {tab}
            </button>
          ))}
        </div>

        {renderSection()}
      </div>
    </main>
  );
}
