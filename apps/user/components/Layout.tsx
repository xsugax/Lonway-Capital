"use client";
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang, LANG_NAMES, LangCode } from '../contexts/LanguageContext';
import { getNotifications, saveNotifications } from '../lib/store';

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

export default function Layout({ children, onLogout, userName, userEmail }: { children: React.ReactNode; onLogout: () => void; userName: string; userEmail?: string }) {
  const { theme, colors, toggle } = useTheme();
  const { lang, setLang, t } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

  // ── Notification state ──
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotif, setToastNotif] = useState<{ id: string; message: string; type: string } | null>(null);
  const lastCountRef = useRef<number>(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play a pleasant 2-note ascending chime via Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      // First note
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.connect(gain);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Second note (higher)
      const gain2 = ctx.createGain();
      gain2.connect(ctx.destination);
      gain2.gain.setValueAtTime(0.18, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15); // A5
      osc2.connect(gain2);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } catch {}
  }, []);

  // Poll localStorage for unread notifications every 2 seconds
  useEffect(() => {
    if (!userEmail) return;
    const poll = () => {
      const notifs = getNotifications(userEmail);
      const unread = notifs.filter((n: any) => !n.read).length;
      setUnreadCount(unread);

      // Detect new notification arrival
      if (lastCountRef.current >= 0 && unread > lastCountRef.current) {
        // Show toast for the newest unread notification
        const newest = notifs.find((n: any) => !n.read);
        if (newest) {
          setToastNotif({ id: newest.id, message: newest.message, type: newest.type });
          playNotificationSound();
          // Auto-dismiss after 5s
          setTimeout(() => setToastNotif(prev => prev?.id === newest.id ? null : prev), 5000);
        }
      }
      lastCountRef.current = unread;
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [userEmail, playNotificationSound]);

  const closeSidebar = () => setMobileNavOpen(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar-desktop${mobileNavOpen ? ' sidebar-open' : ''}`}
        style={{
          width: 240, flexShrink: 0, background: colors.navBg,
          borderRight: `1px solid ${colors.border}`,
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Logo row + close button (mobile) */}
        <div style={{ padding: '1.2rem 1.4rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="15.5" stroke={colors.gold} strokeWidth="1.3" fill="none"/>
            <path d="M11,27 V15 C11,6.5 25,6.5 25,15 V27" stroke={colors.gold} strokeWidth="2" fill="none"/>
            <line x1="7.5" y1="27" x2="28.5" y2="27" stroke={colors.gold} strokeWidth="1"/>
          </svg>
          <span style={{ color: colors.gold, fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.04em', flex: 1 }}>Londway</span>
          {/* Close button — only visible on mobile */}
          <button
            onClick={closeSidebar}
            className="sidebar-close-btn"
            style={{ display: 'none', background: 'none', border: 'none', color: colors.textMuted, fontSize: '1.4rem', cursor: 'pointer', padding: '2px 6px', lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 0' }}>
          {NAV_ITEMS.map(item => {
            const active = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={closeSidebar}>
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
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)', maxHeight: 200, overflowY: 'auto', zIndex: 300,
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

          {/* Sign Out (bottom of sidebar — handy on mobile) */}
          <button onClick={onLogout} style={{
            background: 'transparent', border: `1px solid ${colors.border}`,
            color: colors.textMuted, borderRadius: 8, padding: '0.5rem 0.8rem',
            fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.danger; e.currentTarget.style.color = colors.danger; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay — tap to close ── */}
      {mobileNavOpen && (
        <div
          onClick={closeSidebar}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ── Main content area ── */}
      <div className="main-content" style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.7rem 2rem', background: colors.navBg,
          borderBottom: `1px solid ${colors.border}`,
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 2px 8px rgba(196,160,82,0.04)',
        }}>
          {/* Hamburger — shown on mobile */}
          <button
            onClick={() => setMobileNavOpen(prev => !prev)}
            className="mobile-nav-btn"
            aria-label="Open navigation"
            style={{ display: 'none', background: 'none', border: 'none', color: colors.text, fontSize: '1.6rem', cursor: 'pointer', padding: '4px 6px', lineHeight: 1 }}
          >
            ☰
          </button>

          <div style={{ fontSize: '0.85rem', color: colors.textMuted }}>
            Welcome, <span style={{ color: colors.gold, fontWeight: 700 }}>{userName}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification bell */}
            <Link href="/notifications" style={{ position: 'relative', textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px 6px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={unreadCount > 0 ? colors.gold : colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  background: '#ff4d4f', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 800,
                  borderRadius: '50%', minWidth: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1, padding: '0 3px',
                  boxShadow: '0 0 0 2px ' + colors.navBg,
                }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </Link>

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
          </div>
        </header>

        {/* Page content */}
        <main className="layout-content" style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Responsive CSS — class-based, no attribute selectors */}
      <style>{`
        /* Desktop: sidebar always visible */
        .sidebar-desktop {
          transform: translateX(0);
        }

        @media (max-width: 768px) {
          /* Sidebar hidden by default on mobile */
          .sidebar-desktop {
            transform: translateX(-100%);
            box-shadow: none;
          }
          /* Open state — toggled via className */
          .sidebar-desktop.sidebar-open {
            transform: translateX(0) !important;
            box-shadow: 4px 0 40px rgba(0,0,0,0.6);
          }
          /* Show hamburger, hide on desktop */
          .mobile-nav-btn {
            display: flex !important;
          }
          /* Show close ✕ button inside sidebar on mobile */
          .sidebar-close-btn {
            display: block !important;
          }
          /* Push content to edge */
          .main-content {
            margin-left: 0 !important;
          }
          .main-content header {
            padding: 0.7rem 1rem !important;
          }
        }
      `}</style>

      {/* ── Toast notification popup ── */}
      {toastNotif && (
        <div
          style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            background: colors.navBg, border: `1px solid ${colors.gold}`,
            borderRadius: 12, padding: '0.8rem 1.2rem', maxWidth: 340,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'toastSlideIn 0.35s ease-out',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}
        >
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
            {toastNotif.type === 'success' ? '✅' : toastNotif.type === 'error' ? '❌' : toastNotif.type === 'warning' ? '⚠️' : '🔔'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: colors.gold, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>New Notification</div>
            <div style={{ fontSize: '0.82rem', color: colors.text, lineHeight: 1.4 }}>{toastNotif.message}</div>
          </div>
          <button
            onClick={() => setToastNotif(null)}
            style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1rem', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

