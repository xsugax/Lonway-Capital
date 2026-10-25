"use client";
import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { getBankAccounts, getTransfers, retryPendingTransfers } from '../lib/store';
import { cloudLookup, cloudGetUserTransfers, isCloudEnabled } from '../lib/cloud';
import { applyCloudBankAccounts } from '../lib/sync';
import { useLang } from '../contexts/LanguageContext';
import { exportCSV, exportPDF } from '../lib/exportData';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

const Chart = dynamic(() => import('react-apexcharts').then(mod => mod.default), { ssr: false });

function GlobeNetwork({ gold, isDark }: { gold: string; isDark: boolean }) {
  const baseOpacity = isDark ? 1 : 0.6;
  const nodes = [
    { cx: 420, cy: 60, r: 3 }, { cx: 510, cy: 85, r: 2.5 }, { cx: 560, cy: 130, r: 3.5 },
    { cx: 580, cy: 190, r: 2 }, { cx: 550, cy: 250, r: 3 }, { cx: 490, cy: 290, r: 2.5 },
    { cx: 420, cy: 310, r: 2 }, { cx: 350, cy: 290, r: 3 }, { cx: 290, cy: 250, r: 2.5 },
    { cx: 270, cy: 190, r: 3.5 }, { cx: 290, cy: 130, r: 2 }, { cx: 340, cy: 85, r: 3 },
  ];
  const connections = [
    [0, 2], [0, 5], [1, 4], [2, 7], [3, 8], [4, 9], [5, 10], [6, 11], [7, 1], [8, 3], [9, 0], [10, 6], [11, 4],
    [0, 8], [2, 10], [1, 7], [3, 11], [5, 9],
  ];
  return (
    <svg viewBox="0 0 840 370" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', bottom: 0, right: 0, height: '100%', width: 'min(60%, 520px)', pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="globeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.06"/>
          <stop offset="70%" stopColor={gold} stopOpacity="0.02"/>
          <stop offset="100%" stopColor={gold} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="globeFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent"/>
          <stop offset="15%" stopColor="white"/>
          <stop offset="90%" stopColor="white"/>
          <stop offset="100%" stopColor="transparent"/>
        </linearGradient>
        <mask id="globeMask"><rect width="840" height="370" fill="url(#globeFade)"/></mask>
      </defs>
      <g mask="url(#globeMask)" opacity={0.18 * baseOpacity}>
        <circle cx="420" cy="185" r="130" stroke={gold} strokeWidth="0.8" fill="url(#globeGrad)"/>
        <ellipse cx="420" cy="185" rx="130" ry="45" stroke={gold} strokeWidth="0.4"/>
        <ellipse cx="420" cy="185" rx="90" ry="130" stroke={gold} strokeWidth="0.4"/>
        <ellipse cx="420" cy="185" rx="45" ry="130" stroke={gold} strokeWidth="0.3"/>
        {[-65, -30, 0, 30, 65].map((offset, i) => (
          <ellipse key={i} cx="420" cy={185 + offset} rx={Math.sqrt(Math.max(0, 130 * 130 - offset * offset))} ry="8" stroke={gold} strokeWidth="0.3"/>
        ))}
        {connections.map(([a, b], i) => (
          <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
            stroke={gold} strokeWidth="0.5" strokeDasharray="3,4" opacity="0.6"/>
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.cx} cy={n.cy} r={n.r * 2.5} fill={gold} opacity="0.08"/>
            <circle cx={n.cx} cy={n.cy} r={n.r} fill={gold} opacity="0.7"/>
          </g>
        ))}
        {[155, 180, 210].map((r, i) => (
          <circle key={i} cx="420" cy="185" r={r} stroke={gold} strokeWidth="0.3" fill="none" strokeDasharray={`${4 + i * 2},${8 + i * 3}`}/>
        ))}
      </g>
    </svg>
  );
}

// ─── Market Pulse Ticker ──────────────────────────────────────────────────────
type LiveQuote = { symbol: string; name: string; price: string; change: string; up: boolean };

