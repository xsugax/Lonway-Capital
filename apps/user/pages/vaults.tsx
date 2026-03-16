'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LanguageContext';
import { API_URL } from '../lib/api';

interface Vault {
  id: string;
  name: string;
  balance: number;
  goal: number;
  currency: string;
  createdAt?: string;
}

function VaultIcon({ pct, color }: { pct: number; color: string }) {
  const r = 42, cx = 50, cy = 50, sw = 7;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={100} height={100} viewBox="0 0 100 100" fill="none">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}15`} strokeWidth={sw}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.7s ease' }}/>
      <circle cx={cx} cy={cy} r={28} fill="none" stroke={`${color}30`} strokeWidth={2}/>
      <circle cx={cx} cy={cy} r={18} fill={`${color}10`} stroke={`${color}40`} strokeWidth={1.5}/>
      {[0, 45, 90, 135].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return <line key={deg} x1={cx + 5 * Math.cos(rad)} y1={cy + 5 * Math.sin(rad)} x2={cx + 16 * Math.cos(rad)} y2={cy + 16 * Math.sin(rad)} stroke={color} strokeWidth={2} strokeLinecap="round" opacity="0.7"/>;
      })}
      <circle cx={cx} cy={cy} r={4} fill={color} opacity="0.8"/>
      <rect x={cx + 17} y={cy - 4} width={9} height={7} rx={3} fill={`${color}60`}/>
    </svg>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  loading?: boolean;
  children: React.ReactNode;
  colors: any;
}

function Modal({ title, onClose, onSubmit, submitLabel, loading, children, colors }: ModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: colors.overlayBg, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: colors.surface, borderRadius: 20, padding: '2rem', minWidth: 340, maxWidth: 440, width: '100%', border: `1px solid ${colors.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: colors.text, fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textFaint, fontSize: '1.4rem', lineHeight: 1, padding: '0 4px' }}></button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: 10, color: colors.textMuted, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>Cancel</button>
          <button onClick={onSubmit} disabled={loading} style={{ flex: 2, padding: '0.75rem', background: colors.gold, border: 'none', borderRadius: 10, color: '#060913', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', opacity: loading ? 0.7 : 1 }}>{loading ? '...' : submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, colors }: any) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.7rem', color: colors.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '0.72rem 1rem', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, borderRadius: 10, color: colors.text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}/>
    </div>
  );
}

const VAULT_COLORS = ['#C4A052', '#9b8fbf', '#3D9E7A', '#E07040', '#4A90D9'];
const APY = 4.8;

