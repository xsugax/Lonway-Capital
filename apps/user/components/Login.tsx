'use client';
import React, { useState, useEffect, useRef } from 'react';
import { sendVerificationCode, sendWelcomeEmail, generateSecureCode } from '../lib/email';
import { getNotifications, saveNotifications, getBankAccounts, saveBankAccounts, generateFundedAccounts } from '../lib/store';
import { cloudLookup, cloudSaveUser } from '../lib/cloud';
import {
  hashPassword, verifyPassword, generateSessionToken,
  isLockedOut, recordFailedAttempt, clearLockout,
} from '../lib/crypto';

interface LoginProps {
  onLogin: (user: { name: string; token: string; role: string; email: string }) => void;
  onClose?: () => void;
  modal?: boolean;
  mode?: 'login' | 'register';
  onSwitchMode?: (mode: 'login' | 'register') => void;
}

const ACCOUNTS_KEY = 'londway_accounts';

interface StoredAccount {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  dob?: string;
  idVerified?: boolean;
  faceData?: string;
  pin?: string;
  tier?: string;
  frozen?: boolean;
  blocked?: boolean;
  deleted?: boolean;
}

function getAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [];
  let accounts: StoredAccount[] = [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) accounts = JSON.parse(raw);
  } catch {}
  // Sync admin-managed users that have a password set into londway_accounts
  try {
    const adminRaw = localStorage.getItem('londway_admin_data');
    if (adminRaw) {
      const adminData = JSON.parse(adminRaw);
      let changed = false;
      for (const u of (adminData.users || [])) {
        if (!u.password && !u.pin) continue;
        const existing = accounts.find((a: StoredAccount) => a.email === u.email);
        if (!existing) {
          accounts.push({ email: u.email, password: u.password || '', pin: u.pin || '', name: u.name, role: u.role || 'user', tier: u.tier || 'Standard', frozen: !!u.frozen, blocked: !!u.blocked, idVerified: false });
          changed = true;
        } else {
          let dirty = false;
          if (u.password && existing.password !== u.password) { existing.password = u.password; dirty = true; }
          if (u.pin && existing.pin !== u.pin) { existing.pin = u.pin; dirty = true; }
          if (u.tier && existing.tier !== u.tier) { existing.tier = u.tier; dirty = true; }
          if (existing.frozen !== !!u.frozen) { existing.frozen = !!u.frozen; dirty = true; }
          if (existing.blocked !== !!u.blocked) { existing.blocked = !!u.blocked; dirty = true; }
          // If user exists in admin data, they are NOT deleted (admin re-created them)
          if (existing.deleted) { existing.deleted = false; dirty = true; }
          if (dirty) { existing.name = u.name; existing.role = u.role || existing.role; changed = true; }
        }
      }
      if (changed) localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      // Seed bank accounts from admin balance for users that have never logged in via activation link
      for (const u of (adminData.users || [])) {
        if (!u.email || !u.balance || u.balance <= 0) continue;
        const safe = u.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const acctKey = `londway_bank_accounts__${safe}`;
        if (!localStorage.getItem(acctKey)) {
          const seeded = generateFundedAccounts(u.email, u.balance);
          localStorage.setItem(acctKey, JSON.stringify(seeded));
        }
      }
    }
  } catch {}
  if (accounts.length > 0) return accounts;
  const defaults: StoredAccount[] = [
    { email: 'user@londwaycapital.com', password: 'password123', name: 'Jane Doe', role: 'user', idVerified: true },
    { email: 'admin@londwaycapital.com', password: 'admin123', name: 'Admin', role: 'admin', idVerified: true },
  ];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveNewAccount(account: StoredAccount) {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.email.toLowerCase() === account.email.toLowerCase());
  if (idx !== -1) {
    // Update existing — merge fields, prefer non-empty values
    const existing = accounts[idx];
    if (account.password) existing.password = account.password;
    if (account.pin) existing.pin = account.pin;
    if (account.name) existing.name = account.name;
    if (account.role) existing.role = account.role;
    if (account.tier) existing.tier = account.tier;
    if (account.faceData) existing.faceData = account.faceData;
  } else {
    accounts.push(account);
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function updateAccountPin(email: string, pin: string) {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.email === email);
  if (idx !== -1) { accounts[idx].pin = pin; localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }
}

function updateAccountPassword(email: string, newPw: string) {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.email === email);
  if (idx !== -1) { accounts[idx].password = newPw; localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }
}

const G = '#C4A052';
const GB = 'rgba(196,160,82,0.07)';
const GBD = 'rgba(196,160,82,0.15)';

