"use client";
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang, LANG_NAMES, LangCode } from '../contexts/LanguageContext';

export default function Layout(props) {
  const { theme, colors, toggle } = useTheme();
  const { lang, setLang, t } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <div style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: 'Inter, sans-serif' }}>
        {/* Top bar: Logo left, User + Sign Out right */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.8rem 2rem',
          background: colors.navBg, borderBottom: `1px solid ${colors.border}`,
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 2px 8px rgba(196,160,82,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ color: colors.gold, fontWeight: 800, fontSize: '1.2rem', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="15.5" stroke={colors.gold} strokeWidth="1.3" fill="none"/>
                </svg>
                Londway
              </span>
            </div>
          </div>
          {/* ...rest of layout... */}
        </div>
      </div>
    </>
  );
}

