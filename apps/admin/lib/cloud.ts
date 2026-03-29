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
