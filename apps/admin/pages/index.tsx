import React, { useEffect, useState, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  frozen: boolean;
  kyc: boolean;
  balance: number;
  createdAt: string;
}
interface Transfer {
  id: string;
  recipientName: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  reference: string;
  description: string;
  createdAt: string;
  country?: string;
}
interface Checkbook {
  id: string;
  userEmail: string;
  userName: string;
  status: string;
  requestedAt: string;
  checkStart?: number;
  checkEnd?: number;
  deliveryAddress?: string;
  checks: { number: string; status: string; payee?: string; amount?: number }[];
}
interface Analytics {
  totalUsers: number;
  totalBalance: number;
  frozenAccounts: number;
  kycVerified: number;
  admins: number;
  createdLast30d: number;
}

type Tab = 'overview' | 'transfers' | 'users' | 'checkbooks' | 'audit';

// ── Constants ─────────────────────────────────────────────────────────────────
const G = '#C4A052';
const BG = '#060913';
const S2 = '#0D1628';
const SL = '#60707E';
const IV = '#EAE0D0';

// ── Style helpers ─────────────────────────────────────────────────────────────
const cardStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: S2,
  borderRadius: 16,
  border: '1px solid rgba(196,160,82,0.1)',
  padding: '1.5rem',
  ...extra,
});

const thStyle: React.CSSProperties = {
  padding: '6px 12px',
  textAlign: 'left',
  color: SL,
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(196,160,82,0.08)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '0.88rem',
  color: IV,
  borderBottom: '1px solid rgba(196,160,82,0.04)',
};

const btnPrimary: React.CSSProperties = {
  background: `linear-gradient(135deg, ${G}, #a8873e)`,
  border: 'none',
  color: BG,
  borderRadius: 7,
  padding: '5px 12px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.78rem',
  fontFamily: 'Inter, sans-serif',
};

const btnDanger: React.CSSProperties = {
  background: 'rgba(255,77,79,0.1)',
  border: '1px solid rgba(255,77,79,0.25)',
  color: '#ff4d4f',
  borderRadius: 7,
  padding: '5px 12px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.78rem',
  fontFamily: 'Inter, sans-serif',
};

