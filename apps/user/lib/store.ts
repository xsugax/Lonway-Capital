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
  const acctNum = () => Math.floor(1000_0000 + Math.random() * 9000_0000).toString();
  return [
    {
      id: `acc-1${suffix}`, type: 'Checking', name: 'Primary Checking', balance: 0, currency: '$',
      accountNumber: acctNum(), frozen: false, recentActivity: 'No recent activity',
      transactions: [],
    },
    {
      id: `acc-2${suffix}`, type: 'Savings', name: 'High-Yield Savings', balance: 0, currency: '$',
      accountNumber: acctNum(), frozen: false, recentActivity: 'No recent activity',
      transactions: [],
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

export function getVaults(email?: string): any[] { return getOrSeed(userKey(VAULTS_BASE, email), []); }
export function saveVaults(vaults: any[], email?: string) { save(userKey(VAULTS_BASE, email), vaults); }

// ═══════════════════════════════════════════
// Transfers  (per-user)
// ═══════════════════════════════════════════
const TRANSFERS_BASE = 'londway_transfers';

export function getTransfers(email?: string): any[] { return getOrSeed(userKey(TRANSFERS_BASE, email), []); }
export function saveTransfers(transfers: any[], email?: string) { save(userKey(TRANSFERS_BASE, email), transfers); }

// ═══════════════════════════════════════════
// Notifications  (per-user)
// ═══════════════════════════════════════════
const NOTIF_BASE = 'londway_notifications';

export function getNotifications(email?: string): any[] { return getOrSeed(userKey(NOTIF_BASE, email), []); }
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
