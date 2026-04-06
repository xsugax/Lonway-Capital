'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useTheme } from '../contexts/ThemeContext';
import { getTransfers, saveTransfers, getTierLimits, getDailyUsage, addDailyUsage, getBankAccounts, saveBankAccounts, getNotifications, saveNotifications } from '../lib/store';
import { sendTransferNotification } from '../lib/email';
import {
  createTransaction, migrateLegacyTransfers,
  validateIBAN, validateSWIFT, validateRoutingNumber, validateAccountNumber,
  convertAmount,
} from '../lib/ledger';
import { downloadReceiptFromLegacy } from '../lib/receipt';
import { cloudSaveTransfer, cloudGetUserTransfers, cloudLookup, cloudUpdateBalance } from '../lib/cloud';
import type { TierLimits } from '../lib/store';

type TransferType = 'local' | 'international';
type TransferStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed' | 'reversed';

interface Transfer {
  id: string;
  recipientName: string;
  toAccountId: string;
  amount: number;
  currency: string;
  type: TransferType;
  status: TransferStatus;
  reference: string;
  description: string;
  createdAt: string;
  country?: string;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'AED', 'SGD', 'HKD', 'INR', 'BRL', 'MXN', 'ZAR', 'CNY', 'KRW', 'SEK', 'NOK', 'DKK', 'PLN', 'NZD', 'TRY', 'HUF', 'CZK'];
const COUNTRIES = ['United Kingdom','France','Germany','Switzerland','Japan','Canada','Australia','United Arab Emirates','Singapore','Hong Kong','China','Brazil','India','South Africa','Mexico','Spain','Italy','Netherlands','Sweden','Norway','Denmark','Poland','Czech Republic','Turkey','Ireland','Austria','Belgium','Portugal','Greece','Finland','Saudi Arabia','Qatar','Bahrain','Kuwait','Jordan','Lebanon','Romania','Bulgaria','Hungary','Slovakia','Slovenia','Croatia','Estonia','Latvia','Lithuania','Malta','Cyprus','Luxembourg','Liechtenstein','Monaco'];

