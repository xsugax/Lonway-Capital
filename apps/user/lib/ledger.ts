// ═══════════════════════════════════════════════════════════════════
// LONDWAY CAPITAL — CORE LEDGER ENGINE
// Double-entry accounting, immutable journal, transaction state machine
// ═══════════════════════════════════════════════════════════════════

// ─── Unique ID Generator ───
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Hash for integrity verification ───
function hashEntry(data: string): string {
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = ((h << 5) - h + data.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
}

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export type TransactionStatus =
  | 'initiated'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'reversed';

export type TransactionType =
  | 'local_transfer'
  | 'international_wire'
  | 'card_purchase'
  | 'card_refund'
  | 'deposit'
  | 'withdrawal'
  | 'fee'
  | 'interest'
  | 'vault_deposit'
  | 'vault_withdrawal'
  | 'reversal';

export type EntryType = 'debit' | 'credit';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;          // Account being debited/credited
  accountName: string;        // Human-readable account name
  type: EntryType;            // debit or credit
  amount: number;             // Always positive
  currency: string;
  timestamp: string;          // ISO 8601
  hash: string;               // Integrity hash
  prevHash: string;           // Previous entry hash (chain)
}

export interface Transaction {
  id: string;                 // UUID
  reference: string;          // Human-readable ref (TRF-XXXXXXXX)
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;

  // Parties
  senderAccountId: string;
  senderAccountName: string;
  senderEmail: string;
  senderName: string;
  recipientAccountId: string;
  recipientAccountName: string;
  recipientName: string;
  recipientBankName?: string;

  // Transfer-specific
  iban?: string;
  swift?: string;
  routingNumber?: string;
  country?: string;
  transferType?: 'local' | 'international';

  // Card-specific
  merchantName?: string;
  authorizationCode?: string;
  transactionLocation?: string;
  cardId?: string;

  // Fees & FX
  fee: number;
  fxRate?: number;
  fxFromCurrency?: string;
  fxToCurrency?: string;
  convertedAmount?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  completedAt?: string;
  reversedAt?: string;

  // Audit
  auditTrail: AuditEntry[];
  flagged: boolean;
  flagReason?: string;
  fraudScore: number;         // 0-100, higher = more suspicious

  // Linked ledger entries
  debitEntryId: string;
  creditEntryId: string;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  actor: string;              // 'system' | 'admin' | user email
  detail: string;
  prevStatus?: TransactionStatus;
  newStatus?: TransactionStatus;
}

// ═══════════════════════════════════════════
// State Machine — Valid Transitions
// ═══════════════════════════════════════════

const VALID_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  initiated:  ['pending', 'failed'],
  pending:    ['processing', 'completed', 'failed', 'reversed'],
  processing: ['completed', 'failed', 'reversed'],
  completed:  ['reversed'],
  failed:     [],             // Terminal state
  reversed:   [],             // Terminal state
};

export function canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ═══════════════════════════════════════════
// Storage Keys
// ═══════════════════════════════════════════

const LEDGER_KEY = 'londway_core_ledger';
const TX_KEY = 'londway_core_transactions';

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(key: string, data: unknown): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// ═══════════════════════════════════════════
// Ledger Operations
// ═══════════════════════════════════════════

export function getLedgerEntries(): LedgerEntry[] {
  return load<LedgerEntry>(LEDGER_KEY);
}

export function getTransactions(): Transaction[] {
  return load<Transaction>(TX_KEY);
}

export function getTransaction(id: string): Transaction | undefined {
  return getTransactions().find(t => t.id === id);
}

export function getTransactionByRef(ref: string): Transaction | undefined {
  return getTransactions().find(t => t.reference === ref);
}

/** Generate a human-readable reference: TRF-8CHAR */
export function generateReference(): string {
  return 'TRF-' + Date.now().toString(36).toUpperCase() + uuid().slice(0, 4).toUpperCase();
}

