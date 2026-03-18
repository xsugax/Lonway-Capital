'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LanguageContext';
import { getTierLimits, getDailyUsage, addDailyUsage } from '../lib/store';

const ACCOUNTS_KEY = 'londway_accounts';
const ADMIN_KEY    = 'londway_admin_data';
const PORTFOLIO_KEY = 'londway_portfolio';

// ─── Tradeable assets ────────────────────────────────────────
const MARKET_ASSETS = [
  { ticker: 'BTC',  name: 'Bitcoin',             type: 'crypto' as const, coingeckoId: 'bitcoin',  allocLabel: 'Cash & Crypto' },
  { ticker: 'ETH',  name: 'Ethereum',             type: 'crypto' as const, coingeckoId: 'ethereum', allocLabel: 'Cash & Crypto' },
  { ticker: 'AAPL', name: 'Apple Inc.',           type: 'stock'  as const, allocLabel: 'Equities'      },
  { ticker: 'MSFT', name: 'Microsoft Corp.',      type: 'stock'  as const, allocLabel: 'Equities'      },
  { ticker: 'AMZN', name: 'Amazon.com Inc.',      type: 'stock'  as const, allocLabel: 'Equities'      },
  { ticker: 'NVDA', name: 'NVIDIA Corp.',         type: 'stock'  as const, allocLabel: 'Equities'      },
  { ticker: 'GOOGL',name: 'Alphabet Inc.',        type: 'stock'  as const, allocLabel: 'Equities'      },
  { ticker: 'VTI',  name: 'Vanguard Total Mkt',   type: 'etf'    as const, allocLabel: 'Equities'      },
  { ticker: 'SPY',  name: 'S&P 500 ETF',          type: 'etf'    as const, allocLabel: 'Equities'      },
  { ticker: 'VNQ',  name: 'Vanguard REIT ETF',    type: 'etf'    as const, allocLabel: 'Real Estate'   },
  { ticker: 'AGG',  name: 'iShares Bond ETF',     type: 'etf'    as const, allocLabel: 'Fixed Income'  },
  { ticker: 'GLD',  name: 'SPDR Gold ETF',        type: 'etf'    as const, allocLabel: 'Cash & Crypto' },
];

const ALLOC_COLORS: Record<string, string> = {
  'Equities':      '#C4A052',
  'Fixed Income':  '#3D9E7A',
  'Real Estate':   '#9b8fbf',
  'Cash & Crypto': '#A2B2BF',
};

const ALLOC_KEY: Record<string, string> = {
  'Equities':      'equities',
  'Fixed Income':  'fixedIncome',
  'Real Estate':   'realEstate',
  'Cash & Crypto': 'cash',
};

// ─── Interfaces ──────────────────────────────────────────────
interface RawHolding {
  ticker: string;
  shares: number;
  avgCost: number;
  allocLabel: string;
}

interface Holding {
  id: string;
  ticker: string;
  name: string;
  type: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  pl: number;
  plPct: number;
  allocLabel: string;
}

interface AllocationSlice { label: string; pct: number; color: string; }

interface PortfolioData {
  totalValue: number;
  totalPl: number;
  totalPlPct: number;
  dayChange: number;
  dayChangePct: number;
  sentiment: string;
  currency: string;
  holdings: Holding[];
  allocation: AllocationSlice[];
}