function StatusBadge({ status }: { status: TransferStatus }) {
  const { colors } = useTheme();
  const cfg: Record<TransferStatus, { bg: string; color: string; label: string }> = {
    pending:   { bg: colors.goldBg,                color: colors.gold, label: 'Pending Review' },
    approved:  { bg: 'rgba(80,200,120,0.12)',  color: '#50C878', label: 'Approved' },
    rejected:  { bg: 'rgba(255,77,79,0.12)',   color: '#ff4d4f', label: 'Rejected' },
    completed: { bg: 'rgba(80,200,120,0.12)',  color: '#50C878', label: 'Completed' },
    failed:    { bg: 'rgba(255,77,79,0.12)',   color: '#ff4d4f', label: 'Failed' },
    reversed:  { bg: 'rgba(162,178,191,0.15)', color: '#A2B2BF', label: 'Reversed' },
  };
  const s = cfg[status] || cfg.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: '0.76rem', fontWeight: 600 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

export default function Transfer({ user }: { user: { token: string; email?: string; name?: string } }) {
  const { colors, theme } = useTheme();
  const [tab, setTab] = useState<TransferType>('local');
  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; message: string; ref?: string } | null>(null);
  const [history, setHistory] = useState<Transfer[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [tierLimits, setTierLimits] = useState<TierLimits>(getTierLimits('Standard'));
  const [dailyUsed, setDailyUsed] = useState(0);
  // Local fields
  const [localRecipient, setLocalRecipient] = useState('');
  const [localRouting, setLocalRouting] = useState('');
  const [localAccountNum, setLocalAccountNum] = useState('');
  const [localBankName, setLocalBankName] = useState('');
  const [localAmount, setLocalAmount] = useState('');
  const [localMemo, setLocalMemo] = useState('');
  // International fields
  const [intlName, setIntlName] = useState('');
  const [intlIban, setIntlIban] = useState('');
  const [intlSwift, setIntlSwift] = useState('');
  const [intlBankName, setIntlBankName] = useState('');
  const [intlCountry, setIntlCountry] = useState('');
  const [intlCurrency, setIntlCurrency] = useState('EUR');
  const [intlAmount, setIntlAmount] = useState('');
  const [intlMemo, setIntlMemo] = useState('');

  // Validation feedback
  const [routingError, setRoutingError] = useState('');
  const [acctNumError, setAcctNumError] = useState('');
  const [ibanError, setIbanError] = useState('');
  const [ibanCountry, setIbanCountry] = useState('');
  const [swiftError, setSwiftError] = useState('');
  const [swiftBank, setSwiftBank] = useState('');

  // Review screen
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);

  // FX display
  const [fxInfo, setFxInfo] = useState<{ rate: number; converted: number; fee: number } | null>(null);

  // PIN gate
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingSubmit, setPendingSubmit] = useState<null | (() => void)>(null);

  const QUICK = [100, 250, 500, 1000, 2500, 5000];

  useEffect(() => {
    // Migrate legacy transfers to core ledger on first load
    if (user?.email) {
      migrateLegacyTransfers(user.email);
    }
    fetchHistory();
    // Load user tier from cloud (sync latest admin changes)
    if (typeof window !== 'undefined' && user?.email) {
      const email = user.email;
      (async () => {
        try {
          const cloud = await cloudLookup(email);
          if (cloud?.tier) {
            const raw = localStorage.getItem('londway_accounts');
            if (raw) {
              const accts = JSON.parse(raw);
              const idx = accts.findIndex((a: any) => a.email?.toLowerCase() === email.toLowerCase());
              if (idx !== -1 && accts[idx].tier !== cloud.tier) {
                accts[idx].tier = cloud.tier;
                localStorage.setItem('londway_accounts', JSON.stringify(accts));
              }
            }
            setTierLimits(getTierLimits(cloud.tier));
          }
        } catch {
          // Fallback to local tier
          try {
            const raw = localStorage.getItem('londway_accounts');
            if (raw) {
              const accts = JSON.parse(raw);
              const acct = accts.find((a: any) => a.email === email);
              setTierLimits(getTierLimits(acct?.tier));
            }
          } catch {}
        }
      })();
      setDailyUsed(getDailyUsage(user.email));
    }
    // Auto-poll cloud for status updates + re-sync tier every 10s
    const pollId = setInterval(() => {
      fetchHistory();
      // Re-sync tier from cloud so admin changes take effect within seconds
      if (user?.email) {
        cloudLookup(user.email).then(cloud => {
          if (cloud?.tier) setTierLimits(getTierLimits(cloud.tier));
        }).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(pollId);
  }, [user?.email]);

  // Real-time FX calculation for international
  useEffect(() => {
    if (tab === 'international' && intlCurrency && intlCurrency !== 'USD' && intlAmount) {
      const amt = parseFloat(intlAmount);
      if (amt > 0) {
        const fx = convertAmount(amt, 'USD', intlCurrency);
        setFxInfo(fx);
      } else { setFxInfo(null); }
    } else { setFxInfo(null); }
  }, [intlAmount, intlCurrency, tab]);

  // Real-time IBAN validation
  useEffect(() => {
    if (intlIban.length >= 5) {
      const result = validateIBAN(intlIban);
      setIbanError(result.valid ? '' : result.error || '');
      setIbanCountry(result.country || '');
      if (result.country && !intlCountry) setIntlCountry(result.country);
    } else { setIbanError(''); setIbanCountry(''); }
  }, [intlIban]);

  // Real-time SWIFT validation
  useEffect(() => {
    if (intlSwift.length >= 8) {
      const result = validateSWIFT(intlSwift);
      setSwiftError(result.valid ? '' : result.error || '');
      setSwiftBank(result.bankName || '');
      if (result.bankName && !intlBankName) setIntlBankName(result.bankName);
    } else { setSwiftError(''); setSwiftBank(''); }
  }, [intlSwift]);

  // Real-time routing number validation
  useEffect(() => {
    if (localRouting.length >= 9) {
      const result = validateRoutingNumber(localRouting);
      setRoutingError(result.valid ? '' : result.error || '');
    } else { setRoutingError(''); }
  }, [localRouting]);

  // Real-time account number validation
  useEffect(() => {
    if (localAccountNum.length >= 4) {
      const result = validateAccountNumber(localAccountNum);
      setAcctNumError(result.valid ? '' : result.error || '');
    } else { setAcctNumError(''); }
  }, [localAccountNum]);

  function fetchHistory() {
    setHistoryLoading(true);
    const local = getTransfers(user?.email);
    // Merge cloud transfers: pull admin-created transactions + sync status updates
    if (user?.email) {
      cloudGetUserTransfers(user.email).then(cloudTxs => {
        if (cloudTxs.length > 0) {
          let changed = false;
          const localIds = new Set(local.map((lt: any) => lt.id));

          // Update statuses of existing local transfers from cloud
          const updated = local.map((lt: any) => {
            const ct = cloudTxs.find((c: any) => c.id === lt.id);
            if (ct && ct.status !== lt.status) {
              changed = true;
              // If rejected, refund the held amount back to checking
              if (ct.status === 'rejected' && lt.status === 'pending' && user?.email) {
                try {
                  const refundAmt = Number(lt.amount) + Number(lt.fee || 0);
                  if (refundAmt > 0) {
                    const bankAccts = getBankAccounts(user.email);
                    const checking = bankAccts.find((a: any) => a.type === 'Checking') || bankAccts[0];
                    if (checking) {
                      checking.balance = Math.round((checking.balance + refundAmt) * 100) / 100;
                      checking.recentActivity = `Refund: rejected transfer ${lt.reference}`;
                      checking.transactions = [{ id: 'refund-' + Date.now(), type: 'credit', description: `Refund: rejected transfer ${lt.reference}`, amount: refundAmt, date: new Date().toISOString(), status: 'completed' }, ...(Array.isArray(checking.transactions) ? checking.transactions : [])];
                      saveBankAccounts(bankAccts, user.email);
                      const totalBal = bankAccts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
                      cloudUpdateBalance(user.email, totalBal, bankAccts).catch(() => {});
                    }
                  }
                } catch {}
              }
              return { ...lt, status: ct.status };
            }
            return lt;
          });

          // Pull cloud-only transfers (admin credits/debits) into local history
          const cloudOnly = cloudTxs.filter((ct: any) => !localIds.has(ct.id));
          if (cloudOnly.length > 0) {
            changed = true;
            for (const ct of cloudOnly) {
              updated.unshift({
                id: ct.id,
                reference: ct.reference,
                recipientName: ct.recipient_name,
                toAccountId: ct.recipient_account || '',
                amount: ct.amount,
                currency: ct.currency,
                type: ct.type,
                status: ct.status,
                description: ct.description,
                createdAt: ct.created_at,
                fee: ct.fee || 0,
                country: ct.country || '',
                bankName: ct.bank_name || '',
              });
            }
            // Sort by date descending
            updated.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }

          if (changed) {
            saveTransfers(updated, user?.email);
            // Reconcile local balance with cloud when new admin debits/credits arrive
            if (cloudOnly.length > 0 && user?.email) {
              cloudLookup(user.email).then(acct => {
                if (acct && typeof acct.balance === 'number') {
                  const bankAccts = getBankAccounts(user.email);
                  const localTotal = bankAccts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
                  if (Math.abs(localTotal - acct.balance) > 0.01) {
                    // Cloud has the correct balance — apply the difference to Checking
                    const checking = bankAccts.find((a: any) => a.type === 'Checking') || bankAccts[0];
                    if (checking) {
                      const diff = acct.balance - localTotal;
                      checking.balance = Math.round((checking.balance + diff) * 100) / 100;
                      // Record the admin operation in the account's transaction list
                      for (const ct of cloudOnly) {
                        const txEntry = {
                          id: ct.id || `admin-${Date.now()}`,
                          type: ct.type === 'credit' ? 'credit' : 'debit',
                          description: ct.description || (ct.type === 'credit' ? 'Admin Credit' : 'Admin Debit'),
                          amount: ct.amount,
                          date: ct.created_at || new Date().toISOString(),
                          status: 'completed',
                        };
                        checking.transactions = [txEntry, ...(Array.isArray(checking.transactions) ? checking.transactions : [])];
                      }
                      checking.recentActivity = cloudOnly[0]?.description || (cloudOnly[0]?.type === 'credit' ? 'Admin Credit' : 'Admin Debit');
                      saveBankAccounts(bankAccts, user.email);
                    }
                  }
                }
              }).catch(() => {});
            }
          }
          setHistory(updated);
        } else {
          setHistory(local);
        }
        setHistoryLoading(false);
      }).catch(() => { setHistory(local); setHistoryLoading(false); });
    } else {
      setHistory(local);
      setHistoryLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitResult(null);
    const isLocal = tab === 'local';
    const amt = parseFloat(isLocal ? localAmount : intlAmount);
    if (!amt || amt <= 0) { setSubmitResult({ ok: false, message: 'Please enter a valid amount.' }); return; }

    // ─── Validation: IBAN/SWIFT/Routing ───
    if (isLocal) {
      if (localRouting) {
        const rv = validateRoutingNumber(localRouting);
        if (!rv.valid) { setSubmitResult({ ok: false, message: rv.error || 'Invalid routing number.' }); return; }
      }
      if (localAccountNum) {
        const av = validateAccountNumber(localAccountNum);
        if (!av.valid) { setSubmitResult({ ok: false, message: av.error || 'Invalid account number.' }); return; }
      }
    } else {
      if (intlIban) {
        const iv = validateIBAN(intlIban);
        if (!iv.valid) { setSubmitResult({ ok: false, message: iv.error || 'Invalid IBAN.' }); return; }
      }
      if (intlSwift) {
        const sv = validateSWIFT(intlSwift);
        if (!sv.valid) { setSubmitResult({ ok: false, message: sv.error || 'Invalid SWIFT/BIC.' }); return; }
      }
    }

    // ─── Frozen / Blocked account check ───
    if (typeof window !== 'undefined' && user?.email) {
      try {
        const raw = localStorage.getItem('londway_accounts');
        if (raw) {
          const acct = JSON.parse(raw).find((a: any) => a.email === user.email);
          if (acct?.frozen) { setSubmitResult({ ok: false, message: 'Your account is frozen. Transfers are disabled. Please contact support.' }); return; }
          if (acct?.blocked) { setSubmitResult({ ok: false, message: 'Your account is blocked. Transactions are disabled. Please contact support.' }); return; }
        }
      } catch {}
    }

    // ─── Balance sufficiency check ───
    if (user?.email) {
      const bankAccts = getBankAccounts(user.email);
      const totalBalance = bankAccts.reduce((sum: number, a: any) => sum + (a.balance ?? 0), 0);
      if (amt > totalBalance) {
        setSubmitResult({ ok: false, message: `Insufficient balance. Available: $${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Please fund your account first.` });
        return;
      }
    }

    // ─── Tier limit enforcement ───
    if (amt > tierLimits.perTxLimit) {
      setSubmitResult({ ok: false, message: `Your ${tierLimits.tier} account allows a maximum of $${tierLimits.perTxLimit.toLocaleString()} per transaction. Upgrade your tier to send more.` });
      return;
    }
    const freshDaily = user?.email ? getDailyUsage(user.email) : dailyUsed;
    if (freshDaily + amt > tierLimits.dailyTransferLimit) {
      const remaining = Math.max(0, tierLimits.dailyTransferLimit - freshDaily);
      setSubmitResult({ ok: false, message: `Daily limit reached. You have $${remaining.toLocaleString()} remaining today (${tierLimits.tier} limit: $${tierLimits.dailyTransferLimit.toLocaleString()}).` });
      return;
    }
    if (!isLocal && !tierLimits.intlAllowed) {
      setSubmitResult({ ok: false, message: `International wires require a Silver tier or above. Your current tier is ${tierLimits.tier}.` });
      return;
    }

    // ─── Build review data and show confirmation screen ───
    const fee = isLocal ? (amt >= 1000 ? 15 : 0) : 35;
    const fx = (!isLocal && intlCurrency !== 'USD') ? convertAmount(amt, 'USD', intlCurrency) : null;

    setReviewData({
      type: tab,
      recipientName: isLocal ? localRecipient : intlName,
      routingNumber: isLocal ? localRouting : undefined,
      accountNumber: isLocal ? localAccountNum : undefined,
      iban: isLocal ? undefined : intlIban,
      swift: isLocal ? undefined : intlSwift,
      bankName: isLocal ? localBankName : intlBankName,
      country: isLocal ? 'United States' : intlCountry,
      amount: amt,
      currency: isLocal ? 'USD' : intlCurrency,
      memo: isLocal ? localMemo : intlMemo,
      fee,
      fxRate: fx?.rate,
      convertedAmount: fx?.converted,
      fxFee: fx?.fee,
      total: amt + fee + (fx?.fee || 0),
    });
    setShowReview(true);
  }

  function confirmTransfer() {
    if (!reviewData) return;

    // Check if user has a PIN — require PIN gate
    let userPin: string | undefined;
    if (typeof window !== 'undefined' && user?.email) {
      try {
        const raw = localStorage.getItem('londway_accounts');
        if (raw) {
          const acct = JSON.parse(raw).find((a: any) => a.email === user.email);
          userPin = acct?.pin;
        }
      } catch {}
    }

    const doTransfer = async () => {
      setLoading(true);
      setShowReview(false);
      const isLocal = reviewData.type === 'local';

      // ─── Create in core ledger ───
      const checkingAcct = user?.email ? (getBankAccounts(user.email).find((a: any) => a.type === 'Checking') || getBankAccounts(user.email)[0]) : null;

      const ledgerTx = createTransaction({
        type: isLocal ? 'local_transfer' : 'international_wire',
        amount: reviewData.amount,
        currency: reviewData.currency,
        description: reviewData.memo || (isLocal ? 'Local Transfer' : 'International Wire'),
        senderAccountId: checkingAcct?.id || 'checking',
        senderAccountName: checkingAcct?.name || 'Primary Checking',
        senderEmail: user?.email || '',
        senderName: user?.name || '',
        recipientAccountId: reviewData.iban || reviewData.accountNumber || 'external',
        recipientAccountName: reviewData.iban || reviewData.accountNumber || reviewData.recipientName,
        recipientName: reviewData.recipientName,
        recipientBankName: reviewData.bankName,
        iban: reviewData.iban,
        swift: reviewData.swift,
        routingNumber: reviewData.routingNumber,
        country: reviewData.country,
        transferType: reviewData.type,
        fee: reviewData.fee + (reviewData.fxFee || 0),
        fxRate: reviewData.fxRate,
        fxFromCurrency: reviewData.fxRate ? 'USD' : undefined,
        fxToCurrency: reviewData.fxRate ? reviewData.currency : undefined,
        convertedAmount: reviewData.convertedAmount,
      });

      // ─── Also save to legacy store for backward compat ───
      const legacyTransfer: any = {
        id: ledgerTx.id,
        recipientName: reviewData.recipientName,
        toAccountId: reviewData.iban || reviewData.accountNumber || (reviewData.swift || ''),
        amount: reviewData.amount,
        currency: reviewData.currency,
        type: reviewData.type,
        status: 'pending',
        reference: ledgerTx.reference,
        description: reviewData.memo || (isLocal ? 'Local Transfer' : 'International Wire'),
        createdAt: new Date().toISOString(),
        fee: reviewData.fee + (reviewData.fxFee || 0),
        ...(reviewData.country ? { country: reviewData.country } : {}),
        ...(reviewData.bankName ? { bankName: reviewData.bankName } : {}),
      };
      const all = getTransfers(user?.email);
      all.unshift(legacyTransfer);
      saveTransfers(all, user?.email);

      // ─── Sync to Supabase for cross-device admin access ───
      const cloudOk = await cloudSaveTransfer({
        id: ledgerTx.id,
        reference: ledgerTx.reference,
        sender_email: user?.email || '',
        sender_name: user?.name || '',
        recipient_name: reviewData.recipientName,
        recipient_account: reviewData.iban || reviewData.accountNumber || '',
        amount: reviewData.amount,
        currency: reviewData.currency,
        fee: reviewData.fee + (reviewData.fxFee || 0),
        type: reviewData.type,
        status: 'pending',
        description: reviewData.memo || (isLocal ? 'Local Transfer' : 'International Wire'),
        country: reviewData.country || '',
        bank_name: reviewData.bankName || '',
        created_at: new Date().toISOString(),
      });
      if (!cloudOk) {
        console.warn('[transfer] Cloud sync failed — transfer saved locally only');
      }

      // Deduct from checking and sync to cloud
      if (user?.email) {
        const bankAccts = getBankAccounts(user.email);
        const checking = bankAccts.find((a: any) => a.type === 'Checking') || bankAccts[0];
        if (checking) {
          checking.balance = Math.round(Math.max(0, checking.balance - reviewData.total) * 100) / 100;
          checking.recentActivity = `Transfer hold: -$${reviewData.total.toFixed(2)} → ${reviewData.recipientName}`;
          saveBankAccounts(bankAccts, user.email);
          // Sync deducted balance to cloud so it persists across devices/reloads
          const totalBal = bankAccts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
          cloudUpdateBalance(user.email, totalBal, bankAccts).catch(() => {});
        }
      }

      // Track daily usage
      if (user?.email) {
        addDailyUsage(user.email, reviewData.amount);
        setDailyUsed(d => d + reviewData.amount);
      }

      // Send notification email (receipt is only sent after admin approval)
      let emailSent = false;
      if (user?.email) {
        try {
          const notifRes = await sendTransferNotification(user.email, user.name || 'Valued Client', ledgerTx.reference, reviewData.amount, reviewData.currency, reviewData.recipientName, reviewData.type);
          emailSent = notifRes.success;
        } catch { emailSent = false; }

        const notifs = getNotifications(user.email);
        notifs.unshift({
          id: 'notif-' + Date.now(),
          message: `📋 Transfer Receipt — ${reviewData.currency} ${reviewData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} to ${reviewData.recipientName}. Ref: ${ledgerTx.reference}. Status: Pending Review.${emailSent ? ` A confirmation email has been sent to ${user.email}.` : ''}`,
          type: 'success',
          date: new Date().toISOString(),
          read: false,
        });
        saveNotifications(notifs, user.email);
      }

      setSubmitResult({ ok: true, message: `Transfer submitted — awaiting admin approval. You will be notified once approved.${reviewData.fee > 0 ? ` Wire fee: $${reviewData.fee.toFixed(2)}` : ''}${reviewData.fxRate ? ` FX Rate: 1 USD = ${reviewData.fxRate} ${reviewData.currency}` : ''}`, ref: ledgerTx.reference });
      setLocalRecipient(''); setLocalRouting(''); setLocalAccountNum(''); setLocalBankName(''); setLocalAmount(''); setLocalMemo('');
      setIntlName(''); setIntlIban(''); setIntlSwift(''); setIntlBankName(''); setIntlCountry(''); setIntlCurrency('EUR'); setIntlAmount(''); setIntlMemo('');
      setReviewData(null);
      fetchHistory();
      setLoading(false);
    };

    if (userPin) {
      setPinInput('');
      setPinError('');
      setPendingSubmit(() => doTransfer);
      setShowPinModal(true);
    } else {
      doTransfer();
    }
  }

  const handleReceiptDownload = (tx: Transfer) => {
    downloadReceiptFromLegacy(tx, user?.name || 'Client', user?.email || '');
  };

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, borderRadius: 10, padding: '11px 14px', color: colors.text, fontSize: '0.93rem', outline: 'none', fontFamily: 'Inter, sans-serif' };
  const lbl: React.CSSProperties = { display: 'block', color: colors.textMuted, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 };
  const errS: React.CSSProperties = { color: '#ff4d4f', fontSize: '0.72rem', marginTop: 4, fontWeight: 600 };
  const validS: React.CSSProperties = { color: '#50C878', fontSize: '0.72rem', marginTop: 4, fontWeight: 600 };

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      <Head>
        <title>Transfers — Londway Capital | Send Money Worldwide</title>
        <meta name="description" content="Send money locally and internationally with Londway Capital. Near-instant transfers in 195 currencies with institutional-grade security." />
      </Head>

      {/* PIN Gate Modal */}
      {showPinModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: colors.overlayBg, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: colors.surface, border: `1px solid ${colors.inputBorder}`, borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 340, boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔐</div>
              <h3 style={{ color: colors.text, fontWeight: 700, fontSize: '1.08rem', margin: '0 0 6px' }}>Authorize Transfer</h3>
              <p style={{ color: colors.textFaint, fontSize: '0.8rem', margin: 0 }}>Enter your 4-digit PIN to confirm</p>
            </div>
            {pinError && (
              <div style={{ background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.2)', borderRadius: 8, padding: '0.5rem 1rem', color: '#ff7875', fontSize: '0.82rem', marginBottom: 12, textAlign: 'center' }}>⚠ {pinError}</div>
            )}
            {/* PIN dots */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 20 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < pinInput.length ? colors.gold : 'transparent', border: `2px solid ${i < pinInput.length ? colors.gold : colors.border}`, transition: 'all 0.15s' }} />
              ))}
            </div>
            {/* Numpad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 220, margin: '0 auto 20px' }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
                d === '' ? <div key={i} /> :
                <button key={i} type="button" onClick={() => {
                  if (d === '⌫') setPinInput(p => p.slice(0, -1));
                  else if (pinInput.length < 4) setPinInput(p => p + d);
                }} style={{ padding: '14px 0', borderRadius: 10, border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: d === '⌫' ? colors.textMuted : colors.text, fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{d}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowPinModal(false); setPendingSubmit(null); }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${colors.inputBorder}`, background: 'transparent', color: colors.gold, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={() => {
                let userPin = '';
                if (typeof window !== 'undefined' && user?.email) {
                  try { const raw = localStorage.getItem('londway_accounts'); if (raw) { const a = JSON.parse(raw).find((x: any) => x.email === user.email); userPin = a?.pin || ''; } } catch {}
                }
                if (pinInput !== userPin) { setPinError('Incorrect PIN. Try again.'); setPinInput(''); return; }
                setShowPinModal(false);
                setPinError('');
                if (pendingSubmit) { pendingSubmit(); setPendingSubmit(null); }
              }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})`, color: theme === 'dark' ? colors.bg : '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Confirm →</button>
            </div>
          </div>
        </div>
      )}
      {/* Review / Confirmation Modal */}
      {showReview && reviewData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: colors.overlayBg, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: colors.surface, border: `1px solid ${colors.inputBorder}`, borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 480, boxShadow: '0 30px 80px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
              <h3 style={{ color: colors.text, fontWeight: 700, fontSize: '1.15rem', margin: '0 0 6px' }}>Review Your Transfer</h3>
              <p style={{ color: colors.textFaint, fontSize: '0.8rem', margin: 0 }}>Please verify all details before confirming</p>
            </div>
            {/* Amount highlight */}
            <div style={{ textAlign: 'center', background: colors.goldBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ color: colors.textMuted, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>TOTAL AMOUNT</div>
              <div style={{ color: colors.gold, fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>
                ${reviewData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span style={{ fontSize: '0.9rem', color: colors.textMuted }}>USD</span>
              </div>
              {reviewData.fxRate && (
                <div style={{ color: colors.textFaint, fontSize: '0.78rem', marginTop: 6 }}>
                  ≈ {reviewData.currency} {reviewData.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} at {reviewData.fxRate} rate
                </div>
              )}
            </div>
            {/* Detail rows */}
            <div style={{ background: colors.inputBg, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden', marginBottom: '1.5rem' }}>
              {[
                ['Type', reviewData.type === 'local' ? '🏦 Domestic Transfer' : '🌍 International Wire'],
                ['Recipient', reviewData.recipientName],
                ...(reviewData.routingNumber ? [['Routing Number', reviewData.routingNumber]] : []),
                ...(reviewData.accountNumber ? [['Account Number', reviewData.accountNumber]] : []),
                ...(reviewData.iban ? [['IBAN', reviewData.iban]] : []),
                ...(reviewData.swift ? [['SWIFT/BIC', reviewData.swift]] : []),
                ...(reviewData.bankName ? [['Bank', reviewData.bankName]] : []),
                ['Country', reviewData.country],
                ['Transfer Amount', `$${reviewData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
                ...(reviewData.fee > 0 ? [['Wire Fee', `$${reviewData.fee.toFixed(2)}`]] : []),
                ...(reviewData.fxFee ? [['FX Spread Fee', `$${reviewData.fxFee.toFixed(2)}`]] : []),
                ...(reviewData.fxRate ? [['Exchange Rate', `1 USD = ${reviewData.fxRate} ${reviewData.currency}`]] : []),
                ...(reviewData.memo ? [['Reference/Memo', reviewData.memo]] : []),
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${colors.border}`, background: i % 2 === 0 ? 'transparent' : `${colors.gold}06` }}>
                  <span style={{ color: colors.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>{label}</span>
                  <span style={{ color: colors.text, fontSize: '0.8rem', fontWeight: 700, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}
            </div>
            {/* Warning */}
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: '1.5rem', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '1rem' }}>⚠</span>
              <span style={{ color: '#F59E0B', fontSize: '0.78rem', lineHeight: 1.5 }}>By confirming, you authorize Londway Capital to debit <strong>${reviewData.total.toFixed(2)}</strong> from your Primary Checking account. This transfer is subject to compliance review.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowReview(false)} style={{ flex: 1, padding: '13px', borderRadius: 12, border: `1px solid ${colors.inputBorder}`, background: 'transparent', color: colors.gold, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem' }}>← Edit</button>
              <button onClick={confirmTransfer} disabled={loading} style={{ flex: 2, padding: '13px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})`, color: theme === 'dark' ? colors.bg : '#fff', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem' }}>
                {loading ? 'Processing…' : 'Confirm & Send →'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hero */}
      <div style={{ background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.bg} 100%)`, borderBottom: `1px solid ${colors.border}`, padding: 'clamp(1.2rem, 3vw, 3rem) clamp(1rem, 3vw, 2rem) clamp(1rem, 2vw, 2.5rem)', position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%)', opacity: 0.05, pointerEvents: 'none' }} width="320" height="110" viewBox="0 0 320 110">
          <circle cx="50" cy="55" r="35" fill="none" stroke="#C4A052" strokeWidth="1.2"/><circle cx="50" cy="55" r="20" fill="none" stroke="#C4A052" strokeWidth="0.7"/>
          <line x1="88" y1="55" x2="232" y2="55" stroke="#C4A052" strokeWidth="1" strokeDasharray="6 4"/>
          <polygon points="232,49 246,55 232,61" fill="#C4A052"/>
          <circle cx="270" cy="55" r="35" fill="none" stroke="#C4A052" strokeWidth="1.2"/><circle cx="270" cy="55" r="20" fill="none" stroke="#C4A052" strokeWidth="0.7"/>
        </svg>
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: colors.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, boxShadow: `0 0 8px ${colors.gold}` }}/>SECURE TRANSFERS
          </div>
          <h1 style={{ color: colors.text, fontWeight: 800, fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>Transfer Funds</h1>
          <p style={{ color: colors.textFaint, fontSize: '0.88rem' }}>Local &amp; international wire transfers · IBAN/SWIFT validated · Compliance reviewed before release</p>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: 'clamp(1.2rem, 3vw, 2.5rem) clamp(0.8rem, 2vw, 1.5rem)' }}>
        <div className="transfer-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: '2rem', alignItems: 'start' }}>

          {/* Form */}
          <div style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, padding: '2rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: '1.8rem', background: colors.inputBg, borderRadius: 12, padding: 4, border: `1px solid ${colors.border}` }}>
              {(['local', 'international'] as TransferType[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setSubmitResult(null); }} style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'Inter, sans-serif', fontSize: '0.88rem', transition: 'all 0.2s', background: tab === t ? `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})` : 'transparent', color: tab === t ? (theme === 'dark' ? colors.bg : '#fff') : colors.textFaint }}>
                  {t === 'local' ? '🏦 Local Transfer' : '🌍 International Wire'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {tab === 'local' ? (
                <>
                  <div style={{ marginBottom: 16 }}><label style={lbl}>Recipient Name</label><input style={inp} value={localRecipient} onChange={e => setLocalRecipient(e.target.value)} placeholder="Full name" required /></div>
                  <div className="transfer-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={lbl}>ABA Routing Number</label>
                      <input style={{ ...inp, borderColor: routingError ? '#ff4d4f' : localRouting.length >= 9 && !routingError ? '#50C878' : colors.inputBorder }} value={localRouting} onChange={e => setLocalRouting(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="9 digits" maxLength={9} />
                      {routingError && <div style={errS}>⚠ {routingError}</div>}
                      {localRouting.length === 9 && !routingError && <div style={validS}>✓ Valid routing number</div>}
                    </div>
                    <div>
                      <label style={lbl}>Account Number</label>
                      <input style={{ ...inp, borderColor: acctNumError ? '#ff4d4f' : localAccountNum.length >= 4 && !acctNumError ? '#50C878' : colors.inputBorder }} value={localAccountNum} onChange={e => setLocalAccountNum(e.target.value.replace(/\D/g, '').slice(0, 17))} placeholder="4-17 digits" maxLength={17} />
                      {acctNumError && <div style={errS}>⚠ {acctNumError}</div>}
                      {localAccountNum.length >= 4 && !acctNumError && <div style={validS}>✓ Valid account number</div>}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={lbl}>Amount (USD)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.gold, fontWeight: 700 }}>$</span>
                      <input style={{ ...inp, paddingLeft: 26 }} type="number" min="1" step="0.01" value={localAmount} onChange={e => setLocalAmount(e.target.value)} placeholder="0.00" required />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {QUICK.map(a => <button key={a} type="button" onClick={() => setLocalAmount(String(a))} style={{ background: localAmount === String(a) ? colors.goldBg : colors.inputBg, border: `1px solid ${localAmount === String(a) ? colors.gold : colors.border}`, color: localAmount === String(a) ? colors.gold : colors.textMuted, borderRadius: 7, padding: '4px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>${a >= 1000 ? (a/1000)+'k' : a}</button>)}
                    </div>
                    {parseFloat(localAmount) >= 1000 && <div style={{ color: colors.textFaint, fontSize: '0.75rem', marginTop: 6 }}>💡 Wire fee: $15.00 for transfers ≥ $1,000</div>}
                  </div>
                  <div style={{ marginBottom: 16 }}><label style={lbl}>Bank Name</label><input style={inp} value={localBankName} onChange={e => setLocalBankName(e.target.value)} placeholder="e.g. Chase, Bank of America" /></div>
                  <div style={{ marginBottom: 20 }}><label style={lbl}>Memo (Optional)</label><input style={inp} value={localMemo} onChange={e => setLocalMemo(e.target.value)} placeholder="e.g. Rent for July" /></div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}><label style={lbl}>Beneficiary Name</label><input style={inp} value={intlName} onChange={e => setIntlName(e.target.value)} placeholder="Full legal name" required /></div>
                  <div className="transfer-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={lbl}>IBAN / Account No.</label>
                      <input style={{ ...inp, borderColor: ibanError ? '#ff4d4f' : ibanCountry ? '#50C878' : colors.inputBorder }} value={intlIban} onChange={e => setIntlIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. GB29NWBK60161331926819" />
                      {ibanError && <div style={errS}>⚠ {ibanError}</div>}
                      {ibanCountry && !ibanError && <div style={validS}>✓ Valid IBAN · {ibanCountry}</div>}
                    </div>
                    <div>
                      <label style={lbl}>SWIFT / BIC</label>
                      <input style={{ ...inp, borderColor: swiftError ? '#ff4d4f' : swiftBank ? '#50C878' : colors.inputBorder }} value={intlSwift} onChange={e => setIntlSwift(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. BNPAFRPP" maxLength={11} />
                      {swiftError && <div style={errS}>⚠ {swiftError}</div>}
                      {swiftBank && !swiftError && <div style={validS}>✓ {swiftBank}</div>}
                    </div>
                  </div>
                  <div className="transfer-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div><label style={lbl}>Bank Name</label><input style={inp} value={intlBankName} onChange={e => setIntlBankName(e.target.value)} placeholder="Auto-detected from SWIFT" /></div>
                    <div><label style={lbl}>Country</label>
                      <select style={inp} value={intlCountry} onChange={e => setIntlCountry(e.target.value)} required>
                        <option value="">Select…</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, marginBottom: 16 }}>
                    <div><label style={lbl}>Currency</label>
                      <select style={inp} value={intlCurrency} onChange={e => setIntlCurrency(e.target.value)}>
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label style={lbl}>Amount (USD)</label><input style={inp} type="number" min="1" step="0.01" value={intlAmount} onChange={e => setIntlAmount(e.target.value)} placeholder="0.00" required /></div>
                  </div>
                  {/* FX Conversion Display */}
                  {fxInfo && (
                    <div style={{ background: colors.goldBg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ color: colors.textMuted, fontSize: '0.78rem', fontWeight: 600 }}>Exchange Rate</span>
                        <span style={{ color: colors.gold, fontSize: '0.82rem', fontWeight: 700 }}>1 USD = {fxInfo.rate} {intlCurrency}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ color: colors.textMuted, fontSize: '0.78rem', fontWeight: 600 }}>Recipient Gets</span>
                        <span style={{ color: colors.text, fontSize: '1rem', fontWeight: 800 }}>{intlCurrency} {fxInfo.converted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.textMuted, fontSize: '0.72rem' }}>FX Spread (0.35%)</span>
                        <span style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 600 }}>${fxInfo.fee.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: 20 }}><label style={lbl}>Reference</label><input style={inp} value={intlMemo} onChange={e => setIntlMemo(e.target.value)} placeholder="e.g. Invoice #2024-089" /></div>
                </>
              )}

              <div style={{ background: colors.goldBg, border: `1px solid ${colors.border}`, borderRadius: 9, padding: '9px 13px', marginBottom: 18, display: 'flex', gap: 8, alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: colors.gold }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Transfers are <strong style={{ color: colors.gold }}>pending</strong> until reviewed by Londway compliance (1–2 hrs).</span>
              </div>

              {submitResult && (
                <div style={{ background: submitResult.ok ? 'rgba(80,200,120,0.08)' : 'rgba(255,77,79,0.08)', border: `1px solid ${submitResult.ok ? 'rgba(80,200,120,0.25)' : 'rgba(255,77,79,0.25)'}`, borderRadius: 10, padding: '11px 14px', marginBottom: 16 }}>
                  {submitResult.ok && submitResult.ref && <div style={{ marginBottom: 4, fontSize: '0.8rem' }}><span style={{ color: '#50C878', fontWeight: 700 }}>✓ Submitted</span> · Ref: <strong style={{ color: colors.gold }}>{submitResult.ref}</strong></div>}
                  <p style={{ margin: 0, color: submitResult.ok ? '#50C878' : '#ff4d4f', fontSize: '0.88rem' }}>{submitResult.message}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? colors.goldBg : `linear-gradient(135deg, ${colors.gold}, ${colors.goldDim})`, color: loading ? colors.gold : (theme === 'dark' ? colors.bg : '#fff'), fontWeight: 800, fontSize: '0.97rem', fontFamily: 'Inter, sans-serif', boxShadow: loading ? 'none' : `0 4px 20px ${colors.goldBg}` }}>
                {loading ? 'Submitting…' : `Review ${tab === 'local' ? 'Local' : 'International'} Transfer →`}
              </button>
            </form>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, padding: '1.4rem' }}>
              <h3 style={{ color: colors.gold, fontWeight: 700, fontSize: '0.92rem', margin: '0 0 14px' }}>TRANSFER STATUSES</h3>
              {([['pending','Under compliance review'],['approved','Cleared, funds in transit'],['rejected','Did not pass review'],['completed','Successfully delivered']] as [TransferStatus, string][]).map(([s, desc]) => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                  <StatusBadge status={s} />
                  <span style={{ color: colors.textFaint, fontSize: '0.75rem', textAlign: 'right', maxWidth: 120, lineHeight: 1.3 }}>{desc}</span>
                </div>
              ))}
            </div>
            <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, padding: '1.4rem' }}>
              <h3 style={{ color: colors.gold, fontWeight: 700, fontSize: '0.92rem', margin: '0 0 14px' }}>YOUR LIMITS</h3>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Tier</span>
                  <span style={{ color: tierLimits.color ?? colors.gold, fontWeight: 700, fontSize: '0.8rem' }}>{tierLimits.tier}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Per Transaction</span>
                  <span style={{ color: colors.text, fontWeight: 700, fontSize: '0.8rem' }}>${tierLimits.perTxLimit.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Daily Limit</span>
                  <span style={{ color: colors.text, fontWeight: 700, fontSize: '0.8rem' }}>${tierLimits.dailyTransferLimit.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: colors.textMuted, fontSize: '0.8rem' }}>Used Today</span>
                  <span style={{ color: dailyUsed > 0 ? '#F59E0B' : '#3D9E7A', fontWeight: 700, fontSize: '0.8rem' }}>${dailyUsed.toLocaleString()}</span>
                </div>
                {/* Daily usage progress bar */}
                <div style={{ background: colors.border, borderRadius: 6, height: 6, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 6, background: dailyUsed >= tierLimits.dailyTransferLimit ? '#E05252' : colors.gold, width: `${Math.min(100, (dailyUsed / tierLimits.dailyTransferLimit) * 100)}%`, transition: 'width 0.4s ease' }}/>
                </div>
                <div style={{ color: colors.textFaint, fontSize: '0.72rem', marginTop: 5 }}>${Math.max(0, tierLimits.dailyTransferLimit - dailyUsed).toLocaleString()} remaining today</div>
              </div>
              {!tierLimits.intlAllowed && (
                <div style={{ background: 'rgba(240,59,32,0.07)', border: '1px solid rgba(240,59,32,0.2)', borderRadius: 8, padding: '7px 10px', fontSize: '0.75rem', color: '#F59E0B' }}>⚠ International wires require Silver tier or above.</div>
              )}
            </div>
            <div style={{ background: colors.surface, borderRadius: 18, border: `1px solid ${colors.border}`, padding: '1.4rem' }}>
              <h3 style={{ color: colors.gold, fontWeight: 700, fontSize: '0.92rem', margin: '0 0 14px' }}>WIRE FEES</h3>
              {[['Local ACH / Same-day','Free'],['Local Wire (≥$1k)','$15.00'],['International Wire','$35.00'],['SWIFT Priority','$55.00'],['FX Spread','0.35%']].map(([l, f]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
                  <span style={{ color: colors.textMuted, fontSize: '0.83rem' }}>{l}</span>
                  <span style={{ color: colors.gold, fontWeight: 700, fontSize: '0.83rem' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div id="history" style={{ background: colors.surface, borderRadius: 20, border: `1px solid ${colors.border}`, padding: '2rem', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ color: colors.text, fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Transfer History</h2>
            <button onClick={fetchHistory} style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.gold, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>↻ Refresh</button>
          </div>
          {historyLoading ? (
            <div style={{ textAlign: 'center', color: colors.gold, padding: '2rem' }}>Loading…</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: colors.textFaint }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>⇄</div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No transfers yet. Submit one above.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Reference','Recipient','Type','Amount','Date','Status','Receipt'].map(h => <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: colors.textFaint, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${colors.border}` }}>{h}</th>)}</tr></thead>
                <tbody>
                  {history.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '11px 10px', fontFamily: 'monospace', fontSize: '0.78rem', color: colors.gold }}>{tx.reference}</td>
                      <td style={{ padding: '11px 10px', color: colors.text, fontSize: '0.88rem' }}>{tx.recipientName || tx.toAccountId}</td>
                      <td style={{ padding: '11px 10px' }}><span style={{ background: tx.type === 'international' ? colors.surface2 : colors.goldBg, color: tx.type === 'international' ? colors.textMuted : colors.gold, borderRadius: 5, padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{tx.type}</span></td>
                      <td style={{ padding: '11px 10px', color: colors.text, fontWeight: 700, fontSize: '0.9rem' }}>{tx.currency} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '11px 10px', color: colors.textFaint, fontSize: '0.82rem' }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '11px 10px' }}><StatusBadge status={tx.status} /></td>
                      <td style={{ padding: '11px 10px' }}>
                        <button onClick={() => handleReceiptDownload(tx)} title="Download PDF Receipt" style={{ background: colors.goldBg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: colors.gold, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>📄 PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .transfer-main-grid { grid-template-columns: 1fr !important; }
          .transfer-fields-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
