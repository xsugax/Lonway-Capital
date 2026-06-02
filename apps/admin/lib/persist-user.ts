/**
 * THE MAGIC — single place where new/updated users are saved.
 * Cloud (Supabase) is written FIRST when configured; localStorage is a cache only.
 */

import {
  cloudSaveUser,
  cloudLookupUser,
  isCloudEnabled,
  type CloudAccount,
} from './cloud';

export interface LoginAccountEntry {
  email: string;
  password: string;
  pin?: string;
  name: string;
  role: string;
  tier?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  frozen?: boolean;
  blocked?: boolean;
  deleted?: boolean;
  idVerified?: boolean;
}

/** Cache login credentials locally (same browser only — not the source of truth). */
export function upsertLoginAccountLocal(entry: LoginAccountEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('londway_accounts');
    const accounts: LoginAccountEntry[] = raw ? JSON.parse(raw) : [];
    const idx = accounts.findIndex(a => a.email?.toLowerCase() === entry.email.toLowerCase());
    if (idx >= 0) accounts[idx] = { ...accounts[idx], ...entry };
    else accounts.push({ ...entry, idVerified: entry.idVerified ?? false });
    localStorage.setItem('londway_accounts', JSON.stringify(accounts));
  } catch { /* */ }
}
/**
 * Save user to Supabase FIRST, verify it landed, then cache locally.
 * Returns { ok, cloud, error } so UI can show honest feedback.
 */
export async function persistNewUser(
  cloudPayload: Partial<CloudAccount> & { email: string; password: string },
  localEntry: LoginAccountEntry,
  bankAccounts?: any[] | null,
): Promise<{ ok: boolean; cloud: boolean; error?: string }> {
  const payload = { ...cloudPayload, bank_accounts: bankAccounts ?? cloudPayload.bank_accounts ?? null };

  if (isCloudEnabled()) {
    const saved = await cloudSaveUser(payload);
    if (!saved) {
      return {
        ok: false,
        cloud: false,
        error: 'Cloud save failed — check Supabase billing/connection. User was NOT saved.',
      };
    }
    const verified = await cloudLookupUser(payload.email);
    if (!verified) {
      return {
        ok: false,
        cloud: false,
        error: 'Cloud save unverified — user may not appear on other devices.',
      };
    }
  }

  upsertLoginAccountLocal(localEntry);

  if (bankAccounts?.length && typeof window !== 'undefined') {
    try {
      const safe = payload.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      localStorage.setItem(`londway_bank_accounts__${safe}`, JSON.stringify(bankAccounts));
    } catch { /* */ }
  }

  if (!isCloudEnabled()) {
    return {
      ok: true,
      cloud: false,
      error: 'Saved on this browser only — Supabase keys missing in build.',
    };
  }

  return { ok: true, cloud: true };
}
