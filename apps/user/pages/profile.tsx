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
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(61,158,122,0.12)', border: '1px solid rgba(61,158,122,0.35)', borderRadius: 20, padding: '3px 10px' }}>
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

export default function Profile() {
  const [activeTab, setActiveTab] = useState('Personal Information');

  return (
    <main style={{ background: '#060913', minHeight: '100vh', color: '#EAE0D0', fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0D1628 0%, #060913 70%)', borderBottom: '1px solid rgba(196,160,82,0.12)', padding: '2.5rem 2rem 0' }}>
        <HeroBg />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, paddingBottom: '2rem' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'linear-gradient(135deg, #C4A052, #a0803a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', fontWeight: 700, color: '#060913', boxShadow: '0 0 0 3px rgba(196,160,82,0.25), 0 0 24px rgba(196,160,82,0.2)' }}>JD</div>
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: '#3D9E7A', border: '2px solid #060913', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 700, color: '#EAE0D0' }}>Jane Doe</h1>
                <KycBadge />
              </div>
              <div style={{ color: '#60707E', fontSize: '0.85rem', marginTop: 4 }}>jane.doe@email.com &nbsp;&middot;&nbsp; Londway Premium Member</div>
            </div>
          </div>
          {/* Tabs */}
          <div className="profile-tabs" style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(196,160,82,0.08)', overflowX: 'auto' }}>
            {SECTIONS.map(s => (
              <button key={s.title} onClick={() => setActiveTab(s.title)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.75rem 1.3rem', fontSize: '0.82rem', fontWeight: 600, color: activeTab === s.title ? '#C4A052' : '#60707E', borderBottom: activeTab === s.title ? '2px solid #C4A052' : '2px solid transparent', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {s.icon} {s.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '2rem auto', padding: '0 2rem' }}>
        {SECTIONS.filter(s => s.title === activeTab).map(section => (
          <div key={section.title}>
            <div style={{ background: '#0D1628', borderRadius: 14, border: '1px solid rgba(196,160,82,0.1)', overflow: 'hidden' }}>
              <div style={{ borderBottom: '1px solid rgba(196,160,82,0.08)', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#EAE0D0' }}>{section.icon} {section.title}</span>
                <button style={{ background: 'rgba(196,160,82,0.1)', border: '1px solid rgba(196,160,82,0.2)', borderRadius: 8, color: '#C4A052', fontSize: '0.78rem', fontWeight: 600, padding: '5px 14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Edit</button>
              </div>
              <div style={{ padding: '0.5rem 0' }}>
                {section.fields.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.5rem', borderBottom: i < section.fields.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <span style={{ color: '#60707E', fontSize: '0.85rem', fontWeight: 500 }}>{f.label}</span>
                    <span style={{ color: '#EAE0D0', fontSize: '0.85rem', fontWeight: 600 }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Danger Zone */}
        <div className="profile-danger" style={{ marginTop: 16, background: '#0D1628', borderRadius: 14, border: '1px solid rgba(255,77,79,0.12)', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ff4d4f', marginBottom: 2 }}>Close Account</div>
            <div style={{ color: '#60707E', fontSize: '0.78rem' }}>Permanently remove your account and all associated data.</div>
          </div>
          <button style={{ background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.25)', borderRadius: 8, color: '#ff4d4f', fontSize: '0.78rem', fontWeight: 600, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Close Account</button>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .profile-tabs { scrollbar-width: none; -ms-overflow-style: none; }
          .profile-tabs::-webkit-scrollbar { display: none; }
        }
      `}</style>
    </main>
  );
}
