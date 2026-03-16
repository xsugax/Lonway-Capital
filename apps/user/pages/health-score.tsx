import React from 'react';

const SCORE = 82;

function ScoreGauge({ score, size = 240 }: { score: number; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.37;
  const sw = size * 0.058; // stroke width

  // 270° arc: start at 225°, end at 135° (going clockwise)
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

  const color = score >= 80 ? '#3D9E7A' : score >= 60 ? '#C4A052' : score >= 40 ? '#F0A500' : '#ff4d4f';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';

  const trackPath = `M ${ax1} ${ay1} A ${r} ${r} 0 1 1 ${ax2} ${ay2}`;
  const progressPath = filledDeg > 0
    ? `M ${ax1} ${ay1} A ${r} ${r} 0 ${filledDeg > 180 ? 1 : 0} 1 ${px} ${py}`
    : '';

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`} fill="none">
      {/* Track */}
      <path d={trackPath} stroke="rgba(196,160,82,0.1)" strokeWidth={sw} strokeLinecap="round" fill="none"/>
      {/* Glow */}
      {progressPath && <path d={progressPath} stroke={color} strokeWidth={sw + 8} strokeLinecap="round" fill="none" opacity="0.06"/>}
      {/* Progress */}
      {progressPath && <path d={progressPath} stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" opacity="0.88"/>}
      {/* Endpoint dot */}
      {progressPath && <circle cx={px} cy={py} r={sw * 0.65} fill={color} opacity="0.9"/>}
      {/* Score number */}
      <text x={cx} y={cy * 0.92} textAnchor="middle" fill="#EAE0D0"
        fontSize={size * 0.155} fontWeight="800" fontFamily="Inter, sans-serif">{score}</text>
      {/* SCORE label */}
      <text x={cx} y={cy * 1.08} textAnchor="middle" fill="#60707E"
        fontSize={size * 0.056} fontFamily="Inter, sans-serif" letterSpacing="3"
        style={{ textTransform: 'uppercase' }}>SCORE</text>
      {/* Status label */}
      <text x={cx} y={cy * 1.24} textAnchor="middle" fill={color}
        fontSize={size * 0.066} fontWeight="700" fontFamily="Inter, sans-serif">{label}</text>
    </svg>
  );
}

const BREAKDOWN_ITEMS = [
  { label: 'Savings Rate', score: 88, color: '#3D9E7A' },
  { label: 'Spending Control', score: 74, color: '#C4A052' },
  { label: 'Investment Mix', score: 81, color: '#3D9E7A' },
  { label: 'Debt Level', score: 91, color: '#3D9E7A' },
  { label: 'Emergency Fund', score: 65, color: '#C4A052' },
];

export default function HealthScore() {
  return (
    <main style={{ background: '#060913', minHeight: '100vh', color: '#EAE0D0', fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #0a1020 0%, #060913 100%)', borderBottom: '1px solid rgba(196,160,82,0.07)', padding: '3rem 2rem 2.5rem' }}>
        {/* Background neural pattern */}
        <svg style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)', opacity: 0.04, pointerEvents: 'none' }} width="220" height="220" viewBox="0 0 220 220">
          {[30,60,90,120,150,185].map(r => <circle key={r} cx="110" cy="110" r={r} fill="none" stroke="#C4A052" strokeWidth="0.8"/>)}
          {[0,45,90,135,180,225,270,315].map(a => {
            const rad = a * Math.PI / 180;
            return <line key={a} x1="110" y1="110" x2={110 + 185 * Math.cos(rad)} y2={110 + 185 * Math.sin(rad)} stroke="#C4A052" strokeWidth="0.5"/>;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 110% at 5% 50%, rgba(196,160,82,0.04) 0%, transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(196,160,82,0.07)', border: '1px solid rgba(196,160,82,0.15)', borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: '#C4A052', fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C4A052', boxShadow: '0 0 8px #C4A052' }}/>
            FINANCIAL HEALTH
          </div>
          <h1 style={{ color: '#EAE0D0', fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>Health Score</h1>
          <p style={{ color: '#60707E', fontSize: '0.88rem', lineHeight: 1.6 }}>AI-powered analysis of your financial wellbeing</p>
        </div>
      </div>

      <section style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '2rem', alignItems: 'start' }}>
          {/* Gauge card */}
          <div style={{ background: '#0D1628', borderRadius: 20, padding: '2.2rem', border: '1px solid rgba(196,160,82,0.12)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-30%', left: '-20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,82,0.04) 0%, transparent 60%)', pointerEvents: 'none' }}/>
            <div style={{ fontSize: '0.65rem', color: '#60707E', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1.2rem' }}>Overall Score</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ScoreGauge score={SCORE} size={220} />
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#60707E', lineHeight: 1.6 }}>
              You're in the top <span style={{ color: '#C4A052', fontWeight: 700 }}>18%</span> of Aurix users
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(196,160,82,0.08)', border: '1px solid rgba(196,160,82,0.15)', borderRadius: 8, padding: '0.5rem 0.9rem', fontSize: '0.72rem', color: '#C4A052', fontWeight: 600 }}>Gold Tier</div>
              <div style={{ background: 'rgba(61,158,122,0.08)', border: '1px solid rgba(61,158,122,0.2)', borderRadius: 8, padding: '0.5rem 0.9rem', fontSize: '0.72rem', color: '#3D9E7A', fontWeight: 600 }}>↑ Titan (96)</div>
            </div>
          </div>

          {/* Breakdown card */}
          <div style={{ background: '#0D1628', borderRadius: 20, padding: '2.2rem', border: '1px solid rgba(196,160,82,0.12)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '0.65rem', color: '#60707E', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1.5rem' }}>Score Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {BREAKDOWN_ITEMS.map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#A2B2BF', fontSize: '0.84rem' }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: '0.84rem' }}>{item.score}</span>
                  </div>
                  <div style={{ background: 'rgba(196,160,82,0.06)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.score}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`, borderRadius: 100, boxShadow: `0 0 8px ${item.color}44`, transition: 'width 0.8s ease' }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.8rem', padding: '1rem 1.2rem', background: 'rgba(196,160,82,0.06)', borderRadius: 12, border: '1px solid rgba(196,160,82,0.1)' }}>
              <div style={{ fontSize: '0.7rem', color: '#C4A052', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>RECOMMENDATION</div>
              <div style={{ fontSize: '0.8rem', color: '#A2B2BF', lineHeight: 1.6 }}>
                Boost your Emergency Fund to reach Titan status. Adding $200/month to your vault will get you there in 4 months.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

