'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LanguageContext';

interface Holding {
  id: string;
  investmentId: string | null;
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  pl: number;
  plPct: number;
  dayChangePct: number;
}

interface AllocationSlice { label: string; pct: number; color: string; }

interface PortfolioData {
  totalValue: number;
  totalPl: number;
  totalPlPct: number;
  changePercent: number;
  dayChange: number;
  dayChangePct: number;
  sentiment: string;
  currency: string;
  holdings: Holding[];
  allocation: AllocationSlice[];
}

const ALLOC_KEY: Record<string, string> = {
  'Equities': 'equities',
  'Fixed Income': 'fixedIncome',
  'Real Estate': 'realEstate',
  'Cash & Crypto': 'cash',
};

const DEMO_PORTFOLIO: PortfolioData = {
  totalValue: 18432.50,
  totalPl: 2841.20,
  totalPlPct: 18.2,
  changePercent: 3.6,
  dayChange: 221.19,
  dayChangePct: 1.2,
  sentiment: 'Bullish',
  currency: '$',
  holdings: [
    { id: 'h0', investmentId: null, ticker: 'AAPL', name: 'Apple Inc.',        shares: 10,    avgCost: 155.0,  currentPrice: 189.5,  value: 1895.00, pl: 345.00,  plPct: 22.3, dayChangePct: 1.2  },
    { id: 'h1', investmentId: null, ticker: 'MSFT', name: 'Microsoft Corp.',    shares: 5,     avgCost: 320.0,  currentPrice: 375.0,  value: 1875.00, pl: 275.00,  plPct: 17.2, dayChangePct: -0.4 },
    { id: 'h2', investmentId: null, ticker: 'VTI',  name: 'Vanguard Total Mkt', shares: 8,     avgCost: 195.0,  currentPrice: 225.0,  value: 1800.00, pl: 240.00,  plPct: 15.4, dayChangePct: 0.8  },
    { id: 'h3', investmentId: null, ticker: 'BTC',  name: 'Bitcoin',            shares: 0.012, avgCost: 38000,  currentPrice: 43200,  value: 518.40,  pl: 62.40,   plPct: 13.7, dayChangePct: 2.1  },
    { id: 'h4', investmentId: null, ticker: 'VNQ',  name: 'Vanguard REIT ETF',  shares: 15,    avgCost: 82.0,   currentPrice: 88.0,   value: 1320.00, pl: 90.00,   plPct: 7.3,  dayChangePct: -0.2 },
    { id: 'h5', investmentId: null, ticker: 'AGG',  name: 'iShares Bond ETF',   shares: 20,    avgCost: 98.0,   currentPrice: 96.5,   value: 1930.00, pl: -30.00,  plPct: -1.5, dayChangePct: 0.3  },
  ],
  allocation: [
    { label: 'Equities',      pct: 48, color: '#C4A052' },
    { label: 'Fixed Income',  pct: 28, color: '#3D9E7A' },
    { label: 'Real Estate',   pct: 14, color: '#9b8fbf' },
    { label: 'Cash & Crypto', pct: 10, color: '#A2B2BF' },
  ],
};

function MarketChart({ gold }: { gold: string }) {
  const bars = [42, 55, 48, 67, 59, 72, 64, 78, 70, 85, 76, 91, 82, 88, 95];
  const max = Math.max(...bars);
  return (
    <svg width="100%" height="64" viewBox="0 0 240 64" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="invest-barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gold} stopOpacity="0.55" />
          <stop offset="100%" stopColor={gold} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      {bars.map((h, i) => {
        const bh = (h / max) * 56;
        return <rect key={i} x={i * 17} y={64 - bh} width="11" height={bh} rx="2" fill="url(#invest-barGrad)" />;
      })}
      <polyline
        points={bars.map((h, i) => `${i * 17 + 5.5},${64 - (h / max) * 56}`).join(' ')}
        stroke={gold} strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AllocationDonut({ slices, surfaceBg, textColor, mutedColor }: {
  slices: AllocationSlice[];
  surfaceBg: string;
  textColor: string;
  mutedColor: string;
}) {
  const r = 52, cx = 68, cy = 68, sw = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={136} height={136} viewBox="0 0 136 136" fill="none">
      {slices.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={s.color} strokeWidth={sw}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={circ * 0.25 - (offset / 100) * circ}
            opacity="0.88"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
        );
        offset += s.pct;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r - sw / 2 - 4} fill={surfaceBg} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={textColor} fontSize="13" fontWeight="800" fontFamily="Inter">100%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={mutedColor} fontSize="8.5" fontFamily="Inter" letterSpacing="1.2">ALLOC</text>
    </svg>
  );
}

