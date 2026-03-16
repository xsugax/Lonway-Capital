'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang, LANG_NAMES, LangCode } from '../contexts/LanguageContext';

const NAV_KEYS = [
  { href: '/', key: 'dashboard' },
  { href: '/accounts', key: 'accounts' },
  { href: '/cards', key: 'cards' },
  { href: '/transfer', key: 'transfer' },
  { href: '/checkbook', key: 'checkbooks' },
  { href: '/vaults', key: 'vaults' },
  { href: '/invest', key: 'invest' },
  { href: '/insights', key: 'insights' },
  { href: '/health-score', key: 'healthScore' },
  { href: '/profile', key: 'profile' },
  { href: '/notifications', key: 'notifications' },
  { href: '/twofa', key: 'twofa' },
];

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
  userName?: string;
}

export default function Layout({ children, onLogout, userName }: LayoutProps) {
  const router = useRouter();
  const { theme, colors, toggle } = useTheme();
  const { lang, setLang, t } = useLang();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: 'Inter, sans-serif' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '1rem 2rem',
        background: colors.navBg, boxShadow: '0 2px 8px rgba(196,160,82,0.07)',
        borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap',
      }}>
        <span style={{ color: colors.gold, fontWeight: 800, fontSize: '1.2rem', marginRight: 8, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}><svg width="28" height="28" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="15.5" stroke={colors.gold} strokeWidth="1.3" fill="none"/><path d="M11,27 V15 C11,6.5 25,6.5 25,15 V27" stroke={colors.gold} strokeWidth="2" fill={`${colors.gold}08`} strokeLinejoin="round"/><line x1="7.5" y1="27" x2="28.5" y2="27" stroke={colors.gold} strokeWidth="1" strokeLinecap="round"/></svg>LONDWAY</span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
          {NAV_KEYS.map(({ href, key }) => (
            <Link key={href} href={href} legacyBehavior>
              <a style={{
                color: router.pathname === href ? colors.gold : colors.textFaint,
                fontWeight: router.pathname === href ? 700 : 500,
                textDecoration: 'none', fontSize: '0.9rem',
                padding: '0.35rem 0.8rem', borderRadius: 8,
                background: router.pathname === href ? colors.goldBg : 'transparent',
                transition: 'all 0.18s',
                border: router.pathname === href ? `1px solid ${colors.borderStrong}` : '1px solid transparent',
              }}>{t(key)}</a>
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Language selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen(o => !o)}
              title="Select Language"
              style={{
                background: colors.goldBg, border: `1px solid ${colors.border}`,
                borderRadius: 8, padding: '0.38rem 0.7rem', cursor: 'pointer',
                color: colors.gold, fontWeight: 600, fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              🌐 {lang.toUpperCase()}
            </button>
            {langOpen && (
              <div
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: 12, overflow: 'hidden', zIndex: 200, minWidth: 148,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                }}
                onMouseLeave={() => setLangOpen(false)}
              >
                {(Object.entries(LANG_NAMES) as [LangCode, string][]).map(([code, name]) => (
                  <button
                    key={code}
                    onClick={() => { setLang(code); setLangOpen(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '0.55rem 1rem',
                      background: lang === code ? colors.goldBg : 'transparent',
                      color: lang === code ? colors.gold : colors.text,
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontSize: '0.84rem', fontWeight: lang === code ? 700 : 400,
                    }}
                  >{name}</button>
                ))}
              </div>
            )}
          </div>

          {/* Dark/light toggle */}
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              background: colors.goldBg, border: `1px solid ${colors.border}`,
              borderRadius: 8, padding: '0.38rem 0.6rem', cursor: 'pointer',
              fontSize: '1rem', lineHeight: 1,
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {userName && (
            <span style={{ color: colors.gold, fontWeight: 600, fontSize: '0.9rem' }}>👤 {userName}</span>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(255,77,79,0.08)', color: colors.danger,
                border: `1px solid rgba(255,77,79,0.22)`, borderRadius: 8,
                padding: '0.38rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
              }}
            >{t('signOut')}</button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>{children}</div>
    </div>
  );
}

