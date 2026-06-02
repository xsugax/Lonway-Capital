/**
 * Cloud-first sync — Supabase is the source of truth; localStorage is a cache.
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

import {
  isCloudEnabled,
  cloudLookup,
  type CloudAccount,
  type CloudUserData,
} from './cloud';
import {
  saveBankAccountsLocal,
  saveVaultsLocal,
  saveTransfersLocal,
  saveNotificationsLocal,
  saveCheckbooksLocal,
  saveCryptoDepositsLocal,
  saveCardsLocal,
  getBankAccounts,
  getVaults,
  getTransfers,
  getNotifications,
  getCheckbooks,
  getCryptoDeposits,
  getCards,
} from './store';

const ACCOUNTS_KEY = 'londway_accounts';

function mergeTransactions(local: any[], cloud: any[]): any[] {
  const ids = new Set((local || []).map((t: any) => t.id));
  const extra = (cloud || []).filter((t: any) => t.id && !ids.has(t.id));
  return [...extra, ...(local || [])].sort(
    (a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime()
  );
}

function mergeBankAccountsFromCloud(local: any[], cloud: any[]): any[] {
  return cloud.map((ca: any) => {
    const existing = local.find((la: any) => la.type === ca.type || la.id === ca.id);
    if (existing) {
      const mergedTx = mergeTransactions(existing.transactions || [], ca.transactions || []);
      return {
        ...existing,
        balance: ca.balance,
        transactions: mergedTx,
        recentActivity: ca.recentActivity || existing.recentActivity,
        frozen: ca.frozen ?? existing.frozen,
      };
    }
    return ca;
  });
}

function applyAccountProfile(cloud: CloudAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const accts = raw ? JSON.parse(raw) : [];
    const idx = accts.findIndex((a: any) => a.email?.toLowerCase() === cloud.email.toLowerCase());
    const patch = {
      email: cloud.email,
      name: cloud.name,
      role: cloud.role,
      tier: cloud.tier,
      blocked: !!cloud.blocked,
      frozen: !!cloud.frozen,
    };
    if (idx >= 0) {
      accts[idx] = { ...accts[idx], ...patch };
    } else if (cloud.password) {
      accts.push({ ...patch, password: cloud.password, pin: cloud.pin || '' });
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accts));
  } catch { /* */ }
}

function applyUserData(email: string, ud: CloudUserData | null | undefined): void {
  if (!ud) return;
  if (ud.vaults) saveVaultsLocal(ud.vaults, email);
  if (ud.transfers) saveTransfersLocal(ud.transfers, email);
  if (ud.notifications) saveNotificationsLocal(ud.notifications, email);
  if (ud.checkbooks) saveCheckbooksLocal(ud.checkbooks, email);
  if (ud.crypto_deposits) saveCryptoDepositsLocal(ud.crypto_deposits, email);
  if (ud.cards) saveCardsLocal(ud.cards, email);
  if (ud.daily_usage && typeof window !== 'undefined') {
    try {
      const key = `londway_daily_usage__${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      localStorage.setItem(key, JSON.stringify(ud.daily_usage));
    } catch { /* */ }
  }
}

/** Pull cloud → local cache. Call on login and when restoring session. */
export async function pullUserFromCloud(email: string): Promise<boolean> {
  if (!email || !isCloudEnabled()) return false;
  try {
    const cloud = await cloudLookup(email);
    if (!cloud) return false;

    applyAccountProfile(cloud);

    if (cloud.bank_accounts && cloud.bank_accounts.length > 0) {
      const local = getBankAccounts(email);
      const merged = mergeBankAccountsFromCloud(local, cloud.bank_accounts);
      saveBankAccountsLocal(merged, email);
    }

    applyUserData(email, cloud.user_data);
    return true;
  } catch (err) {
    console.error('[sync] Pull failed:', err);
    return false;
  }
}

/** Push all local per-user data → cloud (backup / migration). */
export async function pushUserToCloud(email: string): Promise<void> {
  if (!email || !isCloudEnabled()) return;
  const { cloudUpdateBalance, cloudPatchUserData, cloudSaveUser } = await import('./cloud');

  const bankAccounts = getBankAccounts(email);
  const total = bankAccounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
  await cloudUpdateBalance(email, total, bankAccounts);

  let daily_usage: { date: string; amount: number } | undefined;
  try {
    const key = `londway_daily_usage__${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const raw = localStorage.getItem(key);
    if (raw) daily_usage = JSON.parse(raw);
  } catch { /* */ }

  const userData: CloudUserData = {
    vaults: getVaults(email),
    transfers: getTransfers(email),
    notifications: getNotifications(email),
    checkbooks: getCheckbooks(email),
    crypto_deposits: getCryptoDeposits(email),
    cards: getCards(email),
    daily_usage,
  };
  await cloudPatchUserData(email, userData);

  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const accts = JSON.parse(raw);
      const m = accts.find((a: any) => a.email?.toLowerCase() === email.toLowerCase());
      if (m?.password) {
        await cloudSaveUser({
          email,
          password: m.password,
          pin: m.pin || '',
          name: m.name || email,
          role: m.role || 'user',
          tier: m.tier || 'Standard',
          balance: total,
          phone: m.phone || '',
          bank_accounts: bankAccounts,
        });
      }
    }
  } catch { /* */ }
}
