import React, { useState, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────
interface User {
  id: string; name: string; email: string; role: string;
  frozen: boolean; kyc: boolean; balance: number;
  createdAt: string; phone?: string; address?: string; tier?: string; password?: string; pin?: string;
}
interface Transaction {
  id: string; userId: string; userName: string;
  type: 'credit' | 'debit' | 'transfer' | 'wire' | 'fee' | 'interest' | 'reversal';
  amount: number; currency: string; status: string;
  description: string; reference: string;
  createdAt: string; processedAt?: string;
  recipientName?: string; recipientAccount?: string;
}
interface AuditEntry {
  id: string; timestamp: string; action: string;
  admin: string; target?: string; details?: string;
}
interface BankSettings {
  dailyTransferLimit: number; perTxLimit: number; intlWireFee: number;
  localTransferFee: number; savingsRate: number; overdraftRate: number;
  supportedCurrencies: string[]; maintenanceMode: boolean;
  bankName: string; bankTagline: string;
}

type Tab = 'overview' | 'users' | 'transactions' | 'funding' | 'audit' | 'cards' | 'notifications' | 'visitors' | 'settings';

// ── Constants ──────────────────────────────────────────────────
const G = '#C4A052';
const BG = '#060913';
const S2 = '#0D1628';
const SL = '#60707E';
const IV = '#EAE0D0';
const STORAGE_KEY = 'londway_admin_data';

// ── Seed data ──────────────────────────────────────────────────
function getDefaultData() {
  const now = new Date().toISOString();
  const users: User[] = [
    { id: 'u1', name: 'Jane Doe', email: 'user@londwaycapital.com', role: 'user', frozen: false, kyc: true, balance: 2847563.42, createdAt: '2021-01-15T10:00:00Z', phone: '+1 (555) 234-5678', address: '420 Park Avenue, New York, NY 10022', tier: 'Platinum' },
    { id: 'u2', name: 'Marcus Chen', email: 'marcus@example.com', role: 'user', frozen: false, kyc: true, balance: 1253800.00, createdAt: '2022-03-22T14:30:00Z', phone: '+1 (555) 876-5432', address: '888 Market St, San Francisco, CA 94103', tier: 'Gold' },
    { id: 'u3', name: 'Elena Volkov', email: 'elena@example.com', role: 'user', frozen: false, kyc: false, balance: 589200.75, createdAt: '2023-07-10T09:15:00Z', phone: '+44 20 7946 0958', address: '12 Kensington Palace Gardens, London W8 4QU', tier: 'Silver' },
    { id: 'u4', name: 'Omar Al-Rashid', email: 'omar@example.com', role: 'user', frozen: true, kyc: true, balance: 4120000.00, createdAt: '2020-11-05T16:45:00Z', phone: '+971 4 333 4444', address: 'DIFC Gate Building, Dubai, UAE', tier: 'Platinum' },
    { id: 'u5', name: 'Sarah Williams', email: 'sarah@example.com', role: 'user', frozen: false, kyc: true, balance: 156430.20, createdAt: '2024-01-18T11:20:00Z', phone: '+1 (555) 111-2222', address: '200 Lakeshore Dr, Chicago, IL 60601', tier: 'Standard' },
  ];
  const transactions: Transaction[] = [
    { id: 't1', userId: 'u1', userName: 'Jane Doe', type: 'credit', amount: 500000, currency: 'USD', status: 'completed', description: 'Wire deposit from JPMorgan Chase', reference: 'WIR-2026-001', createdAt: '2026-03-10T14:22:00Z', processedAt: '2026-03-10T14:25:00Z' },
    { id: 't2', userId: 'u1', userName: 'Jane Doe', type: 'transfer', amount: 25000, currency: 'USD', status: 'pending', description: 'Transfer to savings vault', reference: 'TRF-2026-002', createdAt: '2026-03-14T09:10:00Z', recipientName: 'Jane Doe - Vault', recipientAccount: 'VAULT-001' },
    { id: 't3', userId: 'u2', userName: 'Marcus Chen', type: 'wire', amount: 150000, currency: 'USD', status: 'pending', description: 'International wire to Hong Kong', reference: 'INT-2026-003', createdAt: '2026-03-15T16:30:00Z', recipientName: 'Chen Holdings Ltd', recipientAccount: 'HK-8834-2211' },
    { id: 't4', userId: 'u3', userName: 'Elena Volkov', type: 'debit', amount: 12500, currency: 'USD', status: 'completed', description: 'Card purchase - Harrods London', reference: 'POS-2026-004', createdAt: '2026-03-12T11:45:00Z', processedAt: '2026-03-12T11:45:00Z' },
    { id: 't5', userId: 'u4', userName: 'Omar Al-Rashid', type: 'credit', amount: 2000000, currency: 'USD', status: 'flagged', description: 'Large incoming wire - compliance review', reference: 'WIR-2026-005', createdAt: '2026-03-13T08:00:00Z' },
    { id: 't6', userId: 'u5', userName: 'Sarah Williams', type: 'fee', amount: 29.99, currency: 'USD', status: 'completed', description: 'Monthly account fee', reference: 'FEE-2026-006', createdAt: '2026-03-01T00:00:00Z', processedAt: '2026-03-01T00:00:00Z' },
    { id: 't7', userId: 'u1', userName: 'Jane Doe', type: 'interest', amount: 4523.18, currency: 'USD', status: 'completed', description: 'Monthly interest payment', reference: 'INT-2026-007', createdAt: '2026-03-01T00:00:00Z', processedAt: '2026-03-01T00:00:00Z' },
  ];
  const audit: AuditEntry[] = [
    { id: 'a1', timestamp: now, action: 'system_init', admin: 'System', details: 'Admin panel initialized' },
  ];
  const settings: BankSettings = {
    dailyTransferLimit: 500000, perTxLimit: 100000, intlWireFee: 35, localTransferFee: 0,
    savingsRate: 4.25, overdraftRate: 18.5,
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'AED', 'CAD', 'AUD'],
    maintenanceMode: false, bankName: 'Londway Capital', bankTagline: 'Premium Private Banking',
  };
  return { users, transactions, audit, settings };
}

// ── Persistence ────────────────────────────────────────────────
function loadData() {
  if (typeof window === 'undefined') return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ReturnType<typeof getDefaultData>;
      if (!parsed.settings) parsed.settings = getDefaultData().settings;
      return parsed;
    }
  } catch { /* */ }
  const d = getDefaultData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  return d;
}
function saveData(data: ReturnType<typeof getDefaultData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Helpers ────────────────────────────────────────────────────
let idCounter = Date.now();
function uid() { return 'id_' + (++idCounter).toString(36); }
function fmtMoney(n: number) { return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return new Date(d).toLocaleString(); }

// ── Per-user key helpers (mirrors the user app's store.ts logic) ────────────
function safeEmail(email: string) { return email.toLowerCase().replace(/[^a-z0-9]/g, '_'); }
function userKey(base: string, email: string) { return `${base}__${safeEmail(email)}`; }

// Writes a credit/debit entry directly to the user's bank account localStorage key
// so that admin funding is immediately visible in the user-facing app.
// If bank accounts don't exist yet, they are auto-created with seed structure.
function syncUserBankAccounts(
  email: string, amount: number, isCredit: boolean,
  tx: { id: string; description: string; createdAt: string },
) {
  try {
    const key = userKey('londway_bank_accounts', email);
    let raw = localStorage.getItem(key);
    // If bank accounts don't exist yet, create seed accounts so funding doesn't silently vanish
    if (!raw) {
      const suffix = `-${email.replace(/[^a-z0-9]/gi, '').slice(0, 6)}`;
      const acctNum = () => Math.floor(10000000 + Math.random() * 90000000).toString();
      const seed = [
        { id: `acc-1${suffix}`, type: 'Checking', name: 'Primary Checking', balance: 0, currency: '$', accountNumber: acctNum(), frozen: false, recentActivity: 'No recent activity', transactions: [] },
        { id: `acc-2${suffix}`, type: 'Savings', name: 'High-Yield Savings', balance: 0, currency: '$', accountNumber: acctNum(), frozen: false, recentActivity: 'No recent activity', transactions: [] },
      ];
      localStorage.setItem(key, JSON.stringify(seed));
      raw = localStorage.getItem(key);
    }
    const accts: any[] = JSON.parse(raw!);
    if (!accts.length) return;
    const idx = accts.findIndex((a: any) => a.type === 'Checking' || a.type === 'checking');
    const i = idx >= 0 ? idx : 0;
    accts[i].balance = isCredit
      ? Math.round((accts[i].balance + amount) * 100) / 100
      : Math.max(0, Math.round((accts[i].balance - amount) * 100) / 100);
    const entry = { id: tx.id, type: isCredit ? 'credit' : 'debit', description: tx.description, amount, date: tx.createdAt, status: 'completed' };
    accts[i].transactions = [entry, ...(Array.isArray(accts[i].transactions) ? accts[i].transactions : [])];
    accts[i].recentActivity = tx.description;
    localStorage.setItem(key, JSON.stringify(accts));
  } catch {}
}

// ── Aggregate helpers: read per-user data across all known users ────────────
function getAllUserData(base: string, users: User[]): any[] {
  const all: any[] = [];
  for (const u of users) {
    const key = userKey(base, u.email);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const items = JSON.parse(raw);
        if (Array.isArray(items)) all.push(...items.map((item: any) => ({ ...item, _userEmail: u.email })));
      }
    } catch {}
  }
  return all;
}

function updateUserItem(base: string, email: string, itemId: string, updates: Record<string, any>) {
  const key = userKey(base, email);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const items = JSON.parse(raw);
    const updated = items.map((t: any) => t.id === itemId ? { ...t, ...updates } : t);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

function deleteUserItem(base: string, email: string, itemId: string) {
  const key = userKey(base, email);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const items = JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(items.filter((t: any) => t.id !== itemId)));
  } catch {}
}

