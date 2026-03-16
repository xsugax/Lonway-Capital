import React, { useState } from 'react';

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
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#2ecc40', border: '1px solid #2ecc40', borderRadius: 20, padding: '3px 10px' }}>
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="6" fill="#3D9E7A" fillOpacity="0.2" stroke="#3D9E7A" strokeWidth="1"/>
        <path d="M3.5 6.5l2 2 4-4" stroke="#3D9E7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ color: '#3D9E7A', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em' }}>KYC VERIFIED</span>
    </div>
  );
}

const SECTIONS = [
  {
    title: 'Personal Information',
    icon: '',
    fields: [
      { label: 'Full Name', value: 'Jane Doe' },
      { label: 'Email Address', value: 'jane.doe@email.com' },
      { label: 'Phone Number', value: '+1 (555) 012-3456' },
      { label: 'Date of Birth', value: 'March 14, 1990' },
    ],
  },
  {
    title: 'Account Details',
    icon: '',
    fields: [
      { label: 'Account Number', value: '  4521' },
      { label: 'Member Since', value: 'January 2021' },
      { label: 'Account Tier', value: 'Londway Premium' },
      { label: 'Currency', value: 'USD' },
    ],
  },
  {
    title: 'Security',
    icon: '',
    fields: [
      { label: 'Two-Factor Auth', value: 'Enabled' },
      { label: 'Last Login', value: 'Today, 9:41 AM' },
      { label: 'Active Sessions', value: '2 devices' },
      { label: 'Password Changed', value: '30 days ago' },
    ],
  },
];

function Profile() {
  const [activeTab, setActiveTab] = useState('Personal Information');
  return (
    <main style={{ background: '#181818', minHeight: '100vh', color: '#F5F5F5', fontFamily: 'Inter, sans-serif' }}>
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '2rem', position: 'relative' }}>
        <HeroBg />
        <h1 style={{ color: '#FFD700', fontWeight: 700, fontSize: '2rem', marginBottom: '1.5rem' }}>Profile</h1>
        {/* ...existing code... */}
      </section>
    </main>
  );
}

export default Profile;
