'use client';
import React from 'react';
import Head from 'next/head';
import { useTheme } from '../contexts/ThemeContext';

const SCORE = 82;

const CATEGORIES = [
  { label: 'Savings Rate',      score: 88, icon: '💰' },
  { label: 'Debt Management',   score: 92, icon: '📉' },
  { label: 'Investment Growth', score: 75, icon: '📈' },
  { label: 'Emergency Fund',    score: 70, icon: '🛡️' },
  { label: 'Spending Habits',   score: 85, icon: '🛒' },
];

const TIPS = [
  'Increase your vault contribution by 5% to hit your savings goal faster.',
  'Consider diversifying into index funds for long-term growth.',
  'Your emergency fund covers 4.2 months — aim for 6 months.',
];

function ScoreGauge({ score, size, colors }: { score: number; size: number; colors: any }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.37;
  const sw = size * 0.058;
  const START_DEG = 225, ARC_DEG = 270;
  const filled = Math.min(100, Math.max(0, score));
  const filledDeg = (filled / 100) * ARC_DEG;
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const ax1 = cx + r * Math.cos(toRad(START_DEG));
  const ay1 = cy + r * Math.sin(toRad(START_DEG));
  const ax2 = cx + r * Math.cos(toRad(START_DEG + ARC_DEG));
  const ay2 = cy + r * Math.sin(toRad(START_DEG + ARC_DEG));
  const px = cx + r * Math.cos(toRad(START_DEG + filledDeg));
  const py = cy + r * Math.sin(toRad(START_DEG + filledDeg));
  const scoreColor = score >= 80 ? '#2ecc40' : score >= 60 ? '#F0A500' : '#e74c3c';
  const trackPath = `M ${ax1} ${ay1} A ${r} ${r} 0 1 1 ${ax2} ${ay2}`;
  const progressPath = filledDeg > 0
    ? `M ${ax1} ${ay1} A ${r} ${r} 0 ${filledDeg > 180 ? 1 : 0} 1 ${px} ${py}`
    : '';
  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`} fill="none">
      <path d={trackPath} stroke={`${colors.gold}25`} strokeWidth={sw} strokeLinecap="round" fill="none"/>
      {progressPath && <path d={progressPath} stroke={scoreColor} strokeWidth={sw + 8} strokeLinecap="round" fill="none" opacity="0.08"/>}
      {progressPath && <path d={progressPath} stroke={scoreColor} strokeWidth={sw} strokeLinecap="round" fill="none"/>}
      {progressPath && <circle cx={px} cy={py} r={sw * 0.7} fill={scoreColor} opacity="0.95"/>}
    </svg>
  );
}

export default function HealthScore({ user }: { user?: { token: string; email?: string } }) {
  const { colors } = useTheme();
  const score = SCORE;
  const scoreColor = score >= 80 ? '#2ecc40' : score >= 60 ? '#F0A500' : '#e74c3c';
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      <Head>
        <title>Financial Health Score — Londway Capital</title>
        <meta name="description" content="Track your financial health score with Londway Capital. Analyze savings rate, debt management, investment growth, and emergency fund strength." />
      </Head>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.bg} 60%)`, borderBottom: `1px solid ${colors.border}`, padding: '2.8rem 2rem 2.2rem' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 90% at 0% 50%, ${colors.goldBg} 0%, transparent 70%)`, pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: colors.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, boxShadow: `0 0 8px ${colors.gold}` }}/>
            FINANCIAL WELLNESS REPORT
          </div>
          <h1 style={{ color: colors.text, fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>Financial Health Score</h1>
          <p style={{ color: colors.textFaint, fontSize: '0.88rem' }}>A comprehensive view of your financial wellbeing · Updated monthly</p>
        </div>
      </section>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Score card */}
        <div style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.borderStrong}`, padding: '2.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${scoreColor}80, transparent)` }}/>
          <ScoreGauge score={score} size={260} colors={colors} />
          <div style={{ textAlign: 'center', marginTop: -8 }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: scoreColor, letterSpacing: '-0.03em' }}>{score}</div>
            <div style={{ fontSize: '0.85rem', color: scoreColor, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>{scoreLabel}</div>
          </div>
          <div style={{ marginTop: '1.4rem', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Top 15% of users', 'Improved +3 pts this month'].map((tag, i) => (
              <span key={i} style={{ background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '4px 14px', fontSize: '0.72rem', color: colors.gold, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, padding: '1.8rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, marginBottom: '1.2rem' }}>Category Breakdown</h2>
          {CATEGORIES.map((cat, i) => {
            const catColor = cat.score >= 80 ? '#2ecc40' : cat.score >= 60 ? '#F0A500' : '#e74c3c';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.85rem 0', borderBottom: i < CATEGORIES.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${catColor}14`, border: `1px solid ${catColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{cat.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: colors.text }}>{cat.label}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: catColor }}>{cat.score}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: `${catColor}18` }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${cat.score}%`, background: catColor, boxShadow: `0 0 6px ${catColor}44`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Tips */}
        <div style={{ background: `linear-gradient(135deg, ${colors.surface}, ${colors.surface2})`, border: `1px solid ${colors.borderStrong}`, borderRadius: 20, padding: '1.8rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${colors.gold}55, transparent)` }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.2rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🤖</div>
            <div>
              <div style={{ color: colors.gold, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>AI Recommendations</div>
              <div style={{ color: colors.textFaint, fontSize: '0.62rem', marginTop: 1 }}>Personalised for your portfolio</div>
            </div>
          </div>
          {TIPS.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '0.7rem 0', borderBottom: i < TIPS.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
              <span style={{ color: colors.gold, fontWeight: 800, fontSize: '0.8rem', lineHeight: 1.7, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: '0.85rem', color: colors.textMuted, lineHeight: 1.7 }}>{tip}</span>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}

