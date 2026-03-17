'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LanguageContext';
import { getBankAccounts, saveBankAccounts } from '../lib/store';

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
  const copyKey = account.accountNumber ?? account.id;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: ct.bg, borderRadius: 20, padding: '1.8rem',
        position: 'relative', overflow: 'hidden', cursor: 'default',
        transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease',
        transform: hovered ? 'translateY(-5px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.6), 0 0 50px ${ct.accent}18` : '0 8px 30px rgba(0,0,0,0.45)',
        border: `1px solid ${ct.accent}22`, minHeight: 190,
        opacity: account.frozen ? 0.75 : 1,
      }}
    >
      {account.frozen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,50,90,0.6)', borderRadius: 20, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#A2B2BF', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.1em', background: 'rgba(0,0,0,0.55)', padding: '0.4rem 1rem', borderRadius: 8, border: '1px solid rgba(162,178,191,0.3)' }}>❄ FROZEN</span>
        </div>
      )}
      <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: 200, height: 200, borderRadius: '50%', border: `1px solid ${ct.accent}12`, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', top: '-10%', right: '5%', width: 140, height: 140, borderRadius: '50%', border: `1px solid ${ct.accent}08`, pointerEvents: 'none' }}/>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: ct.accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>{account.type}</div>
          <div style={{ color: ct.alt, fontWeight: 700, fontSize: '1rem' }}>{account.name}</div>
        </div>
        <div style={{ opacity: 0.9 }}><ChipSvg /></div>
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

      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: 6, zIndex: 10, opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(5px)', transition: 'all 0.2s' }}>
        <button
          onClick={() => onCopy(copyKey)}
          style={{ background: `${ct.accent}22`, border: `1px solid ${ct.accent}44`, borderRadius: 7, padding: '0.28rem 0.65rem', color: ct.accent, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
        >
          {copied === copyKey ? tFn('copied') : tFn('copyAccountNo')}
        </button>
        <button
          onClick={() => onFreeze(account.id)}
          style={{ background: account.frozen ? 'rgba(61,158,122,0.15)' : 'rgba(100,160,220,0.12)', border: `1px solid ${account.frozen ? 'rgba(61,158,122,0.3)' : 'rgba(100,160,220,0.25)'}`, borderRadius: 7, padding: '0.28rem 0.65rem', color: account.frozen ? '#3D9E7A' : '#A2B2BF', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
        >
          {account.frozen ? tFn('unfreezeCard') : tFn('freezeCard')}
        </button>
      </div>
    </div>
  );
}

export default function Accounts({ user }: { user: { token: string; email?: string } }) {
  const { colors } = useTheme();
  const { t } = useLang();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [freezeStatus, setFreezeStatus] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const list: Account[] = getBankAccounts(user?.email);
    setAccounts(list);
    const fs: Record<string, boolean> = {};
    list.forEach(a => { fs[a.id] = a.frozen ?? false; });
    setFreezeStatus(fs);
    setLoading(false);
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

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0);

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${colors.border}`, padding: '2.5rem 2rem 2rem' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 40% 80% at 5% 50%, ${colors.goldBg} 0%, transparent 70%)`, pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: colors.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, boxShadow: `0 0 8px ${colors.gold}` }}/>
            {t('accountCenter').toUpperCase()}
          </div>
          <h1 style={{ color: colors.text, fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>{t('yourAccounts')}</h1>
          {!loading && accounts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ color: colors.textFaint, fontSize: '0.85rem' }}>{t('totalBalance')}:</span>
              <span style={{ color: colors.gold, fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                {accounts[0]?.currency}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span style={{ color: colors.textFaint, fontSize: '0.78rem' }}>{t('acrossAccounts')}</span>
            </div>
          )}
        </div>
      </div>

      <section style={{ maxWidth: 960, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: colors.gold, justifyContent: 'center', marginTop: 80, fontSize: '0.9rem' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 0.9s linear infinite' }}>
              <circle cx="10" cy="10" r="8" fill="none" stroke={`${colors.gold}25`} strokeWidth="2.5"/>
              <path d="M10 2 A8 8 0 0 1 18 10" stroke={colors.gold} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
            {t('loading')}
          </div>
        ) : error ? (
          <div style={{ color: colors.danger, textAlign: 'center', marginTop: 40, background: `${colors.danger}10`, border: `1px solid ${colors.danger}28`, borderRadius: 12, padding: '1.6rem' }}>{error}</div>
        ) : (
          <>
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
                  { icon: '＋', label: t('addAccount'), href: '#', color: colors.success },
                  { icon: '↙', label: t('deposit'), href: '#', color: '#9b8fbf' },
                  { icon: '₿', label: 'Crypto Fund', href: '/crypto', color: '#F7931A' },
                ].map(a => (
                  <a
                    key={a.label}
                    href={a.href}
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
    </main>
  );
}