/** Append a double-entry pair to the ledger */
function appendLedgerEntries(
  transactionId: string,
  debitAccount: { id: string; name: string },
  creditAccount: { id: string; name: string },
  amount: number,
  currency: string,
): { debitEntryId: string; creditEntryId: string } {
  const entries = getLedgerEntries();
  const prevHash = entries.length > 0 ? entries[entries.length - 1].hash : '00000000';
  const now = new Date().toISOString();

  const debitId = uuid();
  const creditId = uuid();

  const debitData = `${debitId}|${transactionId}|${debitAccount.id}|debit|${amount}|${currency}|${now}|${prevHash}`;
  const debitHash = hashEntry(debitData);

  const debitEntry: LedgerEntry = {
    id: debitId,
    transactionId,
    accountId: debitAccount.id,
    accountName: debitAccount.name,
    type: 'debit',
    amount,
    currency,
    timestamp: now,
    hash: debitHash,
    prevHash,
  };

  const creditData = `${creditId}|${transactionId}|${creditAccount.id}|credit|${amount}|${currency}|${now}|${debitHash}`;
  const creditHash = hashEntry(creditData);

  const creditEntry: LedgerEntry = {
    id: creditId,
    transactionId,
    accountId: creditAccount.id,
    accountName: creditAccount.name,
    type: 'credit',
    amount,
    currency,
    timestamp: now,
    hash: creditHash,
    prevHash: debitHash,
  };

  entries.push(debitEntry, creditEntry);
  save(LEDGER_KEY, entries);

  return { debitEntryId: debitId, creditEntryId: creditId };
}

// ═══════════════════════════════════════════
// Fraud Scoring
// ═══════════════════════════════════════════

function calculateFraudScore(amount: number, type: TransactionType, transferType?: string): number {
  let score = 0;

  // High-value transactions
  if (amount >= 1_000_000) score += 40;
  else if (amount >= 500_000) score += 25;
  else if (amount >= 100_000) score += 15;
  else if (amount >= 50_000) score += 8;

  // International wires carry more risk
  if (type === 'international_wire') score += 10;
  if (transferType === 'international') score += 5;

  // Round numbers above $10k are suspicious
  if (amount >= 10_000 && amount % 1000 === 0) score += 5;

  return Math.min(score, 100);
}

// ═══════════════════════════════════════════
// Create Transaction (with double-entry)
// ═══════════════════════════════════════════

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;

  senderAccountId: string;
  senderAccountName: string;
  senderEmail: string;
  senderName: string;
  recipientAccountId: string;
  recipientAccountName: string;
  recipientName: string;
  recipientBankName?: string;

  // Transfer specifics
  iban?: string;
  swift?: string;
  routingNumber?: string;
  country?: string;
  transferType?: 'local' | 'international';

  // Card specifics
  merchantName?: string;
  authorizationCode?: string;
  transactionLocation?: string;
  cardId?: string;

  // FX
  fee?: number;
  fxRate?: number;
  fxFromCurrency?: string;
  fxToCurrency?: string;
  convertedAmount?: number;
}

export function createTransaction(input: CreateTransactionInput): Transaction {
  const id = uuid();
  const reference = generateReference();
  const now = new Date().toISOString();
  const fee = input.fee ?? 0;

  // Calculate fraud score
  const fraudScore = calculateFraudScore(input.amount, input.type, input.transferType);
  const flagged = fraudScore >= 30 || input.amount >= 1_000_000;

  // Create double-entry ledger entries
  const { debitEntryId, creditEntryId } = appendLedgerEntries(
    id,
    { id: input.senderAccountId, name: input.senderAccountName },
    { id: input.recipientAccountId, name: input.recipientAccountName },
    input.amount + fee,
    input.currency,
  );

  const transaction: Transaction = {
    id,
    reference,
    type: input.type,
    status: 'initiated',
    amount: input.amount,
    currency: input.currency,
    description: input.description,

    senderAccountId: input.senderAccountId,
    senderAccountName: input.senderAccountName,
    senderEmail: input.senderEmail,
    senderName: input.senderName,
    recipientAccountId: input.recipientAccountId,
    recipientAccountName: input.recipientAccountName,
    recipientName: input.recipientName,
    recipientBankName: input.recipientBankName,

    iban: input.iban,
    swift: input.swift,
    routingNumber: input.routingNumber,
    country: input.country,
    transferType: input.transferType,

    merchantName: input.merchantName,
    authorizationCode: input.authorizationCode,
    transactionLocation: input.transactionLocation,
    cardId: input.cardId,

    fee,
    fxRate: input.fxRate,
    fxFromCurrency: input.fxFromCurrency,
    fxToCurrency: input.fxToCurrency,
    convertedAmount: input.convertedAmount,

    createdAt: now,
    updatedAt: now,

    auditTrail: [{
      timestamp: now,
      action: 'TRANSACTION_CREATED',
      actor: 'system',
      detail: `Transaction ${reference} created. Amount: ${input.currency} ${input.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Type: ${input.type}.${flagged ? ' FLAGGED for review.' : ''}`,
      newStatus: 'initiated',
    }],

    flagged,
    flagReason: flagged ? (input.amount >= 1_000_000 ? 'High-value transaction (>$1M)' : 'Elevated fraud score') : undefined,
    fraudScore,

    debitEntryId,
    creditEntryId,
  };

  // Auto-advance to pending
  transaction.status = 'pending';
  transaction.auditTrail.push({
    timestamp: now,
    action: 'STATUS_CHANGE',
    actor: 'system',
    detail: 'Transaction queued for compliance review.',
    prevStatus: 'initiated',
    newStatus: 'pending',
  });

  const all = getTransactions();
  all.unshift(transaction);
  save(TX_KEY, all);

  return transaction;
}