const btnGhost: React.CSSProperties = {
  background: 'rgba(196,160,82,0.07)',
  border: '1px solid rgba(196,160,82,0.18)',
  color: G,
  borderRadius: 7,
  padding: '5px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.78rem',
  fontFamily: 'Inter, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(196,160,82,0.18)',
  borderRadius: 10,
  padding: '10px 14px',
  color: IV,
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

// ── Sub-components ────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending:     ['rgba(196,160,82,0.12)', G],
    approved:    ['rgba(80,200,120,0.12)', '#50C878'],
    active:      ['rgba(80,200,120,0.12)', '#50C878'],
    active_user: ['rgba(80,200,120,0.12)', '#50C878'],
    completed:   ['rgba(80,200,120,0.12)', '#50C878'],
    rejected:    ['rgba(255,77,79,0.12)',  '#ff4d4f'],
    failed:      ['rgba(255,77,79,0.12)',  '#ff4d4f'],
    frozen:      ['rgba(255,77,79,0.12)',  '#ff4d4f'],
    reversed:    ['rgba(162,178,191,0.12)', '#A2B2BF'],
  };
  const [bg, color] = map[status] ?? ['rgba(162,178,191,0.12)', '#A2B2BF'];
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: '2px 10px', fontSize: '0.73rem', fontWeight: 700 }}>
      {status}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={cardStyle()}>
      <div style={{ fontSize: '0.72rem', color: SL, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color: color ?? G, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.78rem', color: SL, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── API helper ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiCall(token: string, path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminHome({ user }: { user: { token: string } }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [checkbooks, setCheckbooks] = useState<Checkbook[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [fundModal, setFundModal] = useState<{ userId: string; mode: 'credit' | 'debit' } | null>(null);
  const [fundAmt, setFundAmt] = useState('');
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', balance: '' });

  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, t, cb, a] = await Promise.all([
        apiCall(user.token, '/admin/users'),
        apiCall(user.token, '/transfer'),
        apiCall(user.token, '/checkbook'),
        apiCall(user.token, '/admin/analytics'),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setTransfers(Array.isArray(t) ? t : []);
      setCheckbooks(Array.isArray(cb) ? cb : []);
      setAnalytics(a);
    } catch {
      notify(false, 'Failed to load data');
    }
    setLoading(false);
  }, [user.token]);

  const fetchAudit = useCallback(async () => {
    try {
      const logs = await apiCall(user.token, '/admin/audit-logs');
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch { /* ignore */ }
  }, [user.token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (tab === 'audit') fetchAudit(); }, [tab, fetchAudit]);

  async function approveTransfer(id: string) {
    try { await apiCall(user.token, `/transfer/${id}/approve`, 'PATCH'); notify(true, 'Transfer approved'); fetchAll(); }
    catch (e: unknown) { notify(false, (e as Error).message); }
  }
  async function rejectTransfer(id: string) {
    const reason = prompt('Reason for rejection (optional):') ?? '';
    try { await apiCall(user.token, `/transfer/${id}/reject`, 'PATCH', { reason }); notify(true, 'Transfer rejected'); fetchAll(); }
    catch (e: unknown) { notify(false, (e as Error).message); }
  }

  async function toggleFreeze(id: string, frozen: boolean) {
    try { await apiCall(user.token, `/admin/users/${id}/${frozen ? 'unfreeze' : 'freeze'}`, 'PATCH'); notify(true, frozen ? 'Account unfrozen' : 'Account frozen'); fetchAll(); }
    catch (e: unknown) { notify(false, (e as Error).message); }
  }
  async function setKyc(id: string, kyc: boolean) {
    try { await apiCall(user.token, `/admin/users/${id}/kyc`, 'PATCH', { kyc }); notify(true, `KYC ${kyc ? 'verified' : 'unverified'}`); fetchAll(); }
    catch (e: unknown) { notify(false, (e as Error).message); }
  }
  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    if (!fundModal) return;
    const amount = parseFloat(fundAmt);
    if (!amount || amount <= 0) { notify(false, 'Invalid amount'); return; }
    try {
      await apiCall(user.token, `/admin/users/${fundModal.userId}/${fundModal.mode === 'credit' ? 'fund' : 'debit'}`, 'PATCH', { amount });
      notify(true, `Account ${fundModal.mode === 'credit' ? 'credited' : 'debited'} $${amount.toLocaleString()}`);
      setFundModal(null); setFundAmt(''); fetchAll();
    } catch (e: unknown) { notify(false, (e as Error).message); }
  }
  async function changeRole(id: string, role: string) {
    try { await apiCall(user.token, `/admin/users/${id}/role`, 'PATCH', { role }); notify(true, `Role changed to ${role}`); fetchAll(); }
    catch (e: unknown) { notify(false, (e as Error).message); }
  }
  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try { await apiCall(user.token, `/admin/users/${id}`, 'DELETE'); notify(true, 'User deleted'); fetchAll(); }
    catch (e: unknown) { notify(false, (e as Error).message); }
  }
  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiCall(user.token, '/admin/users', 'POST', { ...newUser, balance: parseFloat(newUser.balance) || 0 });
      notify(true, 'User created');
      setShowNewUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', balance: '' });
      fetchAll();
    } catch (e: unknown) { notify(false, (e as Error).message); }
  }

  async function approveCheckbook(id: string) {
    try { await apiCall(user.token, `/checkbook/${id}/approve`, 'PATCH', {}); notify(true, 'Checkbook approved'); fetchAll(); }
    catch (e: unknown) { notify(false, (e as Error).message); }
  }
  async function rejectCheckbook(id: string) {
    const reason = prompt('Reason (optional):') ?? '';
    try { await apiCall(user.token, `/checkbook/${id}/reject`, 'PATCH', { reason }); notify(true, 'Checkbook rejected'); fetchAll(); }
    catch (e: unknown) { notify(false, (e as Error).message); }
  }

  const pendingTransfers = transfers.filter(t => t.status === 'pending');
  const pendingCheckbooks = checkbooks.filter(c => c.status === 'pending');

  const tabDef: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview',   label: '⚡ Overview' },
    { id: 'transfers',  label: '⇄ Transfers',  badge: pendingTransfers.length },
    { id: 'users',      label: '👥 Users' },
    { id: 'checkbooks', label: '📋 Checkbooks', badge: pendingCheckbooks.length },
    { id: 'audit',      label: '🔍 Audit Log' },
  ];

  return (
    <main style={{ background: BG, minHeight: '100vh', color: IV, fontFamily: 'Inter, sans-serif' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? 'rgba(80,200,120,0.12)' : 'rgba(255,77,79,0.12)', border: `1px solid ${toast.ok ? 'rgba(80,200,120,0.3)' : 'rgba(255,77,79,0.3)'}`, color: toast.ok ? '#50C878' : '#ff4d4f', padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {toast.ok ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#0a1020 0%,#060913 100%)', borderBottom: '1px solid rgba(196,160,82,0.08)', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(196,160,82,0.1)', border: '1px solid rgba(196,160,82,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>⚡</div>
              <h1 style={{ color: G, fontWeight: 800, fontSize: '1.6rem', margin: 0, letterSpacing: '-0.02em' }}>Londway God Mode</h1>
            </div>
            <p style={{ color: SL, fontSize: '0.8rem', margin: 0 }}>Full administrative control · All operations logged</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {pendingTransfers.length > 0 && (
              <div style={{ background: 'rgba(196,160,82,0.1)', border: '1px solid rgba(196,160,82,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', color: G, fontWeight: 700 }}>
                {pendingTransfers.length} pending transfer{pendingTransfers.length !== 1 ? 's' : ''}
              </div>
            )}
            <button onClick={fetchAll} style={{ ...btnGhost, padding: '8px 16px' }}>↻ Refresh</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 2rem' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 4, border: '1px solid rgba(196,160,82,0.07)', overflowX: 'auto' }}>
          {tabDef.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ position: 'relative', flex: '0 0 auto', padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 500, fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', transition: 'all 0.2s', background: tab === t.id ? `linear-gradient(135deg,${G},#a8873e)` : 'transparent', color: tab === t.id ? BG : SL, whiteSpace: 'nowrap' }}>
              {t.label}
              {!!t.badge && <span style={{ position: 'absolute', top: 2, right: 4, background: '#ff4d4f', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: G, padding: '4rem', fontSize: '1.1rem' }}>Loading...</div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === 'overview' && analytics && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <StatCard label="Total Users" value={analytics.totalUsers} sub={`${analytics.createdLast30d} new this month`} />
                  <StatCard label="Assets Under Management" value={`$${analytics.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                  <StatCard label="Pending Actions" value={pendingTransfers.length + pendingCheckbooks.length} sub={`${pendingTransfers.length} transfers · ${pendingCheckbooks.length} checkbooks`} color={pendingTransfers.length > 0 ? G : '#50C878'} />
                  <StatCard label="Frozen Accounts" value={analytics.frozenAccounts} color={analytics.frozenAccounts > 0 ? '#ff4d4f' : '#50C878'} />
                  <StatCard label="KYC Verified" value={analytics.kycVerified} sub={`of ${analytics.totalUsers} users`} color="#50C878" />
                  <StatCard label="Admin Accounts" value={analytics.admins} color="#A2B2BF" />
                </div>

                {pendingTransfers.length > 0 && (
                  <div style={cardStyle({ marginBottom: '1.5rem' })}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, color: G, fontWeight: 700, fontSize: '0.95rem' }}>🔔 TRANSFERS AWAITING APPROVAL</h3>
                      <button style={btnGhost} onClick={() => setTab('transfers')}>View All →</button>
                    </div>
                    {pendingTransfers.slice(0, 3).map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(196,160,82,0.05)' }}>
                        <div>
                          <span style={{ color: IV, fontWeight: 600 }}>{tx.recipientName || tx.toAccountId}</span>
                          <span style={{ marginLeft: 10, background: 'rgba(162,178,191,0.1)', color: '#A2B2BF', borderRadius: 4, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{tx.type}</span>
                          <div style={{ color: SL, fontSize: '0.78rem', marginTop: 2 }}>{tx.reference} · {new Date(tx.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ color: G, fontWeight: 800 }}>{tx.currency} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <button style={btnPrimary} onClick={() => approveTransfer(tx.id)}>✓ Approve</button>
                          <button style={btnDanger} onClick={() => rejectTransfer(tx.id)}>✕ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pendingCheckbooks.length > 0 && (
                  <div style={cardStyle()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ margin: 0, color: G, fontWeight: 700, fontSize: '0.95rem' }}>📋 CHECKBOOKS AWAITING APPROVAL</h3>
                      <button style={btnGhost} onClick={() => setTab('checkbooks')}>View All →</button>
                    </div>
                    {pendingCheckbooks.slice(0, 3).map(cb => (
                      <div key={cb.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(196,160,82,0.05)' }}>
                        <div>
                          <span style={{ color: IV, fontWeight: 600 }}>{cb.userName}</span>
                          <div style={{ color: SL, fontSize: '0.78rem', marginTop: 2 }}>{cb.userEmail} · {new Date(cb.requestedAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={btnPrimary} onClick={() => approveCheckbook(cb.id)}>✓ Approve</button>
                          <button style={btnDanger} onClick={() => rejectCheckbook(cb.id)}>✕ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TRANSFERS */}
            {tab === 'transfers' && (
              <div style={cardStyle()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h2 style={{ margin: 0, color: IV, fontWeight: 700, fontSize: '1rem' }}>All Transfers</h2>
                  <span style={{ background: 'rgba(196,160,82,0.1)', color: G, borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700 }}>{pendingTransfers.length} pending</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Reference','Recipient','Type','Amount','Description','Date','Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {transfers.length === 0 ? (
                        <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: SL, padding: '2rem' }}>No transfers</td></tr>
                      ) : transfers.map(tx => (
                        <tr key={tx.id}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.75rem', color: G }}>{tx.reference}</td>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 600 }}>{tx.recipientName || tx.toAccountId}</div>
                            {tx.country && <div style={{ color: SL, fontSize: '0.75rem' }}>{tx.country}</div>}
                          </td>
                          <td style={tdStyle}>
                            <span style={{ background: tx.type === 'international' ? 'rgba(162,178,191,0.1)' : 'rgba(196,160,82,0.08)', color: tx.type === 'international' ? '#A2B2BF' : G, borderRadius: 5, padding: '2px 7px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{tx.type}</span>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{tx.currency} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td style={{ ...tdStyle, color: SL, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                          <td style={{ ...tdStyle, color: SL }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td style={tdStyle}><Badge status={tx.status} /></td>
                          <td style={tdStyle}>
                            {tx.status === 'pending' && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button style={btnPrimary} onClick={() => approveTransfer(tx.id)}>✓</button>
                                <button style={btnDanger} onClick={() => rejectTransfer(tx.id)}>✕</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* USERS */}
            {tab === 'users' && (
              <div style={cardStyle()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h2 style={{ margin: 0, color: IV, fontWeight: 700, fontSize: '1rem' }}>User Management</h2>
                  <button onClick={() => setShowNewUser(v => !v)} style={{ ...btnPrimary, padding: '8px 16px', fontSize: '0.85rem' }}>{showNewUser ? '✕ Cancel' : '+ Add User'}</button>
                </div>

                {showNewUser && (
                  <form onSubmit={createUser} style={{ background: 'rgba(196,160,82,0.04)', border: '1px solid rgba(196,160,82,0.13)', borderRadius: 12, padding: '1.2rem', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {(['name','email','password'] as const).map(f => (
                      <input key={f} required style={inputStyle} placeholder={f.charAt(0).toUpperCase()+f.slice(1)} value={newUser[f]} onChange={e => setNewUser(u => ({ ...u, [f]: e.target.value }))} type={f === 'password' ? 'password' : 'text'} />
                    ))}
                    <select style={inputStyle} value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                      {['user','admin','auditor','support'].map(r => <option key={r}>{r}</option>)}
                    </select>
                    <input style={inputStyle} type="number" min="0" step="0.01" placeholder="Initial Balance" value={newUser.balance} onChange={e => setNewUser(u => ({ ...u, balance: e.target.value }))} />
                    <button type="submit" style={{ ...btnPrimary, padding: '10px' }}>Create User</button>
                  </form>
                )}

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Name','Email','Role','Balance','KYC','Status','Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{u.name}</td>
                          <td style={{ ...tdStyle, color: SL }}>{u.email}</td>
                          <td style={tdStyle}>
                            <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ background: S2, border: '1px solid rgba(196,160,82,0.2)', color: G, borderRadius: 6, padding: '3px 8px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              {['user','admin','auditor','support'].map(r => <option key={r}>{r}</option>)}
                            </select>
                          </td>
                          <td style={{ ...tdStyle, color: G, fontWeight: 700 }}>${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td style={tdStyle}>
                            <button onClick={() => setKyc(u.id, !u.kyc)} style={{ background: u.kyc ? 'rgba(80,200,120,0.1)' : 'rgba(255,77,79,0.1)', border: `1px solid ${u.kyc ? 'rgba(80,200,120,0.3)' : 'rgba(255,77,79,0.3)'}`, color: u.kyc ? '#50C878' : '#ff4d4f', borderRadius: 7, padding: '3px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                              {u.kyc ? '✓ Verified' : '✗ Unverified'}
                            </button>
                          </td>
                          <td style={tdStyle}><Badge status={u.frozen ? 'frozen' : 'active_user'} /></td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button style={btnPrimary} onClick={() => { setFundModal({ userId: u.id, mode: 'credit' }); setFundAmt(''); }}>+ Credit</button>
                              <button style={btnGhost} onClick={() => { setFundModal({ userId: u.id, mode: 'debit' }); setFundAmt(''); }}>− Debit</button>
                              <button style={{ ...btnGhost, color: u.frozen ? '#50C878' : '#ff4d4f', border: `1px solid ${u.frozen ? 'rgba(80,200,120,0.3)' : 'rgba(255,77,79,0.3)'}`, background: u.frozen ? 'rgba(80,200,120,0.07)' : 'rgba(255,77,79,0.07)' }} onClick={() => toggleFreeze(u.id, u.frozen)}>
                                {u.frozen ? '🔓 Unfreeze' : '🔒 Freeze'}
                              </button>
                              <button style={btnDanger} onClick={() => deleteUser(u.id, u.name)}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CHECKBOOKS */}
            {tab === 'checkbooks' && (
              <div style={cardStyle()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h2 style={{ margin: 0, color: IV, fontWeight: 700, fontSize: '1rem' }}>Checkbook Requests</h2>
                  <span style={{ background: 'rgba(196,160,82,0.1)', color: G, borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700 }}>{pendingCheckbooks.length} pending</span>
                </div>
                {checkbooks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: SL, padding: '2rem' }}>No checkbook requests</div>
                ) : checkbooks.map(cb => (
                  <div key={cb.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(196,160,82,0.07)', padding: '1.2rem', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: IV }}>{cb.userName}</div>
                        <div style={{ color: SL, fontSize: '0.8rem' }}>{cb.userEmail} · Requested {new Date(cb.requestedAt).toLocaleDateString()}</div>
                        {cb.deliveryAddress && <div style={{ color: SL, fontSize: '0.78rem', marginTop: 3 }}>📮 {cb.deliveryAddress}</div>}
                        {cb.checkStart && <div style={{ color: G, fontSize: '0.8rem', marginTop: 3, fontWeight: 600 }}>Checks #{cb.checkStart}–{cb.checkEnd} · {cb.checks.filter(c => c.status === 'unused').length} unused</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Badge status={cb.status} />
                        {cb.status === 'pending' && (
                          <>
                            <button style={btnPrimary} onClick={() => approveCheckbook(cb.id)}>✓ Approve</button>
                            <button style={btnDanger} onClick={() => rejectCheckbook(cb.id)}>✕ Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AUDIT LOG */}
            {tab === 'audit' && (
              <div style={cardStyle()}>
                <h2 style={{ margin: '0 0 18px', color: IV, fontWeight: 700, fontSize: '1rem' }}>Audit Log</h2>
                {auditLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', color: SL, padding: '2rem' }}>No audit events yet</div>
                ) : (
                  <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {[...auditLogs].reverse().map((log, i) => {
                      const isHigh = log.includes('[account_frozen]') || log.includes('[user_deleted]') || log.includes('[debited]');
                      return (
                        <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(196,160,82,0.05)', fontFamily: 'monospace', fontSize: '0.78rem', color: isHigh ? '#ff4d4f' : '#A2B2BF' }}>
                          {log}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Fund/Debit Modal */}
      {fundModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,19,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: S2, borderRadius: 20, border: '1px solid rgba(196,160,82,0.2)', padding: '2rem', width: '100%', maxWidth: 360 }}>
            <h3 style={{ margin: '0 0 16px', color: G, fontWeight: 700 }}>{fundModal.mode === 'credit' ? '+ Credit Account' : '− Debit Account'}</h3>
            <form onSubmit={handleFund}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#A2B2BF', fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Amount (USD)</label>
                <input style={inputStyle} type="number" min="0.01" step="0.01" value={fundAmt} onChange={e => setFundAmt(e.target.value)} placeholder="0.00" required autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setFundModal(null)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(196,160,82,0.2)', color: '#A2B2BF', borderRadius: 10, padding: '10px', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, background: fundModal.mode === 'credit' ? 'linear-gradient(135deg,#50C878,#3aae60)' : 'linear-gradient(135deg,#ff4d4f,#dd3e3e)', border: 'none', color: '#fff', borderRadius: 10, padding: '10px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                  {fundModal.mode === 'credit' ? `Credit $${(parseFloat(fundAmt)||0).toLocaleString()}` : `Debit $${(parseFloat(fundAmt)||0).toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

