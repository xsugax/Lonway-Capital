'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getCheckbooks, saveCheckbooks } from '../lib/store';

type CheckStatus = 'unused' | 'used' | 'void' | 'bounced';
type BookStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'exhausted';

interface Check {
  number: string;
  status: CheckStatus;
  payee?: string;
  amount?: number;
  memo?: string;
  date?: string;
}

interface Checkbook {
  id: string;
  status: BookStatus;
  requestedAt: string;
  approvedAt?: string;
  checkStart?: number;
  checkEnd?: number;
  checks: Check[];
  deliveryAddress?: string;
  notes?: string;
}

function StatusBadge({ status, map }: { status: string; map: Record<string, { color: string; bg: string; label: string }> }) {
  const s = map[status] || { color: '#A2B2BF', bg: 'rgba(162,178,191,0.1)', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
      {s.label}
    </span>
  );
}

export default function Checkbook({ user }: { user: { token: string; id?: string; email?: string; name?: string } }) {
  const { colors, theme } = useTheme();

  // Status label maps defined here so they can reference theme-aware colors
  const CHECK_STATUS_LABELS: Record<CheckStatus, { color: string; bg: string; label: string }> = {
    unused:  { color: colors.textFaint, bg: `${colors.textFaint}18`,  label: 'Unused' },
    used:    { color: '#50C878',        bg: 'rgba(80,200,120,0.1)',    label: 'Used' },
    void:    { color: '#ff4d4f',        bg: 'rgba(255,77,79,0.1)',     label: 'Void' },
    bounced: { color: colors.gold,      bg: colors.goldBg,             label: 'Bounced' },
  };
  const BOOK_STATUS_LABELS: Record<BookStatus, { color: string; bg: string; label: string }> = {
    pending:   { color: colors.gold,      bg: colors.goldBg,            label: 'Pending Review' },
    approved:  { color: '#50C878',        bg: 'rgba(80,200,120,0.1)',   label: 'Approved' },
    rejected:  { color: '#ff4d4f',        bg: 'rgba(255,77,79,0.1)',    label: 'Rejected' },
    active:    { color: '#50C878',        bg: 'rgba(80,200,120,0.1)',   label: 'Active' },
    exhausted: { color: colors.textFaint, bg: `${colors.textFaint}18`, label: 'Exhausted' },
  };

  const [checkbooks, setCheckbooks] = useState<Checkbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Checkbook | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [reqForm, setReqForm] = useState({ address: '', notes: '' });
  const [reqResult, setReqResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editCheck, setEditCheck] = useState<{ bookId: string; check: Check } | null>(null);
  const [editData, setEditData] = useState<Partial<Check>>({});

  const userId = user.id || 'user-demo-001';
  const userEmail = user.email || 'user@londwaycapital.com';
  const userName = user.name || 'Jane Doe';

  useEffect(() => { fetchCheckbooks(); }, []);

  function fetchCheckbooks() {
    setLoading(true);
    setCheckbooks(getCheckbooks(user.email));
    setLoading(false);
  }

  function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setRequesting(true);
    setReqResult(null);
    const book = { id: 'cb-' + Date.now(), status: 'pending' as BookStatus, requestedAt: new Date().toISOString(), checks: [] as Check[], deliveryAddress: reqForm.address, notes: reqForm.notes };
    const all = getCheckbooks(user.email);
    all.push(book);
    saveCheckbooks(all, user.email);
    setReqResult({ ok: true, message: 'Checkbook requested successfully. Pending admin approval.' });
    setReqForm({ address: '', notes: '' });
    setShowForm(false);
    fetchCheckbooks();
    setRequesting(false);
  }

  function handleUpdateCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!editCheck) return;
    const all = getCheckbooks(user.email);
    const book = all.find((b: any) => b.id === editCheck.bookId);
    if (book) {
      const check = book.checks.find((c: Check) => c.number === editCheck.check.number);
      if (check) { Object.assign(check, editData); saveCheckbooks(all, user.email); }
    }
    fetchCheckbooks();
    setEditCheck(null);
  }

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, borderRadius: 10, padding: '10px 14px', color: colors.text, fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif' };
  const lbl: React.CSSProperties = { display: 'block', color: colors.textMuted, fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 };

  const activeBook = selected || (checkbooks.find(b => b.status === 'active') ?? null);

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.bg} 100%)`, borderBottom: `1px solid ${colors.border}`, padding: '3rem 2rem 2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)', opacity: 0.05, pointerEvents: 'none' }}>
          <svg width="200" height="130" viewBox="0 0 200 130">
            <rect x="10" y="20" width="180" height="90" rx="12" fill="none" stroke="#C4A052" strokeWidth="1.5"/>
            <rect x="10" y="20" width="180" height="22" rx="12" fill="#C4A052" opacity="0.15"/>
            {[55, 70, 85, 100].map((y, i) => <line key={i} x1="28" y1={y} x2={160 - (i % 2) * 40} y2={y} stroke="#C4A052" strokeWidth="1"/>)}
          </svg>
        </div>
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: colors.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, boxShadow: `0 0 8px ${colors.gold}` }}/>SECURE CHECKBOOKS
          </div>
          <h1 style={{ color: colors.text, fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>Checkbook Management</h1>
          <p style={{ color: colors.textFaint, fontSize: '0.88rem' }}>Request, track, and manage your physical checkbooks securely</p>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Request new checkbook */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: colors.text, fontWeight: 700, fontSize: '1.1rem' }}>My Checkbooks</h2>
          <button onClick={() => { setShowForm(!showForm); setReqResult(null); }} style={{ background: showForm ? `rgba(255,77,79,0.1)` : `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})`, border: showForm ? '1px solid rgba(255,77,79,0.3)' : 'none', color: showForm ? '#ff4d4f' : colors.bg, borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', fontFamily: 'Inter, sans-serif' }}>
            {showForm ? '✕ Cancel' : '+ Request Checkbook'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: colors.surface, borderRadius: 16, border: `1px solid ${colors.borderStrong}`, padding: '1.8rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: colors.gold, fontWeight: 700, margin: '0 0 18px', fontSize: '1rem' }}>New Checkbook Request</h3>
            <form onSubmit={handleRequest}>
              <div className="cb-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div><label style={lbl}>Delivery Address</label><input style={inp} value={reqForm.address} onChange={e => setReqForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, New York, NY 10001" required /></div>
                <div><label style={lbl}>Notes (Optional)</label><input style={inp} value={reqForm.notes} onChange={e => setReqForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Business account checkbook" /></div>
              </div>
              {reqResult && (
                <div style={{ background: reqResult.ok ? 'rgba(80,200,120,0.08)' : 'rgba(255,77,79,0.08)', border: `1px solid ${reqResult.ok ? 'rgba(80,200,120,0.25)' : 'rgba(255,77,79,0.25)'}`, borderRadius: 8, padding: '9px 14px', marginBottom: 14, color: reqResult.ok ? '#50C878' : '#ff4d4f', fontSize: '0.88rem' }}>{reqResult.message}</div>
              )}
              <button type="submit" disabled={requesting} style={{ background: requesting ? colors.goldBg : `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})`, border: 'none', color: requesting ? colors.textMuted : (theme === 'dark' ? colors.bg : '#fff'), borderRadius: 10, padding: '10px 24px', cursor: requesting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif' }}>
                {requesting ? 'Submitting…' : 'Submit Request →'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: colors.gold, padding: '3rem' }}>Loading checkbooks…</div>
        ) : checkbooks.length === 0 ? (
          <div style={{ background: colors.surface, borderRadius: 16, border: `1px solid ${colors.border}`, padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
            <p style={{ color: colors.textFaint, margin: 0 }}>No checkbooks yet. Click "Request Checkbook" to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {checkbooks.map(book => (
              <div key={book.id} style={{ background: colors.surface, borderRadius: 16, border: `1px solid ${book.status === 'active' ? colors.borderStrong : colors.border}`, overflow: 'hidden' }}>
                {/* Book header */}
                <div style={{ padding: '1.3rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }} onClick={() => setSelected(selected?.id === book.id ? null : book)}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: colors.goldBg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📋</div>
                    <div>
                      <div style={{ fontWeight: 700, color: colors.text, fontSize: '0.97rem' }}>
                        {book.checkStart ? `Checks #${book.checkStart}–${book.checkEnd}` : 'Checkbook Request'}
                      </div>
                      <div style={{ color: colors.textFaint, fontSize: '0.8rem', marginTop: 2 }}>
                        Requested {new Date(book.requestedAt).toLocaleDateString()}
                        {book.approvedAt && ` · Approved ${new Date(book.approvedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StatusBadge status={book.status} map={BOOK_STATUS_LABELS} />
                    {book.status === 'active' && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: colors.gold, fontWeight: 700, fontSize: '0.88rem' }}>{book.checks.filter(c => c.status === 'unused').length} remaining</div>
                        <div style={{ color: colors.textFaint, fontSize: '0.73rem' }}>of {book.checks.length} checks</div>
                      </div>
                    )}
                    <svg style={{ transform: selected?.id === book.id ? 'rotate(180deg)' : 'none', transition: '0.2s', color: '#60707E' }} width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                </div>

                {/* Checks table - expanded */}
                {selected?.id === book.id && book.status === 'active' && book.checks.length > 0 && (
                  <div style={{ padding: '1.5rem' }}>
                    <h4 style={{ color: colors.gold, margin: '0 0 14px', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Check Register</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>{['Check #', 'Payee', 'Amount', 'Date', 'Memo', 'Status', 'Action'].map(h => <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: colors.textFaint, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {book.checks.map(check => (
                            <tr key={check.number} style={{ borderBottom: `1px solid ${colors.border}` }}>
                              <td style={{ padding: '9px 10px', fontFamily: 'monospace', color: colors.gold, fontWeight: 700 }}>{check.number}</td>
                              <td style={{ padding: '9px 10px', color: colors.text, fontSize: '0.88rem' }}>{check.payee || '—'}</td>
                              <td style={{ padding: '9px 10px', color: colors.text, fontSize: '0.88rem' }}>{check.amount ? `$${check.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</td>
                              <td style={{ padding: '9px 10px', color: colors.textFaint, fontSize: '0.82rem' }}>{check.date || '—'}</td>
                              <td style={{ padding: '9px 10px', color: colors.textFaint, fontSize: '0.82rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{check.memo || '—'}</td>
                              <td style={{ padding: '9px 10px' }}><StatusBadge status={check.status} map={CHECK_STATUS_LABELS} /></td>
                              <td style={{ padding: '9px 10px' }}>
                                {check.status === 'unused' && (
                                  <button onClick={() => { setEditCheck({ bookId: book.id, check }); setEditData({ status: check.status, payee: check.payee, amount: check.amount, memo: check.memo, date: check.date }); }} style={{ background: colors.goldBg, border: `1px solid ${colors.border}`, color: colors.gold, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: '0.77rem', fontWeight: 600 }}>Edit</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pending message */}
                {selected?.id === book.id && book.status === 'pending' && (
                  <div style={{ padding: '1.2rem 1.5rem', color: colors.textMuted, fontSize: '0.88rem' }}>
                    ⏳ Your checkbook request is under review. You will be notified once approved.
                    {book.deliveryAddress && <div style={{ marginTop: 6, color: colors.textFaint, fontSize: '0.82rem' }}>Delivery to: {book.deliveryAddress}</div>}
                  </div>
                )}

                {/* Rejected message */}
                {selected?.id === book.id && book.status === 'rejected' && (
                  <div style={{ padding: '1.2rem 1.5rem', color: '#ff4d4f', fontSize: '0.88rem' }}>
                    ✗ This checkbook request was rejected. Please contact support or submit a new request.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit check modal */}
      {editCheck && (
        <div style={{ position: 'fixed', inset: 0, background: colors.overlayBg, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.borderStrong}`, padding: '2rem', width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: colors.gold, fontWeight: 700 }}>Update Check #{editCheck.check.number}</h3>
              <button onClick={() => setEditCheck(null)} style={{ background: 'transparent', border: 'none', color: colors.textFaint, cursor: 'pointer', fontSize: '1.3rem' }}>✕</button>
            </div>
            <form onSubmit={handleUpdateCheck}>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Status</label>
                <select style={inp} value={editData.status || 'unused'} onChange={e => setEditData(d => ({ ...d, status: e.target.value as CheckStatus }))}>
                  <option value="unused">Unused</option>
                  <option value="used">Used</option>
                  <option value="void">Void</option>
                  <option value="bounced">Bounced</option>
                </select>
              </div>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Payee</label><input style={inp} value={editData.payee || ''} onChange={e => setEditData(d => ({ ...d, payee: e.target.value }))} placeholder="Payee name" /></div>
              <div className="cb-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label style={lbl}>Amount</label><input style={inp} type="number" min="0" step="0.01" value={editData.amount || ''} onChange={e => setEditData(d => ({ ...d, amount: parseFloat(e.target.value) || undefined }))} placeholder="0.00" /></div>
                <div><label style={lbl}>Date</label><input style={inp} type="date" value={editData.date || ''} onChange={e => setEditData(d => ({ ...d, date: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 20 }}><label style={lbl}>Memo</label><input style={inp} value={editData.memo || ''} onChange={e => setEditData(d => ({ ...d, memo: e.target.value }))} placeholder="Memo" /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setEditCheck(null)} style={{ flex: 1, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, borderRadius: 10, padding: '10px', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})`, border: 'none', color: colors.bg, borderRadius: 10, padding: '10px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .cb-fields-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