// ═══════════════════════════════════════════
// Update Transaction Status
// ═══════════════════════════════════════════

export function updateTransactionStatus(
  transactionId: string,
  newStatus: TransactionStatus,
  actor: string,
  detail?: string,
): { success: boolean; error?: string; transaction?: Transaction } {
  const all = getTransactions();
  const idx = all.findIndex(t => t.id === transactionId);
  if (idx === -1) return { success: false, error: 'Transaction not found' };

  const tx = all[idx];
  if (!canTransition(tx.status, newStatus)) {
    return { success: false, error: `Cannot transition from ${tx.status} to ${newStatus}` };
  }

  const now = new Date().toISOString();
  const prevStatus = tx.status;
  tx.status = newStatus;
  tx.updatedAt = now;

  if (newStatus === 'completed') tx.completedAt = now;
  if (newStatus === 'processing') tx.processedAt = now;
  if (newStatus === 'reversed') tx.reversedAt = now;

  tx.auditTrail.push({
    timestamp: now,
    action: 'STATUS_CHANGE',
    actor,
    detail: detail || `Status changed from ${prevStatus} to ${newStatus}`,
    prevStatus,
    newStatus,
  });

  all[idx] = tx;
  save(TX_KEY, all);

  return { success: true, transaction: tx };
}

// ═══════════════════════════════════════════
// Flag / Unflag Transaction
// ═══════════════════════════════════════════

export function flagTransaction(
  transactionId: string,
  reason: string,
  actor: string,
): { success: boolean; error?: string } {
  const all = getTransactions();
  const idx = all.findIndex(t => t.id === transactionId);
  if (idx === -1) return { success: false, error: 'Transaction not found' };

  all[idx].flagged = true;
  all[idx].flagReason = reason;
  all[idx].updatedAt = new Date().toISOString();
  all[idx].auditTrail.push({
    timestamp: new Date().toISOString(),
    action: 'FLAGGED',
    actor,
    detail: `Transaction flagged: ${reason}`,
  });

  save(TX_KEY, all);
  return { success: true };
}

export function unflagTransaction(transactionId: string, actor: string): { success: boolean } {
  const all = getTransactions();
  const idx = all.findIndex(t => t.id === transactionId);
  if (idx === -1) return { success: false };

  all[idx].flagged = false;
  all[idx].flagReason = undefined;
  all[idx].updatedAt = new Date().toISOString();
  all[idx].auditTrail.push({
    timestamp: new Date().toISOString(),
    action: 'UNFLAGGED',
    actor,
    detail: 'Fraud flag cleared.',
  });

  save(TX_KEY, all);
  return { success: true };
}

// ═══════════════════════════════════════════
// User Transaction Queries
// ═══════════════════════════════════════════

export function getUserTransactions(email: string): Transaction[] {
  return getTransactions().filter(t => t.senderEmail === email);
}

export function getTransactionsByStatus(status: TransactionStatus): Transaction[] {
  return getTransactions().filter(t => t.status === status);
}

export function getTransactionsByAccount(accountId: string): Transaction[] {
  return getTransactions().filter(
    t => t.senderAccountId === accountId || t.recipientAccountId === accountId,
  );
}

export function getFlaggedTransactions(): Transaction[] {
  return getTransactions().filter(t => t.flagged);
}

// ═══════════════════════════════════════════
// Desync Detection
// ═══════════════════════════════════════════

export function checkDesync(email: string): string[] {
  const coreTransactions = getUserTransactions(email);

  // Check legacy transfers store for any orphans
  const alerts: string[] = [];
  if (typeof window === 'undefined') return alerts;

  try {
    const safe = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const legacyRaw = localStorage.getItem(`londway_transfers__${safe}`);
    if (legacyRaw) {
      const legacyTransfers = JSON.parse(legacyRaw);
      for (const lt of legacyTransfers) {
        const found = coreTransactions.find(ct => ct.reference === lt.reference);
        if (!found) {
          alerts.push(`TRANSACTION DESYNC DETECTED: Legacy transfer ${lt.reference} (${lt.recipientName}, $${lt.amount}) not found in core ledger.`);
        }
      }
    }
  } catch {}

  return alerts;
}

