'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LanguageContext';
import { getCards, saveCards } from '../lib/store';

type Network = 'debit' | 'mastercard';
type Tier = 'standard' | 'platinum' | 'gold' | 'black' | 'black_world_elite';

interface CardDef {
  tier: Tier;
  name: string;
  annualFee: string;
  cashback: string;
  lounge: string | false;
  concierge: string | false;
  travel: string | false;
  deliveryDays: number;
  bg: string;
  accent: string;
  labelColor: string;
  label: string;
  subLabel?: string;
}

const DEBIT_CARDS: CardDef[] = [
  {
    tier: 'standard', name: 'Standard', annualFee: '$149 / yr', cashback: '0.8%',
    lounge: false, concierge: false, travel: false, deliveryDays: 14,
    bg: 'linear-gradient(145deg, #0D1628 0%, #1a2444 55%, #0D1628 100%)',
    accent: '#C4A052', labelColor: '#EAE0D0', label: 'DEBIT',
  },
  {
    tier: 'platinum', name: 'Platinum', annualFee: '$395 / yr', cashback: '2%',
    lounge: 'Standard', concierge: false, travel: 'Standard', deliveryDays: 10,
    bg: 'linear-gradient(145deg, #1E2B38 0%, #2E3F52 40%, #1A2535 70%, #141E2A 100%)',
    accent: '#BDD4E8', labelColor: '#DCF0FF', label: 'PLATINUM',
  },
  {
    tier: 'gold', name: 'Gold', annualFee: '$850 / yr', cashback: '3%',
    lounge: 'Priority', concierge: false, travel: 'Premium', deliveryDays: 7,
    bg: 'linear-gradient(145deg, #1A1000 0%, #3E2400 35%, #7A5500 65%, #3D2600 100%)',
    accent: '#F5D060', labelColor: '#FCEEA0', label: 'GOLD',
  },
  {
    tier: 'black', name: 'Noir Black', annualFee: '$2,500 / yr', cashback: '4%',
    lounge: 'Priority Access', concierge: 'Personal', travel: 'Premium', deliveryDays: 3,
    bg: 'linear-gradient(145deg, #060606 0%, #141414 45%, #0A0A0A 100%)',
    accent: '#C9845A', labelColor: '#E8D0C0', label: 'NOIR', subLabel: 'LONDWAY BLACK',
  },
];

const MC_CARDS: CardDef[] = [
  {
    tier: 'platinum', name: 'Platinum', annualFee: '$550 / yr', cashback: '2%',
    lounge: 'Standard', concierge: false, travel: 'Standard', deliveryDays: 10,
    bg: 'linear-gradient(145deg, #22223A 0%, #2A2A4A 45%, #1A1A2E 100%)',
    accent: '#C0C8E8', labelColor: '#E0E8FF', label: 'PLATINUM',
  },
  {
    tier: 'gold', name: 'Gold', annualFee: '$1,200 / yr', cashback: '3.5%',
    lounge: 'Priority', concierge: 'Assisted', travel: 'Premium', deliveryDays: 7,
    bg: 'linear-gradient(145deg, #2A1500 0%, #6B3F00 40%, #A06000 70%, #6B3F00 100%)',
    accent: '#F5C030', labelColor: '#FEE690', label: 'GOLD',
  },
  {
    tier: 'black', name: 'Black World', annualFee: '$3,500 / yr', cashback: '5%',
    lounge: 'Priority Access', concierge: 'Personal', travel: 'Premier', deliveryDays: 3,
    bg: 'linear-gradient(145deg, #030310 0%, #080820 50%, #050515 100%)',
    accent: '#9090C8', labelColor: '#C8CCF0', label: 'WORLD',
  },
  {
    tier: 'black_world_elite', name: 'World Elite', annualFee: '$9,500 / yr', cashback: '7%',
    lounge: 'Unlimited', concierge: 'Dedicated Personal', travel: 'Ultimate', deliveryDays: 2,
    bg: 'linear-gradient(145deg, #020208 0%, #06060F 50%, #020208 100%)',
    accent: '#E8D5B7', labelColor: '#F5EED8', label: 'WORLD ELITE', subLabel: 'MASTERCARD',
  },
];

