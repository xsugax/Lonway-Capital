"use client";
declare global {
  interface Window {
    _smartsupp?: any;
  }
}
import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';
import { getBankAccounts, saveBankAccounts, getTransfers } from '../lib/store';
import { cloudLookup, cloudGetUserTransfers } from '../lib/cloud';
import { useLang } from '../contexts/LanguageContext';
import { exportCSV, exportPDF } from '../lib/exportData';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

const Chart = dynamic(() => import('react-apexcharts').then(mod => mod.default), { ssr: false });

// ─── Premium Globe Network SVG ──────────────────────────────────────────────
// A sophisticated globe with connection nodes — conveys global reach & technology
function GlobeNetwork({ gold, isDark }: { gold: string; isDark: boolean }) {
  const baseOpacity = isDark ? 1 : 0.6;
  // Deterministic nodes around globe perimeter
  const nodes = [
    { cx: 420, cy: 60, r: 3 }, { cx: 510, cy: 85, r: 2.5 }, { cx: 560, cy: 130, r: 3.5 },
    { cx: 580, cy: 190, r: 2 }, { cx: 550, cy: 250, r: 3 }, { cx: 490, cy: 290, r: 2.5 },
    { cx: 420, cy: 310, r: 2 }, { cx: 350, cy: 290, r: 3 }, { cx: 290, cy: 250, r: 2.5 },
    { cx: 270, cy: 190, r: 3.5 }, { cx: 290, cy: 130, r: 2 }, { cx: 340, cy: 85, r: 3 },
  ];
  // Connection lines between nodes (deterministic pairs)
  const connections = [
    [0,2],[0,5],[1,4],[2,7],[3,8],[4,9],[5,10],[6,11],[7,1],[8,3],[9,0],[10,6],[11,4],
    [0,8],[2,10],[1,7],[3,11],[5,9],
  ];
  return (
    <svg viewBox="0 0 840 370" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', bottom: 0, right: 0, height: '100%', width: '60%', pointerEvents: 'none' }}>
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
        {/* Globe outline */}
        <circle cx="420" cy="185" r="130" stroke={gold} strokeWidth="0.8" fill="url(#globeGrad)"/>
        <ellipse cx="420" cy="185" rx="130" ry="45" stroke={gold} strokeWidth="0.4"/>
        <ellipse cx="420" cy="185" rx="90" ry="130" stroke={gold} strokeWidth="0.4"/>
        <ellipse cx="420" cy="185" rx="45" ry="130" stroke={gold} strokeWidth="0.3"/>
        {/* Latitude lines */}
        {[-65,-30,0,30,65].map((offset, i) => (
          <ellipse key={i} cx="420" cy={185 + offset} rx={Math.sqrt(130*130 - offset*offset)} ry="8" stroke={gold} strokeWidth="0.3"/>
        ))}
        {/* Connection lines */}
        {connections.map(([a, b], i) => (
          <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
            stroke={gold} strokeWidth="0.5" strokeDasharray="3,4" opacity="0.6"/>
        ))}
        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.cx} cy={n.cy} r={n.r * 2.5} fill={gold} opacity="0.08"/>
            <circle cx={n.cx} cy={n.cy} r={n.r} fill={gold} opacity="0.7"/>
          </g>
        ))}
        {/* Orbital rings */}
        {[155, 180, 210].map((r, i) => (
          <circle key={i} cx="420" cy="185" r={r} stroke={gold} strokeWidth="0.3" fill="none" strokeDasharray={`${4+i*2},${8+i*3}`}/>
        ))}
      </g>
      {/* Accent glow at bottom */}
      <ellipse cx="420" cy="360" rx="300" ry="30" fill={gold} opacity="0.025"/>
    </svg>
  );
}