// ═══════════════════════════════════════════
// Ledger Integrity Verification
// ═══════════════════════════════════════════

export function verifyLedgerIntegrity(): { valid: boolean; errors: string[] } {
  const entries = getLedgerEntries();
  const errors: string[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPrev = i > 0 ? entries[i - 1].hash : '00000000';
    if (entry.prevHash !== expectedPrev) {
      errors.push(`Chain break at entry ${entry.id}: expected prevHash ${expectedPrev}, got ${entry.prevHash}`);
    }
  }

  // Verify double-entry balance
  const balanceByAccount: Record<string, number> = {};
  for (const entry of entries) {
    if (!balanceByAccount[entry.accountId]) balanceByAccount[entry.accountId] = 0;
    if (entry.type === 'debit') balanceByAccount[entry.accountId] -= entry.amount;
    else balanceByAccount[entry.accountId] += entry.amount;
  }

  // Total debits should equal total credits across all entries
  let totalDebits = 0, totalCredits = 0;
  for (const entry of entries) {
    if (entry.type === 'debit') totalDebits += entry.amount;
    else totalCredits += entry.amount;
  }
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    errors.push(`Ledger imbalance: total debits ($${totalDebits.toFixed(2)}) ≠ total credits ($${totalCredits.toFixed(2)})`);
  }

  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════
// IBAN / SWIFT / Routing Validation
// ═══════════════════════════════════════════

export function validateRoutingNumber(routing: string): { valid: boolean; error?: string } {
  const clean = routing.replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(clean)) return { valid: false, error: 'ABA routing number must be exactly 9 digits' };
  // ABA checksum validation
  const d = clean.split('').map(Number);
  const checksum = (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10;
  if (checksum !== 0) return { valid: false, error: 'Invalid ABA routing number checksum' };
  return { valid: true };
}

export function validateAccountNumber(acct: string): { valid: boolean; error?: string } {
  const clean = acct.replace(/[\s-]/g, '');
  if (!/^\d{4,17}$/.test(clean)) return { valid: false, error: 'Account number must be 4-17 digits' };
  return { valid: true };
}

export function validateIBAN(iban: string): { valid: boolean; error?: string; country?: string } {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (clean.length < 15 || clean.length > 34) return { valid: false, error: 'IBAN must be 15-34 characters' };
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) return { valid: false, error: 'Invalid IBAN format: must start with 2 letters + 2 check digits' };

  // ISO 3166 country detection
  const countryCode = clean.slice(0, 2);
  const IBAN_COUNTRIES: Record<string, string> = {
    GB: 'United Kingdom', FR: 'France', DE: 'Germany', CH: 'Switzerland',
    ES: 'Spain', IT: 'Italy', NL: 'Netherlands', BE: 'Belgium',
    AT: 'Austria', PT: 'Portugal', IE: 'Ireland', DK: 'Denmark',
    SE: 'Sweden', NO: 'Norway', FI: 'Finland', PL: 'Poland',
    CZ: 'Czech Republic', GR: 'Greece', AE: 'United Arab Emirates',
    SA: 'Saudi Arabia', QA: 'Qatar', BH: 'Bahrain', KW: 'Kuwait',
    LB: 'Lebanon', TR: 'Turkey', IL: 'Israel', JO: 'Jordan',
    MT: 'Malta', CY: 'Cyprus', LU: 'Luxembourg', LI: 'Liechtenstein',
    MC: 'Monaco', SM: 'San Marino', HR: 'Croatia', RO: 'Romania',
    BG: 'Bulgaria', HU: 'Hungary', SK: 'Slovakia', SI: 'Slovenia',
    EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania',
  };

  const country = IBAN_COUNTRIES[countryCode];
  if (!country) return { valid: false, error: `Unrecognized IBAN country code: ${countryCode}` };

  // IBAN modulo 97 validation
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
  let remainder = numeric;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(block.length);
  }
  if (parseInt(remainder, 10) % 97 !== 1) return { valid: false, error: 'Invalid IBAN check digits' };

  return { valid: true, country };
}