// ─── EMV Chip ───────────────────────────────────────────────────────────────
function Chip({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width="38" height="30" rx="5" fill={`${color}40`} stroke={color} strokeWidth="1"/>
      <rect x="13" y="0" width="12" height="30" fill="none" stroke={color} strokeWidth="0.6" opacity="0.55"/>
      <line x1="0" y1="10" x2="38" y2="10" stroke={color} strokeWidth="0.6" opacity="0.55"/>
      <line x1="0" y1="20" x2="38" y2="20" stroke={color} strokeWidth="0.6" opacity="0.55"/>
      <rect x="15" y="11.5" width="8" height="7" rx="1.5" fill={color} opacity="0.75"/>
    </g>
  );
}

// ─── MC Circles ─────────────────────────────────────────────────────────────
function McCircles({ x, y, c1, c2, r = 22 }: { x: number; y: number; c1: string; c2: string; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={c1} opacity="0.85"/>
      <circle cx={x + r * 1.15} cy={y} r={r} fill={c2} opacity="0.80"/>
    </g>
  );
}

// ─── Card Pattern Overlays ───────────────────────────────────────────────────
function PatternBrush({ w, h, color }: { w: number; h: number; color: string }) {
  const lines: React.ReactElement[] = [];
  for (let i = -h; i < w + h; i += 9) {
    lines.push(<line key={i} x1={i} y1="0" x2={i + h} y2={h} stroke={color} strokeWidth="0.5" opacity="0.06"/>);
  }
  return <g>{lines}</g>;
}

function PatternCross({ w, h, color }: { w: number; h: number; color: string }) {
  const lines: React.ReactElement[] = [];
  for (let i = -h; i < w + h; i += 12) {
    lines.push(<line key={`a${i}`} x1={i} y1="0" x2={i + h} y2={h} stroke={color} strokeWidth="0.5" opacity="0.07"/>);
    lines.push(<line key={`b${i}`} x1={i + h} y1="0" x2={i} y2={h} stroke={color} strokeWidth="0.5" opacity="0.07"/>);
  }
  return <g>{lines}</g>;
}

function PatternHex({ color }: { color: string }) {
  const cells: React.ReactElement[] = [];
  const s = 14;
  const rows = 10, cols = 26;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * s * 1.732 + (row % 2 === 1 ? s * 0.866 : 0);
      const cy = row * s * 1.5;
      const pts = [0, 1, 2, 3, 4, 5].map(i => {
        const angle = (i * 60 - 30) * Math.PI / 180;
        return `${cx + s * 0.5 * Math.cos(angle)},${cy + s * 0.5 * Math.sin(angle)}`;
      }).join(' ');
      cells.push(<polygon key={`${row}-${col}`} points={pts} fill="none" stroke={color} strokeWidth="0.35" opacity="0.07"/>);
    }
  }
  return <g>{cells}</g>;
}

function PatternDiamond({ color }: { color: string }) {
  const pts: React.ReactElement[] = [];
  const s = 10;
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 38; col++) {
      const cx = col * s + (row % 2 === 1 ? s / 2 : 0);
      const cy = row * s * 0.6;
      pts.push(
        <polygon key={`${row}-${col}`}
          points={`${cx},${cy - s * 0.4} ${cx + s * 0.45},${cy} ${cx},${cy + s * 0.4} ${cx - s * 0.45},${cy}`}
          fill="none" stroke={color} strokeWidth="0.25" opacity="0.055"/>
      );
    }
  }
  return <g>{pts}</g>;
}

function PatternCircles({ accent }: { accent: string }) {
  return (
    <g>
      {[160, 210, 260, 310].map((r, i) => (
        <circle key={i} cx="310" cy="0" r={r} fill="none" stroke={accent} strokeWidth="0.8" opacity="0.06"/>
      ))}
    </g>
  );
}

