'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LanguageContext';

interface Insight {
  id: string;
  title: string;
  message: string;
  category?: string;
}

function NeuralBg({ gold }: { gold: string }) {
  const nodes: [number, number][] = [
    [60, 50], [200, 30], [340, 70], [480, 40], [620, 60], [760, 35], [860, 65],
    [100, 130], [260, 150], [420, 120], [560, 155], [700, 125], [820, 150],
    [40, 190], [180, 175], [320, 195], [460, 180], [600, 195], [740, 175], [880, 190],
  ];
  const edges: [number, number][] = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],
    [7,8],[8,9],[9,10],[10,11],[11,12],
    [13,14],[14,15],[15,16],[16,17],[17,18],[18,19],
    [0,7],[1,8],[2,9],[3,10],[4,11],[5,12],
    [7,13],[8,14],[9,15],[10,16],[11,17],[12,18],
    [1,7],[3,9],[5,11],[8,15],[10,17],
  ];
  return (
    <svg viewBox="0 0 900 220" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', opacity: 0.055, pointerEvents: 'none' }}>
      {edges.map(([a, b], i) => {
        const [x1, y1] = nodes[a], [x2, y2] = nodes[b];
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={gold} strokeWidth="0.8"/>;
      })}
      {nodes.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 5 === 0 ? 3.5 : 2} fill={gold} fillOpacity="0.8"/>
      ))}
    </svg>
  );
}

function ScoreRing({ score, gold, bg, text }: { score: number; gold: string; bg: string; text: string }) {
  const r = 52, cx = 68, cy = 68, sw = 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const labelColor = score >= 85 ? '#3D9E7A' : score >= 70 ? gold : score >= 55 ? '#F0A500' : '#ff4d4f';
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs Work';
  return (
    <svg width={136} height={136} viewBox="0 0 136 136" fill="none">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${gold}18`} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={labelColor} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
      />
      <circle cx={cx} cy={cy} r={r - sw / 2 - 4} fill={bg} />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={text} fontSize="22" fontWeight="800" fontFamily="Inter">{score}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={labelColor} fontSize="8" fontFamily="Inter" fontWeight="700" letterSpacing="0.8">{label.toUpperCase()}</text>
    </svg>
  );
}

function SpendingBar({ label, pct, color, amount, textMuted }: { label: string; pct: number; color: string; amount: string; textMuted: string }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: textMuted }}>{label}</span>
        <span style={{ fontSize: '0.76rem', color, fontWeight: 700 }}>{amount}</span>
      </div>
      <div style={{ height: 6, background: `${color}18`, borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, boxShadow: `0 0 8px ${color}44` }} />
      </div>
    </div>
  );
}

function SavingsTrend({ gold }: { gold: string }) {
  const pts = [14, 18, 16, 22, 20, 24, 22, 28, 26, 30, 28, 32];
  const max = 35; const h = 56; const w = 220;
  const step = w / (pts.length - 1);
  const points = pts.map((v, i) => `${i * step},${h - (v / max) * h}`).join(' ');
  const area = `0,${h} ${points} ${(pts.length - 1) * step},${h}`;
  return (
    <svg width="100%" height={h + 8} viewBox={`0 0 ${w} ${h + 8}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sav-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gold} stopOpacity="0.35" />
          <stop offset="100%" stopColor={gold} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sav-grad)" />
      <polyline points={points} stroke={gold} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CATEGORY_MAP: Record<string, { icon: string; color: string }> = {
  spending:  { icon: '💳', color: '#F0A500' },
  savings:   { icon: '🏦', color: '#3D9E7A' },
  invest:    { icon: '📈', color: '#9b8fbf' },
  vault:     { icon: '🔐', color: '#C4A052' },
  tax:       { icon: '📋', color: '#5ba3d9' },
  credit:    { icon: '💎', color: '#E8857A' },
  default:   { icon: '💡', color: '#C4A052' },
};

function getCategory(title: string): keyof typeof CATEGORY_MAP {
  const tl = title.toLowerCase();
  if (tl.includes('spend') || tl.includes('budget') || tl.includes('dining') || tl.includes('subscript')) return 'spending';
  if (tl.includes('sav') || tl.includes('goal') || tl.includes('rate')) return 'savings';
  if (tl.includes('invest') || tl.includes('market') || tl.includes('portfolio') || tl.includes('rebalanc')) return 'invest';
  if (tl.includes('vault') || tl.includes('interest') || tl.includes('apy')) return 'vault';
  if (tl.includes('tax') || tl.includes('deduct')) return 'tax';
  if (tl.includes('credit') || tl.includes('score') || tl.includes('utiliz')) return 'credit';
  return 'default';
}