export function validateSWIFT(swift: string): { valid: boolean; error?: string; bankName?: string } {
  const clean = swift.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(clean)) {
    return { valid: false, error: 'SWIFT/BIC must be 8 or 11 alphanumeric characters' };
  }

  // Known SWIFT code lookup (major banks)
  const SWIFT_BANKS: Record<string, string> = {
    BNPAFRPP: 'BNP Paribas', DEUTDEFF: 'Deutsche Bank', COBADEFF: 'Commerzbank',
    BARCGB22: 'Barclays', NWBKGB2L: 'NatWest', HSBCGB2L: 'HSBC UK',
    CHASUS33: 'JPMorgan Chase', BOFAUS3N: 'Bank of America', WFBIUS6S: 'Wells Fargo',
    CITIUS33: 'Citibank', UBSWCHZH: 'UBS', CRESCHZZ: 'Credit Suisse',
    MABORUMM: 'Mashreqbank', BOMLAEAD: 'Mashreq', ENABORUMM: 'Emirates NBD',
    SCBLSGSG: 'Standard Chartered SG', DBSSSGSG: 'DBS Bank',
    MABORUAEXXX: 'Mashreqbank', BOABORUMM: 'Banque of Oman',
    SMBJJPJT: 'SMBC', BOTKJPJT: 'MUFG Bank', MHCBJPJT: 'Mizuho Bank',
  };
  const prefix = clean.slice(0, 8);
  const bankName = SWIFT_BANKS[prefix] || SWIFT_BANKS[clean];

  return { valid: true, bankName };
}

// ═══════════════════════════════════════════
// FX Rates (simulated — realistic mid-market)
// ═══════════════════════════════════════════

const FX_RATES: Record<string, number> = {
  USD: 1.0000, EUR: 0.9215, GBP: 0.7895, CHF: 0.8810,
  JPY: 149.50, CAD: 1.3580, AUD: 1.5320, AED: 3.6725,
  SGD: 1.3410, HKD: 7.8120, INR: 83.25, BRL: 4.9700,
  MXN: 17.15, ZAR: 18.65, CNY: 7.2450, KRW: 1325.0,
  SEK: 10.45, NOK: 10.68, DKK: 6.8850, PLN: 3.9950,
  CZK: 22.85, HUF: 355.0, TRY: 32.50, NZD: 1.6350,
};

export function getExchangeRate(from: string, to: string): number {
  const fromRate = FX_RATES[from] ?? 1;
  const toRate = FX_RATES[to] ?? 1;
  return toRate / fromRate;
}

export function convertAmount(amount: number, from: string, to: string): { rate: number; converted: number; fee: number } {
  const rate = getExchangeRate(from, to);
  const converted = Math.round(amount * rate * 100) / 100;
  // FX spread fee: 0.35%
  const fee = Math.round(amount * 0.0035 * 100) / 100;
  return { rate: Math.round(rate * 10000) / 10000, converted, fee };
}

// ═══════════════════════════════════════════
// Migration: Legacy transfers → Core Ledger
// ═══════════════════════════════════════════

export function migrateLegacyTransfers(email: string): number {
  if (typeof window === 'undefined') return 0;
  const safe = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const raw = localStorage.getItem(`londway_transfers__${safe}`);
  if (!raw) return 0;

  let legacy: any[];
  try { legacy = JSON.parse(raw); } catch { return 0; }
  if (!Array.isArray(legacy) || legacy.length === 0) return 0;

  const existing = getTransactions();
  const existingRefs = new Set(existing.map(t => t.reference));
  let migrated = 0;

  for (const lt of legacy) {
    if (existingRefs.has(lt.reference)) continue; // Already migrated

    const statusMap: Record<string, TransactionStatus> = {
      pending: 'pending', approved: 'completed', rejected: 'failed',
      completed: 'completed', failed: 'failed', reversed: 'reversed',
    };

    const tx = createTransaction({
      type: lt.type === 'international' ? 'international_wire' : 'local_transfer',
      amount: lt.amount,
      currency: lt.currency || 'USD',
      description: lt.description || `Migrated: ${lt.type} transfer`,
      senderAccountId: 'checking-' + safe,
      senderAccountName: 'Primary Checking',
      senderEmail: email,
      senderName: lt.senderName || email,
      recipientAccountId: lt.toAccountId || 'external',
      recipientAccountName: lt.recipientName || 'External Account',
      recipientName: lt.recipientName || 'Unknown',
      iban: lt.iban,
      swift: lt.swift,
      country: lt.country,
      transferType: lt.type,
    });

    // Set correct status from legacy
    const targetStatus = statusMap[lt.status] || 'pending';
    if (targetStatus !== 'pending') {
      updateTransactionStatus(tx.id, targetStatus, 'system', `Migrated from legacy. Original status: ${lt.status}`);
    }

    // Override reference to match legacy
    const allTx = getTransactions();
    const idx = allTx.findIndex(t => t.id === tx.id);
    if (idx !== -1) {
      allTx[idx].reference = lt.reference;
      allTx[idx].createdAt = lt.createdAt || tx.createdAt;
      save(TX_KEY, allTx);
    }

    migrated++;
  }

  return migrated;
}