// ─── Card SVG Renderer ───────────────────────────────────────────────────────
function CardSvg({ def, network, holderName, animated }: {
  def: CardDef; network: Network; holderName?: string; animated?: boolean;
}) {
  const W = 340, H = 214;
  const isMC = network === 'mastercard';
  const isElite = def.tier === 'black_world_elite';
  const isBlack = def.tier === 'black';
  const isGold = def.tier === 'gold';
  const isPlatinum = def.tier === 'platinum';

  const displayName = (holderName || 'CARD HOLDER').toUpperCase().slice(0, 24);

  const gradId = `cg-${network}-${def.tier}`;
  const shimmerGrad = `sh-${network}-${def.tier}`;

  return (
    <svg
      width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ borderRadius: 18, display: 'block', userSelect: 'none' }}
    >
      <defs>
        {/* Parse bg gradient stops */}
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          {isElite && <>
            <stop offset="0%" stopColor="#020208"/>
            <stop offset="50%" stopColor="#06060F"/>
            <stop offset="100%" stopColor="#020208"/>
          </>}
          {isBlack && !isMC && <>
            <stop offset="0%" stopColor="#060606"/>
            <stop offset="45%" stopColor="#141414"/>
            <stop offset="100%" stopColor="#0A0A0A"/>
          </>}
          {isGold && !isMC && <>
            <stop offset="0%" stopColor="#1A1000"/>
            <stop offset="35%" stopColor="#3E2400"/>
            <stop offset="65%" stopColor="#7A5500"/>
            <stop offset="100%" stopColor="#3D2600"/>
          </>}
          {isPlatinum && !isMC && <>
            <stop offset="0%" stopColor="#1E2B38"/>
            <stop offset="40%" stopColor="#2E3F52"/>
            <stop offset="70%" stopColor="#1A2535"/>
            <stop offset="100%" stopColor="#141E2A"/>
          </>}
          {!isElite && !isBlack && !isGold && !isPlatinum && !isMC && <>
            <stop offset="0%" stopColor="#0D1628"/>
            <stop offset="55%" stopColor="#1a2444"/>
            <stop offset="100%" stopColor="#0D1628"/>
          </>}
          {/* MC Platinum */}
          {isMC && isPlatinum && <>
            <stop offset="0%" stopColor="#22223A"/>
            <stop offset="45%" stopColor="#2A2A4A"/>
            <stop offset="100%" stopColor="#1A1A2E"/>
          </>}
          {/* MC Gold */}
          {isMC && isGold && <>
            <stop offset="0%" stopColor="#2A1500"/>
            <stop offset="40%" stopColor="#6B3F00"/>
            <stop offset="70%" stopColor="#A06000"/>
            <stop offset="100%" stopColor="#6B3F00"/>
          </>}
          {/* MC Black World */}
          {isMC && isBlack && !isElite && <>
            <stop offset="0%" stopColor="#030310"/>
            <stop offset="50%" stopColor="#080820"/>
            <stop offset="100%" stopColor="#050515"/>
          </>}
        </linearGradient>

        {/* Elite shimmer */}
        {isElite && (
          <linearGradient id={shimmerGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={def.accent} stopOpacity="0"/>
            <stop offset="40%" stopColor={def.accent} stopOpacity="0.04"/>
            <stop offset="50%" stopColor={def.accent} stopOpacity="0.12"/>
            <stop offset="60%" stopColor={def.accent} stopOpacity="0.04"/>
            <stop offset="100%" stopColor={def.accent} stopOpacity="0"/>
            {animated && <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="2 0" dur="2.8s" repeatCount="indefinite"/>}
          </linearGradient>
        )}

        <clipPath id={`clip-${gradId}`}>
          <rect width={W} height={H} rx="18"/>
        </clipPath>
      </defs>

      {/* Background */}
      <rect width={W} height={H} rx="18" fill={`url(#${gradId})`}/>

      {/* Pattern overlay */}
      <g clipPath={`url(#clip-${gradId})`}>
        {(isPlatinum) && <PatternBrush w={W} h={H} color={def.accent}/>}
        {(isGold) && <PatternCross w={W} h={H} color={def.accent}/>}
        {(isBlack && !isMC) && <PatternHex color={def.accent}/>}
        {(isMC && isBlack && !isElite) && <PatternHex color={def.accent}/>}
        {isElite && <PatternDiamond color={def.accent}/>}
        {(!isPlatinum && !isGold && !isBlack && !isElite) && <PatternCircles accent={def.accent}/>}

        {/* Elite shimmer sweep */}
        {isElite && <rect width={W} height={H} fill={`url(#${shimmerGrad})`}/>}

        {/* Edge glow — top */}
        <rect width={W} height="4" rx="2" fill={def.accent} opacity="0.14"/>
        {/* Edge glow — left */}
        <rect width="3" height={H} fill={def.accent} opacity="0.1"/>
      </g>

      {/* ── LONDWAY Logotype ── */}
      <text x="20" y="38" fill={def.accent} fontSize="16" fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif" letterSpacing="2.5">◢ LONDWAY</text>

      {/* ── Card type sublabel ── */}
      <text x={W - 20} y="24" fill={def.labelColor} fontSize="7" fontWeight="700"
        fontFamily="Inter" letterSpacing="1.8" textAnchor="end" opacity="0.5">
        {def.subLabel ?? (isMC ? 'MASTERCARD' : 'LONDWAY CAPITAL')}
      </text>
      <text x={W - 20} y="36" fill={def.accent} fontSize="9" fontWeight="800"
        fontFamily="Inter" letterSpacing="1.4" textAnchor="end" opacity="0.9">
        {def.label}
      </text>

      {/* ── EMV Chip ── */}
      <Chip x={20} y={60} color={def.accent}/>

      {/* ── Contactless wave ── */}
      {[8, 14, 20].map((r, i) => (
        <path key={i}
          d={`M ${73} ${66} a ${r} ${r} 0 0 1 0 ${r * 1.4}`}
          fill="none" stroke={def.accent} strokeWidth="1.2"
          opacity={0.35 + i * 0.12} strokeLinecap="round"/>
      ))}

      {/* ── Card number (masked) ── */}
      <text x="20" y={H - 52} fill={def.accent} fontSize="13" fontWeight="600"
        fontFamily="'Courier New', monospace" letterSpacing="2.5">
        •••• •••• •••• ••••
      </text>

      {/* ── Valid thru ── */}
      <text x="20" y={H - 34} fill={def.labelColor} fontSize="6.5" fontFamily="Inter"
        letterSpacing="0.8" opacity="0.45">VALID THRU</text>
      <text x="20" y={H - 20} fill={def.labelColor} fontSize="11" fontFamily="Inter"
        fontWeight="600" letterSpacing="1">{displayName}</text>

      <text x={W - 20} y={H - 34} fill={def.labelColor} fontSize="6.5" fontFamily="Inter"
        textAnchor="end" opacity="0.45" letterSpacing="0.8">EXPIRES</text>
      <text x={W - 20} y={H - 20} fill={def.labelColor} fontSize="11" fontFamily="Inter"
        textAnchor="end" fontWeight="600" letterSpacing="1">03/31</text>

      {/* ── MC Circles (right-mid area) ── */}
      {isMC && (
        <McCircles
          x={W - 70} y={H - 80}
          c1={isElite ? '#E8D5B7' : isBlack ? '#9090C8' : isGold ? '#FF9E1B' : '#B0B8D8'}
          c2={isElite ? '#CFC0A0' : isBlack ? '#7070A8' : isGold ? '#FFB830' : '#9098C0'}
          r={isElite ? 20 : 18}
        />
      )}
    </svg>
  );
}

