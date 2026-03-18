'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

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

const TABS = ['Personal Information', 'Account Details', 'Security'];

function formatDob(dob?: string): string {
  if (!dob) return '—';
  try {
    return new Date(dob + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dob; }
}

export default function Profile({ user }: { user?: { name: string; email: string; token: string; role: string } }) {
  const { colors, theme } = useTheme();
  const G = colors.gold;
  const GBD = colors.goldBg;
  const [activeTab, setActiveTab] = useState('Personal Information');
  const [account, setAccount] = useState<any>(null);
  const [memberSince, setMemberSince] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.email) {
      try {
        const raw = localStorage.getItem('londway_accounts');
        if (raw) {
          const accounts = JSON.parse(raw);
          const found = accounts.find((a: any) => a.email === user.email);
          setAccount(found || null);
          if (found?.profilePic) setProfilePic(found.profilePic);
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

  function handlePicChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Resize to max 256x256 before storing
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        setProfilePic(compressed);
        // Save into the accounts array
        try {
          const raw = localStorage.getItem('londway_accounts');
          if (raw) {
            const accounts = JSON.parse(raw);
            const idx = accounts.findIndex((a: any) => a.email === user?.email);
            if (idx !== -1) {
              accounts[idx].profilePic = compressed;
              localStorage.setItem('londway_accounts', JSON.stringify(accounts));
              setAccount(accounts[idx]);
            }
          }
        } catch {}
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  const sectionStyle: React.CSSProperties = { background: colors.surface, borderRadius: 16, border: `1px solid ${colors.border}`, padding: '1.6rem', marginBottom: '1.4rem' };
  const fieldRow = (label: string, value: React.ReactNode, badge?: boolean) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${colors.border}` }}>
      <span style={{ color: colors.textFaint, fontSize: '0.82rem', fontWeight: 600 }}>{label}</span>
      {badge ? value : <span style={{ color: colors.text, fontSize: '0.9rem', fontWeight: 500 }}>{value}</span>}
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
        {fieldRow('Account Tier', account?.tier
          ? <span style={{ fontWeight: 700, fontSize: '0.85rem', color: account.tier === 'Platinum' ? (theme === 'dark' ? '#E5E4E2' : colors.textMuted) : account.tier === 'Gold' ? colors.gold : account.tier === 'Silver' ? (theme === 'dark' ? '#C0C0C0' : colors.textMuted) : colors.textFaint }}>{account.tier}</span>
          : <span style={{ color: colors.textFaint, fontSize: '0.85rem' }}>Standard</span>, true)}
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
          : <span style={{ color: colors.gold, fontWeight: 600, fontSize: '0.85rem' }}>— Not set</span>, true)}
        {fieldRow('Face ID', hasFace
          ? <span style={{ color: '#50C878', fontWeight: 600, fontSize: '0.85rem' }}>✓ Enrolled</span>
          : <span style={{ color: '#60707E', fontSize: '0.85rem' }}>Not enrolled</span>, true)}
        {fieldRow('Last Login', lastLogin)}
      </div>
    );
  };

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.bg} 100%)`, borderBottom: `1px solid ${colors.border}`, padding: '3rem 2rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <HeroBg />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Avatar — clickable for photo upload */}
          <div
            onMouseEnter={() => setAvatarHovered(true)}
            onMouseLeave={() => setAvatarHovered(false)}
            onClick={() => picInputRef.current?.click()}
            style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.goldBg}, ${colors.border})`, border: `2px solid ${colors.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }}>
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : hasFace && account?.faceData ? (
              <img src={account.faceData} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: G }}>👤</span>
            )}
            {/* Camera overlay on hover */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: avatarHovered ? 1 : 0, transition: 'opacity 0.2s', borderRadius: '50%' }}>
              <span style={{ fontSize: '1.1rem' }}>📷</span>
              <span style={{ color: '#EAE0D0', fontSize: '0.45rem', fontWeight: 700, letterSpacing: '0.05em', marginTop: 2 }}>CHANGE</span>
            </div>
            <input
              ref={picInputRef}
              type="file"
              accept="image/*"
              capture="user"
              style={{ display: 'none' }}
              onChange={handlePicChange}
            />
          </div>
            <div>
              <h1 style={{ color: colors.text, fontWeight: 800, fontSize: '1.7rem', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{name}</h1>
              <p style={{ color: colors.textFaint, fontSize: '0.85rem', margin: '0 0 8px' }}>{email}</p>
              {account?.idVerified && <KycBadge />}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '1.8rem', background: colors.inputBg, borderRadius: 12, padding: 4, border: `1px solid ${colors.border}` }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif', fontSize: '0.82rem', transition: 'all 0.2s', background: activeTab === tab ? `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})` : 'transparent', color: activeTab === tab ? (theme === 'dark' ? colors.bg : '#fff') : colors.textFaint }}>
              {tab}
            </button>
          ))}
        </div>

        {renderSection()}
      </div>
    </main>
  );
}
