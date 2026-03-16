// Simple localStorage data store for static deployment (GitHub Pages)
// No API calls needed — all data persists in the browser

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
// Bank Accounts
// ═══════════════════════════════════════════
const ACCT_KEY = 'londway_bank_accounts';

const SEED_ACCOUNTS = [
  {
    id: 'acc-1', type: 'Checking', name: 'Primary Checking', balance: 12480.50, currency: '$',
    accountNumber: '4821-XXXX-7734', frozen: false, recentActivity: '+$2,400 this month',
    transactions: [
      { id: 'tx-1', description: 'Salary Deposit', amount: 5200, type: 'credit', date: '2026-03-15', currency: '$' },
      { id: 'tx-2', description: 'Amazon Purchase', amount: 89.99, type: 'debit', date: '2026-03-14', currency: '$' },
      { id: 'tx-3', description: 'Electric Bill', amount: 142.50, type: 'debit', date: '2026-03-12', currency: '$' },
      { id: 'tx-4', description: 'Freelance Payment', amount: 1200, type: 'credit', date: '2026-03-10', currency: '$' },
      { id: 'tx-5', description: 'Restaurant', amount: 67.30, type: 'debit', date: '2026-03-08', currency: '$' },
    ],
  },
  {
    id: 'acc-2', type: 'Savings', name: 'High-Yield Savings', balance: 28750.00, currency: '$',
    accountNumber: '4821-XXXX-9912', frozen: false, recentActivity: '+$450 interest',
    transactions: [
      { id: 'tx-6', description: 'Interest Payment', amount: 450, type: 'credit', date: '2026-03-01', currency: '$' },
      { id: 'tx-7', description: 'Transfer from Checking', amount: 2000, type: 'credit', date: '2026-02-28', currency: '$' },
    ],
  },
  {
    id: 'acc-3', type: 'Investment', name: 'Investment Portfolio', balance: 45320.75, currency: '$',
    accountNumber: '4821-XXXX-3301', frozen: false, recentActivity: '+$1,240 this week',
    transactions: [
      { id: 'tx-8', description: 'Dividend - AAPL', amount: 340, type: 'credit', date: '2026-03-13', currency: '$' },
      { id: 'tx-9', description: 'ETF Purchase', amount: 5000, type: 'debit', date: '2026-03-05', currency: '$' },
    ],
  },
  {
    id: 'acc-4', type: 'Crypto Vault', name: 'Digital Assets', balance: 8920.00, currency: '$',
    accountNumber: '4821-XXXX-5567', frozen: false, recentActivity: '+$320 (24h)',
    transactions: [
      { id: 'tx-10', description: 'BTC Purchase', amount: 2000, type: 'debit', date: '2026-03-11', currency: '$' },
      { id: 'tx-11', description: 'ETH Staking Reward', amount: 120, type: 'credit', date: '2026-03-09', currency: '$' },
    ],
  },
];

export function getBankAccounts(): any[] { return getOrSeed(ACCT_KEY, SEED_ACCOUNTS); }
export function saveBankAccounts(accounts: any[]) { save(ACCT_KEY, accounts); }

// ═══════════════════════════════════════════
// Vaults
// ═══════════════════════════════════════════
const VAULTS_KEY = 'londway_vaults';

const SEED_VAULTS = [
  { id: 'vault-1', name: 'Emergency Fund', balance: 8500, goal: 15000, currency: '$', createdAt: '2025-06-15' },
  { id: 'vault-2', name: 'Vacation Fund', balance: 3200, goal: 5000, currency: '$', createdAt: '2025-09-01' },
  { id: 'vault-3', name: 'New Car', balance: 12000, goal: 35000, currency: '$', createdAt: '2025-01-10' },
];

export function getVaults(): any[] { return getOrSeed(VAULTS_KEY, SEED_VAULTS); }
export function saveVaults(vaults: any[]) { save(VAULTS_KEY, vaults); }

// ═══════════════════════════════════════════
// Transfers
// ═══════════════════════════════════════════
const TRANSFERS_KEY = 'londway_transfers';

const SEED_TRANSFERS = [
  { id: 'tr-1', recipientName: 'John Smith', toAccountId: '098765', amount: 500, currency: 'USD', type: 'local', status: 'completed', reference: 'TRF-2026-001', description: 'Rent Payment', createdAt: '2026-03-10T10:00:00Z' },
  { id: 'tr-2', recipientName: 'Marie Dupont', toAccountId: 'FR76XXX', amount: 1200, currency: 'EUR', type: 'international', status: 'pending', reference: 'TRF-2026-002', description: 'Business Payment', createdAt: '2026-03-14T15:00:00Z', country: 'France' },
  { id: 'tr-3', recipientName: 'Alice Wang', toAccountId: '123456', amount: 250, currency: 'USD', type: 'local', status: 'approved', reference: 'TRF-2026-003', description: 'Split dinner', createdAt: '2026-03-15T12:00:00Z' },
];

export function getTransfers(): any[] { return getOrSeed(TRANSFERS_KEY, SEED_TRANSFERS); }
export function saveTransfers(transfers: any[]) { save(TRANSFERS_KEY, transfers); }

// ═══════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════
const NOTIF_KEY = 'londway_notifications';

const SEED_NOTIFICATIONS = [
  { id: 'n-1', message: 'Welcome to Londway Capital! Your account is now active.', type: 'info', date: '2026-03-16T09:00:00Z', read: false },
  { id: 'n-2', message: 'Your salary of $5,200.00 has been deposited.', type: 'success', date: '2026-03-15T14:30:00Z', read: false },
  { id: 'n-3', message: 'Card ending in 7734 was used for $89.99 at Amazon.', type: 'info', date: '2026-03-14T11:20:00Z', read: true },
  { id: 'n-4', message: 'Your vault "Emergency Fund" reached 56% of its goal!', type: 'success', date: '2026-03-12T08:15:00Z', read: true },
  { id: 'n-5', message: 'Security alert: New login detected from Chrome on Windows.', type: 'warning', date: '2026-03-10T16:45:00Z', read: true },
];

export function getNotifications(): any[] { return getOrSeed(NOTIF_KEY, SEED_NOTIFICATIONS); }
export function saveNotifications(notifs: any[]) { save(NOTIF_KEY, notifs); }

// ═══════════════════════════════════════════
// Cards
// ═══════════════════════════════════════════
const CARDS_KEY = 'londway_cards';

export function getCards(): any[] { return load(CARDS_KEY); }
export function saveCards(cards: any[]) { save(CARDS_KEY, cards); }

// ═══════════════════════════════════════════
// Checkbooks
// ═══════════════════════════════════════════
const CHECKS_KEY = 'londway_checkbooks';

export function getCheckbooks(): any[] { return load(CHECKS_KEY); }
export function saveCheckbooks(books: any[]) { save(CHECKS_KEY, books); }
