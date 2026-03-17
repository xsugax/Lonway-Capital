'use client';
import React, { useState, useEffect } from 'react';
import { getTransfers, saveTransfers, getTierLimits, getDailyUsage, addDailyUsage } from '../lib/store';
import { sendTransferNotification } from '../lib/email';
import type { TierLimits } from '../lib/store';

type TransferType = 'local' | 'international';
type TransferStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed' | 'reversed';

interface Transfer {
  id: string;
  recipientName: string;
  toAccountId: string;
  amount: number;
  currency: string;
  type: TransferType;
  status: TransferStatus;
  reference: string;
  description: string;
  createdAt: string;
  country?: string;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'AED', 'SGD', 'HKD'];
const COUNTRIES = ['United Kingdom','France','Germany','Switzerland','Japan','Canada','Australia','United Arab Emirates','Singapore','Hong Kong','China','Brazil','India','South Africa','Mexico','Spain','Italy','Netherlands'];

function StatusBadge({ status }: { status: TransferStatus }) {
  const cfg: Record<TransferStatus, { bg: string; color: string; label: string }> = {
    pending:   { bg: 'rgba(196,160,82,0.12)',  color: '#C4A052', label: 'Pending Review' },
    approved:  { bg: 'rgba(80,200,120,0.12)',  color: '#50C878', label: 'Approved' },
    rejected:  { bg: 'rgba(255,77,79,0.12)',   color: '#ff4d4f', label: 'Rejected' },
    completed: { bg: 'rgba(80,200,120,0.12)',  color: '#50C878', label: 'Completed' },
    failed:    { bg: 'rgba(255,77,79,0.12)',   color: '#ff4d4f', label: 'Failed' },
    reversed:  { bg: 'rgba(162,178,191,0.15)', color: '#A2B2BF', label: 'Reversed' },
  };
  const s = cfg[status] || cfg.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: '0.76rem', fontWeight: 600 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

export default function Transfer({ user }: { user: { token: string; email?: string; name?: string } }) {
  const [tab, setTab] = useState<TransferType>('local');
  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string; ref?: string } | null>(null);
  const [history, setHistory] = useState<Transfer[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [tierLimits, setTierLimits] = useState<TierLimits>(getTierLimits('Standard'));
  const [dailyUsed, setDailyUsed] = useState(0);
  // Local fields
  const [localRecipient, setLocalRecipient] = useState('');
  const [localAccount, setLocalAccount] = useState('');
  const [localAmount, setLocalAmount] = useState('');
  const [localMemo, setLocalMemo] = useState('');
  // International fields
  const [intlName, setIntlName] = useState('');
  const [intlIban, setIntlIban] = useState('');
  const [intlSwift, setIntlSwift] = useState('');
  const [intlBankName, setIntlBankName] = useState('');
  const [intlCountry, setIntlCountry] = useState('');
  const [intlCurrency, setIntlCurrency] = useState('EUR');
  const [intlAmount, setIntlAmount] = useState('');
  const [intlMemo, setIntlMemo] = useState('');

  // PIN gate
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingSubmit, setPendingSubmit] = useState<null | (() => void)>(null);

  const QUICK = [100, 250, 500, 1000, 2500, 5000];

  useEffect(() => {
    fetchHistory();
    // Load user tier
    if (typeof window !== 'undefined' && user?.email) {
      try {
        const raw = localStorage.getItem('londway_accounts');
        if (raw) {
          const accts = JSON.parse(raw);
          const acct = accts.find((a: any) => a.email === user.email);
          setTierLimits(getTierLimits(acct?.tier));
        }
      } catch {}
      setDailyUsed(getDailyUsage(user.email));
    }
  }, [user?.email]);

  function fetchHistory() {
    setHistoryLoading(true);
    setHistory(getTransfers(user?.email));
    setHistoryLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitResult(null);
    const isLocal = tab === 'local';
    const amt = parseFloat(isLocal ? localAmount : intlAmount);
    if (!amt || amt <= 0) { setSubmitResult({ ok: false, message: 'Please enter a valid amount.' }); return; }

    // ─── Tier limit enforcement ───
    if (amt > tierLimits.perTxLimit) {
      setSubmitResult({ ok: false, message: `Your ${tierLimits.tier} account allows a maximum of $${tierLimits.perTxLimit.toLocaleString()} per transaction. Upgrade your tier to send more.` });
      return;
    }
    const freshDaily = user?.email ? getDailyUsage(user.email) : dailyUsed;
    if (freshDaily + amt > tierLimits.dailyTransferLimit) {
      const remaining = Math.max(0, tierLimits.dailyTransferLimit - freshDaily);
      setSubmitResult({ ok: false, message: `Daily limit reached. You have $${remaining.toLocaleString()} remaining today (${tierLimits.tier} limit: $${tierLimits.dailyTransferLimit.toLocaleString()}).` });
      return;
    }
    if (!isLocal && !tierLimits.intlAllowed) {
      setSubmitResult({ ok: false, message: `International wires require a Silver tier or above. Your current tier is ${tierLimits.tier}.` });
      return;
    }

    // Check if user has a PIN — require PIN gate
    const ACCOUNTS_KEY = 'londway_accounts';
    let userPin: string | undefined;
    if (typeof window !== 'undefined' && user?.email) {
      try {
        const raw = localStorage.getItem(ACCOUNTS_KEY);
        if (raw) {
          const accts = JSON.parse(raw);
          const acct = accts.find((a: any) => a.email === user.email);
          userPin = acct?.pin;
        }
      } catch {}
    }

    const doTransfer = () => {
      setLoading(true);
      const ref = 'TRF-' + Date.now().toString(36).toUpperCase();
      const newTransfer: any = {
        id: 'tr-' + Date.now(),
        recipientName: isLocal ? localRecipient : intlName,
        toAccountId: isLocal ? localAccount : (intlIban || intlSwift),
        amount: amt,
        currency: isLocal ? 'USD' : intlCurrency,
        type: tab,
        status: 'pending',
        reference: ref,
        description: isLocal ? (localMemo || 'Local Transfer') : (intlMemo || 'International Wire'),
        createdAt: new Date().toISOString(),
        ...(tab === 'international' ? { country: intlCountry } : {}),
      };
      const all = getTransfers(user?.email);
      all.unshift(newTransfer);
      saveTransfers(all, user?.email);
      // Track daily usage
      if (user?.email) {
        addDailyUsage(user.email, amt);
        setDailyUsed(d => d + amt);
      }

      // Send confirmation email
      if (user?.email) {
        sendTransferNotification(
          user.email,
          user.name || 'Valued Client',
          ref,
          amt,
          isLocal ? 'USD' : intlCurrency,
          isLocal ? localRecipient : intlName,
          tab,
        );
      }

      setSubmitResult({ ok: true, message: 'Transfer submitted. Pending admin review.', ref });
      setLocalRecipient(''); setLocalAccount(''); setLocalAmount(''); setLocalMemo('');
      setIntlName(''); setIntlIban(''); setIntlSwift(''); setIntlBankName(''); setIntlCountry(''); setIntlCurrency('EUR'); setIntlAmount(''); setIntlMemo('');
      fetchHistory();
      setLoading(false);
    };

    if (userPin) {
      setPinInput('');
      setPinError('');
      setPendingSubmit(() => doTransfer);
      setShowPinModal(true);
    } else {
      doTransfer();
    }
  }

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(196,160,82,0.18)', borderRadius: 10, padding: '11px 14px', color: '#EAE0D0', fontSize: '0.93rem', outline: 'none', fontFamily: 'Inter, sans-serif' };
  const lbl: React.CSSProperties = { display: 'block', color: '#A2B2BF', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 };

  return (
    <main style={{ background: '#060913', minHeight: '100vh', color: '#EAE0D0', fontFamily: "'Inter', sans-serif" }}>

      {/* PIN Gate Modal */}
      {showPinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(4,5,10,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'linear-gradient(160deg, #12172e 0%, #0d1020 100%)', border: '1px solid rgba(196,160,82,0.18)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 340, boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔐</div>
              <h3 style={{ color: '#EAE0D0', fontWeight: 700, fontSize: '1.08rem', margin: '0 0 6px' }}>Authorize Transfer</h3>
              <p style={{ color: '#60707E', fontSize: '0.8rem', margin: 0 }}>Enter your 4-digit PIN to confirm</p>
            </div>
            {pinError && (
              <div style={{ background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.2)', borderRadius: 8, padding: '0.5rem 1rem', color: '#ff7875', fontSize: '0.82rem', marginBottom: 12, textAlign: 'center' }}>⚠ {pinError}</div>
            )}
            {/* PIN dots */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 20 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < pinInput.length ? '#C4A052' : 'transparent', border: `2px solid ${i < pinInput.length ? '#C4A052' : 'rgba(196,160,82,0.25)'}`, transition: 'all 0.15s' }} />
              ))}
            </div>
            {/* Numpad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 220, margin: '0 auto 20px' }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
                d === '' ? <div key={i} /> :
                <button key={i} type="button" onClick={() => {
                  if (d === '⌫') setPinInput(p => p.slice(0, -1));
                  else if (pinInput.length < 4) setPinInput(p => p + d);
                }} style={{ padding: '14px 0', borderRadius: 10, border: '1px solid rgba(196,160,82,0.18)', background: 'rgba(255,255,255,0.03)', color: d === '⌫' ? '#A2B2BF' : '#EAE0D0', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{d}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowPinModal(false); setPendingSubmit(null); }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(196,160,82,0.18)', background: 'transparent', color: '#C4A052', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={() => {
                const ACCOUNTS_KEY = 'londway_accounts';
                let userPin = '';
                if (typeof window !== 'undefined' && user?.email) {
                  try { const raw = localStorage.getItem(ACCOUNTS_KEY); if (raw) { const a = JSON.parse(raw).find((x: any) => x.email === user.email); userPin = a?.pin || ''; } } catch {}
                }
                if (pinInput !== userPin) { setPinError('Incorrect PIN. Try again.'); setPinInput(''); return; }
                setShowPinModal(false);
                setPinError('');
                if (pendingSubmit) { pendingSubmit(); setPendingSubmit(null); }
              }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #C4A052, #a8873e)', color: '#060913', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Confirm →</button>
            </div>
          </div>
        </div>
      )}
      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, #0a1020 0%, #060913 100%)', borderBottom: '1px solid rgba(196,160,82,0.07)', padding: '3rem 2rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)', opacity: 0.05, pointerEvents: 'none' }} width="320" height="110" viewBox="0 0 320 110">
          <circle cx="50" cy="55" r="35" fill="none" stroke="#C4A052" strokeWidth="1.2"/><circle cx="50" cy="55" r="20" fill="none" stroke="#C4A052" strokeWidth="0.7"/>
          <line x1="88" y1="55" x2="232" y2="55" stroke="#C4A052" strokeWidth="1" strokeDasharray="6 4"/>
          <polygon points="232,49 246,55 232,61" fill="#C4A052"/>
          <circle cx="270" cy="55" r="35" fill="none" stroke="#C4A052" strokeWidth="1.2"/><circle cx="270" cy="55" r="20" fill="none" stroke="#C4A052" strokeWidth="0.7"/>
        </svg>
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(196,160,82,0.07)', border: '1px solid rgba(196,160,82,0.15)', borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: '#C4A052', fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C4A052', boxShadow: '0 0 8px #C4A052' }}/>SECURE TRANSFERS
          </div>
          <h1 style={{ color: '#EAE0D0', fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>Transfer Funds</h1>
          <p style={{ color: '#60707E', fontSize: '0.88rem' }}>Local &amp; international wire transfers · Compliance reviewed before release</p>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div className="transfer-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: '2rem', alignItems: 'start' }}>

          {/* Form */}
          <div style={{ background: '#0D1628', borderRadius: 20, border: '1px solid rgba(196,160,82,0.1)', padding: '2rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: '1.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: '1px solid rgba(196,160,82,0.08)' }}>
              {(['local', 'international'] as TransferType[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setSubmitResult(null); }} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', transition: 'all 0.2s', background: tab === t ? 'linear-gradient(135deg, #C4A052, #a8873e)' : 'transparent', color: tab === t ? '#060913' : '#60707E' }}>
                  {t === 'local' ? '🏦 Local Transfer' : '🌍 International Wire'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {tab === 'local' ? (
                <>
                  <div style={{ marginBottom: 16 }}><label style={lbl}>Recipient Name</label><input style={inp} value={localRecipient} onChange={e => setLocalRecipient(e.target.value)} placeholder="Full name" required /></div>
                  <div style={{ marginBottom: 16 }}><label style={lbl}>Account / Routing Number</label><input style={inp} value={localAccount} onChange={e => setLocalAccount(e.target.value)} placeholder="e.g. 021000089 / 1234567890" required /></div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={lbl}>Amount (USD)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#C4A052', fontWeight: 700 }}>$</span>
                      <input style={{ ...inp, paddingLeft: 26 }} type="number" min="1" step="0.01" value={localAmount} onChange={e => setLocalAmount(e.target.value)} placeholder="0.00" required />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {QUICK.map(a => <button key={a} type="button" onClick={() => setLocalAmount(String(a))} style={{ background: localAmount === String(a) ? 'rgba(196,160,82,0.18)' : 'rgba(255,255,255,0.03)', border: `1px solid ${localAmount === String(a) ? '#C4A052' : 'rgba(196,160,82,0.15)'}`, color: localAmount === String(a) ? '#C4A052' : '#A2B2BF', borderRadius: 7, padding: '4px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>${a >= 1000 ? (a/1000)+'k' : a}</button>)}
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}><label style={lbl}>Memo (Optional)</label><input style={inp} value={localMemo} onChange={e => setLocalMemo(e.target.value)} placeholder="e.g. Rent for July" /></div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}><label style={lbl}>Beneficiary Name</label><input style={inp} value={intlName} onChange={e => setIntlName(e.target.value)} placeholder="Full legal name" required /></div>
                  <div className="transfer-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div><label style={lbl}>IBAN / Account No.</label><input style={inp} value={intlIban} onChange={e => setIntlIban(e.target.value)} placeholder="e.g. GB29 NWBK…" /></div>
                    <div><label style={lbl}>SWIFT / BIC</label><input style={inp} value={intlSwift} onChange={e => setIntlSwift(e.target.value)} placeholder="e.g. BNPAFRPP" /></div>
                  </div>
                  <div className="transfer-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div><label style={lbl}>Bank Name</label><input style={inp} value={intlBankName} onChange={e => setIntlBankName(e.target.value)} placeholder="Beneficiary bank" /></div>
                    <div><label style={lbl}>Country</label>
                      <select style={inp} value={intlCountry} onChange={e => setIntlCountry(e.target.value)} required>
                        <option value="">Select…</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, marginBottom: 16 }}>
                    <div><label style={lbl}>Currency</label>
                      <select style={inp} value={intlCurrency} onChange={e => setIntlCurrency(e.target.value)}>
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Amount</label><input style={inp} type="number" min="1" step="0.01" value={intlAmount} onChange={e => setIntlAmount(e.target.value)} placeholder="0.00" required /></div>
                  </div>
                  <div style={{ marginBottom: 20 }}><label style={lbl}>Reference</label><input style={inp} value={intlMemo} onChange={e => setIntlMemo(e.target.value)} placeholder="e.g. Invoice #2024-089" /></div>
                </>
              )}

              <div style={{ background: 'rgba(196,160,82,0.05)', border: '1px solid rgba(196,160,82,0.13)', borderRadius: 9, padding: '9px 13px', marginBottom: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#C4A052" strokeWidth="1.5"/><path d="M12 8v4m0 4h.01" stroke="#C4A052" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ color: '#A2B2BF', fontSize: '0.8rem' }}>Transfers are <strong style={{ color: '#C4A052' }}>pending</strong> until reviewed by Londway compliance (1–2 hrs).</span>
              </div>

              {submitResult && (
                <div style={{ background: submitResult.ok ? 'rgba(80,200,120,0.08)' : 'rgba(255,77,79,0.08)', border: `1px solid ${submitResult.ok ? 'rgba(80,200,120,0.25)' : 'rgba(255,77,79,0.25)'}`, borderRadius: 10, padding: '11px 14px', marginBottom: 16 }}>
                  {submitResult.ok && submitResult.ref && <div style={{ marginBottom: 4, fontSize: '0.8rem' }}><span style={{ color: '#50C878', fontWeight: 700 }}>✓ Submitted</span> · Ref: <strong style={{ color: '#C4A052' }}>{submitResult.ref}</strong></div>}
                  <p style={{ margin: 0, color: submitResult.ok ? '#50C878' : '#ff4d4f', fontSize: '0.88rem' }}>{submitResult.message}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? 'rgba(196,160,82,0.3)' : 'linear-gradient(135deg, #C4A052, #a8873e)', color: '#060913', fontWeight: 800, fontSize: '0.97rem', fontFamily: 'Inter, sans-serif', boxShadow: loading ? 'none' : '0 4px 20px rgba(196,160,82,0.28)' }}>
                {loading ? 'Submitting…' : `Send ${tab === 'local' ? 'Local' : 'International'} Transfer →`}
              </button>
            </form>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#0D1628', borderRadius: 18, border: '1px solid rgba(196,160,82,0.1)', padding: '1.4rem' }}>
              <h3 style={{ color: '#C4A052', fontWeight: 700, fontSize: '0.92rem', margin: '0 0 14px' }}>TRANSFER STATUSES</h3>
              {([['pending','Under compliance review'],['approved','Cleared, funds in transit'],['rejected','Did not pass review'],['completed','Successfully delivered']] as [TransferStatus, string][]).map(([s, desc]) => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                  <StatusBadge status={s} />
                  <span style={{ color: '#60707E', fontSize: '0.75rem', textAlign: 'right', maxWidth: 120, lineHeight: 1.3 }}>{desc}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#0D1628', borderRadius: 18, border: '1px solid rgba(196,160,82,0.1)', padding: '1.4rem' }}>
              <h3 style={{ color: '#C4A052', fontWeight: 700, fontSize: '0.92rem', margin: '0 0 14px' }}>TRANSFER FEES</h3>
              {[['Local ACH / Same-day','Free'],['Local Wire','$15.00'],['International Wire','$35.00'],['SWIFT Priority','$55.00']].map(([l, f]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
                  <span style={{ color: '#A2B2BF', fontSize: '0.83rem' }}>{l}</span>
                  <span style={{ color: '#C4A052', fontWeight: 700, fontSize: '0.83rem' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div style={{ background: '#0D1628', borderRadius: 20, border: '1px solid rgba(196,160,82,0.1)', padding: '2rem', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ color: '#EAE0D0', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Transfer History</h2>
            <button onClick={fetchHistory} style={{ background: 'transparent', border: '1px solid rgba(196,160,82,0.2)', color: '#C4A052', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>↻ Refresh</button>
          </div>
          {historyLoading ? (
            <div style={{ textAlign: 'center', color: '#C4A052', padding: '2rem' }}>Loading…</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#60707E' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>⇄</div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No transfers yet. Submit one above.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Reference','Recipient','Type','Amount','Date','Status'].map(h => <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#60707E', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(196,160,82,0.07)' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {history.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(196,160,82,0.04)' }}>
                      <td style={{ padding: '11px 10px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#C4A052' }}>{tx.reference}</td>
                      <td style={{ padding: '11px 10px', color: '#EAE0D0', fontSize: '0.88rem' }}>{tx.recipientName || tx.toAccountId}</td>
                      <td style={{ padding: '11px 10px' }}><span style={{ background: tx.type === 'international' ? 'rgba(162,178,191,0.1)' : 'rgba(196,160,82,0.08)', color: tx.type === 'international' ? '#A2B2BF' : '#C4A052', borderRadius: 5, padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{tx.type}</span></td>
                      <td style={{ padding: '11px 10px', color: '#EAE0D0', fontWeight: 700, fontSize: '0.9rem' }}>{tx.currency} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '11px 10px', color: '#60707E', fontSize: '0.82rem' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '11px 10px' }}><StatusBadge status={tx.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .transfer-main-grid { grid-template-columns: 1fr !important; }
          .transfer-fields-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
