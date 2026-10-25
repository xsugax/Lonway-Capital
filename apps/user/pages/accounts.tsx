'use client';
import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LanguageContext';
import { getBankAccounts, saveBankAccounts } from '../lib/store';
import { cloudLookup } from '../lib/cloud';
import { applyCloudBankAccounts } from '../lib/sync';
import { exportCSV, exportPDF } from '../lib/exportData';
import { PageSkeleton } from '../components/LoadingSkeleton';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
  currency: string;
}

interface Account {
  id: string;
  type: string;
  name: string;
  balance: number;
  currency: string;
  accountNumber?: string;
  recentActivity?: string;
  frozen?: boolean;
  transactions?: Transaction[];
}

const CARD_THEMES = [
  { bg: 'linear-gradient(135deg, #0D1628 0%, #1a2444 50%, #0D1628 100%)', accent: '#C4A052', alt: '#EAE0D0' },
  { bg: 'linear-gradient(135deg, #1a0d2e 0%, #2a1245 50%, #1a0d2e 100%)', accent: '#9b8fbf', alt: '#EAE0D0' },
  { bg: 'linear-gradient(135deg, #0d1a12 0%, #133320 50%, #0d1a12 100%)', accent: '#3D9E7A', alt: '#EAE0D0' },
];

function ChipSvg() {
  return (
    <svg width="38" height="30" viewBox="0 0 38 30" fill="none">
      <rect x="1" y="1" width="36" height="28" rx="5" fill="#b5942a" stroke="#C4A052" strokeWidth="1.2"/>
      <rect x="13" y="1" width="12" height="28" rx="2" fill="none" stroke="#C4A052" strokeWidth="0.8" opacity="0.5"/>
      <line x1="1" y1="10" x2="37" y2="10" stroke="#C4A052" strokeWidth="0.8" opacity="0.5"/>
      <line x1="1" y1="20" x2="37" y2="20" stroke="#C4A052" strokeWidth="0.8" opacity="0.5"/>
      <rect x="15" y="11" width="8" height="8" rx="1.5" fill="#C4A052" opacity="0.7"/>
    </svg>
  );
}

interface BankCardProps {
  account: Account;
  themeIdx: number;
  onFreeze: (id: string) => void;
  onCopy: (num: string) => void;
  copied: string | null;
  tFn: (k: string) => string;
}