function moneyQuote(n: number, digits = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function MarketPulse({ colors }: { colors: any }) {
  const [quotes, setQuotes] = React.useState<LiveQuote[]>([]);
  const [live, setLive] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      const next: LiveQuote[] = [];
      const have = (symbol: string) => next.some((row) => row.symbol === symbol);
      try {
        const res = await fetch('https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH&tsyms=USD');
        if (res.ok) {
          const data = await res.json();
          for (const [symbol, name] of [['BTC', 'Bitcoin'], ['ETH', 'Ethereum']] as const) {
            const row = data?.RAW?.[symbol]?.USD;
            const price = Number(row?.PRICE);
            if (!(price > 0)) continue;
            const ch = Number(row.CHANGEPCT24HOUR) || 0;
            next.push({ symbol, name, price: `$${moneyQuote(price, price > 1000 ? 0 : 2)}`, change: `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`, up: ch >= 0 });
          }
        }
      } catch { /* the public tape below covers a missed quote */ }
      if (!have('BTC') || !have('ETH')) {
        try {
          const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
          if (res.ok) {
            const data = await res.json();
            for (const [symbol, id, name] of [['BTC', 'bitcoin', 'Bitcoin'], ['ETH', 'ethereum', 'Ethereum']] as const) {
              if (have(symbol)) continue;
              const price = Number(data?.[id]?.usd);
              if (!(price > 0)) continue;
              const ch = Number(data[id].usd_24h_change) || 0;
              next.push({ symbol, name, price: `$${moneyQuote(price, price > 1000 ? 0 : 2)}`, change: `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`, up: ch >= 0 });
            }
          }
        } catch { /* crypto quotes stay on whatever already arrived */ }
      }
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true');
        if (res.ok) {
          const data = await res.json();
          const price = Number(data?.['pax-gold']?.usd);
          const ch = Number(data?.['pax-gold']?.usd_24h_change) || 0;
          if (price > 0) next.push({ symbol: 'XAU', name: 'Gold', price: `$${moneyQuote(price, 0)}`, change: `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`, up: ch >= 0 });
        }
      } catch { /* gold is optional */ }
      try {
        const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
        if (res.ok) {
          const data = await res.json();
          const rate = Number(data?.rates?.USD);
          if (rate > 0) next.push({ symbol: 'EUR', name: 'EUR/USD', price: rate.toFixed(4), change: 'Live', up: true });
        }
      } catch { /* fx is optional */ }
      try {
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=5d');
        if (res.ok) {
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          const price = Number(meta?.regularMarketPrice);
          const prev = Number(meta?.chartPreviousClose || meta?.previousClose);
          if (price > 0) {
            const ch = prev > 0 ? ((price - prev) / prev) * 100 : 0;
            next.push({ symbol: 'SPY', name: 'S&P 500', price: moneyQuote(price, 0), change: `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`, up: ch >= 0 });
          }
        }
      } catch { /* index is optional */ }
      if (!active) return;
      if (next.length) {
        setQuotes(next);
        setLive(true);
      }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (!quotes.length) {
    return <div style={{ color: colors.textMuted, fontSize: '0.9rem' }}>{live ? 'Live prices are temporarily unavailable.' : 'Loading live prices…'}</div>;
  }
  return (
    <div>
      <div style={{ color: colors.success, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>LIVE</div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
      {quotes.map((m) => (
        <div key={m.symbol} style={{ flexShrink: 0, background: colors.surface, border: `1px solid ${m.up ? colors.success : colors.danger}22`, borderRadius: 14, padding: '0.85rem 1.1rem', minWidth: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
            <span style={{ color: colors.textFaint, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>{m.symbol}</span>
            <span style={{ fontSize: '0.62rem', color: m.up ? colors.success : colors.danger, background: `${m.up ? colors.success : colors.danger}15`, borderRadius: 5, padding: '1px 5px', fontWeight: 700 }}>{m.change}</span>
          </div>
          <div style={{ color: colors.text, fontWeight: 700, fontSize: '0.92rem' }}>{m.price}</div>
          <div style={{ color: colors.textFaint, fontSize: '0.62rem', marginTop: 2 }}>{m.name}</div>
        </div>
      ))}
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '↗', label: 'Transfer', href: '/transfer', color: '#4A90D9' },
  { icon: '💳', label: 'Cards', href: '/cards', color: '#C4A052' },
  { icon: '🏦', label: 'Vaults', href: '/vaults', color: '#7FD4A0' },
  { icon: '📈', label: 'Invest', href: '/invest', color: '#A78BFA' },
  { icon: '💡', label: 'Insights', href: '/insights', color: '#FB923C' },
  { icon: '👤', label: 'Profile', href: '/profile', color: '#F472B6' },
];

const ACC_ICONS: Record<string, string> = { Checking: '🏛', Savings: '🏦', 'Crypto Vault': '⬡', Investment: '📈' };

// ─── Trust Indicators ─────────────────────────────────────────────────────────
const TRUST_BADGES = [
  { icon: '🔒', label: '256-bit SSL Encryption' },
  { icon: '🏛', label: 'FDIC Insured' },
  { icon: '✦', label: 'SOC 2 Type II Certified' },
  { icon: '🌐', label: '195 Countries Served' },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ user }: { user: { token: string; email?: string } }) {


  const { colors, theme } = useTheme();
  const { t } = useLang();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [balanceAvailable, setBalanceAvailable] = React.useState(false);
  const [clock, setClock] = React.useState('');
  const [tzName, setTzName] = React.useState('');
  const dashboardHasData = React.useRef(false);

  React.useEffect(() => {
    const fmtClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTzName(Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' '));
    };
    fmtClock();
    const id = setInterval(fmtClock, 1000);
    return () => clearInterval(id);
  }, []);

  const greeting = React.useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('goodMorning');
    if (h < 17) return t('goodAfternoon');
    return t('goodEvening');
  }, [t]);

  React.useEffect(() => {
    let active = true;
    let loadingDashboard = false;
    dashboardHasData.current = false;
    setLoading(true);
    setError(null);
    const hasCachedAccounts = () => {
      if (!user?.email) return false;
      const emailKey = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      return localStorage.getItem(`londway_bank_accounts__${emailKey}`) !== null;
    };

    async function loadDashboard() {
      if (loadingDashboard) return;
      loadingDashboard = true;
      let cloudAccountFound = false;

      try {
        if (user?.email) await retryPendingTransfers(user.email);

        // 1. Refresh accounts and profile from cloud without echoing the pull back as a write.
        if (user?.email && isCloudEnabled()) {
          const cloud = await cloudLookup(user.email);
          if (cloud && active) {
            cloudAccountFound = true;
            applyCloudBankAccounts(user.email, cloud);

            // Sync tier and account status from cloud to the local profile.
            try {
              const raw = localStorage.getItem('londway_accounts');
              if (raw) {
                const accounts = JSON.parse(raw);
                const idx = accounts.findIndex((account: any) => account.email?.toLowerCase() === cloud.email.toLowerCase());
                if (idx !== -1) {
                  let dirty = false;
                  if (cloud.tier && accounts[idx].tier !== cloud.tier) { accounts[idx].tier = cloud.tier; dirty = true; }
                  if (cloud.name && accounts[idx].name !== cloud.name) { accounts[idx].name = cloud.name; dirty = true; }
                  if (cloud.role && accounts[idx].role !== cloud.role) { accounts[idx].role = cloud.role; dirty = true; }
                  const cloudBlocked = !!cloud.blocked;
                  const cloudFrozen = !!cloud.frozen;
                  if (accounts[idx].blocked !== cloudBlocked) { accounts[idx].blocked = cloudBlocked; dirty = true; }
                  if (accounts[idx].frozen !== cloudFrozen) { accounts[idx].frozen = cloudFrozen; dirty = true; }
                  if (dirty) localStorage.setItem('londway_accounts', JSON.stringify(accounts));
                  if (cloudBlocked || cloudFrozen) {
                    localStorage.removeItem('londway_current_user');
                    window.location.href = '/';
                    return;
                  }
                }
              }
            } catch (err) {
              console.error('[dashboard] Failed to update the local account profile:', err);
            }
          }
        }

        if (!active) return;
        setBalanceAvailable(cloudAccountFound || hasCachedAccounts());

        // 2. Use the latest cloud accounts, or the last saved local cache during an outage.
        const accounts = getBankAccounts(user?.email);
        const totalBalance = accounts.reduce((sum: number, account: any) => sum + (Number(account.balance) || 0), 0);

        // 3. Gather transactions from bank accounts.
        const allTx: any[] = [];
        const seenIds = new Set<string>();
        accounts.forEach((account: any) => {
          (account.transactions ?? []).forEach((tx: any) => {
            if (tx.id && seenIds.has(tx.id)) return;
            if (tx.id) seenIds.add(tx.id);
            allTx.push({ ...tx, accountType: account.type });
          });
        });

        // 4. Merge user-submitted transfers (local + cloud) into transaction history.
        if (user?.email) {
          const localTransfers = getTransfers(user.email);
          const cloudTransfers = isCloudEnabled() ? await cloudGetUserTransfers(user.email) : [];
          const txIds = new Set(localTransfers.map((transfer: any) => transfer.id));
          const merged = [...localTransfers, ...cloudTransfers.filter((transfer: any) => !txIds.has(transfer.id))];
          merged.forEach((transfer: any) => {
            const tid = transfer.id || `tf-${transfer.reference}`;
            if (seenIds.has(tid)) return;
            seenIds.add(tid);
            const isPending = transfer.status === 'pending';
            const kind = String(transfer.type || '').toLowerCase();
            const credit = kind === 'credit' || kind === 'interest';
            const who = transfer.recipientName || transfer.recipient_name || '';
            const note = String(transfer.description || '').trim();
            const generic = /^(local transfer|international wire|admin credit|admin debit|wire transfer received|account adjustment|admin balance adjustment|administration top up)$/i.test(note);
            const description = note && !generic
              ? (!credit && who && !note.toLowerCase().includes(who.toLowerCase()) ? `${note} — to ${who}` : note)
              : credit
                ? `Received from ${who || 'Londway Capital'}`
                : `Transfer to ${who || 'recipient'}`;
            allTx.push({
              id: tid,
              type: credit ? 'credit' : 'debit',
              description: isPending ? `${description} (Pending)` : description,
              amount: Number(transfer.amount),
              date: transfer.createdAt || transfer.created_at,
              status: transfer.status || 'completed',
              accountType: 'Checking',
            });
          });
        }

        if (!active) return;
        allTx.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
        const flows = allTx.map((tx) => {
          const amt = Number(tx.amount) || 0;
          const debit = String(tx.type ?? tx.kind ?? '').toLowerCase().includes('debit') || amt < 0;
          const when = new Date(tx.date ?? 0).getTime();
          return { when, signed: debit ? -Math.abs(amt) : Math.abs(amt) };
        }).filter((row) => Number.isFinite(row.when) && row.when > 0);
        const netFlow = flows.reduce((sum, row) => sum + row.signed, 0);
        const opening = totalBalance - netFlow;
        const now = new Date();
        const chartLabels: string[] = [];
        const chartData: number[] = [];
        for (let i = 6; i >= 0; i--) {
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
          chartLabels.push(end.toLocaleString('en-US', { month: 'short' }));
          const moved = flows.filter((row) => row.when <= end.getTime()).reduce((sum, row) => sum + row.signed, 0);
          chartData.push(Math.round((opening + moved) * 100) / 100);
        }
        chartData[chartData.length - 1] = Math.round(totalBalance * 100) / 100;
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const todayChange = flows.filter((row) => row.when >= startOfDay).reduce((sum, row) => sum + row.signed, 0);
        const monthlyGrowth = flows.filter((row) => row.when >= startOfMonth).reduce((sum, row) => sum + row.signed, 0);
        setData({
          totalBalance,
          netWorth: totalBalance,
          todayChange,
          monthlyGrowth,
          chartData,
          chartLabels,
          accounts,
          recentTx: allTx.slice(0, 6),
          insight: 'Your spending is on track this month. Consider increasing your vault contribution by 5% to reach your goal faster.',
        });
        dashboardHasData.current = true;
        setError(null);
      } catch (err) {
        console.error('[dashboard] Refresh failed; keeping the last saved balances:', err);
        if (active) {
          setBalanceAvailable(hasCachedAccounts());
          if (!dashboardHasData.current) setError('Balance data could not be loaded. Please try again shortly.');
        }
      } finally {
        loadingDashboard = false;
        if (active) setLoading(false);
      }
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadDashboard();
    };

    void loadDashboard();
    const refreshInterval = window.setInterval(refreshWhenVisible, 30_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [user?.email]);

  if (loading) return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif", padding: 'clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}><DashboardSkeleton /></div>
    </main>
  );

  if (error) return (
    <div style={{ color: colors.danger, textAlign: 'center', marginTop: 80, fontFamily: "'Inter', sans-serif", background: `${colors.danger}10`, border: `1px solid ${colors.danger}22`, borderRadius: 14, padding: '2rem', maxWidth: 400, margin: '80px auto 0' }}>{error}</div>
  );

  const isLight = theme === 'light';
  const isDark = theme === 'dark';
  const chartGridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  const chartLabelColor = colors.textFaint;
  const money = (n: number) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const glass = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    boxShadow: colors.cardShadow,
  } as const;

  return (
    <main style={{ background: colors.bg, minHeight: '100%', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      <section className="dash-hero" style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(1.2rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2rem) clamp(1rem, 2vw, 2rem)' }}>
        <GlobeNetwork gold={colors.gold} isDark={isDark} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: '0.9rem', maxWidth: '100%' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: colors.success, fontWeight: 700, letterSpacing: '0.08em' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.success, boxShadow: `0 0 8px ${colors.success}` }}/>
              SECURE SESSION
            </div>
            {clock && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: colors.goldBg, border: `1px solid ${colors.border}`, borderRadius: 100, padding: '0.35rem 0.9rem', fontSize: '0.72rem', color: colors.text, fontWeight: 600, letterSpacing: '0.02em', maxWidth: '100%', overflowWrap: 'anywhere' }}>
                {clock}{tzName ? ` · ${tzName}` : ''}
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.6rem)', fontWeight: 800, color: colors.text, margin: '0 0 0.35rem', lineHeight: 1.15, letterSpacing: '-0.025em', overflowWrap: 'anywhere' }}>
            {greeting}
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '1rem', margin: '0 0 1rem', lineHeight: 1.6 }}>
            {t('financialOverview')}
          </p>
          <Link href="/transfer" style={{
            background: colors.gold,
            color: isDark ? '#1A1505' : '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            borderRadius: 10,
            padding: '0.75rem 1.2rem',
            display: 'inline-flex',
            marginBottom: '1.4rem',
          }}>
            Transfer money
          </Link>

          <div className="dash-hero-cards" style={{ display: 'flex', gap: 'clamp(8px, 2vw, 16px)', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <div style={{ ...glass, border: `1px solid ${colors.borderStrong}`, borderRadius: 18, padding: 'clamp(1rem, 2vw, 1.4rem) clamp(1rem, 2vw, 1.6rem)', minWidth: 0, flex: '1.4 1 220px', overflow: 'hidden' }}>
              <div style={{ color: colors.textMuted, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, overflowWrap: 'anywhere' }}>{t('totalBalance')}</div>
              <div className="dash-figure dash-figure-hero" style={{ color: colors.gold, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                {balanceAvailable ? `$${money(data.totalBalance)}` : 'Balance temporarily unavailable'}
              </div>
            </div>
            <div style={{ ...glass, borderRadius: 18, padding: 'clamp(1rem, 2vw, 1.4rem)', minWidth: 0, flex: '1 1 160px', overflow: 'hidden' }}>
              <div style={{ color: colors.textMuted, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, overflowWrap: 'anywhere' }}>{t('todayChange')}</div>
              <div className="dash-figure dash-figure-stat" style={{ color: data.todayChange >= 0 ? colors.success : colors.danger, fontWeight: 800, lineHeight: 1.2 }}>
                {data.todayChange >= 0 ? '+' : ''}${money(data.todayChange)}
              </div>
              <div style={{ fontSize: '0.78rem', color: colors.textMuted, marginTop: 6, overflowWrap: 'anywhere' }}>{data.todayChange === 0 ? 'No movement today' : 'Posted today'}</div>
            </div>
            <div style={{ ...glass, borderRadius: 18, padding: 'clamp(1rem, 2vw, 1.4rem)', minWidth: 0, flex: '1 1 160px', overflow: 'hidden' }}>
              <div style={{ color: colors.textMuted, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, overflowWrap: 'anywhere' }}>{t('netWorth')}</div>
              <div className="dash-figure dash-figure-stat" style={{ color: colors.text, fontWeight: 800, lineHeight: 1.2 }}>${money(data.netWorth)}</div>
              <div style={{ fontSize: '0.78rem', color: colors.textMuted, marginTop: 6, overflowWrap: 'anywhere' }}>All accounts included</div>
            </div>
            <div style={{ ...glass, borderRadius: 18, padding: 'clamp(1rem, 2vw, 1.4rem)', minWidth: 0, flex: '1 1 160px', overflow: 'hidden' }}>
              <div style={{ color: colors.textMuted, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, overflowWrap: 'anywhere' }}>{t('monthlyGrowth')}</div>
              <div className="dash-figure dash-figure-stat" style={{ color: data.monthlyGrowth >= 0 ? colors.gold : colors.danger, fontWeight: 800, lineHeight: 1.2 }}>
                {data.monthlyGrowth >= 0 ? '+' : ''}${money(data.monthlyGrowth)}
              </div>
              <div style={{ fontSize: '0.78rem', color: colors.textMuted, marginTop: 6, overflowWrap: 'anywhere' }}>{data.monthlyGrowth > 0 ? 'Growing this month' : data.monthlyGrowth < 0 ? 'Net outflow this month' : 'No change yet'}</div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: '0.75rem clamp(1rem, 3vw, 2rem)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 22, flexWrap: 'wrap' }}>
          {TRUST_BADGES.map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: colors.textMuted, fontWeight: 600 }}>
              <span>{b.icon}</span>{b.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(1.1rem, 3vw, 2rem)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.72rem', color: colors.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.8rem' }}>{t('quickActions')}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map(a => (
              <Link key={a.href} href={a.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0.85rem 1rem', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, textDecoration: 'none', minWidth: 0, flex: '1 1 96px', boxShadow: colors.cardShadow }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{a.icon}</span>
                <span style={{ color: colors.text, fontSize: '0.78rem', fontWeight: 700, textAlign: 'center', maxWidth: '100%', overflowWrap: 'anywhere' }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="dash-perf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: '1.5rem' }}>
          <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, boxShadow: colors.cardShadow, padding: '1.35rem 1.35rem 0.4rem', minWidth: 0, overflow: 'hidden' }}>
            <h2 style={{ margin: 0, color: colors.text, fontWeight: 700, fontSize: '1.05rem' }}>Portfolio performance</h2>
            <div style={{ color: colors.textMuted, fontSize: '0.8rem', margin: '4px 0 8px', overflowWrap: 'anywhere' }}>Your balance at the close of each of the last seven months</div>
            <div className="dash-chart">
            <Chart
              options={{
                chart: { id: 'growth', toolbar: { show: false }, background: 'transparent', fontFamily: "'Inter', sans-serif" },
                xaxis: { categories: data.chartLabels, labels: { style: { colors: chartLabelColor, fontSize: '0.72rem' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                yaxis: { labels: { style: { colors: chartLabelColor, fontSize: '0.72rem' }, formatter: (v: number) => `$${(v / 1000).toFixed(0)}k` } },
                colors: [colors.gold],
                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.02, stops: [0, 100] } },
                stroke: { curve: 'smooth', width: 2.8 },
                dataLabels: { enabled: false },
                grid: { borderColor: chartGridColor, strokeDashArray: 4 },
                tooltip: { theme: isLight ? 'light' : 'dark' },
                theme: { mode: isLight ? 'light' : 'dark' },
              }}
              series={[{ name: 'Balance', data: data.chartData }]}
              type="area"
              height={240}
            />
            </div>
          </div>
          <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, boxShadow: colors.cardShadow, padding: '1.35rem', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h2 style={{ margin: 0, color: colors.text, fontWeight: 700, fontSize: '1.05rem' }}>{t('accounts')}</h2>
              <Link href="/accounts" style={{ color: colors.gold, fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>{t('viewAll')}</Link>
            </div>
            {data.accounts.length === 0 && <div style={{ color: colors.textMuted, fontSize: '0.9rem' }}>No accounts found.</div>}
            {data.accounts.map((acc: any, i: number) => (
              <div key={acc.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0.75rem 0', borderBottom: i < data.accounts.length - 1 ? `1px solid ${colors.border}` : 'none', minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {ACC_ICONS[acc.type] ?? '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name || acc.type}</div>
                  <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: 2 }}>{acc.type}</div>
                </div>
                <div className="dash-figure" style={{ fontWeight: 800, fontSize: '0.92rem', color: colors.text, textAlign: 'right', maxWidth: '46%' }}>${money(acc.balance)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, boxShadow: colors.cardShadow, padding: '1.25rem 1.35rem', marginBottom: '1.5rem', minWidth: 0, overflow: 'hidden' }}>
          <h2 style={{ margin: '0 0 0.85rem', color: colors.text, fontWeight: 700, fontSize: '1.05rem' }}>{t('marketPulse')}</h2>
          <MarketPulse colors={colors} />
        </div>

        <div className="dash-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
          <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, boxShadow: colors.cardShadow, padding: '1.35rem', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: '0.6rem' }}>
              <h2 style={{ margin: 0, color: colors.text, fontWeight: 700, fontSize: '1.05rem' }}>{t('recentTransactions')}</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => user?.email && exportCSV(user.email, 'Client')} style={{ background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 12px', color: colors.text, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>CSV</button>
                <button onClick={() => user?.email && exportPDF(user.email, 'Client')} style={{ background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 12px', color: colors.text, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>PDF</button>
                <Link href="/accounts" style={{ color: colors.gold, fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>{t('viewAll')}</Link>
              </div>
            </div>
            {data.recentTx.length === 0 ? (
              <div style={{ color: colors.textMuted, fontSize: '0.95rem', padding: '0.6rem 0' }}>No recent transactions.</div>
            ) : data.recentTx.map((tx: any, i: number) => {
              const debit = (tx.type ?? tx.kind ?? '').toLowerCase().includes('debit') || (tx.amount ?? 0) < 0;
              const amt = Math.abs(tx.amount ?? 0);
              const isPending = tx.status === 'pending';
              return (
                <div key={tx.id ?? i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0.8rem 0', borderTop: `1px solid ${colors.border}`, opacity: isPending ? 0.75 : 1, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: isPending ? colors.goldBg : debit ? `${colors.danger}14` : `${colors.success}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isPending ? colors.gold : debit ? colors.danger : colors.success, fontWeight: 800 }}>
                    {isPending ? '…' : debit ? '↑' : '↓'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: colors.text, overflowWrap: 'anywhere' }}>{tx.description ?? tx.label ?? 'Transaction'}</div>
                    <div style={{ fontSize: '0.78rem', color: colors.textMuted, marginTop: 3 }}>
                      {[tx.accountType, tx.date ? new Date(tx.date).toLocaleDateString() : '', isPending ? 'Pending' : ''].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className="dash-figure" style={{ fontWeight: 800, fontSize: '0.92rem', color: isPending ? colors.textMuted : debit ? colors.danger : colors.success, textAlign: 'right', maxWidth: '42%' }}>
                    {debit ? '-' : '+'}${money(amt)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.borderStrong}`, boxShadow: colors.cardShadow, padding: '1.35rem', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ color: colors.gold, fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Londway insight</div>
            <div style={{ color: colors.text, fontSize: '0.98rem', lineHeight: 1.7, flex: 1 }}>{data.insight}</div>
            <Link href="/insights" style={{ marginTop: '1.1rem', color: colors.gold, fontWeight: 700, fontSize: '0.92rem', textDecoration: 'none' }}>View all insights</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
