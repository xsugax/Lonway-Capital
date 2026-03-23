'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getBankAccounts, saveBankAccounts, getCryptoDeposits, saveCryptoDeposits, getNotifications, saveNotifications, getTierLimits } from '../lib/store';
import { sendTransferReceipt } from '../lib/email';

const COINS = [
  { id: 'bitcoin',     symbol: 'BTC', name: 'Bitcoin',  icon: '₿',  color: '#F7931A', address: 'bc1qdpqyxrv428qp4vdlq0hpudmrpmgs5x9qcyhfa5' },
  { id: 'ethereum',    symbol: 'ETH', name: 'Ethereum', icon: 'Ξ',  color: '#627EEA', address: '0x14BeaCB76970C7aD354f35aB1ca21F0e2f826cff' },
  { id: 'tether',      symbol: 'USDT',name: 'Tether',   icon: '₮',  color: '#26A17B', address: '2FbNJXqoyxfXwpe1ycT4FG5bu3RP1vckT7qSWV4zVpMD' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB',      icon: '⬡',  color: '#F0B90B', address: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2' },
  { id: 'solana',      symbol: 'SOL', name: 'Solana',   icon: '◎',  color: '#9945FF', address: '8CRVWJQiVQLDp3nBECKPEhCsZ3KZvq3CpbKrHUC6bfno' },
];

export default function CryptoFunding({ user }: { user: { token: string; email?: string; name?: string } }) {
  const { colors, theme } = useTheme();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [tierAllowed, setTierAllowed] = useState(false);
  const [userTier, setUserTier] = useState('Standard');
  // PIN gate
  const [pinStep, setPinStep] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const usdAmount = cryptoAmount && prices[selectedCoin.id]
    ? (parseFloat(cryptoAmount) * prices[selectedCoin.id]).toFixed(2)
    : '';

  // Fetch live prices from CoinGecko (free, no key)
  useEffect(() => {
    const ids = COINS.map(c => c.id).join(',');
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
      .then(r => r.json())
      .then((data: any) => {
        const p: Record<string, number> = {};
        COINS.forEach(c => { p[c.id] = data[c.id]?.usd ?? 0; });
        setPrices(p);
        setPriceLoading(false);
      })
      .catch(() => {
        // Fallback prices if API is unavailable
        setPrices({ bitcoin: 67000, ethereum: 3500, tether: 1, binancecoin: 580, solana: 175 });
        setPriceError(true);
        setPriceLoading(false);
      });
  }, []);

  // Load tier & deposit history
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.email) {
      try {
        const raw = localStorage.getItem('londway_accounts');
        if (raw) {
          const accts = JSON.parse(raw);
          const acct = accts.find((a: any) => a.email === user.email);
          const tier = acct?.tier || 'Standard';
          setUserTier(tier);
          setTierAllowed(getTierLimits(tier).cryptoAllowed);
        }
      } catch {}
      setDeposits(getCryptoDeposits(user.email));
    }
  }, [user?.email]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(selectedCoin.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [selectedCoin.address]);

  const handleSubmitDeposit = () => {
    if (!cryptoAmount || parseFloat(cryptoAmount) <= 0) return;
    // Frozen / Blocked account check
    if (typeof window !== 'undefined' && user?.email) {
      try {
        const raw = localStorage.getItem('londway_accounts');
        if (raw) {
          const acct = JSON.parse(raw).find((a: any) => a.email === user.email);
          if (acct?.frozen) { setResult({ ok: false, message: 'Your account is frozen. Deposits are disabled. Please contact support.' }); return; }
          if (acct?.blocked) { setResult({ ok: false, message: 'Your account is blocked. Transactions are disabled. Please contact support.' }); return; }
        }
      } catch {}
    }
    setPinStep(true);
    setPin('');
    setPinError('');
  };

  const handleConfirmPin = async () => {
    if (!pin || pin.length < 4) { setPinError('Please enter your PIN.'); return; }
    setPinError('');
    setSubmitting(true);

    // Verify PIN against stored account
    if (typeof window !== 'undefined' && user?.email) {
      try {
        const raw = localStorage.getItem('londway_accounts');
        if (raw) {
          const accts = JSON.parse(raw);
          const acct = accts.find((a: any) => a.email === user.email);
          if (acct && acct.pin !== pin) {
            setPinError('Incorrect PIN. Please try again.');
            setSubmitting(false);
            return;
          }
        }
      } catch {}
    }

    const amt = parseFloat(cryptoAmount);
    const usd = prices[selectedCoin.id] ? amt * prices[selectedCoin.id] : 0;
    const ref = 'CRY-' + Date.now().toString(36).toUpperCase();

    // Credit primary checking account
    if (user?.email) {
      const accounts = getBankAccounts(user.email);
      const primary = accounts.find((a: any) => a.type === 'Checking' || a.name?.toLowerCase().includes('checking')) || accounts[0];
      if (primary) {
        primary.balance = (primary.balance || 0) + usd;
        primary.recentActivity = `+$${usd.toFixed(2)} from ${selectedCoin.symbol} deposit`;
        saveBankAccounts(accounts, user.email);
      }

      // Record crypto deposit
      const deposit = {
        id: 'cd-' + Date.now(),
        coin: selectedCoin.symbol,
        coinName: selectedCoin.name,
        cryptoAmount: amt,
        usdValue: usd,
        reference: ref,
        address: selectedCoin.address,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      const allDeposits = getCryptoDeposits(user.email);
      allDeposits.unshift(deposit);
      saveCryptoDeposits(allDeposits, user.email);
      setDeposits(allDeposits);

      // Add notification
      const notifs = getNotifications(user.email);
      notifs.unshift({ id: 'notif-' + Date.now(), message: `Crypto deposit confirmed: ${amt} ${selectedCoin.symbol} ($${usd.toFixed(2)}) added to your account. Ref: ${ref}`, type: 'success', date: new Date().toISOString(), read: false });
      saveNotifications(notifs, user.email);

      // Send deposit receipt email
      sendTransferReceipt(
        user.email,
        user.name || 'Valued Client',
        ref, usd, 'USD',
        `${user.name || 'Self'} (${selectedCoin.symbol} Deposit)`,
        'local',
        selectedCoin.address,
      ).catch(() => {});

      // Write to per-user transfers for admin visibility
      try {
        const { getTransfers, saveTransfers } = await import('../lib/store');
        const userTransfers = getTransfers(user.email);
        userTransfers.unshift({ id: 'tr-cry-' + Date.now(), type: 'crypto_deposit', recipientName: user.email, amount: usd, currency: 'USD', description: `${amt} ${selectedCoin.symbol} deposit`, reference: ref, status: 'completed', createdAt: new Date().toISOString() });
        saveTransfers(userTransfers, user.email);
      } catch {}
    }

    setResult({ ok: true, message: `Successfully deposited ${amt} ${selectedCoin.symbol} ($${usd.toFixed(2)}) to your checking account. Reference: ${ref}` });
    setPinStep(false);
    setCryptoAmount('');
    setSubmitting(false);
  };

  const surface = { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16 };

  // ── Tier-locked overlay ──
  if (!tierAllowed) {
    return (
      <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 460, width: '100%', margin: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔒</div>
          <h1 style={{ color: colors.gold, fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>Crypto Funding Locked</h1>
          <p style={{ color: colors.textFaint, lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Crypto deposits are available on <strong style={{ color: colors.gold }}>Gold</strong> and <strong style={{ color: '#E5E4E2' }}>Platinum</strong> accounts.<br/>
            Your current tier is <strong style={{ color: colors.text }}>{userTier}</strong>.
          </p>
          <div style={{ background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ color: colors.gold, fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>UPGRADE YOUR ACCOUNT</div>
            <div style={{ color: colors.textFaint, fontSize: '0.82rem' }}>Contact your relationship manager or visit a branch to upgrade to Gold or Platinum tier and unlock crypto funding, higher transfer limits, and more.</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${colors.border}`, padding: 'clamp(1.2rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2rem) clamp(1rem, 2vw, 2rem)' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 40% 80% at 5% 50%, ${colors.goldBg} 0%, transparent 70%)`, pointerEvents: 'none' }}/>
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: colors.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, boxShadow: `0 0 8px ${colors.gold}` }}/>
            CRYPTO FUNDING · {userTier.toUpperCase()}
          </div>
          <h1 style={{ color: colors.text, fontWeight: 800, fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>Fund with Cryptocurrency</h1>
          <p style={{ color: colors.textFaint, fontSize: '0.9rem', maxWidth: 540 }}>
            Deposit Bitcoin, Ethereum, USDT, BNB, or Solana. Funds are instantly converted and credited to your Primary Checking account.
          </p>
          {priceError && <div style={{ marginTop: '0.75rem', color: '#F59E0B', fontSize: '0.75rem' }}>⚠ Using cached prices — live data temporarily unavailable.</div>}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)' }}>
        <div className="crypto-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,380px)', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Left: deposit form ── */}
          <div>
            {/* Coin selector */}
            <div style={{ ...surface, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', color: colors.textFaint, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Select Cryptocurrency</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {COINS.map(coin => (
                  <button
                    key={coin.id}
                    onClick={() => { setSelectedCoin(coin); setCryptoAmount(''); setResult(null); }}
                    style={{
                      padding: '0.6rem 1.1rem', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.18s',
                      background: selectedCoin.id === coin.id ? `${coin.color}18` : colors.surface,
                      border: `1.5px solid ${selectedCoin.id === coin.id ? coin.color : colors.border}`,
                      color: selectedCoin.id === coin.id ? coin.color : colors.textFaint,
                    }}
                  >
                    <span style={{ marginRight: 5 }}>{coin.icon}</span>{coin.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet address */}
            <div style={{ ...surface, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', color: colors.textFaint, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                {selectedCoin.name} Deposit Address
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '1.4rem', minWidth: 28, textAlign: 'center', color: selectedCoin.color }}>{selectedCoin.icon}</span>
                <code style={{ flex: 1, fontSize: '0.78rem', color: colors.text, wordBreak: 'break-all', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
                  {selectedCoin.address}
                </code>
                <button
                  onClick={handleCopy}
                  style={{ flexShrink: 0, padding: '0.4rem 0.9rem', background: copied ? 'rgba(61,158,122,0.15)' : colors.goldBg, border: `1px solid ${copied ? 'rgba(61,158,122,0.4)' : colors.borderStrong}`, borderRadius: 8, color: copied ? '#3D9E7A' : colors.gold, fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: colors.textFaint }}>
                Only send <strong style={{ color: selectedCoin.color }}>{selectedCoin.symbol}</strong> to this address. Sending another coin may result in permanent loss.
              </div>
            </div>

            {/* Amount input */}
            <div style={{ ...surface, padding: '1.5rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', color: colors.textFaint, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Deposit Amount</div>
              <div className="crypto-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: colors.textFaint, marginBottom: 5 }}>{selectedCoin.symbol} Amount</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: selectedCoin.color, fontWeight: 700, fontSize: '1rem' }}>{selectedCoin.icon}</span>
                    <input
                      type="number" min="0" step="any" placeholder="0.00"
                      value={cryptoAmount} onChange={e => { setCryptoAmount(e.target.value); setResult(null); }}
                      style={{ width: '100%', boxSizing: 'border-box', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '0.75rem 0.75rem 0.75rem 2.4rem', color: colors.text, fontSize: '1rem', fontWeight: 600, outline: 'none' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: colors.textFaint, marginBottom: 5 }}>USD Equivalent</label>
                  <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', height: '100%', boxSizing: 'border-box' }}>
                    <span style={{ color: colors.gold, fontWeight: 700, fontSize: '1rem' }}>
                      {priceLoading ? '—' : usdAmount ? `$${parseFloat(usdAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                    </span>
                  </div>
                </div>
              </div>
              {prices[selectedCoin.id] > 0 && (
                <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color: colors.textFaint }}>
                  1 {selectedCoin.symbol} = ${prices[selectedCoin.id].toLocaleString()} USD
                </div>
              )}
            </div>

            {/* Result message */}
            {result && (
              <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', borderRadius: 12, background: result.ok ? 'rgba(61,158,122,0.1)' : 'rgba(220,60,60,0.1)', border: `1px solid ${result.ok ? 'rgba(61,158,122,0.3)' : 'rgba(220,60,60,0.3)'}`, color: result.ok ? '#3D9E7A' : '#E05252', fontSize: '0.88rem', fontWeight: 600 }}>
                {result.ok ? '✓ ' : '✗ '}{result.message}
              </div>
            )}

            {/* Submit button */}
            <button
              disabled={!cryptoAmount || parseFloat(cryptoAmount) <= 0 || priceLoading}
              onClick={handleSubmitDeposit}
              style={{ width: '100%', padding: '1rem', background: (!cryptoAmount || parseFloat(cryptoAmount) <= 0) ? colors.surface : colors.gold, border: 'none', borderRadius: 12, color: (!cryptoAmount || parseFloat(cryptoAmount) <= 0) ? colors.textFaint : (theme === 'dark' ? '#060913' : '#fff'), fontWeight: 800, fontSize: '1rem', cursor: (!cryptoAmount || parseFloat(cryptoAmount) <= 0) ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              Confirm Deposit →
            </button>
          </div>

          {/* ── Right: live prices + history ── */}
          <div>
            {/* Live prices */}
            <div style={{ ...surface, padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', color: colors.textFaint, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Live Prices</div>
              {COINS.map(coin => (
                <div key={coin.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem', color: coin.color }}>{coin.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{coin.symbol}</div>
                      <div style={{ fontSize: '0.7rem', color: colors.textFaint }}>{coin.name}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: colors.gold, fontSize: '0.9rem' }}>
                    {priceLoading ? '—' : prices[coin.id] ? `$${prices[coin.id].toLocaleString()}` : 'N/A'}
                  </div>
                </div>
              ))}
            </div>

            {/* Deposit history */}
            <div style={{ ...surface, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.7rem', color: colors.textFaint, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Recent Deposits</div>
              {deposits.length === 0 ? (
                <div style={{ color: colors.textFaint, fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>No deposits yet.</div>
              ) : (
                deposits.slice(0, 8).map((d: any) => (
                  <div key={d.id} style={{ padding: '0.75rem 0', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: colors.text }}>{d.cryptoAmount} {d.coin}</div>
                      <div style={{ fontSize: '0.7rem', color: colors.textFaint, marginTop: 2 }}>
                        {new Date(d.createdAt).toLocaleDateString()} · {d.reference}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#3D9E7A', fontWeight: 700, fontSize: '0.85rem' }}>+${d.usdValue.toFixed(2)}</div>
                      <div style={{ fontSize: '0.68rem', background: 'rgba(61,158,122,0.1)', color: '#3D9E7A', borderRadius: 5, padding: '1px 6px', display: 'inline-block', marginTop: 2 }}>{d.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── PIN Gate Modal ── */}
      {pinStep && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,9,19,0.88)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: colors.navBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 360, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
            <h2 style={{ color: colors.gold, fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.5rem' }}>Confirm with PIN</h2>
            <p style={{ color: colors.textFaint, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Depositing <strong style={{ color: selectedCoin.color }}>{cryptoAmount} {selectedCoin.symbol}</strong>
              {usdAmount && <> ≈ <strong style={{ color: colors.gold }}>${parseFloat(usdAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></>}
            </p>
            <input
              type="password" placeholder="Enter PIN" maxLength={8}
              value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleConfirmPin()}
              style={{ width: '100%', boxSizing: 'border-box', background: colors.bg, border: `1px solid ${pinError ? '#E05252' : colors.border}`, borderRadius: 10, padding: '0.75rem 1rem', color: colors.text, fontSize: '1.2rem', letterSpacing: '0.25em', textAlign: 'center', outline: 'none', marginBottom: pinError ? '0.5rem' : '1.25rem' }}
              autoFocus
            />
            {pinError && <div style={{ color: '#E05252', fontSize: '0.8rem', marginBottom: '1rem' }}>{pinError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setPinStep(false); setPinError(''); }} style={{ flex: 1, padding: '0.75rem', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, color: colors.text, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmPin} disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: colors.gold, border: 'none', borderRadius: 10, color: theme === 'dark' ? '#060913' : '#fff', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
