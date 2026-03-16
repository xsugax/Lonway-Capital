'use client';
import React, { useState, useEffect, useRef } from 'react';

interface LoginProps {
  onLogin: (user: { name: string; token: string; role: string }) => void;
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
}

function getAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const defaults: StoredAccount[] = [
    { email: 'user@londwaycapital.com', password: 'password123', name: 'Jane Doe', role: 'user', idVerified: true },
    { email: 'admin@londwaycapital.com', password: 'admin123', name: 'Admin', role: 'admin', idVerified: true },
  ];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveNewAccount(account: StoredAccount) {
  const accounts = getAccounts();
  accounts.push(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
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
    setLEmail(''); setLPw(''); setLCode(''); setLGenCode('');
    setMatched(null); setScanning(false);
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
  const regNext = () => {
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
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setRGenCode(code);
      setRegStep(4);
    } else if (regStep === 4) {
      if (rCode !== rGenCode) { setError('Invalid verification code'); return; }
      saveNewAccount({
        email: rEmail, password: rPw, name: rName, role: 'user',
        phone: rPhone, dob: rDob, idVerified: true, faceData: faceData || undefined,
      });
      setRegStep(5);
    } else if (regStep === 5) {
      onLogin({ name: rName, token: 'token-' + Date.now(), role: 'user' });
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
  const loginNext = () => {
    setError(null);
    if (loginStep === 0) {
      const accts = getAccounts();
      const m = accts.find(a => a.email === lEmail && a.password === lPw);
      if (!m) { setError('Invalid email or password'); return; }
      setMatched(m);
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setLGenCode(code);
      setLoginStep(1);
    } else if (loginStep === 1) {
      if (lCode !== lGenCode) { setError('Invalid verification code'); return; }
      if (matched?.faceData) {
        setLoginStep(2);
        setTimeout(() => startCam(), 300);
      } else {
        onLogin({ name: matched!.name, token: 'token-' + Date.now(), role: matched!.role });
      }
    } else if (loginStep === 2) {
      setScanning(true);
      setTimeout(() => {
        stopCam();
        setScanning(false);
        onLogin({ name: matched!.name, token: 'token-' + Date.now(), role: matched!.role });
      }, 2500);
    }
  };

  const loginBack = () => {
    if (loginStep === 2) stopCam();
    setError(null);
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
      <button style={btn} onClick={regNext}>Continue →</button>
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
        <button style={btn} onClick={regNext}>Continue →</button>
      </div>
    </div>
  );

  const regEmailCode = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Email Verification</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Enter the code sent to your email</p>
      <div style={{ background: GB, border: `1px solid ${GBD}`, borderRadius: 10, padding: '0.8rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.6rem', color: G, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>DEMO — YOUR CODE IS:</div>
        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff', letterSpacing: '0.3em', fontFamily: 'monospace' }}>{rGenCode}</div>
      </div>
      <Err />
      <div>
        <label style={lbl}>VERIFICATION CODE</label>
        <input style={{ ...inp, textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.15rem' }} value={rCode}
          onChange={e => setRCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} />
      </div>
      <BtnRow onBack={regBack} onNext={regNext} nextLabel="Verify & Create →" />
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

  // ─── Login Steps ───
  const loginCredentials = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Welcome Back</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Sign in to your private banking dashboard</p>
      <div style={{ background: GB, border: `1px solid ${GBD}`, borderRadius: 10, padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.6rem', color: G, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5 }}>DEMO ACCESS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.76rem', color: '#A2B2BF', lineHeight: 1.7 }}>
            <span style={{ color: '#EAE0D0' }}>Email:</span> user@londwaycapital.com<br/>
            <span style={{ color: '#EAE0D0' }}>Pass:</span> password123
          </div>
          <button onClick={() => { setLEmail('user@londwaycapital.com'); setLPw('password123'); }}
            style={{ background: 'rgba(196,160,82,0.12)', border: `1px solid rgba(196,160,82,0.22)`, color: G, borderRadius: 7, padding: '0.28rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
            Fill →
          </button>
        </div>
      </div>
      <Err />
      <div><label style={lbl}>EMAIL ADDRESS</label><input type="email" style={inp} value={lEmail} onChange={e => setLEmail(e.target.value)} placeholder="you@example.com" /></div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ ...lbl, marginBottom: 0 }}>PASSWORD</label>
          <span style={{ fontSize: '0.72rem', color: 'rgba(196,160,82,0.5)', cursor: 'pointer' }}>Forgot?</span>
        </div>
        <input type="password" style={inp} value={lPw} onChange={e => setLPw(e.target.value)} placeholder="••••••••" />
      </div>
      <button style={btn} onClick={loginNext}>Sign In →</button>
    </div>
  );

  const loginCodeStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.08rem', margin: 0 }}>Verification Code</h3>
      <p style={{ color: '#556', fontSize: '0.8rem', margin: 0 }}>Enter the code sent to your email</p>
      <div style={{ background: GB, border: `1px solid ${GBD}`, borderRadius: 10, padding: '0.8rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.6rem', color: G, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>DEMO — YOUR CODE:</div>
        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff', letterSpacing: '0.3em', fontFamily: 'monospace' }}>{lGenCode}</div>
      </div>
      <Err />
      <div>
        <label style={lbl}>ENTER CODE</label>
        <input style={{ ...inp, textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.15rem' }} value={lCode}
          onChange={e => setLCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} />
      </div>
      <BtnRow onBack={loginBack} onNext={loginNext} nextLabel={matched?.faceData ? 'Continue →' : 'Sign In →'} />
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
        <BtnRow onBack={loginBack} onNext={loginNext} nextLabel="🔍 Verify Face" />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#52c41a', fontSize: '0.82rem', fontWeight: 600 }}>
          <span style={{ width: 14, height: 14, border: '2px solid #52c41a', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
          Scanning face…
        </div>
      )}
    </div>
  );

  // ─── Main ───
  const REG_LABELS = ['Details', 'Password', 'ID Check', 'Face Scan', 'Verify'];
  const LOGIN_LABELS = matched?.faceData ? ['Sign In', 'Code', 'Face'] : ['Sign In', 'Code'];

  const renderContent = () => {
    if (isRegister) {
      return (
        <>
          {regStep < 5 && <StepBar steps={REG_LABELS} cur={regStep} />}
          {regStep === 0 && regPersonalInfo()}
          {regStep === 1 && regPassword()}
          {regStep === 2 && regIdVerify()}
          {regStep === 3 && regFace()}
          {regStep === 4 && regEmailCode()}
          {regStep === 5 && regSuccess()}
        </>
      );
    }
    return (
      <>
        <StepBar steps={LOGIN_LABELS} cur={loginStep} />
        {loginStep === 0 && loginCredentials()}
        {loginStep === 1 && loginCodeStep()}
        {loginStep === 2 && loginFaceStep()}
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