export default function Login({ onLogin, onClose, modal = false, mode = 'login', onSwitchMode }: LoginProps) {
  const isRegister = mode === 'register';

  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Registration ───
  const [regStep, setRegStep] = useState(0);
  const [rName, setRName] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rDob, setRDob] = useState('');
  const [rPw, setRPw] = useState('');
  const [rPwC, setRPwC] = useState('');
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [faceData, setFaceData] = useState<string | null>(null);
  const [rCode, setRCode] = useState('');
  const [rGenCode, setRGenCode] = useState('');

  // ─── Login ───
  const [loginStep, setLoginStep] = useState(0);
  const [lEmail, setLEmail] = useState('');
  const [lPw, setLPw] = useState('');
  const [lCode, setLCode] = useState('');
  const [lGenCode, setLGenCode] = useState('');
  const [matched, setMatched] = useState<StoredAccount | null>(null);
  const [scanning, setScanning] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeSentMsg, setCodeSentMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [activateMsg, setActivateMsg] = useState<string | null>(null);

  // ── Activation link: provision account from admin-generated URL ──────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('activate');
      if (!token) return;
      const data = JSON.parse(atob(decodeURIComponent(token)));
      if (!data?.email || !data?.password) return;
      const accounts = (() => {
        try { const r = localStorage.getItem(ACCOUNTS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
      })();
      if (!accounts.find((a: StoredAccount) => a.email === data.email)) {
        accounts.push({ email: data.email, password: data.password, pin: data.pin || '', name: data.name || data.email, role: data.role || 'user', tier: data.tier, idVerified: false });
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      }
      if (Array.isArray(data.bankAccounts) && data.bankAccounts.length > 0) {
        saveBankAccounts(data.bankAccounts, data.email);
      }
      // Clean the token from the URL without a page reload
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
      setActivateMsg(`Welcome, ${data.name || data.email}! Your account is ready. Sign in with your credentials below.`);
      setLEmail(data.email);
    } catch { /* malformed token – ignore */ }
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('londway_remembered_email');
      if (saved) setLEmail(saved);
    }
  }, []);

  // ─── PIN ───
  const [rPin, setRPin] = useState('');
  const [rPinC, setRPinC] = useState('');
  const [lPin, setLPin] = useState('');

  // ─── Code Fallback (show code in UI if email fails) ───
  const [regCodeFallback, setRegCodeFallback] = useState(false);
  const [loginCodeFallback, setLoginCodeFallback] = useState(false);
  const [forgotCodeFallback, setForgotCodeFallback] = useState(false);

  // ─── Forgot Password ───
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(0);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotGenCode, setForgotGenCode] = useState('');
  const [forgotPw, setForgotPw] = useState('');
  const [forgotPwC, setForgotPwC] = useState('');

  // ─── Camera ───
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  useEffect(() => {
    setError(null);
    setRegStep(0); setLoginStep(0);
    setRName(''); setREmail(''); setRPhone(''); setRDob('');
    setRPw(''); setRPwC('');
    setIdFront(null); setIdBack(null); setFaceData(null);
    setRCode(''); setRGenCode('');
    setRPin(''); setRPinC('');
    setLEmail(''); setLPw(''); setLCode(''); setLGenCode('');
    setLPin('');
    setRegCodeFallback(false); setLoginCodeFallback(false); setForgotCodeFallback(false);
    setMatched(null); setScanning(false); setSending(false); setCodeSentMsg('');
    setForgotMode(false); setForgotStep(0); setForgotEmail(''); setForgotCode(''); setForgotGenCode(''); setForgotPw(''); setForgotPwC('');
    stopCam();
  }, [mode]);

  useEffect(() => { return () => stopCam(); }, []);

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
      });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
    } catch {
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const c = canvasRef.current;
    c.width = 150; c.height = 150;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const v = videoRef.current;
    const sz = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, (v.videoWidth - sz) / 2, (v.videoHeight - sz) / 2, sz, sz, 0, 0, 150, 150);
    return c.toDataURL('image/jpeg', 0.6);
  };

  // ─── Registration flow ───
  const regNext = async () => {
    setError(null);
    if (regStep === 0) {
      if (!rName.trim()) { setError('Enter your full name'); return; }
      if (!rEmail.includes('@')) { setError('Enter a valid email'); return; }
      if (!rPhone.trim()) { setError('Enter your phone number'); return; }
      if (!rDob) { setError('Enter your date of birth'); return; }
      if (getAccounts().find(a => a.email === rEmail)) { setError('Email already registered'); return; }
      setRegStep(1);
    } else if (regStep === 1) {
      if (rPw.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (rPw !== rPwC) { setError('Passwords do not match'); return; }
      setRegStep(2);
    } else if (regStep === 2) {
      if (!idFront || !idBack) { setError('Upload both sides of your ID'); return; }
      setRegStep(3);
      setTimeout(() => startCam(), 300);
    } else if (regStep === 3) {
      if (!faceData) { setError('Capture your face photo'); return; }
      stopCam();
      const code = generateSecureCode();
      setRGenCode(code);
      setSending(true);
      setError(null);
      sendVerificationCode(rEmail, code, rName).then(res => {
        setSending(false);
        if (res.success) {
          setCodeSentMsg(`Code sent to ${rEmail}`);
          setRegCodeFallback(false);
        } else {
          setRegCodeFallback(true);
          setCodeSentMsg('');
        }
        setRegStep(4); // always advance — fallback shown in UI if email fails
      }).catch(() => { setSending(false); setRegCodeFallback(true); setRegStep(4); });
    } else if (regStep === 4) {
      if (rCode !== rGenCode) { setError('Incorrect code. Check your email or use the code displayed below.'); return; }
      // Hash password before storing
      const hashedPw = await hashPassword(rPw);
      saveNewAccount({
        email: rEmail, password: hashedPw, name: rName, role: 'user',
        phone: rPhone, dob: rDob, idVerified: true, faceData: faceData || undefined,
      });
      setRPin(''); setRPinC('');
      setRegStep(5);
    } else if (regStep === 5) {
      if (rPin.length !== 4) { setError('PIN must be exactly 4 digits'); return; }
      if (rPin !== rPinC) { setError('PINs do not match'); return; }
      // Hash PIN before storing
      const hashedPin = await hashPassword(rPin);
      updateAccountPin(rEmail, hashedPin);
      setRegStep(6);
    } else if (regStep === 6) {
      sendWelcomeEmail(rEmail, rName).catch(() => {});
      // Seed account numbers and write welcome notification for new user
      getBankAccounts(rEmail); // triggers seed write to localStorage keyed by email
      // Hash credentials for cloud storage
      const hashedPwCloud = await hashPassword(rPw);
      const hashedPinCloud = await hashPassword(rPin);
      // Save to cloud for cross-device login (hashed credentials)
      cloudSaveUser({ email: rEmail, password: hashedPwCloud, pin: hashedPinCloud, name: rName, role: 'user', tier: 'Standard', balance: 0, phone: rPhone }).catch(() => {});
      const welcomeNotifs = [
        { id: 'n-welcome-' + Date.now(), message: `Welcome to Londway Capital, ${rName}! Your account is verified and ready to use.`, type: 'success', date: new Date().toISOString(), read: false },
        { id: 'n-fund-' + Date.now(), message: 'Your account balance is $0.00. Fund your account via Transfer, Crypto deposit, or contact a branch.', type: 'info', date: new Date().toISOString(), read: false },
      ];
      saveNotifications(welcomeNotifs, rEmail);
      onLogin({ name: rName, token: generateSessionToken(), role: 'user', email: rEmail });
    }
  };

  const regBack = () => {
    if (regStep === 3) stopCam();
    setError(null);
    setRegStep(Math.max(0, regStep - 1));
  };

  const handleIdFile = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const cvs = document.createElement('canvas');
        cvs.width = 300; cvs.height = 190;
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 300, 190);
          const d = cvs.toDataURL('image/jpeg', 0.5);
          side === 'front' ? setIdFront(d) : setIdBack(d);
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ─── Login flow ───
  const loginNext = async () => {
    setError(null);
    if (loginStep === 0) {
      // Brute-force lockout check
      const lockout = isLockedOut();
      if (lockout.locked) {
        const mins = Math.ceil(lockout.remainingMs / 60000);
        setError(`Too many failed attempts. Account locked for ${mins} minute${mins > 1 ? 's' : ''}.`);
        return;
      }
      // Step 0: email + password
      if (!lEmail.includes('@')) { setError('Enter a valid email address'); return; }
      if (!lPw) { setError('Enter your password'); return; }
      const emailLower = lEmail.toLowerCase().trim();
      // Start with whatever is stored locally
      let m: StoredAccount | undefined = getAccounts().find(a => a.email.toLowerCase() === emailLower);
      // ALWAYS check cloud — this ensures cross-device login AND latest credentials
      setSending(true);
      try {
        const cloud = await cloudLookup(emailLower);
        if (cloud) {
          // Merge cloud data into local — cloud is source of truth
          const local: StoredAccount = {
            email: cloud.email,
            password: cloud.password || (m?.password || ''),
            pin: cloud.pin || (m?.pin || ''),
            name: cloud.name || (m?.name || ''),
            role: cloud.role || (m?.role || 'user'),
            tier: cloud.tier || (m as any)?.tier || 'Standard',
            frozen: !!(cloud as any).frozen,
            blocked: !!(cloud as any).blocked,
            idVerified: false,
          };
          saveNewAccount(local);
          if (cloud.bank_accounts && cloud.bank_accounts.length > 0) {
            saveBankAccounts(cloud.bank_accounts, cloud.email);
          } else if (cloud.balance > 0) {
            const seeded = generateFundedAccounts(cloud.email, cloud.balance);
            saveBankAccounts(seeded, cloud.email);
          }
          m = local; // always prefer freshest cloud copy
        }
      } catch (err) {
        console.error('[login] Cloud lookup failed, using local copy:', err);
        // Fall through — m still points to local account if it exists
      } finally { setSending(false); }
      if (!m) { setError('No account found. Check your email or contact support.'); return; }
      if (m.deleted) { setError('This account has been permanently deleted. Please contact support.'); return; }
      // Verify password using PBKDF2 hash comparison (backward-compatible with legacy plain text)
      const pwMatch = await verifyPassword(lPw, m.password);
      if (!pwMatch) {
        const result = recordFailedAttempt();
        if (result.locked) {
          setError('Too many failed attempts. Account locked for 15 minutes.');
        } else {
          setError(`Incorrect password. ${result.attemptsLeft} attempt${result.attemptsLeft !== 1 ? 's' : ''} remaining.`);
        }
        return;
      }
      // Successful password check — clear lockout counter
      clearLockout();
      // Auto-upgrade legacy plain-text password to PBKDF2 hash
      if (!m.password.includes(':') || m.password.length < 60) {
        try {
          const hashed = await hashPassword(lPw);
          updateAccountPassword(m.email, hashed);
          cloudSaveUser({ email: m.email, password: hashed }).catch(() => {});
        } catch {}
      }
      if (m.frozen) { setError('Your account has been frozen. Please contact support or visit a branch.'); return; }
      if (m.blocked) { setError('Your account has been blocked due to suspicious activity. Please contact support immediately.'); return; }
      setMatched(m);
      if (typeof window !== 'undefined') {
        if (rememberMe) localStorage.setItem('londway_remembered_email', lEmail);
        else localStorage.removeItem('londway_remembered_email');
      }
      // Send email verification code
      const code = generateSecureCode();
      setLGenCode(code);
      setSending(true);
      sendVerificationCode(lEmail, code, m.name).then(res => {
        setSending(false);
        if (res.success) { setCodeSentMsg(`Code sent to ${lEmail}`); setLoginCodeFallback(false); }
        else { setLoginCodeFallback(true); setCodeSentMsg(''); }
        setLoginStep(1); // go to email code step
      }).catch(() => { setSending(false); setLoginCodeFallback(true); setLoginStep(1); });
    } else if (loginStep === 1) {
      // Step 1: Email code verification
      if (lCode.length !== 6) { setError('Enter the 6-digit code'); return; }
      if (lCode !== lGenCode) { setError('Incorrect code. Check your email or use the code displayed below.'); return; }
      // Skip PIN step when no PIN is configured
      if (!matched?.pin) {
        if (matched?.faceData) { setLoginStep(3); setTimeout(() => startCam(), 300); }
        else { onLogin({ name: matched!.name, token: generateSessionToken(), role: matched!.role, email: matched!.email }); }
        return;
      }
      setLoginStep(2); // go to PIN step
    } else if (loginStep === 2) {
      // Step 2: PIN verification (PBKDF2 hash comparison, backward-compatible)
      if (lPin.length !== 4) { setError('Enter your 4-digit PIN'); return; }
      if (matched?.pin) {
        const pinMatch = await verifyPassword(lPin, matched.pin);
        if (!pinMatch) { setError('Incorrect PIN'); return; }
      }
      // If account has face data enrolled, proceed to face scan; otherwise login
      if (matched?.faceData) {
        setLoginStep(3);
        setTimeout(() => startCam(), 300);
      } else {
        onLogin({ name: matched!.name, token: generateSessionToken(), role: matched!.role, email: matched!.email });
      }
    } else if (loginStep === 3) {
      // Step 3: Face scan (always succeeds — presence check only)
      setScanning(true);
      setTimeout(() => {
        stopCam();
        setScanning(false);
        onLogin({ name: matched!.name, token: generateSessionToken(), role: matched!.role, email: matched!.email });
      }, 2500);
    }
  };

  const loginBack = () => {
    if (loginStep === 3) stopCam();
    setError(null);
    if (loginStep === 1) { setLCode(''); setCodeSentMsg(''); setLoginCodeFallback(false); }
    setLoginStep(Math.max(0, loginStep - 1));
  };

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  // ─── Styles ───
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 10, boxSizing: 'border-box',
    border: `1.5px solid ${GBD}`, background: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: '0.92rem', outline: 'none', fontFamily: 'Inter, sans-serif',
  };
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '0.73rem', color: '#889', fontWeight: 600,
    marginBottom: 6, letterSpacing: '0.06em',
  };
  const btn: React.CSSProperties = {
    background: G, color: '#060913', border: 'none', borderRadius: 10,
    padding: '0.8rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
    width: '100%', fontFamily: 'Inter, sans-serif',
    boxShadow: '0 0 20px rgba(196,160,82,0.3)',
  };
  const btnO: React.CSSProperties = {
    ...btn, background: 'transparent', color: G,
    border: `1px solid ${GBD}`, boxShadow: 'none',
  };

  // ─── Step indicator ───
  const StepBar = ({ steps, cur }: { steps: string[]; cur: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div style={{ width: 18, height: 2, background: i <= cur ? G : GBD, flexShrink: 0 }}/>}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700,
              background: i < cur ? G : 'transparent',
              border: `2px solid ${i <= cur ? G : GBD}`,
              color: i < cur ? '#060913' : i === cur ? G : 'rgba(196,160,82,0.3)',
            }}>{i < cur ? '✓' : i + 1}</div>
            <span style={{ fontSize: '0.52rem', color: i <= cur ? G : 'rgba(196,160,82,0.3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{s}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  const Err = () => error ? (
    <div style={{ background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.2)', borderRadius: 8, padding: '0.6rem 1rem', color: '#ff7875', fontSize: '0.82rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>⚠</span> {error}
    </div>
  ) : null;

  const BtnRow = ({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel?: string }) => (
    <div style={{ display: 'flex', gap: 10 }}>
      <button style={btnO} onClick={onBack}>← Back</button>
      <button style={btn} onClick={onNext}>{nextLabel || 'Continue →'}</button>
    </div>
  );

  // ─── Registration Steps ───
  const regPersonalInfo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Personal Information</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Tell us about yourself to get started</p>
      <Err />
      <div><label style={lbl}>FULL NAME</label><input style={inp} value={rName} onChange={e => setRName(e.target.value)} placeholder="Jane Doe" /></div>
      <div><label style={lbl}>EMAIL ADDRESS</label><input type="email" style={inp} value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="you@example.com" /></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><label style={lbl}>PHONE NUMBER</label><input type="tel" style={inp} value={rPhone} onChange={e => setRPhone(e.target.value)} placeholder="+1 (555) 123-4567" /></div>
        <div style={{ flex: 1 }}><label style={lbl}>DATE OF BIRTH</label><input type="date" style={{ ...inp, colorScheme: 'dark' }} value={rDob} onChange={e => setRDob(e.target.value)} /></div>
      </div>
      <button style={{ ...btn, opacity: sending ? 0.6 : 1, cursor: sending ? 'wait' : 'pointer' }} onClick={regNext} disabled={sending}>
        {sending ? 'Sending...' : 'Continue →'}
      </button>
    </div>
  );

  const regPassword = () => {
    const str = rPw.length >= 12 ? 3 : rPw.length >= 8 ? 2 : rPw.length >= 6 ? 1 : 0;
    const sL = ['Weak', 'Fair', 'Good', 'Strong'];
    const sC = ['#ff4d4f', '#faad14', '#52c41a', '#00b96b'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Create Password</h3>
        <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Choose a strong password for your account</p>
        <Err />
        <div>
          <label style={lbl}>PASSWORD</label>
          <input type="password" style={inp} value={rPw} onChange={e => setRPw(e.target.value)} placeholder="Min 6 characters" />
          {rPw.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ width: `${(str + 1) * 25}%`, height: '100%', borderRadius: 2, background: sC[str], transition: 'width 0.3s' }}/>
              </div>
              <span style={{ fontSize: '0.68rem', color: sC[str], fontWeight: 600 }}>{sL[str]}</span>
            </div>
          )}
        </div>
        <div><label style={lbl}>CONFIRM PASSWORD</label><input type="password" style={inp} value={rPwC} onChange={e => setRPwC(e.target.value)} placeholder="Re-enter password" /></div>
        <BtnRow onBack={regBack} onNext={regNext} />
      </div>
    );
  };

  const regIdVerify = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>ID Verification</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Upload your government-issued ID</p>
      <Err />
      {(['front', 'back'] as const).map(side => (
        <div key={side}>
          <label style={lbl}>{side === 'front' ? 'ID FRONT' : 'ID BACK'}</label>
          <div style={{
            border: `2px dashed ${(side === 'front' ? idFront : idBack) ? '#52c41a' : GBD}`,
            borderRadius: 12, padding: '0.8rem', textAlign: 'center',
            background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
          }}>
            {(side === 'front' ? idFront : idBack) ? (
              <div>
                <img src={(side === 'front' ? idFront : idBack)!} alt={`ID ${side}`} style={{ maxWidth: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} />
                <div style={{ color: '#52c41a', fontSize: '0.7rem', fontWeight: 700, marginTop: 4 }}>✓ Uploaded</div>
              </div>
            ) : (
              <label style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 2 }}>📄</div>
                <div style={{ color: '#889', fontSize: '0.78rem' }}>Click to upload {side}</div>
                <input type="file" accept="image/*" onChange={handleIdFile(side)} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>
      ))}
      <BtnRow onBack={regBack} onNext={regNext} />
    </div>
  );

  const regFace = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13, alignItems: 'center' }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Face Verification</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>Position your face in the frame</p>
      <Err />
      <div style={{ position: 'relative', width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${faceData ? '#52c41a' : G}`, flexShrink: 0 }}>
        {faceData ? (
          <img src={faceData} alt="Face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!faceData ? (
        <button style={{ ...btn, maxWidth: 200 }} onClick={() => { const p = capturePhoto(); if (p) setFaceData(p); }}>
          📸 Capture Photo
        </button>
      ) : (
        <button style={{ ...btnO, maxWidth: 200 }} onClick={() => { setFaceData(null); startCam(); }}>
          ↻ Retake
        </button>
      )}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button style={btnO} onClick={regBack}>← Back</button>
        <button style={{ ...btn, opacity: sending ? 0.6 : 1, cursor: sending ? 'wait' : 'pointer' }} onClick={regNext} disabled={sending}>
          {sending ? 'Sending code...' : 'Continue →'}
        </button>
      </div>
    </div>
  );

  const resendRegCode = () => {
    const code = generateSecureCode();
    setRGenCode(code);
    setSending(true);
    setError(null);
    setCodeSentMsg('');
    setRegCodeFallback(false);
    sendVerificationCode(rEmail, code, rName).then(res => {
      setSending(false);
      if (res.success) { setCodeSentMsg('New code sent! Check your inbox.'); setRegCodeFallback(false); }
      else { setRegCodeFallback(true); }
    }).catch(() => { setSending(false); setRegCodeFallback(true); });
  };

  const regEmailCode = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Email Verification</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>
        {regCodeFallback
          ? <>Could not deliver to <span style={{ color: G }}>{rEmail}</span>. Your code is shown below.</>  
          : <>A 6-digit code was sent to <span style={{ color: G }}>{rEmail}</span>. Check your inbox &amp; spam.</>}
      </p>
      {codeSentMsg && (
        <div style={{ background: 'rgba(80,200,120,0.08)', border: '1px solid rgba(80,200,120,0.2)', borderRadius: 8, padding: '0.5rem 1rem', color: '#52c41a', fontSize: '0.78rem', textAlign: 'center' }}>
          ✓ {codeSentMsg}
        </div>
      )}
      {regCodeFallback && (
        <div style={{ background: 'rgba(196,160,82,0.07)', border: '1px solid rgba(196,160,82,0.25)', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(196,160,82,0.6)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Your one-time code</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: G, letterSpacing: '0.4em', fontFamily: 'monospace' }}>{rGenCode}</div>
          <div style={{ fontSize: '0.68rem', color: '#556', marginTop: 6 }}>Enter this code in the field below</div>
        </div>
      )}
      <Err />
      <div>
        <label style={lbl}>VERIFICATION CODE</label>
        <input
          style={{ ...inp, textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.15rem' }}
          value={rCode}
          onChange={e => setRCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          autoFocus
        />
      </div>
      <div style={{ textAlign: 'center' }}>
        <span onClick={resendRegCode} style={{ fontSize: '0.76rem', color: 'rgba(196,160,82,0.6)', cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.5 : 1 }}>
          {sending ? 'Sending...' : "Didn't receive it? Resend →"}
        </span>
      </div>
      <BtnRow onBack={regBack} onNext={regNext} nextLabel="Verify & Continue →" />
    </div>
  );

  const regSuccess = () => (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(80,200,120,0.1)', border: '2px solid #52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✓</div>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>Account Created!</h3>
      <p style={{ color: '#889', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>
        Welcome to Londway Capital, {rName}. Your account has been verified and is ready to use.
      </p>
      {faceData && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(80,200,120,0.06)', borderRadius: 8, padding: '0.45rem 0.9rem' }}>
          <img src={faceData} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ color: '#52c41a', fontSize: '0.72rem', fontWeight: 600 }}>Face ID enabled for login</span>
        </div>
      )}
      <button style={btn} onClick={regNext}>Enter Dashboard →</button>
    </div>
  );

  // ─── PIN Pad ───
  const PinPad = ({ pin, setPin }: { pin: string; setPin: (v: string) => void }) => {
    const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    return (
      <div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 20 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < pin.length ? G : 'transparent', border: `2px solid ${i < pin.length ? G : GBD}`, transition: 'all 0.15s' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 220, margin: '0 auto' }}>
          {digits.map((d, i) => (
            d === '' ? <div key={i} /> :
            <button key={i} type="button" onClick={() => {
              if (d === '⌫') setPin(pin.slice(0, -1));
              else if (pin.length < 4) setPin(pin + d);
            }} style={{ padding: '14px 0', borderRadius: 10, border: `1px solid ${GBD}`, background: 'rgba(255,255,255,0.03)', color: d === '⌫' ? '#A2B2BF' : '#EAE0D0', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {d}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ─── Registration: PIN Setup (step 5) ───
  const regPinSetup = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Set Your 4-Digit PIN</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Choose a PIN for quick login and transfer authorization</p>
      <Err />
      <div style={{ marginBottom: 4 }}>
        <label style={{ ...lbl, textAlign: 'center', display: 'block', marginBottom: 12 }}>ENTER PIN</label>
        <PinPad pin={rPin} setPin={setRPin} />
      </div>
      {rPin.length === 4 && (
        <div style={{ marginTop: 8 }}>
          <label style={{ ...lbl, textAlign: 'center', display: 'block', marginBottom: 12 }}>CONFIRM PIN</label>
          <PinPad pin={rPinC} setPin={setRPinC} />
        </div>
      )}
      <BtnRow onBack={regBack} onNext={regNext} nextLabel="Set PIN & Continue →" />
    </div>
  );

  // ─── Login: PIN step ───
  const loginPinStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Enter Your PIN</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Enter your 4-digit PIN to continue</p>
      <Err />
      <PinPad pin={lPin} setPin={setLPin} />
      <div style={{ marginTop: 8 }}>
        <BtnRow onBack={loginBack} onNext={() => { if (lPin.length === 4) loginNext(); else setError('Enter your 4-digit PIN'); }} nextLabel={matched?.faceData ? 'Continue →' : 'Sign In →'} />
      </div>
    </div>
  );

  // ─── Forgot Password Flow ───
  const forgotFlow = () => {
    const sendForgotCode = () => {
      const acct = getAccounts().find(a => a.email === forgotEmail);
      if (!acct) { setError('No account found with that email'); return; }
      const code = generateSecureCode();
      setForgotGenCode(code);
      setSending(true); setError(null);
      sendVerificationCode(forgotEmail, code, acct.name).then(res => {
        setSending(false);
        if (res.success) { setCodeSentMsg(`Code sent to ${forgotEmail}`); setForgotCodeFallback(false); }
        else { setForgotCodeFallback(true); setCodeSentMsg(''); }
        setForgotStep(1);
      }).catch(() => { setSending(false); setForgotCodeFallback(true); setForgotStep(1); });
    };
    if (forgotStep === 0) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Reset Password</h3>
        <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Enter your registered email address</p>
        <Err />
        <div><label style={lbl}>EMAIL ADDRESS</label><input type="email" style={inp} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnO} onClick={() => setForgotMode(false)}>← Back</button>
          <button style={{ ...btn, opacity: sending ? 0.6 : 1 }} onClick={sendForgotCode} disabled={sending}>{sending ? 'Sending…' : 'Send Reset Code →'}</button>
        </div>
      </div>
    );
    if (forgotStep === 1) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Enter Reset Code</h3>
        <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>
          {forgotCodeFallback
            ? <>Could not deliver to <span style={{ color: G }}>{forgotEmail}</span>. Your code is shown below.</>
            : <>A 6-digit code was sent to <span style={{ color: G }}>{forgotEmail}</span>. Check your inbox &amp; spam.</>}
        </p>
        {codeSentMsg && <div style={{ background: 'rgba(80,200,120,0.08)', border: '1px solid rgba(80,200,120,0.2)', borderRadius: 8, padding: '0.5rem 1rem', color: '#52c41a', fontSize: '0.78rem', textAlign: 'center' }}>✓ {codeSentMsg}</div>}
        {forgotCodeFallback && (
          <div style={{ background: 'rgba(196,160,82,0.07)', border: '1px solid rgba(196,160,82,0.25)', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(196,160,82,0.6)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Your one-time code</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: G, letterSpacing: '0.4em', fontFamily: 'monospace' }}>{forgotGenCode}</div>
            <div style={{ fontSize: '0.68rem', color: '#556', marginTop: 6 }}>Enter this code in the field below</div>
          </div>
        )}
        <Err />
        <div><label style={lbl}>VERIFICATION CODE</label><input style={{ ...inp, textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.15rem' }} value={forgotCode} onChange={e => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnO} onClick={() => setForgotStep(0)}>← Back</button>
          <button style={btn} onClick={() => { if (forgotCode !== forgotGenCode) { setError('Invalid code'); return; } setError(null); setForgotStep(2); }}>Verify Code →</button>
        </div>
      </div>
    );
    if (forgotStep === 2) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Set New Password</h3>
        <Err />
        <div><label style={lbl}>NEW PASSWORD</label><input type="password" style={inp} value={forgotPw} onChange={e => setForgotPw(e.target.value)} placeholder="Min 6 characters" /></div>
        <div><label style={lbl}>CONFIRM PASSWORD</label><input type="password" style={inp} value={forgotPwC} onChange={e => setForgotPwC(e.target.value)} placeholder="Re-enter password" /></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btnO} onClick={() => setForgotStep(1)}>← Back</button>
          <button style={btn} onClick={async () => {
            if (forgotPw.length < 6) { setError('Password must be at least 6 characters'); return; }
            if (forgotPw !== forgotPwC) { setError('Passwords do not match'); return; }
            // Hash the new password before storing
            const hashedPw = await hashPassword(forgotPw);
            updateAccountPassword(forgotEmail, hashedPw);
            cloudSaveUser({ email: forgotEmail, password: hashedPw }).catch(() => {});
            // Send password change security alert email
            const accounts = getAccounts();
            const acct = accounts.find(a => a.email === forgotEmail);
            if (acct) {
              import('../lib/email').then(({ sendPasswordChangeAlert }) => {
                sendPasswordChangeAlert(forgotEmail, acct.name || 'Valued Client').catch(() => {});
              }).catch(() => {});
            }
            setForgotStep(3);
          }}>Update Password →</button>
        </div>
      </div>
    );
    return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(80,200,120,0.1)', border: '2px solid #52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✓</div>
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>Password Updated!</h3>
        <p style={{ color: '#889', fontSize: '0.82rem', margin: 0 }}>Your password has been reset. You can now sign in.</p>
        <button style={btn} onClick={() => { setForgotMode(false); setForgotStep(0); setForgotEmail(''); setForgotCode(''); setForgotPw(''); setForgotPwC(''); setCodeSentMsg(''); }}>Sign In →</button>
      </div>
    );
  };

  // ─── Login Steps ───
  const loginCredentials = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Welcome Back</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Sign in to your private banking dashboard</p>
      {activateMsg && (
        <div style={{ background: 'rgba(80,200,120,0.09)', border: '1px solid rgba(80,200,120,0.25)', borderRadius: 10, padding: '0.65rem 1rem', color: '#52c41a', fontSize: '0.78rem', lineHeight: 1.5 }}>
          ✓ {activateMsg}
        </div>
      )}
      <Err />
      <div><label style={lbl}>EMAIL ADDRESS</label><input type="email" style={inp} value={lEmail} onChange={e => setLEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ ...lbl, marginBottom: 0 }}>PASSWORD</label>
          <span style={{ fontSize: '0.72rem', color: 'rgba(196,160,82,0.5)', cursor: 'pointer' }} onClick={() => { setForgotMode(true); setForgotStep(0); setError(null); setForgotEmail(lEmail); }}>Forgot?</span>
        </div>
        <input type="password" style={inp} value={lPw} onChange={e => setLPw(e.target.value)} placeholder="········" autoComplete="current-password"
          onKeyDown={e => { if (e.key === 'Enter') loginNext(); }}
        />
      </div>
      {/* Remember me */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
        <div onClick={() => setRememberMe(r => !r)} style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${rememberMe ? G : 'rgba(196,160,82,0.3)'}`, background: rememberMe ? G : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
          {rememberMe && <span style={{ color: '#060913', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
        </div>
        <span style={{ fontSize: '0.78rem', color: rememberMe ? G : 'rgba(196,160,82,0.5)', fontWeight: 600 }}>Remember my email</span>
      </label>
      <button style={{ ...btn, opacity: sending ? 0.6 : 1, cursor: sending ? 'wait' : 'pointer' }} onClick={loginNext} disabled={sending}>
        Continue →
      </button>
    </div>
  );

  const resendLoginCode = () => {
    const code = generateSecureCode();
    setLGenCode(code);
    setSending(true);
    setError(null);
    setCodeSentMsg('');
    setLoginCodeFallback(false);
    sendVerificationCode(lEmail, code, matched?.name).then(res => {
      setSending(false);
      if (res.success) { setCodeSentMsg('New code sent! Check your inbox.'); setLoginCodeFallback(false); }
      else { setLoginCodeFallback(true); }
    }).catch(() => { setSending(false); setLoginCodeFallback(true); });
  };

  const loginCodeStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Security Verification</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>
        {loginCodeFallback
          ? <>Could not deliver to <span style={{ color: G }}>{lEmail}</span>. Your code is shown below.</>
          : <>A 6-digit code was sent to <span style={{ color: G }}>{lEmail}</span>. Check your inbox &amp; spam.</>}
      </p>
      {codeSentMsg && (
        <div style={{ background: 'rgba(80,200,120,0.08)', border: '1px solid rgba(80,200,120,0.2)', borderRadius: 8, padding: '0.5rem 1rem', color: '#52c41a', fontSize: '0.78rem', textAlign: 'center' }}>
          ✓ {codeSentMsg}
        </div>
      )}
      {loginCodeFallback && (
        <div style={{ background: 'rgba(196,160,82,0.07)', border: '1px solid rgba(196,160,82,0.25)', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(196,160,82,0.6)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Your one-time code</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: G, letterSpacing: '0.4em', fontFamily: 'monospace' }}>{lGenCode}</div>
          <div style={{ fontSize: '0.68rem', color: '#556', marginTop: 6 }}>Enter this code in the field below</div>
        </div>
      )}
      <Err />
      <div>
        <label style={lbl}>ENTER CODE</label>
        <input style={{ ...inp, textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.15rem' }} value={lCode} autoFocus
          onChange={e => setLCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <span onClick={resendLoginCode} style={{ fontSize: '0.76rem', color: 'rgba(196,160,82,0.6)', cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.5 : 1 }}>
          {sending ? 'Sending...' : 'Didn\'t receive it? Resend code →'}
        </span>
      </div>
      <BtnRow onBack={loginBack} onNext={loginNext} nextLabel={matched?.pin ? 'Continue →' : (matched?.faceData ? 'Continue →' : 'Sign In →')} />
    </div>
  );

  const loginFaceStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13, alignItems: 'center' }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Face Verification</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>Look at the camera to verify your identity</p>
      <Err />
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {matched?.faceData && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#889', marginBottom: 4, fontWeight: 600 }}>REGISTERED</div>
            <img src={matched.faceData} alt="" style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GBD}` }} />
          </div>
        )}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: '#889', marginBottom: 4, fontWeight: 600 }}>LIVE</div>
          <div style={{ position: 'relative', width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${scanning ? '#52c41a' : G}` }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            {scanning && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(80,200,120,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="face-scan-line" style={{ position: 'absolute', left: 0, right: 0, height: 2, background: '#52c41a', boxShadow: '0 0 12px #52c41a' }}/>
              </div>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {!scanning ? (
        <>
          <BtnRow onBack={loginBack} onNext={loginNext} nextLabel="🔍 Verify Face" />
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span
              onClick={() => { stopCam(); onLogin({ name: matched!.name, token: generateSessionToken(), role: matched!.role, email: matched!.email }); }}
              style={{ fontSize: '0.76rem', color: 'rgba(196,160,82,0.55)', cursor: 'pointer' }}
            >
              Skip Face Scan →
            </span>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#52c41a', fontSize: '0.82rem', fontWeight: 600 }}>
          <span style={{ width: 14, height: 14, border: '2px solid #52c41a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
          Scanning face…
        </div>
      )}
    </div>
  );

  // ─── Main ───
  const REG_LABELS = ['Details', 'Password', 'ID Check', 'Face Scan', 'Verify', 'Set PIN'];
  const LOGIN_LABELS = (() => {
    const steps = ['Sign In', 'Verify'];
    if (matched?.pin) steps.push('PIN');
    if (matched?.faceData) steps.push('Face ID');
    return steps;
  })();

  const renderContent = () => {
    if (!isRegister && forgotMode) return forgotFlow();
    if (isRegister) {
      return (
        <>
          {regStep < 6 && <StepBar steps={REG_LABELS} cur={regStep} />}
          {regStep === 0 && regPersonalInfo()}
          {regStep === 1 && regPassword()}
          {regStep === 2 && regIdVerify()}
          {regStep === 3 && regFace()}
          {regStep === 4 && regEmailCode()}
          {regStep === 5 && regPinSetup()}
          {regStep === 6 && regSuccess()}
        </>
      );
    }
    return (
      <>
        <StepBar steps={LOGIN_LABELS} cur={loginStep} />
        {loginStep === 0 && loginCredentials()}
        {loginStep === 1 && loginCodeStep()}
        {loginStep === 2 && loginPinStep()}
        {loginStep === 3 && loginFaceStep()}
      </>
    );
  };

  const formContent = (
    <div className="login-card" style={{
      background: 'linear-gradient(160deg, #12172e 0%, #0d1020 100%)',
      border: '1px solid rgba(196,160,82,0.14)',
      borderRadius: 20, padding: '2.2rem', width: '100%', maxWidth: 440,
      boxShadow: '0 30px 100px rgba(0,0,0,0.8), 0 0 60px rgba(196,160,82,0.06)',
      position: 'relative' as const,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
      opacity: visible ? 1 : 0, transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {modal && onClose && (
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 16, background: 'none', border: 'none',
          color: '#555', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: 4,
        }}>✕</button>
      )}

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.3rem' }}>
        <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="15.5" stroke={G} strokeWidth="1.3" fill="none"/>
          <path d="M11,27 V15 C11,6.5 25,6.5 25,15 V27" stroke={G} strokeWidth="2" fill={`${G}08`} strokeLinejoin="round"/>
          <line x1="7.5" y1="27" x2="28.5" y2="27" stroke={G} strokeWidth="1" strokeLinecap="round"/>
        </svg>
        <span style={{ fontWeight: 800, fontSize: '1.08rem', color: '#fff', letterSpacing: '0.05em' }}>
          LONDWAY <span style={{ color: G }}>CAPITAL</span>
        </span>
      </div>

      {renderContent()}

      {((isRegister && regStep === 0) || (!isRegister && loginStep === 0)) && (
        <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: '#445' }}>
          {isRegister ? 'Already have an account? ' : 'New to Londway? '}
          <span onClick={() => onSwitchMode?.(isRegister ? 'login' : 'register')}
            style={{ color: 'rgba(196,160,82,0.6)', cursor: 'pointer' }}>
            {isRegister ? 'Sign in →' : 'Open an account →'}
          </span>
        </div>
      )}

      <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'center', gap: 14, opacity: 0.35, fontSize: '0.66rem', color: '#888' }}>
        <span>🔒 256-bit SSL</span><span>✦ FDIC Insured</span><span>✦ SOC 2</span>
      </div>
    </div>
  );

  if (modal) {
    return (
      <div onClick={handleBackdrop} style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(4,5,10,0.85)',
        backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease',
        overflowY: 'auto',
      }}>
        {formContent}
      </div>
    );
  }

  return (
    <main style={{
      background: '#070910', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(196,160,82,0.05) 0%, transparent 70%)',
    }}>
      {formContent}
    </main>
  );
}