// ─── Trust Shield Badge SVG ──────────────────────────────────────────────────
function ShieldBadge({ gold }: { gold: string }) {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
      <path d="M9 1L16 4.5V9.5C16 13.5 13 17 9 19C5 17 2 13.5 2 9.5V4.5L9 1Z" stroke={gold} strokeWidth="1.2" fill={`${gold}12`}/>
      <path d="M6 10L8 12L12 8" stroke={gold} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const w = 120, h = 36;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spk-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#spk-${color.replace('#', '')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Market Pulse Ticker ──────────────────────────────────────────────────────
const MARKET_DATA = [
  { symbol: 'BTC', name: 'Bitcoin',   price: '$43,820', change: '+2.14%', up: true  },
  { symbol: 'ETH', name: 'Ethereum',  price: '$2,384',  change: '+1.62%', up: true  },
  { symbol: 'XAU', name: 'Gold',      price: '$2,047',  change: '+0.38%', up: true  },
  { symbol: 'EUR', name: 'EUR/USD',   price: '1.0842',  change: '-0.21%', up: false },
  { symbol: 'SPX', name: 'S&P 500',   price: '5,148',   change: '+0.73%', up: true  },
];

function MarketPulse({ colors }: { colors: any }) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
      {MARKET_DATA.map((m, i) => (
        <div key={i} style={{ flexShrink: 0, background: colors.surface, border: `1px solid ${m.up ? colors.success : colors.danger}22`, borderRadius: 14, padding: '0.85rem 1.1rem', minWidth: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
            <span style={{ color: colors.textFaint, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>{m.symbol}</span>
            <span style={{ fontSize: '0.62rem', color: m.up ? colors.success : colors.danger, background: `${m.up ? colors.success : colors.danger}15`, borderRadius: 5, padding: '1px 5px', fontWeight: 700 }}>{m.change}</span>
          </div>
          <div style={{ color: colors.text, fontWeight: 700, fontSize: '0.92rem' }}>{m.price}</div>
          <div style={{ color: colors.textFaint, fontSize: '0.62rem', marginTop: 2 }}>{m.name}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '↗', label: 'Transfer',  href: '/transfer',  color: '#4A90D9' },
  { icon: '💳', label: 'Cards',     href: '/cards',     color: '#C4A052' },
  { icon: '🏦', label: 'Vaults',    href: '/vaults',    color: '#7FD4A0' },
  { icon: '📈', label: 'Invest',    href: '/invest',    color: '#A78BFA' },
  { icon: '💡', label: 'Insights',  href: '/insights',  color: '#FB923C' },
  { icon: '👤', label: 'Profile',   href: '/profile',   color: '#F472B6' },
];

// ─── Account Icon ─────────────────────────────────────────────────────────────
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
  // Smartsupp live chat widget
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const prev = document.getElementById('smartsupp-script');
      if (prev) prev.remove();
      window._smartsupp = window._smartsupp || {};
      window._smartsupp.key = '0f05a7950227b39655dc10ec78004dd2f661d277';
      const script = document.createElement('script');
      script.id = 'smartsupp-script';
      script.type = 'text/javascript';
      script.async = true;
      script.charset = 'utf-8';
      script.src = 'https://www.smartsuppchat.com/loader.js?';
      document.head.appendChild(script);
    }
  }, []);

  const { colors, theme } = useTheme();
  const { t } = useLang();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [clock, setClock] = React.useState('');
  const [tzName, setTzName] = React.useState('');

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
    async function loadDashboard() {
      // 1. Re-sync bank accounts + account tier from cloud to get latest admin changes
      if (user?.email) {
        try {
          const cloud = await cloudLookup(user.email);
          if (cloud) {
            if (cloud.bank_accounts && cloud.bank_accounts.length > 0) {
              saveBankAccounts(cloud.bank_accounts, cloud.email);
            }
            // Sync tier, frozen, blocked status from cloud → localStorage
            try {
              const raw = localStorage.getItem('londway_accounts');
              if (raw) {
                const accts = JSON.parse(raw);
                const idx = accts.findIndex((a: any) => a.email?.toLowerCase() === cloud.email.toLowerCase());
                if (idx !== -1) {
                  let dirty = false;
                  if (cloud.tier && accts[idx].tier !== cloud.tier) { accts[idx].tier = cloud.tier; dirty = true; }
                  if (cloud.name && accts[idx].name !== cloud.name) { accts[idx].name = cloud.name; dirty = true; }
                  if (cloud.role && accts[idx].role !== cloud.role) { accts[idx].role = cloud.role; dirty = true; }
                  if (dirty) localStorage.setItem('londway_accounts', JSON.stringify(accts));
                }
              }
            } catch {}
          }
        } catch {}
      }

      // 2. Read bank accounts (now includes admin debits from cloud sync)
      const accounts = getBankAccounts(user?.email);
      const totalBalance = accounts.reduce((sum: number, acc: any) => sum + (acc.balance ?? 0), 0);

      // 3. Gather transactions from bank accounts (admin debits/credits)
      const allTx: any[] = [];
      const seenIds = new Set<string>();
      accounts.forEach((acc: any) => {
        (acc.transactions ?? []).forEach((tx: any) => {
          if (tx.id && seenIds.has(tx.id)) return;
          if (tx.id) seenIds.add(tx.id);
          allTx.push({ ...tx, accountType: acc.type });
        });
      });

      // 4. Merge user-submitted transfers (local + cloud) into transaction history
      if (user?.email) {
        try {
          const localTransfers = getTransfers(user.email);
          let cloudTransfers: any[] = [];
          try { cloudTransfers = await cloudGetUserTransfers(user.email); } catch {}
          // Deduplicate local + cloud transfers
          const txIds = new Set(localTransfers.map((t: any) => t.id));
          const merged = [...localTransfers, ...cloudTransfers.filter((ct: any) => !txIds.has(ct.id))];
          // Add completed/pending transfers as transaction entries
          merged.forEach((t: any) => {
            const tid = t.id || `tf-${t.reference}`;
            if (seenIds.has(tid)) return;
            seenIds.add(tid);
            const isPending = t.status === 'pending';
            allTx.push({
              id: tid,
              type: 'debit',
              description: isPending
                ? `Transfer to ${t.recipientName || t.recipient_name} (Pending)`
                : `Transfer to ${t.recipientName || t.recipient_name}`,
              amount: Number(t.amount),
              date: t.createdAt || t.created_at,
              status: t.status || 'completed',
              accountType: 'Checking',
            });
          });
        } catch {}
      }

      allTx.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
      setData({
        totalBalance,
        netWorth: totalBalance,
        todayChange: 0,
        monthlyGrowth: 0,
        chartData: [0, 0, 0, 0, 0, 0, Math.round(totalBalance)],
        chartLabels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        accounts,
        recentTx: allTx.slice(0, 6),
        insight: 'Your spending is on track this month. Consider increasing your vault contribution by 5% to reach your goal faster.',
      });
      setLoading(false);
    }
    loadDashboard();
  }, []);

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

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Hero Section ── */}
      <section className="dash-hero" style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(1.2rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2rem) clamp(1rem, 2vw, 2rem)' }}>
        <GlobeNetwork gold={colors.gold} isDark={isDark} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: '0.9rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.58rem', color: colors.success, fontWeight: 600, letterSpacing: '0.08em' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.success, boxShadow: `0 0 8px ${colors.success}` }}/>
              SECURE SESSION
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', color: colors.gold, fontWeight: 700, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.3rem 0.9rem', letterSpacing: '0.08em' }}>
              Assets under management: $2.5T
            </div>
            {clock && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: colors.goldBg, border: `1px solid ${colors.border}`, borderRadius: 100, padding: '0.3rem 0.9rem', fontSize: '0.62rem', color: colors.textMuted, fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                🕐 {clock} · {tzName}
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.6rem)', fontWeight: 800, color: colors.text, margin: '0 0 0.3rem', lineHeight: 1.15, letterSpacing: '-0.025em' }}>
            {greeting},
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '0.95rem', margin: '0 0 2rem', lineHeight: 1.6 }}>
            {t('financialOverview')}
          </p>

          {/* Balance hero strip */}
          <div className="dash-hero-cards" style={{ display: 'flex', gap: 'clamp(8px, 2vw, 18px)', flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* Total Balance Card */}
            <div style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${colors.borderStrong}`,
              borderRadius: 18, padding: 'clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 2rem)',
              minWidth: 0, flex: '1 1 auto', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${colors.gold}08` }}/>
              <div style={{ color: colors.textFaint, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{t('totalBalance')}</div>
              <div className="dash-balance" style={{ color: colors.gold, fontSize: 'clamp(1.6rem, 6vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                ${data.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ marginTop: 8 }}>
                <MiniSparkline values={data.chartData} color={colors.gold}/>
              </div>
            </div>

            {/* Today's Change */}
            <div style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${colors.border}`,
              borderRadius: 18, padding: 'clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 1.8rem)', minWidth: 0, flex: '1 1 auto',
            }}>
              <div style={{ color: colors.textFaint, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{t('todayChange')}</div>
              <div className="dash-sub-value" style={{ color: colors.success, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>+${data.todayChange.toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: colors.success, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>▲</span> 0.72% today
              </div>
            </div>

            {/* Net Worth */}
            <div style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${colors.border}`,
              borderRadius: 18, padding: 'clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 1.8rem)', minWidth: 0, flex: '1 1 auto',
            }}>
              <div style={{ color: colors.textFaint, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{t('netWorth')}</div>
              <div className="dash-sub-value" style={{ color: colors.text, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>${data.netWorth.toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: colors.textMuted, marginTop: 4 }}>All assets included</div>
            </div>

            {/* Monthly Growth */}
            <div style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${colors.border}`,
              borderRadius: 18, padding: 'clamp(1rem, 2vw, 1.5rem) clamp(1rem, 2vw, 1.8rem)', minWidth: 0, flex: '1 1 auto',
            }}>
              <div style={{ color: colors.textFaint, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{t('monthlyGrowth')}</div>
              <div className="dash-sub-value" style={{ color: data.monthlyGrowth >= 0 ? colors.gold : colors.danger, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>{data.monthlyGrowth >= 0 ? '+' : ''}${data.monthlyGrowth.toLocaleString()}</div>
              <div style={{ fontSize: '0.68rem', color: data.monthlyGrowth > 0 ? colors.success : colors.textFaint, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                {data.monthlyGrowth > 0 ? <><span>▲</span> Growing</> : 'No change yet'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <div style={{
        background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)',
        borderBottom: `1px solid ${colors.border}`,
        padding: '0.7rem clamp(1rem, 3vw, 2rem)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
          {TRUST_BADGES.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: colors.textFaint, fontWeight: 600, letterSpacing: '0.06em' }}>
              <span style={{ fontSize: '0.7rem' }}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)' }}>

        {/* ── Quick Actions ── */}
        <div style={{ marginBottom: '1.8rem' }}>
          <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.9rem' }}>{t('quickActions')}</div>
          <div className="dash-quick-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map((a, i) => (
              <Link key={i} href={a.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0.8rem 1rem', background: `${a.color}0D`, border: `1px solid ${a.color}25`, borderRadius: 14, cursor: 'pointer', textDecoration: 'none', minWidth: 0, flex: '1 1 auto', transition: 'all 0.18s' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{a.icon}</span>
                <span style={{ color: colors.textMuted, fontSize: '0.68rem', fontWeight: 600 }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Portfolio Performance + Accounts ── */}
        <div className="dash-perf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: '1.8rem' }}>
          {/* Area Chart */}
          <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, padding: '1.5rem 1.5rem 0.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: '50%', background: `${colors.gold}04`, filter: 'blur(30px)', pointerEvents: 'none' }}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <h3 style={{ margin: 0, color: colors.text, fontWeight: 700, fontSize: '1rem' }}>Portfolio Performance</h3>
                <div style={{ color: colors.textFaint, fontSize: '0.65rem', marginTop: 2 }}>7-month wealth trajectory</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ background: `${colors.success}18`, color: colors.success, fontSize: '0.62rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20, border: `1px solid ${colors.success}28` }}>▲ +7.2%</span>
                <span style={{ background: colors.goldBg, color: colors.gold, fontSize: '0.62rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20, border: `1px solid ${colors.borderStrong}` }}>7 months</span>
              </div>
            </div>
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

          {/* Accounts Panel */}
          <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, color: colors.text, fontWeight: 700, fontSize: '1rem' }}>{t('accounts')}</h3>
              <Link href="/accounts" style={{ color: colors.gold, fontSize: '0.68rem', fontWeight: 700, textDecoration: 'none' }}>{t('viewAll')}</Link>
            </div>
            {data.accounts.length === 0 && <div style={{ color: colors.textFaint, fontSize: '0.85rem' }}>No accounts found.</div>}
            {data.accounts.map((acc: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0.75rem 0', borderBottom: i < data.accounts.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {ACC_ICONS[acc.type] ?? '💳'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.type}</div>
                  <div style={{ fontSize: '0.62rem', color: colors.textFaint, marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: colors.success }}/>
                    Active · Londway
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: colors.gold, flexShrink: 0 }}>${acc.balance?.toLocaleString()}</div>
              </div>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: colors.textFaint, fontWeight: 600 }}>Total across {data.accounts.length} accounts</span>
              <span style={{ fontSize: '0.9rem', color: colors.gold, fontWeight: 800 }}>${data.totalBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Market Pulse ── */}
        <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, padding: '1.4rem 1.5rem', marginBottom: '1.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '1rem', color: colors.text, fontWeight: 700 }}>{t('marketPulse')}</div>
              <div style={{ fontSize: '0.62rem', color: colors.textFaint, marginTop: 2 }}>Real-time global markets</div>
            </div>
            <span style={{ background: `${colors.success}18`, color: colors.success, fontSize: '0.62rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20, border: `1px solid ${colors.success}28` }}>● LIVE</span>
          </div>
          <MarketPulse colors={colors}/>
        </div>

        {/* ── Bottom Row: Recent Transactions + AI Insight ── */}
        <div className="dash-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14 }}>
          {/* Recent Transactions */}
          <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.text, fontWeight: 700, fontSize: '1rem' }}>{t('recentTransactions')}</h3>
                <div style={{ color: colors.textFaint, fontSize: '0.62rem', marginTop: 2 }}>Latest activity across all accounts</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => user?.email && exportCSV(user.email, 'Client')} title="Download CSV" style={{ background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: '4px 10px', color: colors.gold, fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>CSV</button>
                <button onClick={() => user?.email && exportPDF(user.email, 'Client')} title="Print / Save PDF" style={{ background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 8, padding: '4px 10px', color: colors.gold, fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>PDF</button>
                <Link href="/accounts" style={{ color: colors.gold, fontSize: '0.68rem', fontWeight: 700, textDecoration: 'none' }}>{t('viewAll')}</Link>
              </div>
            </div>
            {data.recentTx.length === 0 ? (
              <div style={{ color: colors.textFaint, fontSize: '0.85rem' }}>No recent transactions.</div>
            ) : (
              data.recentTx.map((tx: any, i: number) => {
                const debit = (tx.type ?? tx.kind ?? '').toLowerCase().includes('debit') || (tx.amount ?? 0) < 0;
                const amt = Math.abs(tx.amount ?? 0);
                const isPending = tx.status === 'pending';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.7rem 0', borderBottom: i < data.recentTx.length - 1 ? `1px solid ${colors.border}` : 'none', opacity: isPending ? 0.7 : 1 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: isPending ? `${colors.gold}12` : debit ? `${colors.danger}12` : `${colors.success}12`, border: `1px solid ${isPending ? colors.gold : debit ? colors.danger : colors.success}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                      {isPending ? '⏳' : debit ? '↑' : '↓'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description ?? tx.label ?? 'Transaction'}</div>
                      <div style={{ fontSize: '0.62rem', color: colors.textFaint, marginTop: 1 }}>
                        {tx.accountType ?? ''} · {tx.date ? new Date(tx.date).toLocaleDateString() : ''}
                        {isPending && <span style={{ marginLeft: 6, background: `${colors.gold}18`, color: colors.gold, padding: '1px 6px', borderRadius: 4, fontSize: '0.58rem', fontWeight: 700 }}>PENDING</span>}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isPending ? colors.gold : debit ? colors.danger : colors.success, flexShrink: 0 }}>{debit ? '-' : '+'}${amt.toLocaleString()}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* AI Insight */}
          <div style={{
            background: `linear-gradient(145deg, ${colors.surface} 0%, ${colors.surface2} 100%)`,
            borderRadius: 18, border: `1px solid ${colors.borderStrong}`,
            padding: '1.5rem', display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${colors.gold}40, transparent)` }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>🤖</div>
              <div>
                <div style={{ color: colors.gold, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Londway AI Insight</div>
                <div style={{ color: colors.textFaint, fontSize: '0.58rem', marginTop: 1 }}>Personalized recommendation</div>
              </div>
            </div>
            <div style={{ color: colors.textMuted, fontSize: '0.88rem', lineHeight: 1.75, flex: 1 }}>{data.insight}</div>
            <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 8 }}>
              <Link href="/insights" style={{ flex: 1, padding: '0.6rem', background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 11, color: colors.gold, fontWeight: 700, fontSize: '0.72rem', textDecoration: 'none', textAlign: 'center', letterSpacing: '0.04em', transition: 'all 0.18s' }}>View All Insights →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed chat button for customer care */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .dash-perf-grid { grid-template-columns: 1fr !important; }
          .dash-bottom-grid { grid-template-columns: 1fr !important; }
          .dash-hero-cards { flex-direction: column !important; }
          .dash-hero-cards > div { min-width: 0 !important; flex: 1 1 100% !important; }
          .dash-hero { padding: 1rem !important; }
        }
        @media (max-width: 480px) {
          .dash-hero { padding: 0.8rem 0.6rem !important; }
          .dash-hero-cards > div { padding: 0.8rem !important; }
        }
      `}</style>
    </main>
  );
}
