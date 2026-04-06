/**
 * Cloud account storage via Supabase REST API.
 * Mirrors apps/user/lib/cloud.ts for admin usage.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isCloudEnabled(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Headers for read requests */
const readHdrs = (): Record<string, string> => ({
  'Accept': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
});

/** Headers for write requests */
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
  blocked?: boolean;
  frozen?: boolean;
}

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

/** PATCH only the fields that changed — never overwrites password/pin with empty values */
export async function cloudPatchUser(email: string, fields: Record<string, any>): Promise<void> {
  if (!isCloudEnabled()) return;
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email.toLowerCase())}`,
      { method: 'PATCH', headers: writeHdrs(), body: JSON.stringify(fields) }
    );
  } catch (err) { console.error('[cloud] Patch error:', err); }
}

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

export async function cloudDeleteUser(email: string) {
  if (!isCloudEnabled()) return;
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email.toLowerCase())}`,
      { method: 'DELETE', headers: readHdrs() }
    );
  } catch (err) { console.error('[cloud] Delete error:', err); }
}

/** Look up a user's cloud data by email */
export async function cloudLookupUser(email: string): Promise<CloudAccount | null> {
  if (!isCloudEnabled()) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*`,
      { method: 'GET', headers: readHdrs() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch { return null; }
}

/** Refund a transfer amount to a user's cloud balance */
export async function cloudRefundBalance(email: string, refundAmount: number, description: string): Promise<void> {
  if (!isCloudEnabled()) return;
  try {
    const user = await cloudLookupUser(email);
    if (!user) return;
    const accts: any[] = user.bank_accounts || [];
    if (accts.length === 0) return;
    const idx = accts.findIndex((a: any) => a.type === 'Checking' || a.type === 'checking');
    const i = idx >= 0 ? idx : 0;
    accts[i].balance = Math.round((accts[i].balance + refundAmount) * 100) / 100;
    const entry = { id: 'refund-' + Date.now(), type: 'credit', description, amount: refundAmount, date: new Date().toISOString(), status: 'completed' };
    accts[i].transactions = [entry, ...(Array.isArray(accts[i].transactions) ? accts[i].transactions : [])];
    accts[i].recentActivity = description;
    const totalBalance = accts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    await cloudUpdateBalance(email, totalBalance, accts);
  } catch (err) { console.error('[cloud] Refund error:', err); }
}

// ── Bank Settings cloud sync ──

/** Save global bank settings to cloud (stored as a special account row) */
export async function cloudSaveBankSettings(settings: any): Promise<void> {
  if (!isCloudEnabled()) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/accounts`, {
      method: 'POST',
      headers: { ...writeHdrs(), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        email: '__bank_settings__',
        name: 'Bank Settings',
        role: 'system',
        tier: 'Standard',
        password: '',
        pin: '',
        balance: 0,
        phone: '',
        bank_accounts: settings,
      }),
    });
  } catch (err) { console.error('[cloud] Save bank settings error:', err); }
}

/** Fetch global bank settings from cloud */
export async function cloudGetBankSettings(): Promise<any | null> {
  if (!isCloudEnabled()) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?email=eq.__bank_settings__&select=bank_accounts`,
      { method: 'GET', headers: readHdrs() }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.bank_accounts ?? null;
  } catch { return null; }
}

// ── Transfer cloud functions ──

export async function cloudGetPendingTransfers(): Promise<any[]> {
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

export async function cloudGetAllTransfers(): Promise<any[]> {
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

export async function cloudUpdateTransferStatus(id: string, status: string): Promise<void> {
  if (!isCloudEnabled()) return;
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/transfers?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers: writeHdrs(), body: JSON.stringify({ status, updated_at: new Date().toISOString() }) }
    );
  } catch (err) { console.error('[cloud] Transfer status update error:', err); }
}

/** Save a transfer/transaction record to cloud so it appears in user's transfer history */
export async function cloudSaveTransfer(tx: Record<string, any>): Promise<boolean> {
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

// ── Card cloud functions ──

export async function cloudGetAllCards(): Promise<any[]> {
  if (!isCloudEnabled()) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cards?order=requested_at.desc`,
      { method: 'GET', headers: readHdrs() }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function cloudUpdateCardStatus(id: string, updates: Record<string, any>): Promise<void> {
  if (!isCloudEnabled()) return;
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/cards?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers: writeHdrs(), body: JSON.stringify(updates) }
    );
  } catch (err) { console.error('[cloud] Card status update error:', err); }
}