// ─── Tier Selector Card ──────────────────────────────────────────────────────
function TierPill({
  def, network, selected, onSelect, colors,
}: {
  def: CardDef; network: Network; selected: boolean; onSelect: () => void; colors: any;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? def.bg : (hovered ? colors.surface2 : colors.surface),
        border: selected ? `2px solid ${def.accent}` : `1px solid ${colors.border}`,
        borderRadius: 16, padding: '1.2rem 1rem', cursor: 'pointer',
        transition: 'all 0.22s', minWidth: 120, textAlign: 'center',
        transform: (selected || hovered) ? 'translateY(-3px)' : 'none',
        boxShadow: selected ? `0 8px 32px ${def.accent}30` : 'none',
      }}
    >
      <div style={{ fontSize: '0.55rem', color: selected ? def.accent : colors.textFaint, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
        {network === 'debit' ? 'DEBIT' : 'MASTERCARD'}
      </div>
      <div style={{ color: selected ? def.accent : colors.textMuted, fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>{def.name}</div>
      <div style={{ color: selected ? def.labelColor : colors.textFaint, fontSize: '0.7rem', fontWeight: 600, marginTop: 4, opacity: 0.85 }}>{def.annualFee}</div>
    </button>
  );
}

// ─── Feature Row ─────────────────────────────────────────────────────────────
function FeatureRow({ icon, label, value, colors }: { icon: string; label: string; value: string | false; colors: any }) {
  const has = !!value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.65rem 0', borderBottom: `1px solid ${colors.border}` }}>
      <span style={{ fontSize: '1rem', width: 24, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: colors.textMuted, fontSize: '0.82rem', flex: 1 }}>{label}</span>
      <span style={{
        color: has ? colors.success : colors.textFaint,
        fontWeight: has ? 700 : 400,
        fontSize: '0.78rem',
      }}>
        {has ? (typeof value === 'string' ? value : '✓') : '—'}
      </span>
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, colors }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; colors: any;
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.68rem', color: colors.textFaint, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '0.75rem 1rem', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, borderRadius: 10, color: colors.text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter' }}
      />
    </div>
  );
}