// ─── Portfolio computation ────────────────────────────────────
function computePortfolio(raw: RawHolding[], prices: Record<string, number>): PortfolioData {
  const holdings: Holding[] = raw
    .filter(h => h.shares > 0.000001)
    .map(h => {
      const asset = MARKET_ASSETS.find(a => a.ticker === h.ticker);
      const currentPrice = prices[h.ticker] ?? h.avgCost;
      const value = +(currentPrice * h.shares).toFixed(2);
      const pl = +((currentPrice - h.avgCost) * h.shares).toFixed(2);
      const plPct = h.avgCost > 0 ? +((currentPrice - h.avgCost) / h.avgCost * 100).toFixed(2) : 0;
      return {
        id: `h-${h.ticker.toLowerCase()}`,
        ticker: h.ticker, name: asset?.name ?? h.ticker,
        type: asset?.type ?? 'stock',
        shares: h.shares, avgCost: h.avgCost,
        currentPrice, value, pl, plPct,
        allocLabel: h.allocLabel,
      };
    });

  const totalValue = +holdings.reduce((s, h) => s + h.value, 0).toFixed(2);
  const totalCost  = +raw.filter(h => h.shares > 0).reduce((s, h) => s + h.avgCost * h.shares, 0).toFixed(2);
  const totalPl    = +(totalValue - totalCost).toFixed(2);
  const totalPlPct = totalCost > 0 ? +(totalPl / totalCost * 100).toFixed(2) : 0;

  const allocMap: Record<string, number> = {};
  for (const h of holdings) allocMap[h.allocLabel] = (allocMap[h.allocLabel] ?? 0) + h.value;
  const allocation: AllocationSlice[] = Object.entries(allocMap)
    .filter(([, v]) => v > 0)
    .map(([label, v]) => ({
      label, color: ALLOC_COLORS[label] ?? '#888',
      pct: totalValue > 0 ? +((v / totalValue) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  return {
    totalValue, totalPl, totalPlPct,
    dayChange: 0, dayChangePct: 0,
    sentiment: totalPl > 0 ? 'Bullish' : totalPl < 0 ? 'Bearish' : 'Neutral',
    currency: '$', holdings, allocation,
  };
}

// ─── Admin balance helpers ─────────────────────────────────────
function getAdminBalance(email: string): number {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const u = (data.users ?? []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    return u?.balance ?? 0;
  } catch { return 0; }
}

function setAdminBalance(email: string, newBal: number): void {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const updated = {
      ...data,
      users: (data.users ?? []).map((u: any) =>
        u.email?.toLowerCase() === email.toLowerCase() ? { ...u, balance: newBal } : u
      ),
    };
    localStorage.setItem(ADMIN_KEY, JSON.stringify(updated));
  } catch {}
}

// ─── Per-user portfolio storage ────────────────────────────────
function portfolioKey(email: string) {
  return `${PORTFOLIO_KEY}__${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}
function loadRawHoldings(email: string): RawHolding[] {
  try {
    const raw = localStorage.getItem(portfolioKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveRawHoldings(email: string, h: RawHolding[]) {
  try { localStorage.setItem(portfolioKey(email), JSON.stringify(h)); } catch {}
}

// ─── Market chart (uses live prices as bars) ─────────────────
function MarketChart({ gold, prices }: { gold: string; prices: Record<string, number> }) {
  const stocks = ['AAPL', 'MSFT', 'VTI', 'VNQ', 'AGG', 'SPY', 'AMZN', 'NVDA', 'GOOGL', 'GLD'];
  const vals = stocks.map(s => prices[s] ?? 0).filter(v => v > 0);
  const bars = vals.length >= 4 ? vals : [42, 55, 48, 67, 59, 72, 64, 78, 70, 85, 76, 91, 82, 88, 95];
  const max = Math.max(...bars, 1);
  const bw = Math.floor(240 / bars.length);
  return (
    <svg width="100%" height="64" viewBox="0 0 240 64" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id="invest-barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gold} stopOpacity="0.55" />
          <stop offset="100%" stopColor={gold} stopOpacity="0.06" />
        </linearGradient>
      </defs>
      {bars.map((h, i) => {
        const bh = Math.max(2, (h / max) * 56);
        return <rect key={i} x={i * bw} y={64 - bh} width={bw - 2} height={bh} rx="2" fill="url(#invest-barGrad)" />;
      })}
      <polyline
        points={bars.map((h, i) => `${i * bw + bw / 2},${64 - (h / max) * 56}`).join(' ')}
        stroke={gold} strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Allocation donut ─────────────────────────────────────────
function AllocationDonut({ slices, surfaceBg, textColor, mutedColor }: {
  slices: AllocationSlice[];
  surfaceBg: string;
  textColor: string;
  mutedColor: string;
}) {
  const r = 52, cx = 68, cy = 68, sw = 22;
  const circ = 2 * Math.PI * r;
  if (slices.length === 0) {
    return (
      <svg width={136} height={136} viewBox="0 0 136 136" fill="none">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={mutedColor} strokeWidth={sw} strokeOpacity="0.1" />
        <circle cx={cx} cy={cy} r={r - sw / 2 - 4} fill={surfaceBg} />
        <text x={cx} y={cy + 5} textAnchor="middle" fill={mutedColor} fontSize="8.5" fontFamily="Inter" letterSpacing="1">EMPTY</text>
      </svg>
    );
  }
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

// ─── Main component ───────────────────────────────────────────
export default function Invest({ user }: { user: { token: string; email?: string; name?: string } }) {
  const { colors } = useTheme();
  const { t } = useLang();

  const [userEmail, setUserEmail] = useState('');
  const [availableCash, setAvailableCash] = useState(0);
  const [tierLimits, setTierLimits] = useState(getTierLimits('Standard'));
  const [rawHoldings, setRawHoldings] = useState<RawHolding[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceStatus, setPriceStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [lastUpdated, setLastUpdated] = useState('');
  const [showMarket, setShowMarket] = useState(false);

  const [tradeModal, setTradeModal] = useState<{
    ticker: string; name: string; type: string;
    currentPrice: number; existingShares: number; mode: 'buy' | 'sell';
  } | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [tradeError, setTradeError] = useState('');

  // ── load user data ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const email = user?.email ?? '';
    setUserEmail(email);
    if (!email) { setLoading(false); return; }

    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (raw) {
        const acct = JSON.parse(raw).find((a: any) => a.email?.toLowerCase() === email.toLowerCase());
        setTierLimits(getTierLimits(acct?.tier));
      }
    } catch {}

    setAvailableCash(getAdminBalance(email));
    setRawHoldings(loadRawHoldings(email));
    setLoading(false);
  }, [user]);

  // ── fetch live prices ──────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    setPriceStatus('loading');
    const prices: Record<string, number> = {};

    // Crypto via CoinGecko (CORS-friendly, free)
    try {
      const ids = MARKET_ASSETS.filter(a => a.coingeckoId).map(a => a.coingeckoId).join(',');
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
      if (res.ok) {
        const data = await res.json();
        for (const a of MARKET_ASSETS.filter(a => a.coingeckoId)) {
          if (data[a.coingeckoId!]?.usd) prices[a.ticker] = data[a.coingeckoId!].usd;
        }
      }
    } catch {}

    // Stocks via Yahoo Finance
    const stockSymbols = MARKET_ASSETS.filter(a => !a.coingeckoId).map(a => a.ticker).join(',');
    const tryYahoo = async (host: string) => {
      const res = await fetch(`https://${host}/v7/finance/quote?symbols=${stockSymbols}`);
      if (!res.ok) return false;
      const data = await res.json();
      const quotes: any[] = data?.quoteResponse?.result ?? [];
      for (const q of quotes) {
        if (q.symbol && q.regularMarketPrice) prices[q.symbol] = q.regularMarketPrice;
      }
      return quotes.length > 0;
    };
    try {
      const ok = await tryYahoo('query1.finance.yahoo.com');
      if (!ok) await tryYahoo('query2.finance.yahoo.com');
    } catch {}

    setLivePrices(prices);
    const hasData = Object.keys(prices).length > 0;
    setPriceStatus(hasData ? 'live' : 'error');
    if (hasData) setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    fetchPrices();
    const t = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchPrices]);

  // ── rebuild portfolio when holdings or prices change ───────
  useEffect(() => {
    setPortfolio(computePortfolio(rawHoldings, livePrices));
  }, [rawHoldings, livePrices]);

  // ── trade execution ────────────────────────────────────────
  const handleTrade = () => {
    if (!tradeModal || !tradeAmount || !userEmail) return;
    const amount = parseFloat(tradeAmount);
    if (!amount || amount <= 0) { setTradeError('Enter a valid amount.'); return; }
    const price = tradeModal.currentPrice;
    if (!price || price <= 0) { setTradeError('Asset price not available.'); return; }

    // Tier checks
    if (tradeModal.type === 'crypto' && !tierLimits.cryptoAllowed) {
      setTradeError(`${tierLimits.tier} tier does not allow crypto. Upgrade to Gold or Platinum.`);
      return;
    }
    if (amount > tierLimits.perTxLimit) {
      setTradeError(`Exceeds ${tierLimits.tier} per-trade limit of $${tierLimits.perTxLimit.toLocaleString()}.`);
      return;
    }

    if (tradeModal.mode === 'buy') {
      const dailyUsed = getDailyUsage(userEmail);
      if (dailyUsed + amount > tierLimits.dailyTransferLimit) {
        setTradeError(`Would exceed daily limit of $${tierLimits.dailyTransferLimit.toLocaleString()}. Used: $${dailyUsed.toFixed(2)}.`);
        return;
      }
      if (amount > availableCash) {
        setTradeError(`Insufficient funds. Available: $${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`);
        return;
      }
    } else {
      const owned = rawHoldings.find(h => h.ticker === tradeModal.ticker);
      const ownedVal = owned ? owned.shares * price : 0;
      if (amount > ownedVal + 0.01) {
        setTradeError(`Cannot sell more than position value of $${ownedVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`);
        return;
      }
    }

    setTradeError('');
    setTradeLoading(true);
    const shares = amount / price;
    const updated = [...rawHoldings];
    const idx = updated.findIndex(h => h.ticker === tradeModal.ticker);
    const asset = MARKET_ASSETS.find(a => a.ticker === tradeModal.ticker);

    if (tradeModal.mode === 'buy') {
      if (idx >= 0) {
        const old = updated[idx];
        const newShares = old.shares + shares;
        const newAvgCost = (old.avgCost * old.shares + price * shares) / newShares;
        updated[idx] = { ...old, shares: +newShares.toFixed(8), avgCost: +newAvgCost.toFixed(4) };
      } else {
        updated.push({ ticker: tradeModal.ticker, shares: +shares.toFixed(8), avgCost: +price.toFixed(4), allocLabel: asset?.allocLabel ?? 'Equities' });
      }
      const newCash = +(availableCash - amount).toFixed(2);
      setAdminBalance(userEmail, newCash);
      setAvailableCash(newCash);
      addDailyUsage(userEmail, amount);
    } else {
      if (idx >= 0) {
        const old = updated[idx];
        const newShares = old.shares - shares;
        if (newShares < 0.00001) updated.splice(idx, 1);
        else updated[idx] = { ...old, shares: +newShares.toFixed(8) };
      }
      const newCash = +(availableCash + amount).toFixed(2);
      setAdminBalance(userEmail, newCash);
      setAvailableCash(newCash);
    }

    saveRawHoldings(userEmail, updated);
    setRawHoldings(updated);

    setTimeout(() => {
      setTradeSuccess(true);
      setTimeout(() => {
        setTradeModal(null);
        setTradeAmount('');
        setTradeSuccess(false);
        setTradeLoading(false);
        setTradeError('');
      }, 1400);
    }, 300);
  };

  const openTradeFromHolding = (h: Holding, mode: 'buy' | 'sell') => {
    setTradeModal({ ticker: h.ticker, name: h.name, type: h.type, currentPrice: h.currentPrice, existingShares: h.shares, mode });
    setTradeAmount(''); setTradeError(''); setTradeSuccess(false);
  };

  const openTradeFromMarket = (asset: typeof MARKET_ASSETS[0]) => {
    const price = livePrices[asset.ticker] ?? 0;
    if (!price) return;
    const existingShares = rawHoldings.find(h => h.ticker === asset.ticker)?.shares ?? 0;
    setTradeModal({ ticker: asset.ticker, name: asset.name, type: asset.type, currentPrice: price, existingShares, mode: 'buy' });
    setTradeAmount(''); setTradeError(''); setTradeSuccess(false);
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
        {/* Price status bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', fontWeight: 700,
              color: priceStatus === 'live' ? colors.success : priceStatus === 'error' ? colors.danger : colors.gold,
              background: priceStatus === 'live' ? `${colors.success}12` : priceStatus === 'error' ? `${colors.danger}12` : `${colors.gold}12`,
              border: `1px solid ${priceStatus === 'live' ? colors.success : priceStatus === 'error' ? colors.danger : colors.gold}30`,
              borderRadius: 20, padding: '3px 10px',
            }}>
              {priceStatus === 'loading' ? (
                <svg width="10" height="10" viewBox="0 0 20 20" style={{ animation: 'spin 0.9s linear infinite' }}>
                  <path d="M10 2 A8 8 0 0 1 18 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              )}
              {priceStatus === 'live' ? `LIVE · ${lastUpdated}` : priceStatus === 'error' ? 'PRICES UNAVAILABLE' : 'FETCHING PRICES…'}
            </span>
            <span style={{ fontSize: '0.68rem', color: colors.textFaint }}>
              Available: <strong style={{ color: colors.gold }}>${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              {' · '}Tier: <strong style={{ color: tierLimits.color }}>{tierLimits.tier}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchPrices}
              style={{ padding: '0.3rem 0.8rem', background: 'none', border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.textMuted, fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer' }}>
              ↻ Refresh
            </button>
            <button onClick={() => setShowMarket(v => !v)}
              style={{ padding: '0.3rem 0.8rem', background: showMarket ? colors.goldBg : 'none', border: `1px solid ${showMarket ? colors.borderStrong : colors.border}`, borderRadius: 8, color: showMarket ? colors.gold : colors.textMuted, fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>
              {showMarket ? '✕ Close Market' : '+ Buy Assets'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: colors.gold, justifyContent: 'center', marginTop: 80, fontSize: '0.9rem' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 0.9s linear infinite' }}>
              <circle cx="10" cy="10" r="8" fill="none" stroke={`${colors.gold}25`} strokeWidth="2.5" />
              <path d="M10 2 A8 8 0 0 1 18 10" stroke={colors.gold} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
            {t('loadingPortfolio')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>

            {/* Market panel — browse & buy assets */}
            {showMarket && (
              <div style={{ background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.borderStrong}`, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1.2rem' }}>
                  MARKET — BUY ASSETS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  {MARKET_ASSETS.map(asset => {
                    const price = livePrices[asset.ticker];
                    const isCrypto = asset.type === 'crypto';
                    const blocked = isCrypto && !tierLimits.cryptoAllowed;
                    const owned = rawHoldings.find(h => h.ticker === asset.ticker);
                    return (
                      <div key={asset.ticker} style={{
                        background: colors.surface2 ?? colors.bg, borderRadius: 14, padding: '1rem',
                        border: `1px solid ${blocked ? `${colors.danger}22` : colors.border}`,
                        opacity: blocked ? 0.6 : 1,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', color: colors.gold, fontWeight: 800 }}>
                              {asset.ticker.slice(0, 3)}
                            </div>
                            <div>
                              <div style={{ color: colors.text, fontWeight: 700, fontSize: '0.82rem' }}>{asset.ticker}</div>
                              <div style={{ color: colors.textFaint, fontSize: '0.63rem' }}>{asset.name}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.6rem', color: ALLOC_COLORS[asset.allocLabel] ?? colors.textFaint, background: `${ALLOC_COLORS[asset.allocLabel] ?? '#888'}18`, borderRadius: 5, padding: '2px 6px', fontWeight: 600 }}>
                            {asset.type.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ color: price ? colors.text : colors.textFaint, fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                          {price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                        </div>
                        {owned && <div style={{ color: colors.success, fontSize: '0.65rem', marginBottom: 6 }}>Owned: {owned.shares < 0.01 ? owned.shares.toFixed(6) : owned.shares.toFixed(4)} shares</div>}
                        {blocked ? (
                          <div style={{ fontSize: '0.65rem', color: colors.danger }}>Requires Gold+ tier</div>
                        ) : (
                          <button
                            onClick={() => openTradeFromMarket(asset)}
                            disabled={!price}
                            style={{ width: '100%', padding: '0.4rem', background: price ? `${colors.success}18` : colors.surface, border: `1px solid ${price ? colors.success : colors.border}30`, borderRadius: 8, color: price ? colors.success : colors.textFaint, fontWeight: 700, fontSize: '0.7rem', cursor: price ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
                            {price ? '+ Buy' : 'No price'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Portfolio summary */}
            {portfolio && (
              <div style={{ background: colors.surface, borderRadius: 20, padding: '2rem', border: `1px solid ${colors.borderStrong}`, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${colors.goldBg} 0%, transparent 60%)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>{t('totalPortfolioValue')}</div>
                    <div style={{ color: colors.text, fontWeight: 800, fontSize: '2.4rem', letterSpacing: '-0.025em' }}>
                      {portfolio.currency}{portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {portfolio.totalValue > 0 ? (
                        <>
                          <span style={{ color: portfolio.totalPl >= 0 ? colors.success : colors.danger, fontWeight: 700, fontSize: '0.9rem' }}>
                            {portfolio.totalPl >= 0 ? '▲' : '▼'} {portfolio.currency}{Math.abs(portfolio.totalPl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span style={{ color: portfolio.totalPl >= 0 ? colors.success : colors.danger, fontWeight: 600, fontSize: '0.82rem' }}>
                            ({portfolio.totalPl >= 0 ? '+' : ''}{portfolio.totalPlPct}%)
                          </span>
                          <span style={{ color: colors.textFaint, fontSize: '0.78rem' }}>total return</span>
                        </>
                      ) : (
                        <span style={{ color: colors.textFaint, fontSize: '0.82rem' }}>No positions yet — buy assets above to start</span>
                      )}
                      <span style={{ background: `${portfolio.totalPl >= 0 ? colors.success : colors.textFaint}18`, color: portfolio.totalPl >= 0 ? colors.success : colors.textFaint, fontSize: '0.65rem', fontWeight: 700, borderRadius: 6, padding: '2px 8px', border: `1px solid ${portfolio.totalPl >= 0 ? colors.success : colors.border}28` }}>
                        {portfolio.sentiment}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Cash Balance</div>
                    <div style={{ color: colors.gold, fontWeight: 700, fontSize: '1.1rem' }}>
                      ${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ color: colors.textFaint, fontSize: '0.72rem', marginTop: 2 }}>{tierLimits.tier} · ${tierLimits.perTxLimit.toLocaleString()} / trade</div>
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '1.2rem' }}>
                  <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{t('performance30d')}</div>
                  <MarketChart gold={colors.gold} prices={livePrices} />
                </div>
              </div>
            )}

            {/* Allocation + Holdings */}
            <div className="invest-alloc-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(0, 2fr)', gap: '1.4rem' }}>
              {/* Allocation donut */}
              <div style={{ background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1.2rem' }}>{t('assetAllocation')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' }}>
                  <AllocationDonut slices={portfolio?.allocation ?? []} surfaceBg={colors.bg} textColor={colors.text} mutedColor={colors.textFaint} />
                  <div style={{ width: '100%' }}>
                    {(portfolio?.allocation ?? []).length === 0 ? (
                      <div style={{ color: colors.textFaint, fontSize: '0.76rem', textAlign: 'center' }}>No allocation data</div>
                    ) : (portfolio?.allocation ?? []).map(s => (
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
                    {(portfolio?.holdings ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: colors.textFaint, fontSize: '0.85rem' }}>
                          No holdings yet. Use <strong style={{ color: colors.gold }}>+ Buy Assets</strong> above to start investing.
                        </td>
                      </tr>
                    ) : (portfolio?.holdings ?? []).map((h, i) => (
                      <tr key={h.id} style={{ borderBottom: i < (portfolio?.holdings.length ?? 1) - 1 ? `1px solid ${colors.border}` : 'none' }}>
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
                          {h.shares < 0.01 ? h.shares.toFixed(6) : h.shares < 1 ? h.shares.toFixed(4) : h.shares.toFixed(4)}
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
                            <button onClick={() => openTradeFromHolding(h, 'buy')}
                              style={{ padding: '0.28rem 0.65rem', background: `${colors.success}18`, border: `1px solid ${colors.success}30`, borderRadius: 7, color: colors.success, fontWeight: 700, fontSize: '0.67rem', cursor: 'pointer' }}>
                              {t('buy')}
                            </button>
                            <button onClick={() => openTradeFromHolding(h, 'sell')}
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
        )}
      </section>

      {/* Trade Modal */}
      {tradeModal && (
        <div style={{ position: 'fixed', inset: 0, background: colors.overlayBg, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div style={{ background: colors.surface, borderRadius: 20, padding: '2rem', maxWidth: 420, width: '100%', border: `1px solid ${colors.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{t('tradeAsset')}</div>
                <h3 style={{ color: colors.text, fontWeight: 800, margin: '2px 0 0', fontSize: '1.1rem' }}>
                  {tradeModal.mode === 'buy' ? t('buy') : t('sell')} {tradeModal.ticker}
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
                <div style={{ background: (colors as any).surface2 ?? `${colors.gold}08`, borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.2rem', fontSize: '0.8rem', color: colors.textMuted, lineHeight: 1.9 }}>
                  <div>Price: <strong style={{ color: colors.gold }}>${tradeModal.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    {priceStatus === 'live' && <span style={{ color: colors.success, fontSize: '0.65rem', marginLeft: 4 }}>● LIVE</span>}
                  </div>
                  {tradeModal.existingShares > 0 && (
                    <div>Owned: <strong style={{ color: colors.text }}>{tradeModal.existingShares < 0.01 ? tradeModal.existingShares.toFixed(6) : tradeModal.existingShares.toFixed(4)} shares</strong>
                      {' · '}Value: <strong style={{ color: colors.text }}>${(tradeModal.existingShares * tradeModal.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}
                  <div>Available cash: <strong style={{ color: colors.gold }}>${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                  <div>Max per trade: <strong style={{ color: tierLimits.color }}>${tierLimits.perTxLimit.toLocaleString()} ({tierLimits.tier})</strong></div>
                </div>

                {tradeError && (
                  <div style={{ background: `${colors.danger}12`, border: `1px solid ${colors.danger}30`, borderRadius: 9, padding: '0.7rem 1rem', marginBottom: '1rem', color: colors.danger, fontSize: '0.8rem' }}>
                    {tradeError}
                  </div>
                )}

                <label style={{ display: 'block', fontSize: '0.68rem', color: colors.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>
                  {t('amount')} (USD)
                </label>
                <input
                  type="number" min="1"
                  value={tradeAmount}
                  onChange={e => { setTradeAmount(e.target.value); setTradeError(''); }}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '0.75rem 1rem', background: (colors as any).inputBg ?? colors.bg, border: `1px solid ${(colors as any).inputBorder ?? colors.border}`, borderRadius: 10, color: colors.text, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: tradeAmount && tradeModal.currentPrice ? '0.5rem' : '1.2rem', fontFamily: 'Inter' }}
                />
                {tradeAmount && parseFloat(tradeAmount) > 0 && tradeModal.currentPrice > 0 && (
                  <div style={{ color: colors.textFaint, fontSize: '0.72rem', marginBottom: '1.2rem' }}>
                    ≈ {(parseFloat(tradeAmount) / tradeModal.currentPrice).toFixed(tradeModal.type === 'crypto' ? 6 : 4)} shares of {tradeModal.ticker}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setTradeModal(null)}
                    style={{ flex: 1, padding: '0.75rem', background: 'none', border: `1px solid ${colors.border}`, borderRadius: 12, color: colors.textMuted, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleTrade}
                    disabled={tradeLoading || !tradeAmount || parseFloat(tradeAmount) <= 0}
                    style={{ flex: 1, padding: '0.75rem', background: tradeModal.mode === 'buy' ? colors.success : colors.danger, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: (tradeLoading || !tradeAmount || parseFloat(tradeAmount) <= 0) ? 'not-allowed' : 'pointer', fontSize: '0.9rem', opacity: (tradeLoading || !tradeAmount || parseFloat(tradeAmount) <= 0) ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    {tradeLoading ? '…' : (tradeModal.mode === 'buy' ? t('buy') : t('sell'))}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .invest-alloc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