const SPENDING_CATEGORIES = [
  { label: 'Housing',       pct: 38, amount: '$2,850', color: '#C4A052' },
  { label: 'Dining & Food', pct: 22, amount: '$1,650', color: '#F0A500' },
  { label: 'Transport',     pct: 14, amount: '$1,050', color: '#5ba3d9' },
  { label: 'Subscriptions', pct: 10, amount: '$748',   color: '#9b8fbf' },
  { label: 'Shopping',      pct: 9,  amount: '$675',   color: '#3D9E7A' },
];

const DEMO_INSIGHTS: Insight[] = [
  { id: '1',  title: 'Spending Trend Alert',         message: 'Your dining expenses increased 18% this month. Consider setting a $400 monthly cap to stay on track with your savings goal.' },
  { id: '2',  title: 'Vault Interest Milestone',     message: 'Your Emergency Fund vault crossed $5,000. At 4.8% APY you\'re earning $19.20 per month in passive interest — compounding daily.' },
  { id: '3',  title: 'Portfolio Rebalancing Needed', message: 'Your equity allocation drifted to 54% (target: 48%). Moving $820 from equities into fixed income could reduce risk and improve Sharpe ratio.' },
  { id: '4',  title: 'Savings Rate Improvement',     message: 'You saved 22% of income this month — your best rate in 6 months. At this pace you\'ll hit your house deposit goal 3 months ahead of schedule.' },
  { id: '5',  title: 'Subscription Audit',           message: '14 recurring charges detected this month totalling $248. You haven\'t used 3 of these services in 90+ days. Cancelling them saves ~$67/month.' },
  { id: '6',  title: 'Tax-Loss Harvesting',          message: 'AGG (iShares Bond ETF) is showing a $30 unrealised loss. Selling before year-end could offset capital gains and save an estimated $210 in taxes.' },
  { id: '7',  title: 'Credit Utilisation Warning',   message: 'Your credit utilisation reached 34% this cycle. Paying down $1,200 before statement date will bring it below 28%, potentially boosting your score 18–22 points.' },
  { id: '8',  title: 'Emergency Fund Progress',      message: 'Your Emergency Fund now covers 4.8 months of expenses. Financial best practice recommends 6 months — you\'re $3,600 away from optimal security.' },
  { id: '9',  title: 'Market Volatility Hedge',      message: 'Bitcoin in your portfolio has increased to 12.4% of total holdings. Consider trimming to 8–10% to keep crypto exposure within your stated risk profile.' },
  { id: '10', title: 'Dividend Reinvestment Alert',  message: 'VTI paid a $42.30 dividend this quarter. Auto-reinvesting dividends in this position increases your compound annual growth rate by an estimated 0.6%.' },
];

const FILTER_TABS = ['all', 'spending', 'savings', 'invest', 'vault', 'tax', 'credit'] as const;

