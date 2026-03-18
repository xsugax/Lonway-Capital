/**
 * Cloud account storage via Supabase REST API.
 * Mirrors apps/user/lib/cloud.ts for admin usage.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isCloudEnabled(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

const hdrs = (): Record<string, string> => ({
  'Content-Type': 'application/json',
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
      headers: { ...hdrs(), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ ...acct, email: acct.email.toLowerCase() }),
    });
  } catch {}
}

export async function cloudUpdateBalance(email: string, balance: number, bankAccounts?: any[]) {
  if (!isCloudEnabled()) return;
  try {
    const body: Record<string, any> = { balance };
    if (bankAccounts) body.bank_accounts = bankAccounts;
    await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email.toLowerCase())}`,
      { method: 'PATCH', headers: hdrs(), body: JSON.stringify(body) }
    );
  } catch {}
}

export async function cloudDeleteUser(email: string) {
  if (!isCloudEnabled()) return;
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/accounts?email=eq.${encodeURIComponent(email.toLowerCase())}`,
      { method: 'DELETE', headers: hdrs() }
    );
  } catch {}
}
