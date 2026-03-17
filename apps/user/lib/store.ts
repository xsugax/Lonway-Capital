// Simple localStorage data store for static deployment (GitHub Pages)
// All data is isolated per user email — each user owns their own data.

// ═══════════════════════════════════════════
// Tier Limits
// ═══════════════════════════════════════════
export interface TierLimits {
  tier: string;
  dailyTransferLimit: number;   // USD
  perTxLimit: number;           // USD
  intlAllowed: boolean;
  cryptoAllowed: boolean;
  maxAccounts: number;
  maxVaults: number;
  savingsRate: number;          // % APY
  color: string;
  description: string;
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  Standard: {
    tier: 'Standard', dailyTransferLimit: 5_000, perTxLimit: 2_500,
    intlAllowed: false, cryptoAllowed: false,
    maxAccounts: 2, maxVaults: 2, savingsRate: 1.5,
    color: '#A2B2BF', description: 'Basic banking access',
  },
  Silver: {
    tier: 'Silver', dailyTransferLimit: 25_000, perTxLimit: 10_000,
    intlAllowed: true, cryptoAllowed: false,
    maxAccounts: 3, maxVaults: 3, savingsRate: 2.5,
    color: '#C0C0C0', description: 'Enhanced transfers & international wires',
  },
  Gold: {
    tier: 'Gold', dailyTransferLimit: 100_000, perTxLimit: 50_000,
    intlAllowed: true, cryptoAllowed: true,
    maxAccounts: 5, maxVaults: 5, savingsRate: 3.75,
    color: '#C4A052', description: 'Full access including crypto funding',
  },
  Platinum: {
    tier: 'Platinum', dailyTransferLimit: 1_000_000, perTxLimit: 500_000,
    intlAllowed: true, cryptoAllowed: true,
    maxAccounts: 10, maxVaults: 10, savingsRate: 5.0,
    color: '#E5E4E2', description: 'Unlimited private banking',
  },
};

/** Get tier limits for a given tier name (falls back to Standard). */
export function getTierLimits(tier?: string): TierLimits {
  return TIER_LIMITS[tier || 'Standard'] ?? TIER_LIMITS['Standard'];
}

// ═══════════════════════════════════════════
// Per-user key helpers
// ═══════════════════════════════════════════
function userKey(base: string, email?: string): string {
  if (!email) return base;
  // Sanitise email → safe key segment
  const safe = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${base}__${safe}`;
}

function getOrSeed<T>(key: string, seed: T[]): T[] {
  if (typeof window === 'undefined') return seed;
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length > 0) return parsed; }
  } catch {}
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

function load(key: string): any[] {
  if (typeof window === 'undefined') return [];
  try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch {}
  return [];
}

function save(key: string, data: any) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(data));
}

// ═══════════════════════════════════════════
// Daily Transfer Usage (per user, resets midnight)
// ═══════════════════════════════════════════
export function getDailyUsage(email: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const key = `londway_daily_usage__${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const { date, amount } = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (date !== today) return 0;
    return amount || 0;
  } catch { return 0; }
}

