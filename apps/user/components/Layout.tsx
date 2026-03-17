"use client";
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang, LANG_NAMES, LangCode } from '../contexts/LanguageContext';

const NAV_ITEMS = [
  { href: '/',              icon: '🏠', label: 'Dashboard' },
  { href: '/accounts',      icon: '🏛', label: 'Accounts' },
  { href: '/transfer',      icon: '↗',  label: 'Transfer' },
  { href: '/crypto',        icon: '₿',  label: 'Crypto' },
  { href: '/cards',         icon: '💳', label: 'Cards' },
  { href: '/vaults',        icon: '🏦', label: 'Vaults' },
  { href: '/invest',        icon: '📈', label: 'Invest' },
  { href: '/insights',      icon: '💡', label: 'Insights' },
  { href: '/health-score',  icon: '❤',  label: 'Health Score' },
  { href: '/checkbook',     icon: '📒', label: 'Checkbook' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
  { href: '/profile',       icon: '👤', label: 'Profile' },
  { href: '/twofa',         icon: '🔐', label: '2FA Setup' },
];

export default function Layout({ children, onLogout, userName }: { children: React.ReactNode; onLogout: () => void; userName: string }) {
  const { theme, colors, toggle } = useTheme();
  const { lang, setLang, t } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0, background: colors.navBg,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 101,
        transition: 'transform 0.25s',
        transform: mobileNavOpen ? 'translateX(0)' : undefined,
      }}
        className="sidebar-desktop"
      >
        {/* Logo */}
        <div style={{ padding: '1.2rem 1.4rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="15.5" stroke={colors.gold} strokeWidth="1.3" fill="none"/>
            <path d="M11,27 V15 C11,6.5 25,6.5 25,15 V27" stroke={colors.gold} strokeWidth="2" fill="none"/>
            <line x1="7.5" y1="27" x2="28.5" y2="27" stroke={colors.gold} strokeWidth="1"/>
          </svg>
          <span style={{ color: colors.gold, fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.04em' }}>Londway</span>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 0' }}>
          {NAV_ITEMS.map(item => {
            const active = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0.65rem 1.4rem', margin: '2px 0.6rem', borderRadius: 10,
                  background: active ? colors.goldBg : 'transparent',
                  color: active ? colors.gold : colors.textMuted,
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.85rem',
                  transition: 'background 0.15s, color 0.15s',
                  cursor: 'pointer',
                  border: active ? `1px solid ${colors.borderStrong}` : '1px solid transparent',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = colors.surface; e.currentTarget.style.color = colors.text; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; }}}
                >
                  <span style={{ fontSize: '1.05rem', width: 22, textAlign: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div style={{ padding: '1rem 1.4rem', borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Theme toggle */}
          <button onClick={toggle} style={{
            background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8,
            padding: '0.5rem 0.8rem', color: colors.textMuted, fontSize: '0.78rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Language selector */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setLangOpen(!langOpen)} style={{
              background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8,
              padding: '0.5rem 0.8rem', color: colors.textMuted, fontSize: '0.78rem', width: '100%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between',
            }}>
              <span>🌐 {LANG_NAMES[lang]}</span>
              <span style={{ fontSize: '0.6rem' }}>▼</span>
            </button>
            {langOpen && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4,
                background: colors.navBg, border: `1px solid ${colors.border}`, borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxHeight: 200, overflowY: 'auto', zIndex: 200,
              }}>
                {(Object.keys(LANG_NAMES) as LangCode[]).map(code => (
                  <div key={code} onClick={() => { setLang(code); setLangOpen(false); }} style={{
                    padding: '0.5rem 0.8rem', cursor: 'pointer', fontSize: '0.78rem',
                    color: lang === code ? colors.gold : colors.textMuted,
                    background: lang === code ? colors.goldBg : 'transparent',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = colors.surface}
                    onMouseLeave={e => e.currentTarget.style.background = lang === code ? colors.goldBg : 'transparent'}
                  >{LANG_NAMES[code]}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile nav overlay ── */}
      {mobileNavOpen && (
        <div onClick={() => setMobileNavOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
        }}/>
      )}

      {/* ── Main content area ── */}
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.7rem 2rem', background: colors.navBg,
          borderBottom: `1px solid ${colors.border}`,
          position: 'sticky', top: 0, zIndex: 99,
          boxShadow: '0 2px 8px rgba(196,160,82,0.04)',
        }}>
          {/* Mobile hamburger */}
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="mobile-nav-btn" style={{
            display: 'none', background: 'none', border: 'none', color: colors.text,
            fontSize: '1.5rem', cursor: 'pointer', padding: 4,
          }}>☰</button>

          <div style={{ fontSize: '0.85rem', color: colors.textMuted }}>
            Welcome, <span style={{ color: colors.gold, fontWeight: 700 }}>{userName}</span>
          </div>

          <button onClick={onLogout} style={{
            background: 'transparent', border: `1px solid ${colors.border}`,
            color: colors.textMuted, borderRadius: 8, padding: '0.4rem 1rem',
            fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.danger; e.currentTarget.style.color = colors.danger; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
          >
            Sign Out
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { transform: translateX(-100%) !important; }
          .sidebar-desktop[style*="translateX(0)"] { transform: translateX(0) !important; }
          .mobile-nav-btn { display: flex !important; }
          div[style*="marginLeft: 240"] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}

