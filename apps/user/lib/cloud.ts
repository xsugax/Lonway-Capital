/**
 * Cloud account storage via Supabase REST API.
 * When NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set,
 * accounts are stored in the cloud so users can log in from ANY device.
 * When not set, the app falls back to localStorage-only (current behavior).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isCloudEnabled(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Headers for GET (read) requests — no Content-Type to avoid CORS preflight on Safari */
const readHdrs = (): Record<string, string> => ({
  'Accept': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
});

/** Headers for POST/PATCH/DELETE (write) requests */
const writeHdrs = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
});

export interface CloudAccount {
  email: string;
  password: string;
  pin: string;
  name: string;
  role: string;
  tier: string;
  balance: number;
  phone: string;
  bank_accounts: any[] | null;
}

/** Look up account by email */
export async function cloudLookup(email: string): Promise<CloudAccount | null> {
  if (!isCloudEnabled()) {
    console.warn('[cloud] Cloud not enabled — missing SUPABASE_URL or ANON_KEY');
    return null;
  }
  try {
    const url = `${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*`;
    const res = await fetch(url, { method: 'GET', headers: readHdrs() });
    if (!res.ok) {
      console.error('[cloud] Lookup failed:', res.status, await res.text().catch(() => ''));
      return null;
    }
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch (err) {
    console.error('[cloud] Lookup error:', err);
    return null;
  }
}

/** Create or update account (upsert by email) */
export async function cloudSaveUser(acct: Partial<CloudAccount> & { email: string }) {
  if (!isCloudEnabled()) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/accounts`, {
      method: 'POST',
      headers: { ...writeHdrs(), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ ...acct, email: acct.email.toLowerCase() }),
    });
  } catch (err) { console.error('[cloud] Save error:', err); }
}

/** Update balance and optionally bank accounts */
export async function cloudUpdateBalance(email: string, balance: number, bankAccounts?: any[]) {
  if (!isCloudEnabled()) return;
  try {
    const body: Record<string, any> = { balance };
    if (bankAccounts) body.bank_accounts = bankAccounts;
    await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email.toLowerCase())}`,
      { method: 'PATCH', headers: writeHdrs(), body: JSON.stringify(body) }
    );
  } catch (err) { console.error('[cloud] Update error:', err); }
}

/** Delete account from cloud */
export async function cloudDeleteUser(email: string) {
  if (!isCloudEnabled()) return;
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email.toLowerCase())}`,
      { method: 'DELETE', headers: readHdrs() }
    );
  } catch (err) { console.error('[cloud] Delete error:', err); }
}

// ═══════════════════════════════════════════════════════════════
// CLOUD TRANSFERS — Supabase-synced transfer requests
// ═══════════════════════════════════════════════════════════════

export interface CloudTransfer {
  id: string;
  reference: string;
  sender_email: string;
  sender_name: string;
  recipient_name: string;
  recipient_account: string;
  amount: number;
  currency: string;
  fee: number;
  type: string;
  status: string;
  description: string;
  country: string;
  bank_name: string;
  created_at: string;
  updated_at: string;
}

/** Save a new transfer to Supabase */
export async function cloudSaveTransfer(tx: Omit<CloudTransfer, 'updated_at'>): Promise<boolean> {
  if (!isCloudEnabled()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/transfers`, {
      method: 'POST',
      headers: { ...writeHdrs(), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(tx),
    });
    if (!res.ok) { console.error('[cloud] Save transfer failed:', res.status); return false; }
    return true;
  } catch (err) { console.error('[cloud] Save transfer error:', err); return false; }
}

/** Get all pending transfers from Supabase */
export async function cloudGetPendingTransfers(): Promise<CloudTransfer[]> {
  if (!isCloudEnabled()) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/transfers?status=eq.pending&order=created_at.desc`,
      { method: 'GET', headers: readHdrs() }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

/** Get all transfers from Supabase */
export async function cloudGetAllTransfers(): Promise<CloudTransfer[]> {
  if (!isCloudEnabled()) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/transfers?order=created_at.desc&limit=500`,
      { method: 'GET', headers: readHdrs() }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

/** Update a transfer status in Supabase */
export async function cloudUpdateTransferStatus(id: string, status: string): Promise<boolean> {
  if (!isCloudEnabled()) return false;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/transfers?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers: writeHdrs(), body: JSON.stringify({ status, updated_at: new Date().toISOString() }) }
    );
    if (!res.ok) { console.error('[cloud] Update transfer failed:', res.status); return false; }
    return true;
  } catch (err) { console.error('[cloud] Update transfer error:', err); return false; }
}