export default function Insights({ user }: { user: { token: string } }) {
  const { colors, theme } = useTheme();
  const { t } = useLang();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    setInsights(DEMO_INSIGHTS);
    setLoading(false);
  }, []);

  const displayed = activeFilter === 'all'
    ? insights
    : insights.filter(ins => getCategory(ins.title) === activeFilter);

  const healthScore = 78;
  const avgSavingsRate = 22;

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.bg} 65%)`, borderBottom: `1px solid ${colors.border}`, padding: '2.5rem 2rem 2rem' }}>
        <NeuralBg gold={colors.gold} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: colors.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, boxShadow: `0 0 8px ${colors.gold}` }}/>
              AI POWERED · UPDATED DAILY
            </div>
            <h1 style={{ color: colors.text, fontWeight: 800, fontSize: '2.2rem', margin: '0 0 0.3rem', letterSpacing: '-0.025em' }}>{t('insights')}</h1>
            <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.88rem', lineHeight: 1.6 }}>Personalised financial analysis · Londway AI</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Health Score',    value: `${healthScore}/100`, color: '#3D9E7A' },
              { label: 'Savings Rate',    value: `${avgSavingsRate}%`, color: colors.gold },
              { label: 'Active Insights', value: `${insights.length}`, color: colors.gold },
            ].map(s => (
              <div key={s.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '0.65rem 1rem', textAlign: 'center', minWidth: 90 }}>
                <div style={{ color: s.color, fontWeight: 800, fontSize: '1.1rem' }}>{s.value}</div>
                <div style={{ color: colors.textFaint, fontSize: '0.58rem', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: colors.gold, justifyContent: 'center', marginTop: 80, fontSize: '0.9rem' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 0.9s linear infinite' }}>
              <circle cx="10" cy="10" r="8" fill="none" stroke={`${colors.gold}25`} strokeWidth="2.5"/>
              <path d="M10 2 A8 8 0 0 1 18 10" stroke={colors.gold} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
            Analysing your finances…
          </div>
        ) : (
          <>
            {/* Widget row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem', marginBottom: '1.8rem' }}>

              {/* Financial Health Score */}
              <div style={{ background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <ScoreRing score={healthScore} gold={colors.gold} bg={colors.bg} text={colors.text} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Financial Health</div>
                  <div style={{ color: colors.text, fontWeight: 700, fontSize: '0.95rem', marginBottom: 10 }}>Your score is <span style={{ color: '#3D9E7A', fontWeight: 800 }}>Good</span></div>
                  {[
                    { label: 'Savings',     pct: 88, color: '#3D9E7A' },
                    { label: 'Spending',    pct: 72, color: '#F0A500' },
                    { label: 'Investments', pct: 65, color: colors.gold },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <div style={{ fontSize: '0.64rem', color: colors.textFaint, width: 72 }}>{m.label}</div>
                      <div style={{ flex: 1, height: 4, background: `${m.color}18`, borderRadius: 2 }}>
                        <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: '0.64rem', color: m.color, fontWeight: 700, width: 28, textAlign: 'right' }}>{m.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spending Breakdown */}
              <div style={{ background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.2rem' }}>Monthly Spending</div>
                {SPENDING_CATEGORIES.map(c => (
                  <SpendingBar key={c.label} label={c.label} pct={c.pct} color={c.color} amount={c.amount} textMuted={colors.textMuted} />
                ))}
              </div>

              {/* Savings Rate Trend */}
              <div style={{ background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Savings Rate</div>
                    <div style={{ color: colors.gold, fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.025em' }}>{avgSavingsRate}%</div>
                  </div>
                  <span style={{ background: 'rgba(61,158,122,0.12)', color: '#3D9E7A', fontSize: '0.65rem', fontWeight: 700, borderRadius: 8, padding: '3px 9px', border: '1px solid rgba(61,158,122,0.2)', marginTop: 4 }}>
                    ▲ 4% vs last mo
                  </span>
                </div>
                <SavingsTrend gold={colors.gold} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: '0.58rem', color: colors.textFaint }}>12 months ago</span>
                  <span style={{ fontSize: '0.58rem', color: colors.textFaint }}>Now</span>
                </div>
                <div style={{ marginTop: '1rem', padding: '0.7rem 0.9rem', background: `${colors.gold}08`, borderRadius: 10, border: `1px solid ${colors.gold}18` }}>
                  <div style={{ fontSize: '0.72rem', color: colors.textMuted, lineHeight: 1.5 }}>
                    At this rate you'll save <strong style={{ color: colors.gold }}>$28,440</strong> over the next 12 months.
                  </div>
                </div>
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: '1.4rem', scrollbarWidth: 'none' }}>
              {FILTER_TABS.map(tab => {
                const active = activeFilter === tab;
                const catIcon = tab !== 'all' ? CATEGORY_MAP[tab].icon : '🔍';
                return (
                  <button key={tab} onClick={() => setActiveFilter(tab)}
                    style={{
                      padding: '0.42rem 1rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700,
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s', flexShrink: 0, fontFamily: 'Inter',
                      background: active ? colors.gold : colors.surface,
                      border: `1px solid ${active ? colors.gold : colors.border}`,
                      color: active ? (theme === 'dark' ? '#060913' : '#fff') : colors.textMuted,
                    }}>
                    {catIcon} {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Insights grid */}
            {displayed.length === 0 ? (
              <div style={{ textAlign: 'center', color: colors.textFaint, padding: '3rem', background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}` }}>
                No insights in this category yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.1rem' }}>
                {displayed.map((insight, i) => {
                  const cat = getCategory(insight.title);
                  const { icon, color } = CATEGORY_MAP[cat];
                  const readTime = Math.max(1, Math.ceil(insight.message.split(' ').length / 200));
                  return (
                    <div key={insight.id || i}
                      style={{ background: colors.surface, borderRadius: 16, border: `1px solid ${colors.border}`, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${color}1a`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}>
                      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }}/>
                      <div style={{ padding: '1.3rem 1.3rem 1.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: colors.text, lineHeight: 1.3 }}>{insight.title}</div>
                            <div style={{ fontSize: '0.65rem', color, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{cat === 'default' ? 'General' : cat}</div>
                          </div>
                        </div>
                        <p style={{ margin: '0 0 14px', color: colors.textMuted, fontSize: '0.82rem', lineHeight: 1.65 }}>{insight.message}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.67rem', color: colors.textFaint }}>{readTime} min read</span>
                          <button
                            style={{ fontSize: '0.67rem', color, fontWeight: 700, background: `${color}12`, border: `1px solid ${color}28`, padding: '3px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter' }}
                            onClick={() => { /* detail panel */ }}>
                            Apply →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