export default function Invest({ user }: { user: { token: string } }) {
  const { colors } = useTheme();
  const { t } = useLang();

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tradeModal, setTradeModal] = useState<{ holding: Holding; type: 'buy' | 'sell' } | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);

  useEffect(() => {
    setPortfolio(DEMO_PORTFOLIO);
    setLoading(false);
  }, []);

  const handleTrade = () => {
    if (!tradeModal || !tradeAmount) return;
    setTradeLoading(true);
    setTradeSuccess(true);
    setTimeout(() => {
      setTradeModal(null);
      setTradeAmount('');
      setTradeSuccess(false);
      setTradeLoading(false);
    }, 1400);
  };

  const openTrade = (holding: Holding, type: 'buy' | 'sell') => {
    setTradeModal({ holding, type });
    setTradeAmount('');
    setTradeSuccess(false);
  };

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${colors.border}`, padding: '3rem 2rem 2.5rem' }}>
        <svg style={{ position: 'absolute', right: '4%', bottom: 0, opacity: 0.045, pointerEvents: 'none' }}
          width="260" height="150" viewBox="0 0 260 150">
          {[
            [20, 60, 45, 80], [38, 50, 35, 95], [56, 70, 52, 85], [74, 30, 20, 55],
            [92, 55, 40, 90], [110, 45, 28, 75], [128, 65, 50, 105], [146, 35, 22, 60],
            [164, 75, 58, 115], [182, 50, 35, 85], [200, 80, 62, 120], [218, 55, 42, 95],
          ].map(([x, open, low, high], i) => {
            const close = i % 3 === 0 ? open - 10 : open + 15;
            const body_y = Math.min(open, close);
            const body_h = Math.abs(close - open) || 4;
            const c = close >= open ? '#3D9E7A' : '#ff4d4f';
            return (
              <g key={i}>
                <line x1={x + 7} y1={150 - high} x2={x + 7} y2={150 - low} stroke={c} strokeWidth="1.2" opacity="0.6" />
                <rect x={x} y={150 - body_y - body_h} width="14" height={body_h} rx="1" fill={c} opacity="0.5" />
              </g>
            );
          })}
          <line x1="0" y1="149" x2="260" y2="149" stroke={colors.gold} strokeWidth="0.5" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 110% at 5% 50%, ${colors.goldBg} 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: colors.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, boxShadow: `0 0 8px ${colors.gold}` }} />
            {t('investmentCenter').toUpperCase()}
          </div>
          <h1 style={{ color: colors.text, fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>{t('investments')}</h1>
          <p style={{ color: colors.textFaint, fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>Diversified portfolio management · AI-driven insights</p>
        </div>
      </div>

      <section style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: colors.gold, justifyContent: 'center', marginTop: 80, fontSize: '0.9rem' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 0.9s linear infinite' }}>
              <circle cx="10" cy="10" r="8" fill="none" stroke={`${colors.gold}25`} strokeWidth="2.5" />
              <path d="M10 2 A8 8 0 0 1 18 10" stroke={colors.gold} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
            {t('loadingPortfolio')}
          </div>
        ) : error ? (
          <div style={{ color: colors.danger, textAlign: 'center', marginTop: 40, background: `${colors.danger}10`, border: `1px solid ${colors.danger}28`, borderRadius: 12, padding: '1.6rem' }}>{error}</div>
        ) : portfolio ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>

            {/* Portfolio summary card */}
            <div style={{ background: colors.surface, borderRadius: 20, padding: '2rem', border: `1px solid ${colors.borderStrong}`, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${colors.goldBg} 0%, transparent 60%)`, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>{t('totalPortfolioValue')}</div>
                  <div style={{ color: colors.text, fontWeight: 800, fontSize: '2.4rem', letterSpacing: '-0.025em' }}>
                    {portfolio.currency}{portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ color: portfolio.totalPl >= 0 ? colors.success : colors.danger, fontWeight: 700, fontSize: '0.9rem' }}>
                      {portfolio.totalPl >= 0 ? '▲' : '▼'} {portfolio.currency}{Math.abs(portfolio.totalPl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{ color: portfolio.totalPl >= 0 ? colors.success : colors.danger, fontWeight: 600, fontSize: '0.82rem' }}>
                      ({portfolio.totalPl >= 0 ? '+' : ''}{portfolio.totalPlPct}%)
                    </span>
                    <span style={{ color: colors.textFaint, fontSize: '0.78rem' }}>total return</span>
                    <span style={{ background: portfolio.changePercent >= 0 ? `${colors.success}18` : `${colors.danger}18`, color: portfolio.changePercent >= 0 ? colors.success : colors.danger, fontSize: '0.65rem', fontWeight: 700, borderRadius: 6, padding: '2px 8px', border: `1px solid ${portfolio.changePercent >= 0 ? colors.success : colors.danger}28` }}>
                      {portfolio.sentiment}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Today</div>
                  <div style={{ color: portfolio.dayChangePct >= 0 ? colors.success : colors.danger, fontWeight: 700, fontSize: '1.1rem' }}>
                    {portfolio.dayChangePct >= 0 ? '+' : ''}{portfolio.currency}{portfolio.dayChange.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ color: portfolio.dayChangePct >= 0 ? colors.success : colors.danger, fontSize: '0.76rem', fontWeight: 600 }}>
                    {portfolio.dayChangePct >= 0 ? '+' : ''}{portfolio.dayChangePct}% {t('thisMonth')}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '1.2rem' }}>
                <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{t('performance30d')}</div>
                <MarketChart gold={colors.gold} />
              </div>
            </div>

            {/* Allocation + Holdings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(0, 2fr)', gap: '1.4rem' }}>
              {/* Allocation donut */}
              <div style={{ background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1.2rem' }}>{t('assetAllocation')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
                  <AllocationDonut slices={portfolio.allocation} surfaceBg={colors.bg} textColor={colors.text} mutedColor={colors.textFaint} />
                  <div style={{ width: '100%' }}>
                    {portfolio.allocation.map(s => (
                      <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: colors.textMuted, fontSize: '0.76rem' }}>
                            {(t as any)(ALLOC_KEY[s.label] ?? s.label) || s.label}
                          </span>
                        </div>
                        <span style={{ color: s.color, fontWeight: 700, fontSize: '0.76rem' }}>{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Holdings table */}
              <div style={{ background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
                <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1.2rem' }}>{t('holdings')}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 380 }}>
                  <thead>
                    <tr>
                      {['Asset', t('shares'), t('price'), t('value'), t('plPercent'), ''].map((h, i) => (
                        <th key={i} style={{ textAlign: i === 5 ? 'right' : 'left', color: colors.textFaint, fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '0.7rem', borderBottom: `1px solid ${colors.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((h, i) => (
                      <tr key={h.id} style={{ borderBottom: i < portfolio.holdings.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                        <td style={{ padding: '0.72rem 0.5rem 0.72rem 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: colors.gold, fontWeight: 800, flexShrink: 0 }}>
                              {h.ticker.slice(0, 3)}
                            </div>
                            <div>
                              <div style={{ color: colors.text, fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.2 }}>{h.ticker}</div>
                              <div style={{ color: colors.textFaint, fontSize: '0.66rem' }}>{h.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.72rem 0.5rem', color: colors.textMuted, fontSize: '0.8rem' }}>
                          {h.shares < 1 ? h.shares.toFixed(4) : h.shares}
                        </td>
                        <td style={{ padding: '0.72rem 0.5rem', color: colors.textMuted, fontSize: '0.8rem' }}>
                          ${h.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.72rem 0.5rem', color: colors.text, fontWeight: 600, fontSize: '0.82rem' }}>
                          ${h.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '0.72rem 0.5rem' }}>
                          <div>
                            <span style={{ color: h.plPct >= 0 ? colors.success : colors.danger, fontWeight: 700, fontSize: '0.8rem' }}>
                              {h.plPct >= 0 ? '+' : ''}{h.plPct}%
                            </span>
                            <div style={{ color: h.pl >= 0 ? colors.success : colors.danger, fontSize: '0.64rem', opacity: 0.8 }}>
                              {h.pl >= 0 ? '+' : ''}${Math.abs(h.pl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.72rem 0', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                            <button onClick={() => openTrade(h, 'buy')}
                              style={{ padding: '0.28rem 0.65rem', background: `${colors.success}18`, border: `1px solid ${colors.success}30`, borderRadius: 7, color: colors.success, fontWeight: 700, fontSize: '0.67rem', cursor: 'pointer' }}>
                              {t('buy')}
                            </button>
                            <button onClick={() => openTrade(h, 'sell')}
                              style={{ padding: '0.28rem 0.65rem', background: `${colors.danger}12`, border: `1px solid ${colors.danger}28`, borderRadius: 7, color: colors.danger, fontWeight: 700, fontSize: '0.67rem', cursor: 'pointer' }}>
                              {t('sell')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: colors.textFaint, marginTop: 60, padding: '2rem' }}>{t('noPortfolio')}</div>
        )}
      </section>

      {/* Trade Modal */}
      {tradeModal && (
        <div style={{ position: 'fixed', inset: 0, background: colors.overlayBg, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div style={{ background: colors.surface, borderRadius: 20, padding: '2rem', maxWidth: 400, width: '100%', border: `1px solid ${colors.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{t('tradeAsset')}</div>
                <h3 style={{ color: colors.text, fontWeight: 800, margin: '2px 0 0', fontSize: '1.1rem' }}>
                  {tradeModal.type === 'buy' ? t('buy') : t('sell')} {tradeModal.holding.ticker}
                </h3>
              </div>
              <button onClick={() => setTradeModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textFaint, fontSize: '1.3rem', lineHeight: 1 }}>✕</button>
            </div>

            {tradeSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '2.8rem', marginBottom: '0.9rem' }}>✅</div>
                <div style={{ color: colors.success, fontWeight: 700, fontSize: '1rem' }}>{t('orderPlaced')}</div>
              </div>
            ) : (
              <>
                <div style={{ background: colors.surface2, borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.2rem', fontSize: '0.8rem', color: colors.textMuted, lineHeight: 1.8 }}>
                  <div>Current price: <strong style={{ color: colors.gold }}>${tradeModal.holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                  <div>Holdings: <strong style={{ color: colors.text }}>{tradeModal.holding.shares < 1 ? tradeModal.holding.shares.toFixed(4) : tradeModal.holding.shares} shares</strong>
                    {' · '}Value: <strong style={{ color: colors.text }}>${tradeModal.holding.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                  <div>P&L: <strong style={{ color: tradeModal.holding.pl >= 0 ? colors.success : colors.danger }}>
                    {tradeModal.holding.pl >= 0 ? '+' : ''}${tradeModal.holding.pl.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({tradeModal.holding.plPct}%)
                  </strong></div>
                </div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: colors.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>
                  {t('amount')} (USD)
                </label>
                <input
                  type="number"
                  min="1"
                  value={tradeAmount}
                  onChange={e => setTradeAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '0.75rem 1rem', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, borderRadius: 10, color: colors.text, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: '1.2rem', fontFamily: 'Inter' }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setTradeModal(null)}
                    style={{ flex: 1, padding: '0.75rem', background: 'none', border: `1px solid ${colors.border}`, borderRadius: 12, color: colors.textMuted, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleTrade}
                    disabled={tradeLoading || !tradeAmount || parseFloat(tradeAmount) <= 0}
                    style={{ flex: 1, padding: '0.75rem', background: tradeModal.type === 'buy' ? colors.success : colors.danger, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', opacity: (tradeLoading || !tradeAmount || parseFloat(tradeAmount) <= 0) ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    {tradeLoading ? '...' : (tradeModal.type === 'buy' ? t('buy') : t('sell'))}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

