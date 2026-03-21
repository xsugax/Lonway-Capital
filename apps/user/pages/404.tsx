import React from 'react';
import Head from 'next/head';
import { useTheme } from '../contexts/ThemeContext';

export default function Custom404() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const bg = dark ? '#060913' : '#f7f5ef';
  const card = dark ? '#0D1628' : '#fff';
  const text = dark ? '#fff' : '#0D1628';
  const sub = dark ? '#9ca3af' : '#6b7280';
  const gold = '#C4A052';

  return (
    <>
      <Head><title>404 — Londway Capital</title></Head>
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, background: card, borderRadius: 20, padding: '60px 40px', border: `1px solid ${dark ? 'rgba(196,160,82,0.15)' : 'rgba(0,0,0,0.08)'}`, boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.1)' }}>
          {/* Lock icon */}
          <div style={{ marginBottom: 24 }}>
            <svg width="64" height="64" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" stroke={gold} strokeWidth="1.3" fill={bg} />
              <path d="M11,27 V15 C11,6.5 25,6.5 25,15 V27" stroke={gold} strokeWidth="2" fill="none" />
              <line x1="7.5" y1="27" x2="28.5" y2="27" stroke={gold} strokeWidth="1" />
            </svg>
          </div>
          {/* 404 */}
          <div style={{ fontSize: 72, fontWeight: 900, color: gold, lineHeight: 1, marginBottom: 8 }}>404</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: text, margin: '0 0 12px' }}>Page Not Found</h1>
          <p style={{ fontSize: 14, color: sub, lineHeight: 1.7, margin: '0 0 32px' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Please check the URL or return to your dashboard.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              background: `linear-gradient(135deg, ${gold}, #a8873e)`,
              color: '#060913',
              fontSize: 14,
              fontWeight: 800,
              textDecoration: 'none',
              borderRadius: 10,
              padding: '14px 32px',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ← Back to Dashboard
          </a>
          <div style={{ marginTop: 24, fontSize: 11, color: sub }}>
            Londway Capital — Premium Private Banking
          </div>
        </div>
      </div>
    </>
  );
}
