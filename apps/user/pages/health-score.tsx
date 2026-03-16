import React from 'react';

const SCORE = 82;

function ScoreGauge({ score, size = 240 }: { score: number; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.37;
  const sw = size * 0.058;

  const START_DEG = 225;
  const ARC_DEG = 270;
  const filled = Math.min(100, Math.max(0, score));
  const filledDeg = (filled / 100) * ARC_DEG;

  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;

  const ax1 = cx + r * Math.cos(toRad(START_DEG));
  const ay1 = cy + r * Math.sin(toRad(START_DEG));
  const ax2 = cx + r * Math.cos(toRad(START_DEG + ARC_DEG));
  const ay2 = cy + r * Math.sin(toRad(START_DEG + ARC_DEG));

  const px = cx + r * Math.cos(toRad(START_DEG + filledDeg));
  const py = cy + r * Math.sin(toRad(START_DEG + filledDeg));

  const color = score >= 80 ? '#2ecc40' : score >= 60 ? '#FFD700' : score >= 40 ? '#FFD700' : '#e74c3c';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';

  const trackPath = `M ${ax1} ${ay1} A ${r} ${r} 0 1 1 ${ax2} ${ay2}`;
  const progressPath = filledDeg > 0
    ? `M ${ax1} ${ay1} A ${r} ${r} 0 ${filledDeg > 180 ? 1 : 0} 1 ${px} ${py}`
    : '';

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`} fill="none">
      <path d={trackPath} stroke={'#FFD7001A'} strokeWidth={sw} strokeLinecap="round" fill="none"/>
      {progressPath && <path d={progressPath} stroke={color} strokeWidth={sw + 8} strokeLinecap="round" fill="none" opacity="0.06"/>}
      {progressPath && <path d={progressPath} stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" opacity="0.88"/>}
      {progressPath && <circle cx={px} cy={py} r={sw * 0.65} fill={color} opacity="0.9"/>}
    </svg>
  );
}

const CATEGORIES = [
  { label: 'Savings Rate', score: 88, icon: '💰' },
  { label: 'Debt Management', score: 92, icon: '📉' },
  { label: 'Investment Growth', score: 75, icon: '📈' },
  { label: 'Emergency Fund', score: 70, icon: '🛡️' },
  { label: 'Spending Habits', score: 85, icon: '🛒' },
];

const TIPS = [
  'Increase your vault contribution by 5% to hit your savings goal faster.',
  'Consider diversifying into index funds for long-term growth.',
  'Your emergency fund covers 4.2 months — aim for 6 months.',
];

export default function HealthScore() {
  const score = SCORE;
  const color = score >= 80 ? '#2ecc40' : score >= 60 ? '#FFD700' : '#e74c3c';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';

  return (
    <main style={{ background: '#181818', minHeight: '100vh', color: '#F5F5F5', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ color: '#FFD700', fontWeight: 800, fontSize: '2rem', marginBottom: '0.3rem' }}>Financial Health Score</h1>
        <p style={{ color: '#aaa', fontSize: '0.88rem', marginBottom: '2rem' }}>A comprehensive view of your financial wellbeing</p>

        {/* Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <ScoreGauge score={score} size={260} />
          <div style={{ textAlign: 'center', marginTop: -10 }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color }}>{score}</div>
            <div style={{ fontSize: '0.82rem', color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFD700', marginBottom: '1rem', letterSpacing: '0.06em' }}>Category Breakdown</h2>
          {CATEGORIES.map((cat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.8rem 0', borderBottom: i < CATEGORIES.length - 1 ? '1px solid #ffffff10' : 'none' }}>
              <span style={{ fontSize: '1.2rem', width: 32, textAlign: 'center' }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{cat.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: cat.score >= 80 ? '#2ecc40' : cat.score >= 60 ? '#FFD700' : '#e74c3c' }}>{cat.score}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#ffffff10' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${cat.score}%`, background: cat.score >= 80 ? '#2ecc40' : cat.score >= 60 ? '#FFD700' : '#e74c3c', transition: 'width 0.5s' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div style={{ background: '#1e1e1e', border: '1px solid #FFD70022', borderRadius: 16, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFD700', marginBottom: '1rem' }}>💡 Recommendations</h2>
          {TIPS.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.6rem 0', borderBottom: i < TIPS.length - 1 ? '1px solid #ffffff08' : 'none' }}>
              <span style={{ color: '#FFD700', fontWeight: 700, fontSize: '0.8rem', marginTop: 2 }}>•</span>
              <span style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: 1.6 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