function writeUserNotification(base: string, email: string, notif: any) {
  const key = userKey(base, email);
  try {
    const raw = localStorage.getItem(key);
    const items = raw ? JSON.parse(raw) : [];
    localStorage.setItem(key, JSON.stringify([notif, ...items]));
  } catch {}
}

// ── Styles ─────────────────────────────────────────────────────
const cardS = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: S2, borderRadius: 16, border: '1px solid rgba(196,160,82,0.1)', padding: '1.5rem', ...extra,
});
const thS: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', color: SL, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid rgba(196,160,82,0.08)', whiteSpace: 'nowrap' };
const tdS: React.CSSProperties = { padding: '10px 12px', fontSize: '0.85rem', color: IV, borderBottom: '1px solid rgba(196,160,82,0.04)' };
const btnP: React.CSSProperties = { background: `linear-gradient(135deg,${G},#a8873e)`, border: 'none', color: BG, borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'Inter,sans-serif' };
const btnD: React.CSSProperties = { background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.25)', color: '#ff4d4f', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'Inter,sans-serif' };
const btnG: React.CSSProperties = { background: 'rgba(196,160,82,0.07)', border: '1px solid rgba(196,160,82,0.18)', color: G, borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', fontFamily: 'Inter,sans-serif' };
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(196,160,82,0.18)', borderRadius: 10, padding: '10px 14px', color: IV, fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter,sans-serif' };
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    pending: ['rgba(196,160,82,0.12)', G], completed: ['rgba(80,200,120,0.12)', '#50C878'],
    approved: ['rgba(80,200,120,0.12)', '#50C878'], active: ['rgba(80,200,120,0.12)', '#50C878'],
    flagged: ['rgba(255,165,0,0.12)', '#FFA500'], failed: ['rgba(255,77,79,0.12)', '#ff4d4f'],
    rejected: ['rgba(255,77,79,0.12)', '#ff4d4f'], frozen: ['rgba(255,77,79,0.12)', '#ff4d4f'],
    reversed: ['rgba(162,178,191,0.12)', '#A2B2BF'], cancelled: ['rgba(162,178,191,0.12)', '#A2B2BF'],
  };
  const [bg, c] = m[status] ?? ['rgba(162,178,191,0.12)', '#A2B2BF'];
  return <span style={{ background: bg, color: c, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{status}</span>;
}

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={cardS()}>
      <div style={{ fontSize: '0.7rem', color: SL, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: 800, color: color ?? G, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: SL, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,19,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: S2, borderRadius: 20, border: '1px solid rgba(196,160,82,0.2)', padding: '2rem', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: G, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.3rem' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN ADMIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function AdminDashboard({ onLogout, adminName }: { user: { token: string }; onLogout?: () => void; adminName?: string }) {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState<Tab>('overview');
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [search, setSearch] = useState('');

  const [editUser, setEditUser] = useState<User | null>(null);
  const [pinModal, setPinModal] = useState<User | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [fundModal, setFundModal] = useState<{ userId: string; mode: 'credit' | 'debit' } | null>(null);
  const [fundAmt, setFundAmt] = useState('');
  const [fundDesc, setFundDesc] = useState('');
  const [fundDate, setFundDate] = useState('');
  const [newUserModal, setNewUserModal] = useState(false);
  const [newTxModal, setNewTxModal] = useState(false);
  const [editTxModal, setEditTxModal] = useState<Transaction | null>(null);

  const [nu, setNu] = useState({ name: '', email: '', password: '', pin: '', role: 'user', balance: '', phone: '', address: '', tier: 'Standard', createdAt: '' });
  const [nt, setNt] = useState({ userId: '', type: 'credit' as Transaction['type'], amount: '', currency: 'USD', description: '', status: 'completed', createdAt: '' });
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Notifications state
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning'>('info');
  const [notifTarget, setNotifTarget] = useState('all');

  // Settings state
  const [settingsForm, setSettingsForm] = useState(data.settings);

  const aName = adminName || 'God Admin';
  const persist = useCallback((d: typeof data) => { setData(d); saveData(d); }, []);
  const notify = (ok: boolean, msg: string) => { setToast({ ok, msg }); setTimeout(() => setToast(null), 4000); };

  const addAudit = useCallback((action: string, target?: string, details?: string) => {
    const entry: AuditEntry = { id: uid(), timestamp: new Date().toISOString(), action, admin: aName, target, details };
    setData(prev => { const next = { ...prev, audit: [...prev.audit, entry] }; saveData(next); return next; });
  }, [aName]);

  // ── Activation link helpers ────────────────────────────────────
  function makeFundedTx(target: number, acctId: string): object[] {
    if (target <= 0) return [];
    const credits = ['Initial Deposit','Direct Deposit – Payroll','Wire Transfer Received','ACH Transfer In','Account Funding','Interest Credit','Incoming Wire'];
    const debits = ['ATM Withdrawal','Card Purchase','Wire Fee','Service Fee'];
    const DAY = 86400000;
    const now = Date.now();
    const numD = target < 1000 ? 0 : Math.floor(Math.random() * 3);
    const txDebits: object[] = [];
    let totalD = 0;
    for (let i = 0; i < numD; i++) {
      const a = Math.round(target * (0.005 + Math.random() * 0.02) * 100) / 100;
      totalD += a;
      txDebits.push({ id: `${acctId}-d${i}`, type: 'debit', description: debits[Math.floor(Math.random() * debits.length)], amount: a, date: new Date(now - (i + 1) * 7 * DAY).toISOString(), status: 'completed' });
    }
    const totalC = target + totalD;
    const n = Math.floor(Math.random() * 4) + 5;
    const txCredits: object[] = [];
    let alloc = 0;
    for (let i = 0; i < n - 1; i++) {
      const rem = totalC - alloc;
      const a = Math.round(Math.min(rem * (Math.random() * 0.35 + 0.08), rem - 1) * 100) / 100;
      alloc += a;
      txCredits.push({ id: `${acctId}-c${i}`, type: 'credit', description: credits[Math.floor(Math.random() * credits.length)], amount: a, date: new Date(now - (n - i) * 18 * DAY).toISOString(), status: 'completed' });
    }
    txCredits.push({ id: `${acctId}-c${n - 1}`, type: 'credit', description: 'Account Opening Deposit', amount: Math.round((totalC - alloc) * 100) / 100, date: new Date(now - n * 18 * DAY).toISOString(), status: 'completed' });
    return [...txCredits, ...txDebits].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  function buildActivationToken(email: string, password: string, pin: string, name: string, role: string, tier: string, balance: number): string {
    const safe = email.replace(/[^a-z0-9]/gi, '').slice(0, 6);
    const acctNum = () => Math.floor(10000000 + Math.random() * 90000000).toString();
    const checkBal = Math.round(balance * 0.65 * 100) / 100;
    const saveBal = Math.round((balance - checkBal) * 100) / 100;
    const c1 = `acc-1-${safe}`, c2 = `acc-2-${safe}`;
    const bankAccounts = [
      { id: c1, type: 'Checking', name: 'Primary Checking', balance: checkBal, currency: '$', accountNumber: acctNum(), frozen: false, recentActivity: 'Direct Deposit', transactions: makeFundedTx(checkBal, c1) },
      { id: c2, type: 'Savings', name: 'High-Yield Savings', balance: saveBal, currency: '$', accountNumber: acctNum(), frozen: false, recentActivity: 'Interest Credit', transactions: makeFundedTx(saveBal, c2) },
    ];
    const payload = { email, password, pin, name, role, tier, bankAccounts };
    return encodeURIComponent(btoa(JSON.stringify(payload)));
  }

  // ── User Actions ─────────────────────────────────────────────
  function createUser(e: React.FormEvent) {
    e.preventDefault();
    const user: User = {
      id: uid(), name: nu.name, email: nu.email, role: nu.role,
      frozen: false, kyc: false, balance: parseFloat(nu.balance) || 0,
      createdAt: nu.createdAt ? new Date(nu.createdAt).toISOString() : new Date().toISOString(),
      phone: nu.phone || undefined, address: nu.address || undefined, tier: nu.tier,
      password: nu.password || undefined,
      pin: nu.pin || undefined,
    };
    persist({ ...data, users: [...data.users, user] });
    // Also register in londway_accounts so the user can log in on this device
    try {
      const raw = localStorage.getItem('londway_accounts');
      const accounts: any[] = raw ? JSON.parse(raw) : [];
      if (!accounts.find((a: any) => a.email === nu.email)) {
        accounts.push({
          email: nu.email,
          password: nu.password,
          pin: nu.pin,
          name: nu.name,
          role: nu.role,
          phone: nu.phone || '',
          tier: nu.tier,
          idVerified: false,
        });
        localStorage.setItem('londway_accounts', JSON.stringify(accounts));
      }
    } catch {}
    addAudit('user_created', user.email, `Balance: ${fmtMoney(user.balance)}, Role: ${user.role}`);
    notify(true, `User ${user.name} created`);
    setNewUserModal(false);
    // Generate activation link so user can log in from any device
    const token = buildActivationToken(nu.email, nu.password, nu.pin, nu.name, nu.role, nu.tier, parseFloat(nu.balance) || 0);
    const base = typeof window !== 'undefined' ? window.location.origin.replace('/admin', '') : 'https://londwaycapital.com';
    setActivationLink(`${base}/?activate=${token}`);
    setLinkCopied(false);
    setNu({ name: '', email: '', password: '', pin: '', role: 'user', balance: '', phone: '', address: '', tier: 'Standard', createdAt: '' });
  }

  function updateUser(updated: User) {
    persist({ ...data, users: data.users.map(u => u.id === updated.id ? updated : u) });
    // Sync changes to londway_accounts so login stays in sync
    try {
      const raw = localStorage.getItem('londway_accounts');
      const accounts: any[] = raw ? JSON.parse(raw) : [];
      const idx = accounts.findIndex((a: any) => a.email === updated.email);
      if (idx !== -1) {
        accounts[idx].name = updated.name;
        accounts[idx].role = updated.role;
        if (updated.tier) accounts[idx].tier = updated.tier;
        if (updated.password) accounts[idx].password = updated.password;
        if (updated.pin) accounts[idx].pin = updated.pin;
        localStorage.setItem('londway_accounts', JSON.stringify(accounts));
      } else if (updated.password || updated.pin) {
        accounts.push({ email: updated.email, password: updated.password || '', pin: updated.pin || '', name: updated.name, role: updated.role, tier: updated.tier, idVerified: false });
        localStorage.setItem('londway_accounts', JSON.stringify(accounts));
      }
    } catch {}
    addAudit('user_updated', updated.email, `Name: ${updated.name}, Tier: ${updated.tier}`);
    notify(true, `User ${updated.name} updated`);
    setEditUser(null);
  }

  function savePinOnly(u: User, pin: string) {
    if (!pin || pin.length !== 4) { notify(false, 'PIN must be exactly 4 digits'); return; }
    const updated = { ...u, pin };
    persist({ ...data, users: data.users.map(x => x.id === updated.id ? updated : x) });
    try {
      const raw = localStorage.getItem('londway_accounts');
      const accounts: any[] = raw ? JSON.parse(raw) : [];
      const idx = accounts.findIndex((a: any) => a.email === updated.email);
      if (idx !== -1) {
        accounts[idx].pin = pin;
        localStorage.setItem('londway_accounts', JSON.stringify(accounts));
      } else {
        accounts.push({ email: updated.email, password: updated.password || '', pin, name: updated.name, role: updated.role, tier: updated.tier, idVerified: false });
        localStorage.setItem('londway_accounts', JSON.stringify(accounts));
      }
    } catch {}
    addAudit('pin_updated', updated.email, 'PIN changed by admin');
    notify(true, `PIN updated for ${updated.name}`);
    setPinModal(null);
    setPinValue('');
  }

  function toggleFreeze(u: User) {
    persist({ ...data, users: data.users.map(x => x.id === u.id ? { ...x, frozen: !x.frozen } : x) });
    addAudit(u.frozen ? 'account_unfrozen' : 'account_frozen', u.email);
    notify(true, `${u.name} ${u.frozen ? 'unfrozen' : 'frozen'}`);
  }

  function toggleKyc(u: User) {
    persist({ ...data, users: data.users.map(x => x.id === u.id ? { ...x, kyc: !x.kyc } : x) });
    addAudit('kyc_changed', u.email, `KYC: ${!u.kyc}`);
    notify(true, `${u.name} KYC ${u.kyc ? 'revoked' : 'verified'}`);
  }

  function changeRole(u: User, role: string) {
    persist({ ...data, users: data.users.map(x => x.id === u.id ? { ...x, role } : x) });
    addAudit('role_changed', u.email, `New role: ${role}`);
    notify(true, `${u.name} role → ${role}`);
  }

  function deleteUser(u: User) {
    if (!confirm(`Permanently delete "${u.name}"? All their transactions will remain for audit.`)) return;
    persist({ ...data, users: data.users.filter(x => x.id !== u.id) });
    addAudit('user_deleted', u.email, `Balance at deletion: ${fmtMoney(u.balance)}`);
    notify(true, `${u.name} deleted`);
  }

  // ── Fund / Debit ─────────────────────────────────────────────
  function handleFund(e: React.FormEvent) {
    e.preventDefault();
    if (!fundModal) return;
    const amount = parseFloat(fundAmt);
    if (!amount || amount <= 0) { notify(false, 'Invalid amount'); return; }
    const user = data.users.find(u => u.id === fundModal.userId);
    if (!user) return;
    const isCredit = fundModal.mode === 'credit';
    const newBalance = isCredit ? user.balance + amount : user.balance - amount;
    const tx: Transaction = {
      id: uid(), userId: user.id, userName: user.name,
      type: isCredit ? 'credit' : 'debit', amount, currency: 'USD', status: 'completed',
      description: fundDesc || (isCredit ? 'Admin credit' : 'Admin debit'),
      reference: `ADM-${Date.now().toString(36).toUpperCase()}`,
      createdAt: fundDate ? new Date(fundDate).toISOString() : new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };
    persist({
      ...data,
      users: data.users.map(u => u.id === fundModal.userId ? { ...u, balance: newBalance } : u),
      transactions: [...data.transactions, tx],
    });
    // Sync the funded amount to the user's bank account so the user app shows the correct balance
    syncUserBankAccounts(user.email, amount, isCredit, { id: tx.id, description: tx.description, createdAt: tx.createdAt });
    addAudit(isCredit ? 'account_credited' : 'account_debited', user.email, `${fmtMoney(amount)} — ${tx.description}${fundDate ? ' (backdated)' : ''}`);
    notify(true, `${isCredit ? 'Credited' : 'Debited'} ${fmtMoney(amount)} ${isCredit ? 'to' : 'from'} ${user.name}`);
    setFundModal(null); setFundAmt(''); setFundDesc(''); setFundDate('');
  }

  // ── Transaction Actions ──────────────────────────────────────
  function createTransaction(e: React.FormEvent) {
    e.preventDefault();
    const user = data.users.find(u => u.id === nt.userId);
    if (!user) { notify(false, 'Select a user'); return; }
    const amount = parseFloat(nt.amount);
    if (!amount || amount <= 0) { notify(false, 'Invalid amount'); return; }
    const tx: Transaction = {
      id: uid(), userId: user.id, userName: user.name,
      type: nt.type, amount, currency: nt.currency, status: nt.status,
      description: nt.description || 'Manual transaction',
      reference: `MAN-${Date.now().toString(36).toUpperCase()}`,
      createdAt: nt.createdAt ? new Date(nt.createdAt).toISOString() : new Date().toISOString(),
      processedAt: nt.status === 'completed' ? new Date().toISOString() : undefined,
    };
    let users = data.users;
    if (nt.status === 'completed') {
      const delta = ['credit', 'interest'].includes(nt.type) ? amount : -amount;
      users = users.map(u => u.id === user.id ? { ...u, balance: u.balance + delta } : u);
    }
    persist({ ...data, users, transactions: [...data.transactions, tx] });
    // Sync completed transactions to the user's bank account
    if (nt.status === 'completed') {
      const isPositive = ['credit', 'interest'].includes(nt.type);
      syncUserBankAccounts(user.email, amount, isPositive, { id: tx.id, description: tx.description, createdAt: tx.createdAt });
    }
    addAudit('transaction_created', user.email, `${nt.type} ${fmtMoney(amount)}${nt.createdAt ? ' (backdated)' : ''}`);
    notify(true, `Transaction created for ${user.name}`);
    setNewTxModal(false);
    setNt({ userId: '', type: 'credit', amount: '', currency: 'USD', description: '', status: 'completed', createdAt: '' });
  }

  function changeTransactionStatus(tx: Transaction, newStatus: string) {
    const oldStatus = tx.status;
    let users = data.users;
    const user = users.find(u => u.id === tx.userId);
    if (user) {
      const delta = ['credit', 'interest'].includes(tx.type) ? tx.amount : -tx.amount;
      if (oldStatus !== 'completed' && newStatus === 'completed') {
        users = users.map(u => u.id === tx.userId ? { ...u, balance: u.balance + delta } : u);
        syncUserBankAccounts(user.email, tx.amount, delta > 0, { id: tx.id, description: tx.description, createdAt: tx.createdAt });
      } else if (oldStatus === 'completed' && newStatus !== 'completed') {
        users = users.map(u => u.id === tx.userId ? { ...u, balance: u.balance - delta } : u);
        // Reverse the previous credit/debit
        syncUserBankAccounts(user.email, tx.amount, delta < 0, { id: tx.id + '-rev', description: 'Reversal: ' + tx.description, createdAt: new Date().toISOString() });
      }
    }
    persist({
      ...data, users,
      transactions: data.transactions.map(t => t.id === tx.id ? { ...t, status: newStatus, processedAt: newStatus === 'completed' ? new Date().toISOString() : t.processedAt } : t),
    });
    addAudit('tx_status_changed', tx.userName, `${tx.reference}: ${oldStatus} → ${newStatus}`);
    notify(true, `${tx.reference} → ${newStatus}`);
  }

  function updateTransaction(updated: Transaction) {
    persist({ ...data, transactions: data.transactions.map(t => t.id === updated.id ? updated : t) });
    addAudit('transaction_edited', updated.userName, `${updated.reference} edited`);
    notify(true, `Transaction ${updated.reference} updated`);
    setEditTxModal(null);
  }

  function deleteTransaction(tx: Transaction) {
    if (!confirm(`Delete transaction ${tx.reference}?`)) return;
    persist({ ...data, transactions: data.transactions.filter(t => t.id !== tx.id) });
    addAudit('transaction_deleted', tx.userName, `${tx.reference} — ${fmtMoney(tx.amount)}`);
    notify(true, 'Transaction deleted');
  }

  // ── Computed ─────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredUsers = data.users.filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const filteredTx = data.transactions.filter(t => !q || t.userName.toLowerCase().includes(q) || t.reference.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  const pending = data.transactions.filter(t => t.status === 'pending');
  const flagged = data.transactions.filter(t => t.status === 'flagged');
  const totalBalance = data.users.reduce((s, u) => s + u.balance, 0);

  const userCards = typeof window !== 'undefined' ? getAllUserData('londway_cards', data.users) : [];
  const userNotifs = typeof window !== 'undefined' ? getAllUserData('londway_notifications', data.users) : [];
  const pendingCards = userCards.filter((c: any) => c.status === 'pending');
  const userTransfers: any[] = typeof window !== 'undefined' ? getAllUserData('londway_transfers', data.users) : [];
  const pendingUserTransfers = userTransfers.filter((t: any) => t.status === 'pending');
  const linkClicks: any[] = typeof window !== 'undefined' ? (() => { try { const r = localStorage.getItem('londway_link_clicks'); return r ? JSON.parse(r) : []; } catch { return []; } })() : [];

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview', label: '⚡ Overview' },
    { id: 'users', label: '👥 Users', badge: data.users.length },
    { id: 'transactions', label: '⇄ Transactions', badge: pending.length + flagged.length + pendingUserTransfers.length || undefined },
    { id: 'funding', label: '💰 Fund & Backdate' },
    { id: 'cards', label: '💳 Cards', badge: pendingCards.length || undefined },
    { id: 'notifications', label: '🔔 Notifications' },
    { id: 'visitors', label: '🌍 Visitors', badge: linkClicks.length || undefined },
    { id: 'settings', label: '⚙ Settings' },
    { id: 'audit', label: '📋 Audit Log', badge: data.audit.length },
  ];

  return (
    <main style={{ background: BG, minHeight: '100vh', color: IV, fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? 'rgba(80,200,120,0.12)' : 'rgba(255,77,79,0.12)', border: `1px solid ${toast.ok ? 'rgba(80,200,120,0.3)' : 'rgba(255,77,79,0.3)'}`, color: toast.ok ? '#50C878' : '#ff4d4f', padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: '0.88rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxWidth: '90vw' }}>
          {toast.ok ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#0a1020 0%,#060913 100%)', borderBottom: '1px solid rgba(196,160,82,0.08)', padding: '1.2rem 1.5rem' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(196,160,82,0.08)', border: '1px solid rgba(196,160,82,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>⚡</div>
            <div>
              <h1 style={{ color: G, fontWeight: 800, fontSize: 'clamp(1rem,3vw,1.4rem)', margin: 0 }}>LONDWAY GOD MODE</h1>
              <p style={{ color: SL, fontSize: '0.72rem', margin: 0 }}>Full control · {aName}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {(pending.length > 0 || flagged.length > 0) && (
              <div style={{ background: 'rgba(196,160,82,0.1)', border: '1px solid rgba(196,160,82,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', color: G, fontWeight: 700 }}>
                {pending.length} pending · {flagged.length} flagged
              </div>
            )}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inp, width: 180, padding: '7px 12px', fontSize: '0.8rem' }} />
            {onLogout && <button onClick={onLogout} style={{ ...btnD, padding: '7px 14px' }}>Logout</button>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '1.2rem 1.5rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: 4, border: '1px solid rgba(196,160,82,0.07)', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              position: 'relative', flex: '0 0 auto', padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: tab === t.id ? 700 : 500, fontFamily: 'Inter,sans-serif', fontSize: '0.85rem',
              background: tab === t.id ? `linear-gradient(135deg,${G},#a8873e)` : 'transparent',
              color: tab === t.id ? BG : SL, whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
              {t.label}
              {!!t.badge && <span style={{ marginLeft: 6, background: tab === t.id ? 'rgba(0,0,0,0.2)' : 'rgba(196,160,82,0.15)', color: tab === t.id ? '#fff' : G, borderRadius: 12, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 800 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <Stat label="Total Clients" value={data.users.length} sub={`${data.users.filter(u => !u.frozen).length} active`} />
              <Stat label="AUM" value={fmtMoney(totalBalance)} />
              <Stat label="Pending" value={pending.length + flagged.length} sub={`${pending.length} pending · ${flagged.length} flagged`} color={pending.length > 0 ? G : '#50C878'} />
              <Stat label="Frozen" value={data.users.filter(u => u.frozen).length} color={data.users.some(u => u.frozen) ? '#ff4d4f' : '#50C878'} />
              <Stat label="KYC Verified" value={data.users.filter(u => u.kyc).length} sub={`of ${data.users.length}`} color="#50C878" />
              <Stat label="Transactions" value={data.transactions.length} color="#A2B2BF" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
              {[
                { label: '+ Create User', action: () => setNewUserModal(true), c: G },
                { label: '+ New Transaction', action: () => setNewTxModal(true), c: '#50C878' },
                { label: '👥 Manage Users', action: () => setTab('users'), c: '#A2B2BF' },
                { label: '💰 Fund Account', action: () => setTab('funding'), c: G },
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{
                  background: `${a.c}10`, border: `1px solid ${a.c}30`, borderRadius: 12,
                  padding: '1rem', cursor: 'pointer', color: a.c, fontWeight: 700,
                  fontSize: '0.88rem', fontFamily: 'Inter,sans-serif', transition: 'all 0.15s', textAlign: 'center',
                }}>{a.label}</button>
              ))}
            </div>
            {(pending.length > 0 || pendingUserTransfers.length > 0) && (
              <div style={cardS({ marginBottom: '1.5rem' })}>
                <h3 style={{ margin: '0 0 14px', color: G, fontWeight: 700, fontSize: '0.9rem' }}>🔔 PENDING APPROVAL ({pending.length + pendingUserTransfers.length})</h3>
                {pending.slice(0, 5).map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(196,160,82,0.05)', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ color: IV, fontWeight: 600 }}>{tx.userName}</span>
                      <span style={{ marginLeft: 8, color: SL, fontSize: '0.78rem' }}>{tx.reference} · {tx.type}</span>
                      <div style={{ color: SL, fontSize: '0.75rem', marginTop: 2 }}>{tx.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: G, fontWeight: 800 }}>{fmtMoney(tx.amount)}</span>
                      <button style={btnP} onClick={() => changeTransactionStatus(tx, 'completed')}>✓ Approve</button>
                      <button style={btnD} onClick={() => changeTransactionStatus(tx, 'rejected')}>✕ Reject</button>
                    </div>
                  </div>
                ))}
                {pendingUserTransfers.slice(0, 5).map((tx: any) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(196,160,82,0.05)', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ color: IV, fontWeight: 600 }}>{tx.recipientName}</span>
                      <span style={{ marginLeft: 8, color: SL, fontSize: '0.78rem' }}>{tx.reference} · {tx.type}</span>
                      <div style={{ color: SL, fontSize: '0.75rem', marginTop: 2 }}>{tx.description || 'User transfer request'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: G, fontWeight: 800 }}>{tx.currency} {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <button style={btnP} onClick={() => {
                        updateUserItem('londway_transfers', tx._userEmail, tx.id, { status: 'approved' });
                        addAudit('transfer_approved', tx.recipientName, `${tx.reference} — ${tx.currency} ${tx.amount}`);
                        notify(true, `Transfer approved: ${tx.reference}`);
                        setData({ ...data });
                      }}>✓ Approve</button>
                      <button style={btnD} onClick={() => {
                        updateUserItem('londway_transfers', tx._userEmail, tx.id, { status: 'rejected' });
                        addAudit('transfer_rejected', tx.recipientName, `${tx.reference} — ${tx.currency} ${tx.amount}`);
                        notify(true, `Transfer rejected: ${tx.reference}`);
                        setData({ ...data });
                      }}>✕ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ USERS ═══ */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ margin: 0, color: IV, fontWeight: 700, fontSize: '1.1rem' }}>👥 User Management ({filteredUsers.length})</h2>
              <button onClick={() => setNewUserModal(true)} style={{ ...btnP, padding: '10px 20px', fontSize: '0.88rem' }}>+ Add User</button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredUsers.map(u => {
                const userTxs = data.transactions.filter(t => t.userId === u.id);
                return (
                <div key={u.id} style={{ background: S2, borderRadius: 16, border: `1px solid ${u.frozen ? 'rgba(255,77,79,0.25)' : 'rgba(196,160,82,0.12)'}`, padding: '1.2rem 1.4rem', position: 'relative' }}>
                  {u.frozen && <div style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(255,77,79,0.12)', color: '#ff4d4f', padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em' }}>FROZEN</div>}
                  {/* Row 1: Identity */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg,${G},#a8873e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BG, fontWeight: 800, fontSize: '0.95rem', flexShrink: 0 }}>{u.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: IV }}>{u.name}</div>
                          <div style={{ color: SL, fontSize: '0.78rem' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                        <select value={u.role} onChange={e => changeRole(u, e.target.value)} style={{ background: 'rgba(196,160,82,0.06)', border: '1px solid rgba(196,160,82,0.2)', color: G, borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 700 }}>
                          {['user','admin','vip','support','auditor'].map(r => <option key={r}>{r}</option>)}
                        </select>
                        <span style={{ background: 'rgba(196,160,82,0.08)', color: G, borderRadius: 6, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{u.tier || 'Standard'}</span>
                        <button onClick={() => toggleKyc(u)} style={{ background: u.kyc ? 'rgba(80,200,120,0.1)' : 'rgba(255,77,79,0.1)', border: `1px solid ${u.kyc ? 'rgba(80,200,120,0.3)' : 'rgba(255,77,79,0.3)'}`, color: u.kyc ? '#50C878' : '#ff4d4f', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', fontFamily: 'Inter,sans-serif' }}>{u.kyc ? '✓ KYC' : '✗ KYC'}</button>
                        <span style={{ color: SL, fontSize: '0.72rem', alignSelf: 'center' }}>Since {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: G, letterSpacing: '-0.02em' }}>{fmtMoney(u.balance)}</div>
                      <div style={{ color: SL, fontSize: '0.72rem', marginTop: 2 }}>{userTxs.length} transactions</div>
                    </div>
                  </div>

                  {/* Row 2: Credentials — PASSWORD & PIN prominently displayed */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, padding: '12px 14px', background: 'rgba(196,160,82,0.03)', borderRadius: 10, border: '1px solid rgba(196,160,82,0.08)' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: SL, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>🔒 Password</div>
                      {u.password ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#50C878', fontWeight: 700, fontSize: '0.88rem', fontFamily: 'monospace' }}>{u.password}</span>
                          <span style={{ background: 'rgba(80,200,120,0.1)', color: '#50C878', borderRadius: 5, padding: '1px 6px', fontSize: '0.6rem', fontWeight: 700 }}>SET</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#ff4d4f', fontSize: '0.82rem', fontWeight: 600 }}>Not set</span>
                          <button onClick={() => setEditUser(u)} style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', color: '#FFA500', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.65rem', fontFamily: 'Inter,sans-serif' }}>Set Now</button>
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: SL, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>🔑 PIN</div>
                      {u.pin ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#50C878', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.2em', fontFamily: 'monospace' }}>{u.pin}</span>
                          <span style={{ background: 'rgba(80,200,120,0.1)', color: '#50C878', borderRadius: 5, padding: '1px 6px', fontSize: '0.6rem', fontWeight: 700 }}>SET</span>
                          <button onClick={() => { setPinModal(u); setPinValue(u.pin || ''); }} style={{ background: 'rgba(196,160,82,0.06)', border: '1px solid rgba(196,160,82,0.15)', color: G, borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.65rem', fontFamily: 'Inter,sans-serif' }}>Change</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#ff4d4f', fontSize: '0.82rem', fontWeight: 600 }}>Not set</span>
                          <button onClick={() => { setPinModal(u); setPinValue(''); }} style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', color: '#FFA500', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.65rem', fontFamily: 'Inter,sans-serif' }}>Set PIN</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Contact info */}
                  {(u.phone || u.address) && (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14, fontSize: '0.78rem', color: SL }}>
                      {u.phone && <span>📞 {u.phone}</span>}
                      {u.address && <span>📍 {u.address}</span>}
                    </div>
                  )}

                  {/* Row 4: Actions — full power */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid rgba(196,160,82,0.06)' }}>
                    <button style={{ ...btnP, padding: '7px 14px' }} onClick={() => { setFundModal({ userId: u.id, mode: 'credit' }); setFundAmt(''); setFundDesc(''); setFundDate(''); }}>+ Credit</button>
                    <button style={{ ...btnG, padding: '7px 14px' }} onClick={() => { setFundModal({ userId: u.id, mode: 'debit' }); setFundAmt(''); setFundDesc(''); setFundDate(''); }}>− Debit</button>
                    <button style={{ ...btnG, padding: '7px 14px' }} onClick={() => setEditUser(u)}>✏ Edit</button>
                    <button style={{ ...btnG, padding: '7px 14px' }} onClick={() => { setPinModal(u); setPinValue(u.pin || ''); }}>🔑 PIN</button>
                    <button style={{ ...btnG, padding: '7px 14px', color: u.frozen ? '#50C878' : '#ff4d4f', borderColor: u.frozen ? 'rgba(80,200,120,0.3)' : 'rgba(255,77,79,0.3)' }} onClick={() => toggleFreeze(u)}>{u.frozen ? '🔓 Unfreeze' : '🔒 Freeze'}</button>
                    <button style={{ ...btnD, padding: '7px 14px' }} onClick={() => deleteUser(u)}>🗑 Delete</button>
                  </div>
                </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div style={{ textAlign: 'center', color: SL, padding: '3rem' }}>No users found. Create one to get started.</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TRANSACTIONS ═══ */}
        {tab === 'transactions' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* User Transfer Requests */}
            <div style={cardS()}>
              <h2 style={{ margin: '0 0 14px', color: G, fontWeight: 700, fontSize: '1rem' }}>↗ User Transfer Requests ({userTransfers.length})</h2>
              {userTransfers.length === 0 ? (
                <div style={{ textAlign: 'center', color: SL, padding: '2rem' }}>No transfer requests yet</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                    <thead><tr>{['Ref','Recipient','Type','Amount','Date','Status','Actions'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[...userTransfers].reverse().map((tx: any) => (
                        <tr key={tx.id}>
                          <td style={{ ...tdS, fontFamily: 'monospace', fontSize: '0.72rem', color: G }}>{tx.reference}</td>
                          <td style={{ ...tdS, fontWeight: 600 }}>{tx.recipientName}</td>
                          <td style={tdS}><span style={{ background: 'rgba(196,160,82,0.08)', color: G, borderRadius: 5, padding: '2px 7px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{tx.type}</span></td>
                          <td style={{ ...tdS, fontWeight: 700, color: '#ff7875' }}>-{tx.currency} {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ ...tdS, color: SL, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}</td>
                          <td style={tdS}><Badge status={tx.status || 'pending'} /></td>
                          <td style={tdS}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              {tx.status === 'pending' && (
                                <>
                                  <button style={btnP} onClick={() => {
                                    updateUserItem('londway_transfers', tx._userEmail, tx.id, { status: 'approved' });
                                    addAudit('transfer_approved', tx.recipientName, `${tx.reference} — ${tx.currency} ${tx.amount}`);
                                    notify(true, `Transfer approved: ${tx.reference}`);
                                    setData({ ...data });
                                  }}>✓ Approve</button>
                                  <button style={btnD} onClick={() => {
                                    updateUserItem('londway_transfers', tx._userEmail, tx.id, { status: 'rejected' });
                                    addAudit('transfer_rejected', tx.recipientName, `${tx.reference} — ${tx.currency} ${tx.amount}`);
                                    notify(true, `Transfer rejected: ${tx.reference}`);
                                    setData({ ...data });
                                  }}>✕ Reject</button>
                                </>
                              )}
                              <button style={btnD} onClick={() => {
                                if (!confirm(`Delete transfer ${tx.reference}?`)) return;
                                deleteUserItem('londway_transfers', tx._userEmail, tx.id);
                                addAudit('transfer_deleted', tx.recipientName, tx.reference);
                                notify(true, 'Transfer deleted');
                                setData({ ...data });
                              }}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Admin Transactions */}
            <div style={cardS()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ margin: 0, color: IV, fontWeight: 700, fontSize: '1rem' }}>All Transactions ({filteredTx.length})</h2>
              <button onClick={() => setNewTxModal(true)} style={{ ...btnP, padding: '8px 16px', fontSize: '0.85rem' }}>+ Create Transaction</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead><tr>{['Ref','User','Type','Amount','Description','Date','Status','Actions'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredTx.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', color: SL, padding: '2rem' }}>No transactions</td></tr>
                  ) : [...filteredTx].reverse().map(tx => (
                    <tr key={tx.id}>
                      <td style={{ ...tdS, fontFamily: 'monospace', fontSize: '0.72rem', color: G }}>{tx.reference}</td>
                      <td style={{ ...tdS, fontWeight: 600 }}>{tx.userName}</td>
                      <td style={tdS}><span style={{ background: 'rgba(196,160,82,0.08)', color: G, borderRadius: 5, padding: '2px 7px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{tx.type}</span></td>
                      <td style={{ ...tdS, fontWeight: 700, color: ['credit','interest'].includes(tx.type) ? '#50C878' : '#ff7875' }}>
                        {['credit','interest'].includes(tx.type) ? '+' : '-'}{fmtMoney(tx.amount)}
                      </td>
                      <td style={{ ...tdS, color: SL, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                      <td style={{ ...tdS, color: SL, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{fmtDate(tx.createdAt)}</td>
                      <td style={tdS}>
                        <select value={tx.status} onChange={e => changeTransactionStatus(tx, e.target.value)} style={{ background: S2, border: '1px solid rgba(196,160,82,0.2)', color: G, borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
                          {['pending','completed','approved','flagged','rejected','failed','reversed','cancelled'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={tdS}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button style={btnG} onClick={() => setEditTxModal(tx)}>✏</button>
                          {tx.status === 'pending' && <button style={btnP} onClick={() => changeTransactionStatus(tx, 'completed')}>✓</button>}
                          <button style={btnD} onClick={() => deleteTransaction(tx)}>🗑</button>
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

        {/* ═══ FUNDING ═══ */}
        {tab === 'funding' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            <div style={cardS()}>
              <h2 style={{ margin: '0 0 18px', color: G, fontWeight: 700, fontSize: '1rem' }}>💰 Quick Fund / Debit</h2>
              <p style={{ color: SL, fontSize: '0.82rem', lineHeight: 1.7, marginBottom: 20 }}>Credit or debit any account. Backdate optional.</p>
              <div style={{ display: 'grid', gap: 12 }}>
                {data.users.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(196,160,82,0.06)', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                      <div style={{ color: SL, fontSize: '0.75rem' }}>{fmtMoney(u.balance)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={btnP} onClick={() => { setFundModal({ userId: u.id, mode: 'credit' }); setFundAmt(''); setFundDesc(''); setFundDate(''); }}>+ Credit</button>
                      <button style={btnG} onClick={() => { setFundModal({ userId: u.id, mode: 'debit' }); setFundAmt(''); setFundDesc(''); setFundDate(''); }}>− Debit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={cardS()}>
              <h2 style={{ margin: '0 0 18px', color: G, fontWeight: 700, fontSize: '1rem' }}>🕐 Backdate Account Creation</h2>
              <p style={{ color: SL, fontSize: '0.82rem', lineHeight: 1.7, marginBottom: 20 }}>Change when an account was created.</p>
              <div style={{ display: 'grid', gap: 12 }}>
                {data.users.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(196,160,82,0.06)', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                      <div style={{ color: SL, fontSize: '0.75rem' }}>Created: {fmtDate(u.createdAt)}</div>
                    </div>
                    <input type="datetime-local" defaultValue={u.createdAt.slice(0, 16)}
                      onBlur={e => {
                        if (!e.target.value) return;
                        const nd = new Date(e.target.value).toISOString();
                        if (nd === u.createdAt) return;
                        persist({ ...data, users: data.users.map(x => x.id === u.id ? { ...x, createdAt: nd } : x) });
                        addAudit('account_backdated', u.email, `New date: ${fmtDate(nd)}`);
                        notify(true, `${u.name} creation date updated`);
                      }}
                      style={{ ...inp, width: 200, padding: '6px 10px', fontSize: '0.8rem' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ VISITORS ═══ */}
        {tab === 'visitors' && (() => {
          const uniqCountries = [...new Set(linkClicks.map((c: any) => c.country).filter(Boolean))].length;
          const uniqIps = [...new Set(linkClicks.map((c: any) => c.ip).filter(Boolean))].length;
          function flagEmoji(code: string) {
            if (!code || code.length !== 2) return '🌐';
            return code.toUpperCase().replace(/./g, ch =>
              String.fromCodePoint(0x1F1E6 - 65 + ch.charCodeAt(0))
            );
          }
          return (
            <div style={cardS()}>
              {/* Summary row */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                {[
                  { label: 'Total Visits', value: linkClicks.length },
                  { label: 'Unique IPs', value: uniqIps },
                  { label: 'Countries', value: uniqCountries },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(196,160,82,0.06)', border: '1px solid rgba(196,160,82,0.12)', borderRadius: 10, padding: '12px 20px', minWidth: 100, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: G }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: SL, marginTop: 3, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
                <button onClick={() => {
                  if (!confirm('Clear all visitor logs?')) return;
                  localStorage.setItem('londway_link_clicks', '[]');
                  addAudit('visitor_log_cleared', 'System');
                  notify(true, 'Visitor log cleared');
                  setData({ ...data });
                }} style={{ ...btnD, marginLeft: 'auto', alignSelf: 'center' }}>Clear Log</button>
              </div>

              {linkClicks.length === 0 ? (
                <div style={{ textAlign: 'center', color: SL, padding: '3rem' }}>No visitor data yet — visits are recorded when users navigate the site.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                    <thead>
                      <tr>{['Flag', 'Country', 'State / Region', 'City', 'Page', 'IP', 'Time'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {linkClicks.map((c: any) => (
                        <tr key={c.id}>
                          <td style={{ ...tdS, fontSize: '1.3rem', textAlign: 'center' }}>{flagEmoji(c.countryCode || '')}</td>
                          <td style={{ ...tdS, fontWeight: 600, color: IV }}>{c.country || '—'}</td>
                          <td style={{ ...tdS, color: G }}>{c.state || '—'}</td>
                          <td style={{ ...tdS, color: SL }}>{c.city || '—'}</td>
                          <td style={{ ...tdS, fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(196,160,82,0.7)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.page || '/'}</td>
                          <td style={{ ...tdS, fontFamily: 'monospace', fontSize: '0.72rem', color: SL }}>{c.ip || '—'}</td>
                          <td style={{ ...tdS, color: SL, fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{c.timestamp ? fmtDate(c.timestamp) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══ AUDIT ═══ */}
        {tab === 'audit' && (
          <div style={cardS()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, color: IV, fontWeight: 700, fontSize: '1rem' }}>Audit Log ({data.audit.length})</h2>
              <button onClick={() => { if (confirm('Clear all audit logs?')) persist({ ...data, audit: [] }); }} style={btnD}>Clear</button>
            </div>
            {data.audit.length === 0 ? (
              <div style={{ textAlign: 'center', color: SL, padding: '2rem' }}>No audit events</div>
            ) : (
              <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {[...data.audit].reverse().map(a => {
                  const hi = a.action.includes('frozen') || a.action.includes('deleted') || a.action.includes('debit');
                  return (
                    <div key={a.id} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(196,160,82,0.05)', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ color: SL, fontSize: '0.72rem', whiteSpace: 'nowrap', minWidth: 130, fontFamily: 'monospace' }}>{fmtDate(a.timestamp)}</div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <span style={{ color: hi ? '#ff7875' : G, fontWeight: 700, fontSize: '0.8rem' }}>[{a.action}]</span>
                        {a.target && <span style={{ color: IV, fontSize: '0.8rem', marginLeft: 8 }}>{a.target}</span>}
                        {a.details && <div style={{ color: SL, fontSize: '0.75rem', marginTop: 2 }}>{a.details}</div>}
                        <div style={{ color: 'rgba(162,178,191,0.5)', fontSize: '0.7rem', marginTop: 2 }}>by {a.admin}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ CARDS ═══ */}
        {tab === 'cards' && (
          <div style={cardS()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ margin: 0, color: IV, fontWeight: 700, fontSize: '1rem' }}>Card Requests ({userCards.length})</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge status={`${pendingCards.length} pending`} />
                <Badge status={`${userCards.filter((c: any) => c.status === 'approved').length} approved`} />
              </div>
            </div>
            {userCards.length === 0 ? (
              <div style={{ textAlign: 'center', color: SL, padding: '3rem' }}>No card requests yet. Users can request cards from their Cards page.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead><tr>{['Card ID','Holder','Network','Tier','Status','Requested','Actions'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {userCards.map((card: any) => (
                      <tr key={card.id}>
                        <td style={{ ...tdS, fontFamily: 'monospace', fontSize: '0.72rem', color: G }}>{card.id}</td>
                        <td style={{ ...tdS, fontWeight: 600 }}>{card.holderName || '—'}</td>
                        <td style={tdS}>{card.network || '—'}</td>
                        <td style={{ ...tdS, color: G, fontWeight: 600 }}>{card.tier || '—'}</td>
                        <td style={tdS}><Badge status={card.status || 'pending'} /></td>
                        <td style={{ ...tdS, color: SL, fontSize: '0.78rem' }}>{card.requestedAt ? fmtDate(card.requestedAt) : '—'}</td>
                        <td style={tdS}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {card.status === 'pending' && (
                              <>
                                <button style={btnP} onClick={() => {
                                  updateUserItem('londway_cards', card._userEmail, card.id, { status: 'approved', approvedAt: new Date().toISOString(), estimatedDelivery: new Date(Date.now() + 7 * 86400000).toISOString() });
                                  addAudit('card_approved', card.holderName, `${card.network} ${card.tier}`);
                                  notify(true, `Card approved for ${card.holderName}`);
                                  setData({ ...data });
                                }}>✓ Approve</button>
                                <button style={btnD} onClick={() => {
                                  updateUserItem('londway_cards', card._userEmail, card.id, { status: 'rejected' });
                                  addAudit('card_rejected', card.holderName, `${card.network} ${card.tier}`);
                                  notify(true, `Card rejected for ${card.holderName}`);
                                  setData({ ...data });
                                }}>✕ Reject</button>
                              </>
                            )}
                            <button style={btnD} onClick={() => {
                              if (!confirm(`Delete card ${card.id}?`)) return;
                              deleteUserItem('londway_cards', card._userEmail, card.id);
                              addAudit('card_deleted', card.holderName, card.id);
                              notify(true, 'Card deleted');
                              setData({ ...data });
                            }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ NOTIFICATIONS ═══ */}
        {tab === 'notifications' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            <div style={cardS()}>
              <h2 style={{ margin: '0 0 18px', color: G, fontWeight: 700, fontSize: '1rem' }}>📤 Send Notification</h2>
              <form onSubmit={e => {
                e.preventDefault();
                if (!notifMsg.trim()) { notify(false, 'Enter a message'); return; }
                const newNotif = {
                  id: 'n-' + Date.now(),
                  message: notifMsg.trim(),
                  type: notifType,
                  date: new Date().toISOString(),
                  read: false,
                  target: notifTarget,
                };
                // Write to per-user notification keys so the user app can read them
                if (notifTarget === 'all') {
                  for (const u of data.users) writeUserNotification('londway_notifications', u.email, newNotif);
                } else {
                  const targetUser = data.users.find(u => u.id === notifTarget);
                  if (targetUser) writeUserNotification('londway_notifications', targetUser.email, newNotif);
                }
                addAudit('notification_sent', notifTarget === 'all' ? 'All Users' : data.users.find(u => u.id === notifTarget)?.name || notifTarget, notifMsg.trim());
                notify(true, 'Notification sent');
                setNotifMsg('');
              }} style={{ display: 'grid', gap: 14 }}>
                <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Recipient</label>
                  <select style={sel} value={notifTarget} onChange={e => setNotifTarget(e.target.value)}>
                    <option value="all">All Users</option>
                    {data.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select></div>
                <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Type</label>
                  <select style={sel} value={notifType} onChange={e => setNotifType(e.target.value as any)}>
                    <option value="info">ℹ Info</option>
                    <option value="success">✓ Success</option>
                    <option value="warning">⚠ Warning</option>
                  </select></div>
                <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Message</label>
                  <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Your account has been upgraded..." required /></div>
                <button type="submit" style={{ ...btnP, padding: '12px', fontSize: '0.9rem', borderRadius: 10 }}>Send Notification</button>
              </form>
            </div>
            <div style={cardS()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ margin: 0, color: IV, fontWeight: 700, fontSize: '1rem' }}>📨 Sent Notifications ({userNotifs.length})</h2>
                <button onClick={() => {
                  if (!confirm('Clear all user notifications?')) return;
                  for (const u of data.users) {
                    const nKey = userKey('londway_notifications', u.email);
                    localStorage.setItem(nKey, '[]');
                  }
                  addAudit('notifications_cleared', 'All Users');
                  notify(true, 'All notifications cleared');
                  setData({ ...data });
                }} style={btnD}>Clear All</button>
              </div>
              {userNotifs.length === 0 ? (
                <div style={{ textAlign: 'center', color: SL, padding: '2rem' }}>No notifications</div>
              ) : (
                <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                  {userNotifs.map((n: any) => (
                    <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(196,160,82,0.05)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', color: IV, wordBreak: 'break-word' }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: SL, marginTop: 3 }}>{fmtDate(n.date)}{n.read ? '' : ' · Unread'}</div>
                      </div>
                      <button onClick={() => {
                        deleteUserItem('londway_notifications', n._userEmail, n.id);
                        notify(true, 'Notification removed');
                        setData({ ...data });
                      }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {tab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            <div style={cardS()}>
              <h2 style={{ margin: '0 0 18px', color: G, fontWeight: 700, fontSize: '1rem' }}>🏦 Bank Configuration</h2>
              <form onSubmit={e => {
                e.preventDefault();
                persist({ ...data, settings: settingsForm });
                addAudit('settings_updated', 'System', 'Bank settings updated');
                notify(true, 'Settings saved');
              }} style={{ display: 'grid', gap: 14 }}>
                <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Bank Name</label>
                  <input style={inp} value={settingsForm.bankName} onChange={e => setSettingsForm(p => ({ ...p, bankName: e.target.value }))} /></div>
                <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Tagline</label>
                  <input style={inp} value={settingsForm.bankTagline} onChange={e => setSettingsForm(p => ({ ...p, bankTagline: e.target.value }))} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Daily Transfer Limit ($)</label>
                    <input style={inp} type="number" value={settingsForm.dailyTransferLimit} onChange={e => setSettingsForm(p => ({ ...p, dailyTransferLimit: parseFloat(e.target.value) || 0 }))} /></div>
                  <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Per-Transaction Limit ($)</label>
                    <input style={inp} type="number" value={settingsForm.perTxLimit} onChange={e => setSettingsForm(p => ({ ...p, perTxLimit: parseFloat(e.target.value) || 0 }))} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Local Transfer Fee ($)</label>
                    <input style={inp} type="number" step="0.01" value={settingsForm.localTransferFee} onChange={e => setSettingsForm(p => ({ ...p, localTransferFee: parseFloat(e.target.value) || 0 }))} /></div>
                  <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Int'l Wire Fee ($)</label>
                    <input style={inp} type="number" step="0.01" value={settingsForm.intlWireFee} onChange={e => setSettingsForm(p => ({ ...p, intlWireFee: parseFloat(e.target.value) || 0 }))} /></div>
                </div>
                <button type="submit" style={{ ...btnP, padding: '12px', fontSize: '0.9rem', borderRadius: 10 }}>Save Settings</button>
              </form>
            </div>
            <div style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
              <div style={cardS()}>
                <h2 style={{ margin: '0 0 18px', color: G, fontWeight: 700, fontSize: '1rem' }}>📈 Interest Rates</h2>
                <form onSubmit={e => {
                  e.preventDefault();
                  persist({ ...data, settings: settingsForm });
                  addAudit('rates_updated', 'System', `Savings: ${settingsForm.savingsRate}%, Overdraft: ${settingsForm.overdraftRate}%`);
                  notify(true, 'Rates updated');
                }} style={{ display: 'grid', gap: 14 }}>
                  <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Savings APY (%)</label>
                    <input style={inp} type="number" step="0.01" value={settingsForm.savingsRate} onChange={e => setSettingsForm(p => ({ ...p, savingsRate: parseFloat(e.target.value) || 0 }))} /></div>
                  <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Overdraft Rate (%)</label>
                    <input style={inp} type="number" step="0.01" value={settingsForm.overdraftRate} onChange={e => setSettingsForm(p => ({ ...p, overdraftRate: parseFloat(e.target.value) || 0 }))} /></div>
                  <button type="submit" style={{ ...btnP, padding: '12px', fontSize: '0.9rem', borderRadius: 10 }}>Update Rates</button>
                </form>
              </div>
              <div style={cardS()}>
                <h2 style={{ margin: '0 0 18px', color: G, fontWeight: 700, fontSize: '1rem' }}>🛡 System Controls</h2>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: settingsForm.maintenanceMode ? 'rgba(255,77,79,0.08)' : 'rgba(80,200,120,0.06)', borderRadius: 10, border: `1px solid ${settingsForm.maintenanceMode ? 'rgba(255,77,79,0.2)' : 'rgba(80,200,120,0.15)'}` }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: IV }}>Maintenance Mode</div>
                      <div style={{ color: SL, fontSize: '0.75rem' }}>{settingsForm.maintenanceMode ? 'Users see maintenance page' : 'Bank is fully operational'}</div>
                    </div>
                    <button onClick={() => {
                      const next = !settingsForm.maintenanceMode;
                      const s = { ...settingsForm, maintenanceMode: next };
                      setSettingsForm(s);
                      persist({ ...data, settings: s });
                      addAudit(next ? 'maintenance_enabled' : 'maintenance_disabled', 'System');
                      notify(true, next ? 'Maintenance mode ON' : 'Maintenance mode OFF');
                    }} style={settingsForm.maintenanceMode ? btnP : btnD}>
                      {settingsForm.maintenanceMode ? '✓ Go Live' : '⏸ Enable'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(196,160,82,0.06)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: IV }}>Reset All Data</div>
                      <div style={{ color: SL, fontSize: '0.75rem' }}>Wipe admin + user data to defaults</div>
                    </div>
                    <button onClick={() => {
                      if (!confirm('This will reset ALL data (admin, user accounts, cards, notifications). Proceed?')) return;
                      // Clear per-user suffixed keys for all known users
                      const bases = ['londway_bank_accounts', 'londway_vaults', 'londway_transfers', 'londway_notifications', 'londway_cards', 'londway_checkbooks'];
                      for (const u of data.users) {
                        for (const b of bases) localStorage.removeItem(userKey(b, u.email));
                      }
                      // Also clear the old base keys (legacy) and admin data
                      localStorage.removeItem(STORAGE_KEY);
                      for (const b of bases) localStorage.removeItem(b);
                      localStorage.removeItem('londway_accounts');
                      const fresh = getDefaultData();
                      setData(fresh);
                      saveData(fresh);
                      setSettingsForm(fresh.settings);
                      notify(true, 'All data reset to defaults');
                    }} style={btnD}>🗑 Reset</button>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'rgba(196,160,82,0.04)', borderRadius: 10, border: '1px solid rgba(196,160,82,0.08)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: G, marginBottom: 6 }}>Supported Currencies</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {settingsForm.supportedCurrencies.map(c => (
                        <span key={c} style={{ background: 'rgba(196,160,82,0.1)', color: G, borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}

      {fundModal && (() => {
        const user = data.users.find(u => u.id === fundModal.userId);
        return (
          <Modal title={`${fundModal.mode === 'credit' ? '+ Credit' : '− Debit'} ${user?.name ?? ''}`} onClose={() => setFundModal(null)}>
            <form onSubmit={handleFund} style={{ display: 'grid', gap: 14 }}>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Amount (USD)</label>
                <input style={inp} type="number" min="0.01" step="0.01" value={fundAmt} onChange={e => setFundAmt(e.target.value)} placeholder="0.00" required autoFocus /></div>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Description</label>
                <input style={inp} value={fundDesc} onChange={e => setFundDesc(e.target.value)} placeholder="Wire deposit, correction..." /></div>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Backdate (optional)</label>
                <input style={inp} type="datetime-local" value={fundDate} onChange={e => setFundDate(e.target.value)} />
                <div style={{ color: SL, fontSize: '0.7rem', marginTop: 4 }}>Leave empty for now</div></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setFundModal(null)} style={{ ...btnG, flex: 1, padding: '10px' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter,sans-serif', background: fundModal.mode === 'credit' ? 'linear-gradient(135deg,#50C878,#3aae60)' : 'linear-gradient(135deg,#ff4d4f,#dd3e3e)', color: '#fff' }}>
                  {fundModal.mode === 'credit' ? 'Credit' : 'Debit'} Account
                </button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {pinModal && (
        <Modal title={`🔑 Set PIN — ${pinModal.name}`} onClose={() => { setPinModal(null); setPinValue(''); }}>
          <div style={{ display: 'grid', gap: 18 }}>
            <p style={{ margin: 0, color: SL, fontSize: '0.85rem', lineHeight: 1.6 }}>
              {pinModal.pin ? `Current PIN is set. Enter a new 4-digit PIN to change it for ${pinModal.name}.` : `No PIN set for ${pinModal.name}. Enter a 4-digit PIN to enable account access.`}
            </p>
            <div>
              <label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>4-Digit PIN</label>
              <input
                style={{ ...inp, letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.6rem', padding: '14px' }}
                type="tel"
                placeholder="0000"
                maxLength={4}
                value={pinValue}
                autoFocus
                onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
              <div style={{ marginTop: 6, color: SL, fontSize: '0.72rem', textAlign: 'center' }}>{pinValue.length}/4 digits entered</div>
            </div>
            <button
              style={{ ...btnP, padding: '13px', fontSize: '0.9rem', borderRadius: 10, opacity: pinValue.length === 4 ? 1 : 0.5 }}
              onClick={() => savePinOnly(pinModal, pinValue)}
              disabled={pinValue.length !== 4}
            >
              {pinModal.pin ? '🔑 Update PIN' : '🔑 Save PIN'}
            </button>
          </div>
        </Modal>
      )}

      {newUserModal && (
        <Modal title="+ Create New User" onClose={() => setNewUserModal(false)}>
          <form onSubmit={createUser} style={{ display: 'grid', gap: 12 }}>
            {[
              { l: 'Full Name', k: 'name', t: 'text', r: true },
              { l: 'Email', k: 'email', t: 'email', r: true },
              { l: 'Phone', k: 'phone', t: 'text' },
              { l: 'Address', k: 'address', t: 'text' },
              { l: 'Initial Balance', k: 'balance', t: 'number' },
            ].map(f => (
              <div key={f.k}><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>{f.l}</label>
                <input style={inp} type={f.t} required={f.r} value={(nu as Record<string,string>)[f.k]} onChange={e => setNu(p => ({ ...p, [f.k]: e.target.value }))} /></div>
            ))}
            <div>
              <label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Password <span style={{ color: '#777', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(min 6 chars, letters &amp; numbers)</span></label>
              <input style={inp} type="text" minLength={6} required placeholder="e.g. London25" value={nu.password} onChange={e => setNu(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>4-Digit PIN</label>
              <input style={{ ...inp, letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.15rem' }} type="tel" placeholder="0000" maxLength={4} required value={nu.pin} onChange={e => setNu(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Role</label>
                <select style={sel} value={nu.role} onChange={e => setNu(p => ({ ...p, role: e.target.value }))}>{['user','admin','vip','support','auditor'].map(r => <option key={r}>{r}</option>)}</select></div>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Tier</label>
                <select style={sel} value={nu.tier} onChange={e => setNu(p => ({ ...p, tier: e.target.value }))}>{['Standard','Silver','Gold','Platinum','Black'].map(t => <option key={t}>{t}</option>)}</select></div>
            </div>
            <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Backdate Creation (optional)</label>
              <input style={inp} type="datetime-local" value={nu.createdAt} onChange={e => setNu(p => ({ ...p, createdAt: e.target.value }))} /></div>
            <button type="submit" style={{ ...btnP, padding: '12px', fontSize: '0.9rem', borderRadius: 10 }}>Create User</button>
          </form>
        </Modal>
      )}

      {editUser && (
        <Modal title={`Edit: ${editUser.name}`} onClose={() => setEditUser(null)}>
          <form onSubmit={e => { e.preventDefault(); updateUser(editUser); }} style={{ display: 'grid', gap: 12 }}>
            {[
              { l: 'Name', k: 'name' }, { l: 'Email', k: 'email' }, { l: 'Phone', k: 'phone' },
              { l: 'Address', k: 'address' }, { l: 'Balance', k: 'balance', t: 'number' },
            ].map(f => (
              <div key={f.k}><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>{f.l}</label>
                <input style={inp} type={f.t || 'text'} value={(editUser as Record<string,any>)[f.k] ?? ''} onChange={e => setEditUser(p => p ? { ...p, [f.k]: f.t === 'number' ? parseFloat(e.target.value) || 0 : e.target.value } : null)} /></div>
            ))}
            <div>
              <label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>
                Password <span style={{ color: '#777', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(min 6 chars — leave blank to keep)</span>
              </label>
              <input style={inp} type="text" minLength={6} placeholder="e.g. London25" value={editUser.password ?? ''} onChange={e => setEditUser(p => p ? { ...p, password: e.target.value || undefined } : null)} />
            </div>
            <div>
              <label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>
                4-Digit PIN <span style={{ color: '#777', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(leave blank to keep current)</span>
              </label>
              <input style={{ ...inp, letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.15rem' }} type="tel" placeholder="0000" maxLength={4} value={editUser.pin ?? ''} onChange={e => setEditUser(p => p ? { ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) || undefined } : null)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Role</label>
                <select style={sel} value={editUser.role} onChange={e => setEditUser(p => p ? { ...p, role: e.target.value } : null)}>{['user','admin','vip','support','auditor'].map(r => <option key={r}>{r}</option>)}</select></div>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Tier</label>
                <select style={sel} value={editUser.tier || 'Standard'} onChange={e => setEditUser(p => p ? { ...p, tier: e.target.value } : null)}>{['Standard','Silver','Gold','Platinum','Black'].map(t => <option key={t}>{t}</option>)}</select></div>
            </div>
            <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Created Date</label>
              <input style={inp} type="datetime-local" value={editUser.createdAt.slice(0, 16)} onChange={e => setEditUser(p => p ? { ...p, createdAt: new Date(e.target.value).toISOString() } : null)} /></div>
            <button type="submit" style={{ ...btnP, padding: '12px', fontSize: '0.9rem', borderRadius: 10 }}>Save Changes</button>
          </form>
        </Modal>
      )}

      {/* ── Activation Link Modal ── */}
      {activationLink && (
        <Modal title="✓ User Created — Activation Link" onClose={() => { setActivationLink(null); setLinkCopied(false); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: '#A2B2BF', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
              Share this link with the user. When they open it on <strong style={{ color: IV }}>any device or browser</strong>, their account and funded balance will be automatically activated — ready to sign in.
            </p>
            <div style={{ background: 'rgba(196,160,82,0.07)', border: '1px solid rgba(196,160,82,0.2)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.62rem', color: SL, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Activation URL</div>
              <div style={{ wordBreak: 'break-all', fontSize: '0.72rem', color: G, fontFamily: 'monospace', lineHeight: 1.5 }}>{activationLink}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...btnP, flex: 1, padding: '10px', fontSize: '0.82rem' }} onClick={() => { navigator.clipboard.writeText(activationLink).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 3000); }); }}>
                {linkCopied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
              <button style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid rgba(196,160,82,0.3)`, color: SL, borderRadius: 10, cursor: 'pointer', fontSize: '0.82rem' }} onClick={() => { setActivationLink(null); setLinkCopied(false); }}>
                Close
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#556', textAlign: 'center' }}>
              The link includes all credentials — send it privately (email/WhatsApp).
            </p>
          </div>
        </Modal>
      )}

      {newTxModal && (
        <Modal title="+ Create Transaction" onClose={() => setNewTxModal(false)}>
          <form onSubmit={createTransaction} style={{ display: 'grid', gap: 12 }}>
            <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>User</label>
              <select style={sel} value={nt.userId} onChange={e => setNt(p => ({ ...p, userId: e.target.value }))} required>
                <option value="">Select user...</option>
                {data.users.map(u => <option key={u.id} value={u.id}>{u.name} — {fmtMoney(u.balance)}</option>)}
              </select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Type</label>
                <select style={sel} value={nt.type} onChange={e => setNt(p => ({ ...p, type: e.target.value as Transaction['type'] }))}>{['credit','debit','transfer','wire','fee','interest','reversal'].map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Status</label>
                <select style={sel} value={nt.status} onChange={e => setNt(p => ({ ...p, status: e.target.value }))}>{['pending','completed','approved','flagged','rejected','failed'].map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Amount</label>
                <input style={inp} type="number" min="0.01" step="0.01" value={nt.amount} onChange={e => setNt(p => ({ ...p, amount: e.target.value }))} required /></div>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Currency</label>
                <select style={sel} value={nt.currency} onChange={e => setNt(p => ({ ...p, currency: e.target.value }))}>{['USD','EUR','GBP','CHF','JPY','AED'].map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Description</label>
              <input style={inp} value={nt.description} onChange={e => setNt(p => ({ ...p, description: e.target.value }))} placeholder="Wire deposit, card purchase..." /></div>
            <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Backdate (optional)</label>
              <input style={inp} type="datetime-local" value={nt.createdAt} onChange={e => setNt(p => ({ ...p, createdAt: e.target.value }))} /></div>
            <button type="submit" style={{ ...btnP, padding: '12px', fontSize: '0.9rem', borderRadius: 10 }}>Create Transaction</button>
          </form>
        </Modal>
      )}

      {editTxModal && (
        <Modal title={`Edit: ${editTxModal.reference}`} onClose={() => setEditTxModal(null)}>
          <form onSubmit={e => { e.preventDefault(); updateTransaction(editTxModal); }} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Type</label>
                <select style={sel} value={editTxModal.type} onChange={e => setEditTxModal(p => p ? { ...p, type: e.target.value as Transaction['type'] } : null)}>{['credit','debit','transfer','wire','fee','interest','reversal'].map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Status</label>
                <select style={sel} value={editTxModal.status} onChange={e => setEditTxModal(p => p ? { ...p, status: e.target.value } : null)}>{['pending','completed','approved','flagged','rejected','failed','reversed','cancelled'].map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Amount</label>
              <input style={inp} type="number" min="0.01" step="0.01" value={editTxModal.amount} onChange={e => setEditTxModal(p => p ? { ...p, amount: parseFloat(e.target.value) || 0 } : null)} /></div>
            <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Description</label>
              <input style={inp} value={editTxModal.description} onChange={e => setEditTxModal(p => p ? { ...p, description: e.target.value } : null)} /></div>
            <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Date</label>
              <input style={inp} type="datetime-local" value={editTxModal.createdAt.slice(0, 16)} onChange={e => setEditTxModal(p => p ? { ...p, createdAt: new Date(e.target.value).toISOString() } : null)} /></div>
            <div><label style={{ display: 'block', color: SL, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>Recipient</label>
              <input style={inp} value={editTxModal.recipientName || ''} onChange={e => setEditTxModal(p => p ? { ...p, recipientName: e.target.value } : null)} placeholder="Optional" /></div>
            <button type="submit" style={{ ...btnP, padding: '12px', fontSize: '0.9rem', borderRadius: 10 }}>Save Changes</button>
          </form>
        </Modal>
      )}
    </main>
  );
}