// ─── Existing Card Row ────────────────────────────────────────────────────────
function ExistingCard({ card, colors }: { card: any; colors: any }) {
  const tierLabel: Record<string, string> = {
    standard: 'Standard', platinum: 'Platinum', gold: 'Gold',
    black: 'Black', black_world_elite: 'World Elite',
  };
  const statusColor: Record<string, string> = {
    active: colors.success, pending: colors.gold, processing: '#9b8fbf',
    shipped: '#4A90D9', blocked: colors.danger,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.2rem', background: colors.surface, borderRadius: 16, border: `1px solid ${colors.border}`, marginBottom: 10 }}>
      <div style={{ width: 48, height: 30, borderRadius: 6, background: card.network === 'mastercard' ? 'linear-gradient(135deg,#2A1500,#6B3F00)' : 'linear-gradient(135deg,#0D1628,#1a2444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.48rem', color: '#C4A052', fontWeight: 800, letterSpacing: 1, flexShrink: 0 }}>⬡</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: colors.text, fontWeight: 700, fontSize: '0.88rem' }}>{card.network === 'mastercard' ? 'Mastercard' : 'Debit'} · {tierLabel[card.tier] ?? card.tier}</div>
        <div style={{ color: colors.textFaint, fontSize: '0.72rem', marginTop: 1 }}>{card.maskedNumber} · {card.holderName}</div>
      </div>
      <div style={{ background: `${statusColor[card.status] ?? colors.textFaint}18`, border: `1px solid ${statusColor[card.status] ?? colors.textFaint}30`, borderRadius: 6, padding: '2px 9px', fontSize: '0.65rem', color: statusColor[card.status] ?? colors.textFaint, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {card.status}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Cards({ user }: { user: { token: string; email?: string } }) {
  const { colors } = useTheme();
  const { t } = useLang();

  const [network, setNetwork] = useState<Network>('debit');
  const [selectedTier, setSelectedTier] = useState<Tier>('standard');
  const [step, setStep] = useState<'pick' | 'form' | 'success'>('pick');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [existingCards, setExistingCards] = useState<any[]>([]);

  const cards = network === 'debit' ? DEBIT_CARDS : MC_CARDS;
  const def = cards.find(c => c.tier === selectedTier) ?? cards[0];

  const fetchCards = useCallback(() => {
    setExistingCards(getCards(user?.email));
  }, [user?.email]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  // If current tier not in new network, reset to first
  const handleNetworkChange = (n: Network) => {
    setNetwork(n);
    const list = n === 'debit' ? DEBIT_CARDS : MC_CARDS;
    const exists = list.find(c => c.tier === selectedTier);
    if (!exists) setSelectedTier(list[0].tier);
  };

  const handleSubmit = () => {
    if (!fullName.trim() || !address.trim() || !city.trim() || !country.trim()) return;
    setSubmitting(true);
    const card = { id: 'card-' + Date.now(), network, tier: def.tier, holderName: fullName, deliveryAddress: address, city, country, status: 'pending', requestedAt: new Date().toISOString() };
    const all = getCards(user?.email);
    all.push(card);
    saveCards(all, user?.email);
    setResult(card);
    setStep('success');
    fetchCards();
    setSubmitting(false);
  };

  return (
    <main style={{ background: colors.bg, minHeight: '100vh', color: colors.text, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${colors.border}`, padding: '2.5rem 2rem 2rem' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 120% at 5% 50%, ${colors.goldBg} 0%, transparent 65%)`, pointerEvents: 'none' }}/>
        {/* Decorative card silhouette */}
        <svg style={{ position: 'absolute', right: 48, top: 16, opacity: 0.045, pointerEvents: 'none' }} width="280" height="176" viewBox="0 0 280 176">
          <rect width="280" height="176" rx="18" fill={colors.gold}/>
          <rect x="18" y="55" width="38" height="30" rx="5" fill={colors.gold} opacity="0.6"/>
          <rect x="18" y="130" width="160" height="10" rx="3" fill={colors.gold} opacity="0.4"/>
          <circle cx="220" cy="120" r="28" fill={colors.gold} opacity="0.3"/>
          <circle cx="248" cy="120" r="28" fill={colors.gold} opacity="0.25"/>
        </svg>
        <div style={{ position: 'relative', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.goldBg, border: `1px solid ${colors.borderStrong}`, borderRadius: 100, padding: '0.28rem 0.9rem', marginBottom: '1rem', fontSize: '0.62rem', color: colors.gold, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, boxShadow: `0 0 8px ${colors.gold}` }}/>
            {t('cardCenter').toUpperCase()}
          </div>
          <h1 style={{ color: colors.text, fontWeight: 800, fontSize: '2.2rem', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>{t('yourCards')}</h1>
          <p style={{ color: colors.textFaint, fontSize: '0.88rem', margin: 0 }}>Premium cards curated for every lifestyle — from everyday to elite.</p>
        </div>
      </div>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* ── Existing Cards ── */}
        {existingCards.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>{t('yourCards')}</div>
            {existingCards.map(c => <ExistingCard key={c.id} card={c} colors={colors}/>)}
          </div>
        )}

        {step === 'success' ? (
          /* ── Success State ── */
          <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto', padding: '3rem 2rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${colors.success}18`, border: `2px solid ${colors.success}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 1.5rem' }}>✅</div>
            <h2 style={{ color: colors.text, fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.6rem' }}>{t('cardRequested')}</h2>
            <p style={{ color: colors.textMuted, fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.4rem' }}>
              {t('requestSubmitted')} <strong style={{ color: colors.gold }}>
                {result?.estimatedDelivery ? new Date(result.estimatedDelivery).toLocaleDateString() : ''}
              </strong>
            </p>
            <div style={{ background: colors.surface, borderRadius: 16, padding: '1.2rem', marginBottom: '1.6rem', border: `1px solid ${colors.border}` }}>
              <div style={{ color: colors.textFaint, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Card Preview</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ transform: 'scale(0.75)', transformOrigin: 'center top', marginBottom: -54 }}>
                  <CardSvg def={def} network={network} holderName={fullName} animated={false}/>
                </div>
              </div>
            </div>
            <button onClick={() => { setStep('pick'); setFullName(''); setAddress(''); setCity(''); setCountry(''); setResult(null); }}
              style={{ padding: '0.75rem 2rem', background: colors.gold, border: 'none', borderRadius: 12, color: '#060913', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              Request Another Card
            </button>
          </div>
        ) : step === 'form' ? (
          /* ── Form Step ── */
          <div className="cards-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
            <div>
              <div style={{ marginBottom: '1.8rem' }}>
                <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>Card Preview</div>
                <div style={{ transition: 'all 0.35s', maxWidth: 340 }}>
                  <CardSvg def={def} network={network} holderName={fullName || 'YOUR NAME'} animated={def.tier === 'black_world_elite'}/>
                </div>
              </div>
              {/* Mini feature list */}
              <div style={{ background: colors.surface, borderRadius: 16, padding: '1.4rem', border: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.8rem' }}>Included Benefits</div>
                <FeatureRow icon="💳" label="Cashback" value={def.cashback} colors={colors}/>
                <FeatureRow icon="✈️" label={t('loungeAccess')} value={def.lounge} colors={colors}/>
                <FeatureRow icon="🎩" label={t('concierge')} value={def.concierge} colors={colors}/>
                <FeatureRow icon="🛡️" label={t('travelInsurance')} value={def.travel} colors={colors}/>
              </div>
            </div>

            <div style={{ background: colors.surface, borderRadius: 20, padding: '2rem', border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.5rem' }}>{t('deliveryDetails')}</div>
              <Field label={t('fullName')} value={fullName} onChange={setFullName} placeholder="e.g. Alex Londway" colors={colors}/>
              <Field label={t('deliveryAddress')} value={address} onChange={setAddress} placeholder="Street address" colors={colors}/>
              <Field label={t('city')} value={city} onChange={setCity} placeholder="City" colors={colors}/>
              <Field label={t('country')} value={country} onChange={setCountry} placeholder="Country" colors={colors}/>
              <div style={{ background: colors.surface2, borderRadius: 10, padding: '0.8rem 1rem', marginBottom: '1.4rem', fontSize: '0.78rem', color: colors.textMuted, lineHeight: 1.7 }}>
                <strong style={{ color: colors.gold }}>{network === 'debit' ? 'Debit' : 'Mastercard'} {def.name}</strong><br/>
                Annual fee: <strong style={{ color: colors.text }}>{def.annualFee}</strong> ·
                Est. delivery: <strong style={{ color: colors.text }}>{def.deliveryDays} business days</strong>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('pick')}
                  style={{ flex: 1, padding: '0.75rem', background: 'none', border: `1px solid ${colors.border}`, borderRadius: 12, color: colors.textMuted, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  {t('back')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !fullName.trim() || !address.trim() || !city.trim() || !country.trim()}
                  style={{ flex: 2, padding: '0.75rem', background: colors.gold, border: 'none', borderRadius: 12, color: '#060913', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', opacity: (submitting || !fullName.trim()) ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  {submitting ? '…' : t('requestNow')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Pick Step ── */
          <div>
            {/* Network Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
              {(['debit', 'mastercard'] as Network[]).map(n => (
                <button key={n} onClick={() => handleNetworkChange(n)}
                  style={{ padding: '0.6rem 1.4rem', borderRadius: 10, border: `1px solid ${network === n ? colors.borderStrong : colors.border}`, background: network === n ? colors.goldBg : colors.surface, color: network === n ? colors.gold : colors.textMuted, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.18s' }}>
                  {n === 'debit' ? t('debitCard') : t('masterCard')}
                </button>
              ))}
            </div>

            {/* Card Tier Picker */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>{t('selectTier')}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {cards.map(c => (
                  <TierPill key={c.tier} def={c} network={network} selected={selectedTier === c.tier}
                    onSelect={() => setSelectedTier(c.tier)} colors={colors}/>
                ))}
              </div>
            </div>

            {/* Large card preview + features */}
            <div className="cards-pick-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Card 3D preview */}
              <div>
                <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.2rem' }}>Preview</div>
                <div style={{
                  perspective: '800px',
                  display: 'flex', justifyContent: 'flex-start',
                }}>
                  <div style={{
                    transition: 'transform 0.5s cubic-bezier(.34,1.56,.64,1)',
                    maxWidth: 340,
                    filter: `drop-shadow(0 24px 48px ${def.accent}30)`,
                  }}>
                    <CardSvg def={def} network={network} holderName="YOUR NAME HERE" animated={def.tier === 'black_world_elite'}/>
                  </div>
                </div>

                {/* Delivery badge */}
                <div style={{ display: 'flex', gap: 10, marginTop: '1.4rem', flexWrap: 'wrap' }}>
                  <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '0.5rem 0.85rem', fontSize: '0.72rem', color: colors.textMuted }}>
                    🚚 <strong style={{ color: colors.text }}>{def.deliveryDays} day</strong> delivery
                  </div>
                  <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '0.5rem 0.85rem', fontSize: '0.72rem', color: colors.textMuted }}>
                    💳 <strong style={{ color: colors.text }}>{def.cashback}</strong> cashback
                  </div>
                  <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '0.5rem 0.85rem', fontSize: '0.72rem', color: def.tier === 'standard' ? colors.textFaint : colors.success }}>
                    {def.tier === 'standard' ? '—' : '✓'} Lounge Access
                  </div>
                </div>
              </div>

              {/* Features & CTA */}
              <div>
                <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.8rem' }}>Features Included</div>

                <div style={{ background: colors.surface, borderRadius: 16, padding: '1.4rem', border: `1px solid ${colors.border}`, marginBottom: '1.2rem' }}>
                  <FeatureRow icon="💳" label="Cashback Rate" value={def.cashback} colors={colors}/>
                  <FeatureRow icon="✈️" label={t('loungeAccess')} value={def.lounge} colors={colors}/>
                  <FeatureRow icon="🎩" label={t('concierge')} value={def.concierge} colors={colors}/>
                  <FeatureRow icon="🛡️" label={t('travelInsurance')} value={def.travel} colors={colors}/>
                  <FeatureRow icon="📱" label="Apple/Google Pay" value="Included" colors={colors}/>
                  <FeatureRow icon="🌐" label="Global Acceptance" value="190+ countries" colors={colors}/>
                  <FeatureRow icon="🔒" label="Zero Liability" value="Included" colors={colors}/>
                  {def.tier !== 'standard' && <FeatureRow icon="📞" label="24/7 Priority Support" value="Included" colors={colors}/>}
                </div>

                {/* Annual fee highlight */}
                <div style={{ background: `${colors.gold}10`, border: `1px solid ${colors.borderStrong}`, borderRadius: 14, padding: '1rem 1.2rem', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{t('annualFee')}</div>
                    <div style={{ color: colors.gold, fontWeight: 800, fontSize: '1.3rem' }}>{def.annualFee}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Est. Delivery</div>
                    <div style={{ color: colors.text, fontWeight: 700, fontSize: '0.9rem' }}>{def.deliveryDays} days</div>
                  </div>
                </div>

                <button
                  onClick={() => setStep('form')}
                  style={{ width: '100%', padding: '0.9rem', background: colors.gold, border: 'none', borderRadius: 14, color: '#060913', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', letterSpacing: '0.04em', transition: 'opacity 0.2s, transform 0.2s' }}
                >
                  {t('requestNow')} →
                </button>
              </div>
            </div>

            {/* Comparison Table */}
            <div style={{ marginTop: '3rem', background: colors.surface, borderRadius: 20, padding: '1.8rem', border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '0.62rem', color: colors.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1.4rem' }}>Compare {network === 'debit' ? 'Debit' : 'Mastercard'} Cards</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 580 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', color: colors.textFaint, fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '0.8rem', borderBottom: `1px solid ${colors.border}`, paddingRight: 12 }}>Feature</th>
                      {cards.map(c => (
                        <th key={c.tier} style={{ textAlign: 'center', color: selectedTier === c.tier ? colors.gold : colors.textFaint, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em', paddingBottom: '0.8rem', borderBottom: `1px solid ${selectedTier === c.tier ? colors.gold : colors.border}`, paddingRight: 8 }}>
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Annual Fee', key: 'annualFee' as keyof CardDef },
                      { label: 'Cashback', key: 'cashback' as keyof CardDef },
                      { label: 'Lounge', key: 'lounge' as keyof CardDef },
                      { label: 'Concierge', key: 'concierge' as keyof CardDef },
                      { label: 'Travel Insurance', key: 'travel' as keyof CardDef },
                    ].map(row => (
                      <tr key={row.label}>
                        <td style={{ padding: '0.65rem 12px 0.65rem 0', color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>{row.label}</td>
                        {cards.map(c => {
                          const val = c[row.key];
                          return (
                            <td key={c.tier} style={{ padding: '0.65rem 8px', textAlign: 'center', borderBottom: `1px solid ${colors.border}`, color: val ? (selectedTier === c.tier ? colors.gold : colors.text) : colors.textFaint, fontWeight: val ? 600 : 400 }}>
                              {val === false ? '—' : String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover { opacity: 0.92; }
        @media (max-width: 768px) {
          .cards-pick-grid { grid-template-columns: 1fr !important; }
          .cards-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