export default function Vaults({ user }: { user: { token: string } }) {
  const { colors } = useTheme();
  const { t } = useLang();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newCurrency, setNewCurrency] = useState('$');
  const [creating, setCreating] = useState(false);

  const [activeModal, setActiveModal] = useState<{ type: 'topup' | 'withdraw'; vault: Vault } | null>(null);
  const [modalAmount, setModalAmount] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchVaults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/vaults`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch vaults');
      const data = await res.json();
      setVaults(Array.isArray(data) ? data : (data.vaults ?? []));
    } catch (err: any) {
      setError(err.message ?? 'Error loading vaults');
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => { fetchVaults(); }, [fetchVaults]);

  const handleCreate = async () => {
    if (!newName.trim() || !newGoal) return;
    setCreating(true);
    try {
      await fetch(`${API_URL}/vaults`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, goal: parseFloat(newGoal), currency: newCurrency }),
      });
      setShowCreate(false);
      setNewName(''); setNewGoal('');
      fetchVaults();
    } catch {} finally { setCreating(false); }
  };

  const handleAction = async () => {
    if (!activeModal || !modalAmount) return;
    setModalLoading(true);
    const { type, vault } = activeModal;
    try {
      await fetch(`${API_URL}/vaults/${vault.id}/${type === 'topup' ? 'deposit' : 'withdraw'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(modalAmount) }),
      });
      setActiveModal(null);
      setModalAmount('');
      fetchVaults();
    } catch {} finally { setModalLoading(false); }
  };

  const getProjectedMonths = (v: Vault) => {
    const remaining = v.goal - v.balance;
    if (remaining <= 0) return null;
    const monthlyRate = APY / 12 / 100;
    const monthly = 300;
    const months = Math.ceil(remaining / (monthly + v.balance * monthlyRate));
    return months > 0 ? months : 1;
  };

  const getInterestEarned = (v: Vault) => ((v.balance * (APY / 100) * 90) / 365).toFixed(2);

  const totalSaved = vaults.reduce((s, v) => s + v.balance, 0);

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${colors.border}`, padding: '2.5rem 2rem 2rem' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 40% 80% at 5% 50%, ${colors.goldBg} 0%, transparent 70%)`, pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: colors.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, boxShadow: `0 0 8px ${colors.gold}` }}/>
              {t('savingsVaults').toUpperCase()}
            </div>
            <h1 style={{ color: colors.text, fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>{t('yourVaults')}</h1>
            {!loading && vaults.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color: colors.textFaint, fontSize: '0.85rem' }}>{t('totalBalance')}:</span>
                <span style={{ color: colors.gold, fontWeight: 800, fontSize: '1.4rem' }}>{vaults[0]?.currency}{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span style={{ background: 'rgba(61,158,122,0.1)', color: colors.success, fontSize: '0.7rem', fontWeight: 700, borderRadius: 6, padding: '2px 8px', border: '1px solid rgba(61,158,122,0.2)' }}>{APY}% {t('apy')}</span>
              </div>
            )}
          </div>
          <button onClick={() => setShowCreate(true)} style={{ padding: '0.75rem 1.5rem', background: colors.gold, border: 'none', borderRadius: 12, color: '#060913', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 }}>
            ＋ {t('createVault')}
          </button>
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
        ) : vaults.length === 0 ? (
          <div style={{ textAlign: 'center', color: colors.textFaint, marginTop: 60, padding: '3rem', background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}></div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: colors.text, marginBottom: 6 }}>No vaults yet</div>
            <div style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Create your first savings vault to start earning {APY}% APY</div>
            <button onClick={() => setShowCreate(true)} style={{ padding: '0.75rem 2rem', background: colors.gold, border: 'none', borderRadius: 12, color: '#060913', fontWeight: 700, cursor: 'pointer' }}>＋ {t('createVault')}</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.4rem' }}>
            {vaults.map((vault, i) => {
              const pct = Math.min(100, vault.goal > 0 ? (vault.balance / vault.goal) * 100 : 0);
              const color = VAULT_COLORS[i % VAULT_COLORS.length];
              const remaining = Math.max(0, vault.goal - vault.balance);
              const months = getProjectedMonths(vault);
              const interest = getInterestEarned(vault);
              return (
                <div key={vault.id} style={{ background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>SAVINGS VAULT</div>
                      <div style={{ color: colors.text, fontWeight: 700, fontSize: '1.05rem' }}>{vault.name}</div>
                    </div>
                    <VaultIcon pct={pct} color={color} />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ color, fontWeight: 800, fontSize: '1.55rem', letterSpacing: '-0.02em' }}>
                      {vault.currency}{(vault.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ color: colors.textFaint, fontSize: '0.76rem', marginTop: 2 }}>
                      of {vault.currency}{(vault.goal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} goal
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.67rem', color: colors.textFaint, fontWeight: 600 }}>{t('progress')}</span>
                      <span style={{ fontSize: '0.67rem', color, fontWeight: 700 }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 6, background: `${color}18`, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.7s ease', boxShadow: `0 0 8px ${color}55` }}/>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1.2rem' }}>
                    {[
                      { label: t('remaining'), value: `${vault.currency}${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                      { label: t('apy'), value: `${APY}%`, color: colors.success },
                      { label: t('interestEarned'), value: `${vault.currency}${interest}`, color: colors.success },
                      { label: t('projectedCompletion'), value: months ? `~${months}mo` : (pct >= 100 ? ' Done' : '') },
                    ].map(s => (
                      <div key={s.label} style={{ background: `${color}08`, borderRadius: 10, padding: '0.6rem 0.8rem', border: `1px solid ${color}15` }}>
                        <div style={{ fontSize: '0.58rem', color: colors.textFaint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
                        <div style={{ color: s.color ?? colors.text, fontWeight: 700, fontSize: '0.82rem' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {pct >= 100 && (
                    <div style={{ background: 'rgba(61,158,122,0.1)', border: '1px solid rgba(61,158,122,0.25)', borderRadius: 10, padding: '0.5rem', textAlign: 'center', color: colors.success, fontWeight: 700, fontSize: '0.8rem', marginBottom: '1rem' }}>
                       {t('goalReached')}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setActiveModal({ type: 'topup', vault }); setModalAmount(''); }}
                      style={{ flex: 1, padding: '0.65rem', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 10, color, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                      {t('topUp')}
                    </button>
                    <button onClick={() => { setActiveModal({ type: 'withdraw', vault }); setModalAmount(''); }}
                      style={{ flex: 1, padding: '0.65rem', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: 10, color: colors.textMuted, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                      {t('withdraw')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Vault Modal */}
      {showCreate && (
        <Modal title={t('createVault')} onClose={() => setShowCreate(false)} onSubmit={handleCreate} submitLabel={t('create')} loading={creating} colors={colors}>
          <Field label={t('vaultName')} value={newName} onChange={setNewName} placeholder="e.g. Emergency Fund" colors={colors}/>
          <Field label={t('targetAmount')} value={newGoal} onChange={setNewGoal} type="number" placeholder="10000" colors={colors}/>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: colors.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>{t('currency')}</label>
            <select value={newCurrency} onChange={e => setNewCurrency(e.target.value)}
              style={{ width: '100%', padding: '0.72rem 1rem', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, borderRadius: 10, color: colors.text, fontSize: '0.9rem', outline: 'none' }}>
              {['$', '', '', '', ''].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* Top-up / Withdraw Modal */}
      {activeModal && (
        <Modal
          title={activeModal.type === 'topup' ? `${t('topUp')}: ${activeModal.vault.name}` : `${t('withdraw')}: ${activeModal.vault.name}`}
          onClose={() => setActiveModal(null)}
          onSubmit={handleAction}
          submitLabel={t('confirm')}
          loading={modalLoading}
          colors={colors}
        >
          <Field label={t('amount')} value={modalAmount} onChange={setModalAmount} type="number" placeholder="100" colors={colors}/>
          <div style={{ background: colors.surface2, borderRadius: 10, padding: '0.8rem 1rem', fontSize: '0.8rem', color: colors.textMuted }}>
            {activeModal.type === 'topup'
              ? 'Funds will be added to your vault and start earning APY immediately.'
              : `Available: ${activeModal.vault.currency}${(activeModal.vault.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