export function addDailyUsage(email: string, amount: number): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `londway_daily_usage__${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const today = new Date().toISOString().slice(0, 10);
    const current = getDailyUsage(email);
    localStorage.setItem(key, JSON.stringify({ date: today, amount: current + amount }));
  } catch {}
}

// ═══════════════════════════════════════════
// Bank Accounts  (per-user)
// ═══════════════════════════════════════════
const ACCT_BASE = 'londway_bank_accounts';

function buildSeedAccounts(email?: string): any[] {
  const suffix = email ? `-${email.replace(/[^a-z0-9]/gi, '').slice(0, 6)}` : '';
  return [
    {
      id: `acc-1${suffix}`, type: 'Checking', name: 'Primary Checking', balance: 12_480.50, currency: '$',
      accountNumber: '4821-XXXX-7734', frozen: false, recentActivity: '+$2,400 this month',
      transactions: [
        { id: `tx-1${suffix}`, description: 'Salary Deposit', amount: 5200, type: 'credit', date: '2026-03-15', currency: '$' },
        { id: `tx-2${suffix}`, description: 'Amazon Purchase', amount: 89.99, type: 'debit', date: '2026-03-14', currency: '$' },
        { id: `tx-3${suffix}`, description: 'Electric Bill', amount: 142.50, type: 'debit', date: '2026-03-12', currency: '$' },
        { id: `tx-4${suffix}`, description: 'Freelance Payment', amount: 1200, type: 'credit', date: '2026-03-10', currency: '$' },
        { id: `tx-5${suffix}`, description: 'Restaurant', amount: 67.30, type: 'debit', date: '2026-03-08', currency: '$' },
      ],
    },
    {
      id: `acc-2${suffix}`, type: 'Savings', name: 'High-Yield Savings', balance: 28_750.00, currency: '$',
      accountNumber: '4821-XXXX-9912', frozen: false, recentActivity: '+$450 interest',
      transactions: [
        { id: `tx-6${suffix}`, description: 'Interest Payment', amount: 450, type: 'credit', date: '2026-03-01', currency: '$' },
        { id: `tx-7${suffix}`, description: 'Transfer from Checking', amount: 2000, type: 'credit', date: '2026-02-28', currency: '$' },
      ],
    },
  ];
}

export function getBankAccounts(email?: string): any[] {
  const key = userKey(ACCT_BASE, email);
  return getOrSeed(key, buildSeedAccounts(email));
}
export function saveBankAccounts(accounts: any[], email?: string) {
  save(userKey(ACCT_BASE, email), accounts);
}

// ═══════════════════════════════════════════
// Vaults  (per-user)
// ═══════════════════════════════════════════
const VAULTS_BASE = 'londway_vaults';

const SEED_VAULTS = [
  { id: 'vault-1', name: 'Emergency Fund', balance: 8500, goal: 15000, currency: '$', createdAt: '2025-06-15' },
  { id: 'vault-2', name: 'Vacation Fund', balance: 3200, goal: 5000, currency: '$', createdAt: '2025-09-01' },
  { id: 'vault-3', name: 'New Car', balance: 12000, goal: 35000, currency: '$', createdAt: '2025-01-10' },
];

export function getVaults(email?: string): any[] { return getOrSeed(userKey(VAULTS_BASE, email), SEED_VAULTS); }
export function saveVaults(vaults: any[], email?: string) { save(userKey(VAULTS_BASE, email), vaults); }

// ═══════════════════════════════════════════
// Transfers  (per-user)
// ═══════════════════════════════════════════
const TRANSFERS_BASE = 'londway_transfers';

const SEED_TRANSFERS = [
  { id: 'tr-1', recipientName: 'John Smith', toAccountId: '098765', amount: 500, currency: 'USD', type: 'local', status: 'completed', reference: 'TRF-2026-001', description: 'Rent Payment', createdAt: '2026-03-10T10:00:00Z' },
  { id: 'tr-2', recipientName: 'Marie Dupont', toAccountId: 'FR76XXX', amount: 1200, currency: 'EUR', type: 'international', status: 'pending', reference: 'TRF-2026-002', description: 'Business Payment', createdAt: '2026-03-14T15:00:00Z', country: 'France' },
  { id: 'tr-3', recipientName: 'Alice Wang', toAccountId: '123456', amount: 250, currency: 'USD', type: 'local', status: 'approved', reference: 'TRF-2026-003', description: 'Split dinner', createdAt: '2026-03-15T12:00:00Z' },
];

export function getTransfers(email?: string): any[] { return getOrSeed(userKey(TRANSFERS_BASE, email), SEED_TRANSFERS); }
export function saveTransfers(transfers: any[], email?: string) { save(userKey(TRANSFERS_BASE, email), transfers); }

// ═══════════════════════════════════════════
// Notifications  (per-user)
// ═══════════════════════════════════════════
const NOTIF_BASE = 'londway_notifications';

const SEED_NOTIFICATIONS = [
  { id: 'n-1', message: 'Welcome to Londway Capital! Your account is now active.', type: 'info', date: '2026-03-16T09:00:00Z', read: false },
  { id: 'n-2', message: 'Your salary of $5,200.00 has been deposited.', type: 'success', date: '2026-03-15T14:30:00Z', read: false },
  { id: 'n-3', message: 'Card ending in 7734 was used for $89.99 at Amazon.', type: 'info', date: '2026-03-14T11:20:00Z', read: true },
  { id: 'n-4', message: 'Your vault "Emergency Fund" reached 56% of its goal!', type: 'success', date: '2026-03-12T08:15:00Z', read: true },
  { id: 'n-5', message: 'Security alert: New login detected from Chrome on Windows.', type: 'warning', date: '2026-03-10T16:45:00Z', read: true },
];

export function getNotifications(email?: string): any[] { return getOrSeed(userKey(NOTIF_BASE, email), SEED_NOTIFICATIONS); }
export function saveNotifications(notifs: any[], email?: string) { save(userKey(NOTIF_BASE, email), notifs); }

// ═══════════════════════════════════════════
// Cards  (per-user)
// ═══════════════════════════════════════════
const CARDS_BASE = 'londway_cards';

export function getCards(email?: string): any[] { return load(userKey(CARDS_BASE, email)); }
export function saveCards(cards: any[], email?: string) { save(userKey(CARDS_BASE, email), cards); }

// ═══════════════════════════════════════════
// Checkbooks  (per-user)
// ═══════════════════════════════════════════
const CHECKS_BASE = 'londway_checkbooks';

export function getCheckbooks(email?: string): any[] { return load(userKey(CHECKS_BASE, email)); }
export function saveCheckbooks(books: any[], email?: string) { save(userKey(CHECKS_BASE, email), books); }

// ═══════════════════════════════════════════
// Crypto Deposits  (per-user)
// ═══════════════════════════════════════════
const CRYPTO_BASE = 'londway_crypto_deposits';

export function getCryptoDeposits(email?: string): any[] { return load(userKey(CRYPTO_BASE, email)); }
export function saveCryptoDeposits(deposits: any[], email?: string) { save(userKey(CRYPTO_BASE, email), deposits); }