function BankCard({ account, themeIdx, onFreeze, onCopy, copied, tFn }: BankCardProps) {
  const ct = CARD_THEMES[themeIdx % CARD_THEMES.length];
  const cardNum = account.accountNumber?.slice(-4) ?? '••••';
  const [hovered, setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const copyKey = account.accountNumber ?? account.id;

  useEffect(() => {
    if (!showMenu) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [showMenu]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: ct.bg, borderRadius: 20, padding: '1.8rem',
        position: 'relative', overflow: 'visible', cursor: 'default',
        transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease',
        transform: hovered ? 'translateY(-5px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.6), 0 0 50px ${ct.accent}18` : '0 8px 30px rgba(0,0,0,0.45)',
        border: `1px solid ${ct.accent}22`, minHeight: 190,
        opacity: account.frozen ? 0.75 : 1,
      }}
    >
      {/* Inner clip for background rings only */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden', pointerEvents: 'none' }}>
        {account.frozen && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,50,90,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
            <span style={{ color: '#A2B2BF', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.1em', background: 'rgba(0,0,0,0.55)', padding: '0.4rem 1rem', borderRadius: 8, border: '1px solid rgba(162,178,191,0.3)', pointerEvents: 'none' }}>❄ FROZEN</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: 200, height: 200, borderRadius: '50%', border: `1px solid ${ct.accent}12` }}/>
        <div style={{ position: 'absolute', top: '-10%', right: '5%', width: 140, height: 140, borderRadius: '50%', border: `1px solid ${ct.accent}08` }}/>
      </div>

      {/* Header: account info + ⋮ menu + chip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', position: 'relative', zIndex: 10 }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: ct.accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>{account.type}</div>
          <div style={{ color: ct.alt, fontWeight: 700, fontSize: '1rem' }}>{account.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* ⋮ Actions menu — always visible, works on mobile & desktop */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(prev => !prev); }}
              title="Account actions"
              style={{ background: `${ct.accent}20`, border: `1px solid ${ct.accent}40`, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ct.accent, fontSize: '1.1rem', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}
            >
              ⋮
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#0d1020', border: `1px solid ${ct.accent}30`, borderRadius: 10, zIndex: 200, minWidth: 175, boxShadow: '0 16px 48px rgba(0,0,0,0.85)', overflow: 'hidden' }}>
                <button
                  onClick={() => { onCopy(copyKey); setShowMenu(false); }}
                  style={{ display: 'block', width: '100%', padding: '0.8rem 1rem', background: 'none', border: 'none', borderBottom: `1px solid ${ct.accent}15`, color: ct.accent, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}
                >
                  {copied === copyKey ? `✓ ${tFn('copied')}` : `📋 ${tFn('copyAccountNo')}`}
                </button>
                <button
                  onClick={() => { onFreeze(account.id); setShowMenu(false); }}
                  style={{ display: 'block', width: '100%', padding: '0.8rem 1rem', background: 'none', border: 'none', color: account.frozen ? '#3D9E7A' : '#A2B2BF', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}
                >
                  {account.frozen ? `🔓 ${tFn('unfreezeCard')}` : `❄ ${tFn('freezeCard')}`}
                </button>
              </div>
            )}
          </div>
          <div style={{ opacity: 0.9 }}><ChipSvg /></div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, marginBottom: '1.2rem' }}>
        <div style={{ color: ct.accent, fontWeight: 800, fontSize: '1.7rem', letterSpacing: '-0.025em' }}>
          {account.currency}{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        {account.recentActivity && (
          <div style={{ color: `${ct.alt}65`, fontSize: '0.74rem', marginTop: 3 }}>{account.recentActivity}</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: '0.52rem', color: `${ct.alt}50`, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{tFn('validThru')}</div>
          <div style={{ color: ct.alt, fontSize: '0.74rem', fontWeight: 600, letterSpacing: '0.08em' }}>12/28</div>
        </div>
        <div style={{ color: `${ct.alt}60`, fontSize: '0.88rem', fontWeight: 600, letterSpacing: '0.12em' }}>•••• {cardNum}</div>
      </div>
    </div>
  );
}

export default function Accounts({ user }: { user: { token: string; email?: string; name?: string } }) {
  const { colors, theme } = useTheme();
  const { t } = useLang();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [freezeStatus, setFreezeStatus] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [moveModal, setMoveModal] = useState(false);
  const [moveFrom, setMoveFrom] = useState('');
  const [moveTo, setMoveTo] = useState('');
  const [moveAmount, setMoveAmount] = useState('');
  const [moveError, setMoveError] = useState('');
  const [moveSuccess, setMoveSuccess] = useState('');

  useEffect(() => {
    const list: Account[] = getBankAccounts(user?.email);
    setAccounts(list);
    const fs: Record<string, boolean> = {};
    list.forEach(a => { fs[a.id] = a.frozen ?? false; });
    setFreezeStatus(fs);
    setLoading(false);

    // Reconcile through the shared guard so a stale cloud zero cannot erase a known balance.
    if (user?.email) {
      (async () => {
        try {
          const cloud = await cloudLookup(user.email!);
          if (!cloud) return;
          applyCloudBankAccounts(user.email!, cloud);
          const reconciled = getBankAccounts(user.email);
          setAccounts(reconciled);
          const fs: Record<string, boolean> = {};
          reconciled.forEach(account => { fs[account.id] = account.frozen ?? false; });
          setFreezeStatus(fs);
        } catch (err) {
          console.error('[accounts] Cloud balance reconciliation failed:', err);
        }
      })();
    }
  }, [user?.email]);

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopied(val);
    setTimeout(() => setCopied(null), 2200);
  };

  const handleFreeze = (id: string) => {
    const isFrozen = freezeStatus[id];
    setFreezeStatus(prev => ({ ...prev, [id]: !isFrozen }));
    const accs = getBankAccounts(user?.email);
    const acc = accs.find((a: any) => a.id === id);
    if (acc) { acc.frozen = !isFrozen; saveBankAccounts(accs, user?.email); }
    setAccounts(accs);
  };

  const openMoveModal = () => {
    const accs = getBankAccounts(user?.email);
    if (accs.length < 2) return;
    setMoveFrom(accs[0]?.id || '');
    setMoveTo(accs[1]?.id || '');
    setMoveAmount('');
    setMoveError('');
    setMoveSuccess('');
    setMoveModal(true);
  };

  const handleMove = () => {
    setMoveError('');
    setMoveSuccess('');
    const amount = parseFloat(moveAmount);
    if (!amount || amount <= 0) { setMoveError('Enter a valid amount.'); return; }
    if (moveFrom === moveTo) { setMoveError('Source and destination must be different.'); return; }

    const accs = getBankAccounts(user?.email);
    const src = accs.find((a: any) => a.id === moveFrom);
    const dst = accs.find((a: any) => a.id === moveTo);
    if (!src || !dst) { setMoveError('Account not found.'); return; }
    if (src.frozen) { setMoveError(`${src.name} is frozen. Unfreeze it first.`); return; }
    if (dst.frozen) { setMoveError(`${dst.name} is frozen. Unfreeze it first.`); return; }
    if (amount > src.balance) { setMoveError(`Insufficient funds. ${src.name} balance: $${src.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`); return; }

    // Debit source
    src.balance -= amount;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const txId = `mv-${Date.now()}`;
    if (!src.transactions) src.transactions = [];
    src.transactions.unshift({
      id: txId + '-d',
      description: `Transfer to ${dst.name}`,
      amount,
      type: 'debit' as const,
      date: dateStr,
      currency: '$',
    });

    // Credit destination
    dst.balance += amount;
    if (!dst.transactions) dst.transactions = [];
    dst.transactions.unshift({
      id: txId + '-c',
      description: `Transfer from ${src.name}`,
      amount,
      type: 'credit' as const,
      date: dateStr,
      currency: '$',
    });

    src.recentActivity = `Moved $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} to ${dst.name}`;
    dst.recentActivity = `Received $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} from ${src.name}`;

    saveBankAccounts(accs, user?.email);
    setAccounts([...accs]);
    setMoveSuccess(`$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} moved from ${src.name} to ${dst.name}`);
    setMoveAmount('');
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);

  return (
    <main style={{ background: 'transparent', minHeight: '100%', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      <Head>
        <title>Accounts — Londway Capital | Private Banking</title>
        <meta name="description" content="Manage your Londway Capital bank accounts. Track balances, view transactions, and control your checking and savings accounts with premium private banking." />
      </Head>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(1.25rem, 3vw, 2.25rem) clamp(1rem, 3vw, 2rem) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ color: colors.text, fontWeight: 700, fontSize: 'clamp(1.6rem, 4vw, 2.15rem)', margin: 0, letterSpacing: '-0.03em' }}>{t('yourAccounts')}</h1>
            {!loading && accounts.length > 0 && (
              <p style={{ color: colors.textMuted, fontSize: '0.95rem', margin: '0.45rem 0 0' }}>
                {t('totalBalance')} {accounts[0]?.currency}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} · {t('acrossAccounts')}
              </p>
            )}
          </div>
          {!loading && accounts.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => user?.email && exportCSV(user.email, user?.name || 'Client')} style={{ background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: 10, padding: '0.7rem 0.95rem', color: colors.text, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>CSV</button>
              <button onClick={() => user?.email && exportPDF(user.email, user?.name || 'Client')} style={{ background: colors.gold, border: 'none', borderRadius: 10, padding: '0.7rem 0.95rem', color: theme === 'dark' ? '#1A1505' : '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Statement</button>
            </div>
          )}
        </div>
      </div>

      <section style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(1.2rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2rem)' }}>
        {loading ? (
          <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(1.2rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2rem)' }}><PageSkeleton /></div>
        ) : error ? (
          <div style={{ color: colors.danger, textAlign: 'center', marginTop: 40, background: `${colors.danger}10`, border: `1px solid ${colors.danger}28`, borderRadius: 12, padding: '1.6rem' }}>{error}</div>
        ) : (
          <>
            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, boxShadow: colors.cardShadow, marginBottom: '1.6rem' }}>
              {accounts.map((acc, i) => (
                <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0.95rem 1.2rem', borderTop: i === 0 ? 'none' : `1px solid ${colors.border}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: colors.text }}>{acc.name}</div>
                    <div style={{ fontSize: '0.85rem', color: colors.textMuted, marginTop: 2 }}>{acc.type}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: colors.text, flexShrink: 0 }}>
                    {acc.currency}{Number(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.6rem', marginBottom: '2.5rem' }}>
              {accounts.map((acc, i) => (
                <div key={acc.id}>
                  <BankCard
                    account={{ ...acc, frozen: freezeStatus[acc.id] ?? false }}
                    themeIdx={i}
                    onFreeze={handleFreeze}
                    onCopy={handleCopy}
                    copied={copied}
                    tFn={t}
                  />
                  <button
                    onClick={() => setExpandedId(expandedId === acc.id ? null : acc.id)}
                    style={{ width: '100%', marginTop: 8, padding: '0.5rem', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: 10, color: colors.textFaint, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                  >
                    {expandedId === acc.id ? '▲' : '▼'} {t('recentActivity')}
                  </button>
                  {expandedId === acc.id && (
                    <div style={{ marginTop: 8, background: colors.surface, borderRadius: 14, padding: '1rem', border: `1px solid ${colors.border}` }}>
                      {acc.transactions && acc.transactions.length > 0 ? (
                        acc.transactions.slice(0, 5).map((tx, ti) => (
                          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: ti < Math.min(acc.transactions!.length, 5) - 1 ? `1px solid ${colors.border}` : 'none' }}>
                            <div>
                              <div style={{ color: colors.text, fontSize: '0.8rem', fontWeight: 500 }}>{tx.description}</div>
                              <div style={{ color: colors.textFaint, fontSize: '0.67rem', marginTop: 1 }}>{tx.date}</div>
                            </div>
                            <span style={{ color: tx.type === 'credit' ? colors.success : colors.danger, fontWeight: 700, fontSize: '0.82rem', flexShrink: 0, marginLeft: 8 }}>
                              {tx.type === 'credit' ? '+' : '-'}{tx.currency}{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: colors.textFaint, fontSize: '0.8rem', textAlign: 'center', margin: '0.5rem 0' }}>{t('noTransactions')}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.2rem' }}>{t('quickActions')}</div>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {[
                  { icon: '↗', label: t('transfer'), href: '/transfer', color: colors.gold },
                  { icon: '⇄', label: 'Move Money', href: '#move', color: '#58a6ff' },
                  { icon: '＋', label: t('addAccount'), href: '#', color: colors.success },
                  { icon: '↙', label: t('deposit'), href: '#', color: '#9b8fbf' },
                  { icon: '₿', label: 'Crypto Fund', href: '/crypto', color: '#F7931A' },
                ].map(a => (
                  <a
                    key={a.label}
                    href={a.href}
                    onClick={a.href === '#move' ? (e: React.MouseEvent) => { e.preventDefault(); openMoveModal(); } : undefined}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '1rem 1.3rem', background: `${a.color}0f`, border: `1px solid ${a.color}22`, borderRadius: 14, cursor: 'pointer', textDecoration: 'none', minWidth: 88 }}
                  >
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, fontSize: '1.1rem', fontWeight: 800 }}>{a.icon}</span>
                    <span style={{ color: colors.textMuted, fontSize: '0.76rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{a.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ──────────── Move Money Modal ──────────── */}
      {moveModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setMoveModal(false); }}>
          <div style={{ background: colors.surface, borderRadius: 20, padding: 'clamp(1.5rem, 3vw, 2.5rem)', width: '100%', maxWidth: 420, border: `1px solid ${colors.border}`, boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: colors.text, fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Move Money</h2>
              <button onClick={() => setMoveModal(false)} style={{ background: 'none', border: 'none', color: colors.textFaint, fontSize: '1.3rem', cursor: 'pointer', padding: 4 }}>✕</button>
            </div>

            <label style={{ display: 'block', color: colors.textMuted, fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>From</label>
            <select value={moveFrom} onChange={e => { setMoveFrom(e.target.value); if (e.target.value === moveTo) { const other = accounts.find(a => a.id !== e.target.value); if (other) setMoveTo(other.id); } }}
              style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '0.9rem', marginBottom: '1rem', outline: 'none' }}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — ${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</option>)}
            </select>

            <label style={{ display: 'block', color: colors.textMuted, fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>To</label>
            <select value={moveTo} onChange={e => setMoveTo(e.target.value)}
              style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '0.9rem', marginBottom: '1rem', outline: 'none' }}>
              {accounts.filter(a => a.id !== moveFrom).map(a => <option key={a.id} value={a.id}>{a.name} — ${a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</option>)}
            </select>

            <label style={{ display: 'block', color: colors.textMuted, fontSize: '0.78rem', fontWeight: 600, marginBottom: 6 }}>Amount</label>
            <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.textFaint, fontWeight: 600 }}>$</span>
              <input type="number" min="0.01" step="0.01" value={moveAmount} onChange={e => setMoveAmount(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '0.7rem 0.9rem 0.7rem 2rem', borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {moveError && <div style={{ color: colors.danger, fontSize: '0.8rem', marginBottom: '0.8rem', padding: '0.6rem', background: `${colors.danger}10`, borderRadius: 8, border: `1px solid ${colors.danger}28` }}>{moveError}</div>}
            {moveSuccess && <div style={{ color: colors.success, fontSize: '0.8rem', marginBottom: '0.8rem', padding: '0.6rem', background: `${colors.success}10`, borderRadius: 8, border: `1px solid ${colors.success}28` }}>✓ {moveSuccess}</div>}

            <button onClick={handleMove}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})`, color: '#0D1628', fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em', marginTop: 4 }}>
              Move Funds
            </button>
            <p style={{ color: colors.textFaint, fontSize: '0.7rem', textAlign: 'center', marginTop: '0.7rem' }}>Instant · No fees · Between your own accounts</p>
          </div>
        </div>
      )}
    </main>
  );
}
