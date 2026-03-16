'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// ─── Scroll-reveal hook ────────────────────────────────────────────────────
function useReveal(threshold = 0.18) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Parallax hook (translates bg on scroll) ──────────────────────────────
function useParallax(strength = 60) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current || !bgRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: -1 (above viewport) → +1 (below viewport)
      const progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2);
      bgRef.current.style.transform = `translateY(${progress * strength}px) scale(1.1)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [strength]);
  return { sectionRef, bgRef };
}

// ─── Photo section component ───────────────────────────────────────────────
interface PhotoSectionProps {
  id?: string;
  photoUrl: string;
  bgPosition?: string;
  align: 'left' | 'right';
  height?: number;
  label: string;
  headline: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  gradientDir?: string;
  overlayDir?: string;
}

function PhotoSection({
  id, photoUrl, bgPosition = 'center', align, height = 560,
  label, headline, body, footer,
  gradientDir, overlayDir,
}: PhotoSectionProps) {
  const { colors: c, theme: t } = useTheme();
  const dk = t === 'dark';
  const G = c.gold;
  const IV = c.text;
  const PT = c.textMuted;

  const { ref: revealRef, visible } = useReveal(0.15);
  const { sectionRef, bgRef } = useParallax(55);
  const isLeft = align === 'left';
  const gDir = gradientDir ?? (isLeft ? '135deg' : '225deg');
  const oDir = overlayDir ?? (isLeft ? '90deg' : '270deg');

  // Merge the two refs
  const setRef = useCallback((node: HTMLElement | null) => {
    (revealRef as React.MutableRefObject<HTMLElement | null>).current = node;
    (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
  }, [revealRef, sectionRef]);

  const bgBase = dk ? 'rgba(6,9,19,' : 'rgba(245,240,232,';

  return (
    <section ref={setRef as React.RefCallback<HTMLElement>} id={id}
      style={{ position: 'relative', height, overflow: 'hidden' }}>
      {/* Parallax background */}
      <div ref={bgRef} style={{
        position: 'absolute', inset: '-10% 0', height: '120%',
        backgroundImage: `url(${photoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: bgPosition,
        filter: dk ? 'brightness(0.26) saturate(0.65)' : 'brightness(0.38) saturate(0.7)',
        willChange: 'transform',
        transition: 'filter 0.6s ease',
      }}/>
      {/* Overlay gradients */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${gDir}, ${bgBase}0.95) 0%, ${G}08 55%, transparent 100%)` }}/>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${oDir}, ${bgBase}0.6) 0%, transparent 50%)` }}/>
      {/* Gold accent line */}
      <div style={{
        position: 'absolute', [isLeft ? 'left' : 'right']: 0, top: '20%', bottom: '20%',
        width: 2,
        background: `linear-gradient(180deg, transparent 0%, ${G}59 40%, ${G}59 60%, transparent 100%)`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scaleY(1)' : 'scaleY(0)',
        transition: 'opacity 0.8s ease 0.4s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s',
        transformOrigin: 'center',
      }}/>
      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto',
        height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: isLeft ? 'flex-start' : 'flex-end',
        padding: '0 3.5rem',
      }}>
        <div style={{
          maxWidth: 560,
          textAlign: isLeft ? 'left' : 'right',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : `translateY(${isLeft ? 36 : -36}px)`,
          transition: 'opacity 0.85s cubic-bezier(0.16,1,0.3,1) 0.15s, transform 0.85s cubic-bezier(0.16,1,0.3,1) 0.15s',
        }}>
          {/* Label */}
          <div style={{
            fontSize: '0.66rem', color: G, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', marginBottom: '0.9rem',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : `translateX(${isLeft ? -20 : 20}px)`,
            transition: 'opacity 0.7s ease 0.05s, transform 0.7s ease 0.05s',
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: isLeft ? 'flex-start' : 'flex-end',
          }}>
            {isLeft && <span style={{ width: 24, height: 1, background: G, display: 'inline-block' }}/>}
            {label}
            {!isLeft && <span style={{ width: 24, height: 1, background: G, display: 'inline-block' }}/>}
          </div>
          {/* Headline */}
          <h2 style={{
            fontSize: 'clamp(2.1rem, 3.8vw, 3.2rem)', fontWeight: 800, color: IV,
            lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '1.2rem',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(22px)',
            transition: 'opacity 0.8s ease 0.25s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s',
          }}>{headline}</h2>
          {/* Body */}
          <p style={{
            fontSize: '1rem', color: PT, lineHeight: 1.85, maxWidth: 500,
            margin: isLeft ? '0' : '0 0 0 auto',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.75s ease 0.38s, transform 0.75s ease 0.38s',
          }}>{body}</p>
          {/* Optional footer (buttons etc.) */}
          {footer && (
            <div style={{
              marginTop: '1.8rem',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.7s ease 0.5s, transform 0.7s ease 0.5s',
            }}>{footer}</div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SVG: Financial District at Night ────────────────────────────────────
function Cityscape() {
  const { colors: c } = useTheme();
  const G = c.gold;
  return (
    <svg viewBox="0 0 1440 340" xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax meet"
      style={{ display: 'block', width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="groundHaze" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor={G} stopOpacity="0.07"/>
          <stop offset="100%" stopColor={G} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1440" height="340" fill="url(#groundHaze)"/>

      {/* Far background – very faint */}
      <g opacity="0.08" stroke={G} strokeWidth="0.35" fill="none">
        {[[40,280,25,60],[75,260,35,80],[120,273,22,67],[160,255,42,85],[212,268,28,72],
          [1100,270,30,70],[1145,252,40,88],[1198,265,25,75],[1238,250,45,90],
          [1295,268,32,72],[1348,280,90,60]
        ].map(([x,y,w,h],i) => <rect key={i} x={x} y={y} width={w} height={h}/>)}
      </g>

      {/* Left mid cluster */}
      <g opacity="0.2" stroke={G} fill="rgba(196,160,82,0.02)">
        <rect x="285" y="145" width="68" height="195" strokeWidth="0.6"/>
        <rect x="286" y="132" width="66" height="17" strokeWidth="0.4" fill="none"/>
        <rect x="363" y="175" width="54" height="165" strokeWidth="0.5"/>
        <rect x="427" y="160" width="62" height="180" strokeWidth="0.55"/>
      </g>
      {[0,1,2,3,4,5,6,7].map(r => [0,1,2,3].map(c => (
        <rect key={`lm${r}${c}`} x={293+c*15} y={152+r*19} width="9" height="12"
          fill={G} opacity={(r+c)%3===0?0.28:0.04}/>
      )))}

      {/* Left tower */}
      <g opacity="0.28">
        <rect x="498" y="82" width="86" height="258"
          fill="rgba(196,160,82,0.025)" stroke={G} strokeWidth="0.65"/>
        <polygon points="498,82 541,52 584,82" fill="none" stroke={G} strokeWidth="0.5"/>
        <line x1="541" y1="52" x2="541" y2="44" stroke={G} strokeWidth="0.65"/>
        {[0,1,2,3,4,5,6,7,8,9,10].map(r => [0,1,2,3,4].map(c => (
          <rect key={`lt${r}${c}`} x={504+c*16} y={90+r*21} width="10" height="13"
            fill={G} opacity={(r*c+r)%5===0?0.32:r%2===0?0.07:0.03}/>
        )))}
      </g>

      {/* ── CENTRAL TOWER ── */}
      <g>
        <rect x="648" y="22" width="144" height="318"
          fill="rgba(196,160,82,0.04)" stroke={G} strokeWidth="0.9" opacity="0.5"/>
        <rect x="659" y="10" width="122" height="16"
          fill="rgba(196,160,82,0.04)" stroke={G} strokeWidth="0.6" opacity="0.45"/>
        <rect x="673" y="0" width="94" height="13"
          fill="rgba(196,160,82,0.04)" stroke={G} strokeWidth="0.5" opacity="0.4"/>
        <line x1="720" y1="0" x2="720" y2="-16" stroke={G} strokeWidth="0.75" opacity="0.6"/>
        <circle cx="720" cy="-17" r="2.5" fill={G} opacity="0.45"/>
        <line x1="720" y1="28" x2="720" y2="340" stroke={G} strokeWidth="0.25" opacity="0.18"/>
        {[0,1,2,3,4,5,6].map(i => (
          <line key={i} x1="648" y1={28+i*44} x2="792" y2={28+i*44}
            stroke={G} strokeWidth="0.2" opacity="0.14"/>
        ))}
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(r => [0,1,2,3,4,5,6,7].map(c => (
          <rect key={`ct${r}${c}`} x={653+c*17} y={30+r*22} width="11" height="14"
            fill={G} opacity={(r+c)%4===0?0.42:(r*c)%3===0?0.14:0.04}/>
        )))}
      </g>

      {/* Right tower */}
      <g opacity="0.28">
        <rect x="858" y="74" width="92" height="266"
          fill="rgba(196,160,82,0.025)" stroke={G} strokeWidth="0.65"/>
        <rect x="868" y="62" width="72" height="15"
          fill="none" stroke={G} strokeWidth="0.4" opacity="0.6"/>
        <rect x="880" y="50" width="48" height="15"
          fill="none" stroke={G} strokeWidth="0.35" opacity="0.5"/>
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(r => [0,1,2,3,4].map(c => (
          <rect key={`rt${r}${c}`} x={863+c*17} y={82+r*19} width="11" height="12"
            fill={G} opacity={(r+c)%3===0?0.3:0.04}/>
        )))}
      </g>

      {/* Right mid cluster */}
      <g opacity="0.2" stroke={G} fill="rgba(196,160,82,0.02)">
        <rect x="966" y="150" width="58" height="190" strokeWidth="0.5"/>
        <rect x="1034" y="170" width="48" height="170" strokeWidth="0.5"/>
        <rect x="996" y="136" width="30" height="204" strokeWidth="0.55"/>
        {[0,1,2,3,4,5,6,7].map(r => [0,1].map(c => (
          <rect key={`rmc${r}${c}`} x={970+c*26} y={158+r*19} width="12" height="12"
            fill={G} opacity={r%3===0?0.22:0.04} stroke="none"/>
        )))}
      </g>

      <line x1="0" y1="339" x2="1440" y2="339" stroke={G} strokeWidth="0.8" opacity="0.28"/>
      <ellipse cx="720" cy="339" rx="660" ry="18" fill={G} opacity="0.025"/>
    </svg>
  );
}

// ─── SVG: Vault Door ─────────────────────────────────────────────────────
function VaultDoor() {
  const { colors: c } = useTheme();
  const G = c.gold;
  const spokes = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', maxWidth: 280 }}>
      <rect x="10" y="10" width="260" height="260" rx="14"
        fill="rgba(196,160,82,0.03)" stroke={G} strokeWidth="1.2" opacity="0.2"/>
      <rect x="28" y="28" width="224" height="224" rx="8"
        fill="rgba(196,160,82,0.03)" stroke={G} strokeWidth="1.5" opacity="0.28"/>
      <circle cx="140" cy="140" r="90"
        fill="rgba(196,160,82,0.04)" stroke={G} strokeWidth="1.5" opacity="0.35"/>
      <circle cx="140" cy="140" r="76"
        fill="none" stroke={G} strokeWidth="0.7" opacity="0.18"/>
      <circle cx="140" cy="140" r="62"
        fill="rgba(196,160,82,0.04)" stroke={G} strokeWidth="1.2" opacity="0.28"/>
      {spokes.map(angle => {
        const rad = angle * Math.PI / 180;
        return (
          <line key={angle}
            x1={140 + 62 * Math.cos(rad)} y1={140 + 62 * Math.sin(rad)}
            x2={140 + 89 * Math.cos(rad)} y2={140 + 89 * Math.sin(rad)}
            stroke={G} strokeWidth="5.5" strokeLinecap="round" opacity="0.22"/>
        );
      })}
      <circle cx="140" cy="140" r="38"
        fill="rgba(196,160,82,0.05)" stroke={G} strokeWidth="1" opacity="0.3"/>
      <circle cx="140" cy="140" r="25"
        fill="rgba(196,160,82,0.06)" stroke={G} strokeWidth="1.5" opacity="0.32"/>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30) * Math.PI / 180;
        const r1 = i % 3 === 0 ? 29 : 31;
        return (
          <line key={i}
            x1={140 + r1 * Math.cos(a)} y1={140 + r1 * Math.sin(a)}
            x2={140 + 37 * Math.cos(a)} y2={140 + 37 * Math.sin(a)}
            stroke={G} strokeWidth={i % 3 === 0 ? 1.6 : 0.8} opacity="0.4"/>
        );
      })}
      <circle cx="197" cy="140" r="15"
        fill="rgba(196,160,82,0.08)" stroke={G} strokeWidth="1.5" opacity="0.3"/>
      <circle cx="197" cy="140" r="6" fill={G} opacity="0.22"/>
      <circle cx="140" cy="140" r="9" fill={G} opacity="0.28"/>
      <circle cx="140" cy="140" r="3.5" fill={G} opacity="0.6"/>
      {[[44,44],[236,44],[44,236],[236,236]].map(([x, y]) => (
        <circle key={`b${x}${y}`} cx={x} cy={y} r="8"
          fill="rgba(196,160,82,0.06)" stroke={G} strokeWidth="1" opacity="0.22"/>
      ))}
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────
function getFeatures(G: string) {
  return [
    {
      icon: (
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="17" stroke={G} strokeWidth="1.4"/>
          <path d="M11 18l5 5 9-9" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Institutional Security',
      desc: 'Military-grade AES-256 encryption, biometric authentication, zero-knowledge architecture, and Anti fraud monitoring — 1,400+ signals per second.',
    },
    {
      icon: (
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="17" stroke={G} strokeWidth="1.4"/>
          <polyline points="8,24 13,16 19,20 28,10" stroke={G} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      ),
      title: 'Intelligent Investing',
      desc: 'AI-driven portfolio management spanning equities, fixed income, crypto, and alternatives — fully automated or advisory-led.',
    },
    {
      icon: (
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="17" stroke={G} strokeWidth="1.4"/>
          <path d="M11 18h14M18 11v14" stroke={G} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: 'Frictionless Transfers',
      desc: 'Near-instant domestic and cross-border payments in 195 currencies. Zero fees. Full SWIFT, SEPA, and ACH access.',
    },
    {
      icon: (
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="17" stroke={G} strokeWidth="1.4"/>
          <rect x="9" y="13" width="18" height="12" rx="2" stroke={G} strokeWidth="1.6"/>
          <path d="M9 17h18" stroke={G} strokeWidth="1.6"/>
        </svg>
      ),
      title: 'Premium Accounts',
      desc: 'Unlimited checking, high-yield Savings Vaults (4.8% APY), and multi-currency wallets — unified in one elegant dashboard.',
    },
    {
      icon: (
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="17" stroke={G} strokeWidth="1.4"/>
          <circle cx="18" cy="18" r="4.5" stroke={G} strokeWidth="1.6"/>
          <path d="M18 10v2M18 24v2M10 18h2M24 18h2"
            stroke={G} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      title: 'Financial Intelligence',
      desc: 'Personalized health scores, real-time spending analytics, peer benchmarking, and proactive wealth recommendations.',
    },
    {
      icon: (
        <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="17" stroke={G} strokeWidth="1.4"/>
          <path d="M12 22c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={G} strokeWidth="1.7"
            strokeLinecap="round" fill="none"/>
          <circle cx="18" cy="13" r="2.5" stroke={G} strokeWidth="1.4"/>
        </svg>
      ),
      title: 'White-Glove Service',
      desc: '24/7 access to dedicated wealth advisors, priority concierge banking, and exclusive privileges reserved for private clients.',
    },
  ];
}

const stats = [
  { n: '$89B+', l: 'Assets Under Custody' },
  { n: '2.4M', l: 'Private Members' },
  { n: '195', l: 'Countries Served' },
  { n: '99.99%', l: 'Platform Uptime' },
];

const testimonials = [
  {
    q: 'The level of sophistication Londway Capital brings to digital private banking is unmatched. Portfolio performance is up 34% since I moved my wealth here.',
    name: 'Alexandra Chen', role: 'Founder & CEO, Meridian Ventures', av: 'AC',
  },
  {
    q: "I hold accounts at three of the world's largest private banks. Londway Capital surpasses all of them in technology, execution speed, and client experience.",
    name: 'Marcus Guillaume', role: 'Managing Director, Apex Capital', av: 'MG',
  },
  {
    q: 'This is what banking should feel like — seamless, intelligent, and secure. Londway Capital is the reason I closed my legacy accounts permanently.',
    name: 'Priya Anand-Sharma', role: 'Chief Financial Officer, NovaTech Group', av: 'PA',
  },
];

function getTiers(G: string, PT: string) {
  return [
    {
      name: 'Londway Select', tag: 'Essential', tagClr: PT, featured: false,
      items: ['Unlimited checking', '$0 monthly fee', 'Instant virtual card', '2% cashback on all spend'],
      cta: 'Open Select Account',
    },
    {
      name: 'Londway Private', tag: 'Most Popular', tagClr: G, featured: true,
      items: ['Everything in Select', 'Dedicated wealth advisor', 'High-yield Vaults (4.8% APY)', 'Priority international wires'],
      cta: 'Open Private Account',
    },
    {
      name: 'Londway Prestige', tag: 'Invitation Only', tagClr: '#6E8FA8', featured: false,
      items: ['Everything in Private', 'Platinum concierge card', 'Exclusive investment mandates', 'Family Office services'],
      cta: 'Request Access',
    },
  ];
}

interface WelcomeProps { onSignIn: () => void; onOpenAccount: () => void; }

export default function Welcome({ onSignIn, onOpenAccount }: WelcomeProps) {
  const { colors, theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware design tokens
  const G   = colors.gold;
  const GB  = colors.goldBg;
  const GBR = isDark ? 'rgba(196,160,82,0.13)' : 'rgba(139,105,20,0.15)';
  const BG  = colors.bg;
  const S1  = isDark ? '#09101F' : colors.surface;
  const S2  = colors.surface;
  const S3  = isDark ? '#141E38' : colors.surface2;
  const IV  = colors.text;
  const SL  = colors.textFaint;
  const PT  = colors.textMuted;

  const [scrolled, setScrolled] = useState(false);
  const [tIdx, setTIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const features = getFeatures(G);
  const tiers = getTiers(G, PT);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTIdx(i => (i + 1) % testimonials.length), 5200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ background: BG, color: IV, fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden', lineHeight: 1.6 }}>

      {/* ──────────────── NAVBAR ──────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 64, padding: '0 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? (isDark ? 'rgba(6,9,19,0.96)' : 'rgba(245,240,232,0.96)') : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${GBR}` : 'none',
        transition: 'all 0.35s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="15.5" stroke={G} strokeWidth="1.3" fill="none"/>
            <path d="M11,27 V15 C11,6.5 25,6.5 25,15 V27" stroke={G} strokeWidth="2" fill={`${G}08`} strokeLinejoin="round"/>
            <line x1="7.5" y1="27" x2="28.5" y2="27" stroke={G} strokeWidth="1" strokeLinecap="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em', color: IV }}>
            LONDWAY<span style={{ color: G }}> CAPITAL</span>
          </span>
        </div>

        {/* Desktop Links (hidden on mobile via CSS class) */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[
            { label: 'Private Banking', target: 'private-banking' },
            { label: 'Investments', target: 'investments' },
            { label: 'Security', target: 'security' },
            { label: 'About', target: 'about' },
          ].map(l => (
            <a key={l.label} href={`#${l.target}`} onClick={e => { e.preventDefault(); scrollTo(l.target); }}
              style={{ color: SL, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.02em', transition: 'color 0.2s', cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseOver={e => (e.currentTarget.style.color = IV)}
              onMouseOut={e => (e.currentTarget.style.color = SL)}>{l.label}</a>
          ))}
          <button onClick={toggle} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{
            background: 'none', border: `1px solid ${GBR}`, color: G,
            width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', transition: 'all 0.2s', padding: 0, flexShrink: 0,
          }}
            onMouseOver={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = GB; el.style.borderColor = G; }}
            onMouseOut={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'none'; el.style.borderColor = GBR; }}>
            {isDark ? '☀' : '🌙'}
          </button>
          <button onClick={onSignIn} style={{
            background: 'none', border: `1px solid ${GBR}`, color: G,
            padding: '0.4rem 1.2rem', borderRadius: 6, cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.04em', transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
            onMouseOver={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = GB; el.style.borderColor = G; }}
            onMouseOut={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'none'; el.style.borderColor = GBR; }}>
            Client Login
          </button>
          <button onClick={onOpenAccount} style={{
            background: G, color: isDark ? BG : '#fff', border: 'none',
            padding: '0.45rem 1.4rem', borderRadius: 6, cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em',
            boxShadow: `0 0 20px ${G}33`, transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
            onMouseOver={e => { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = `0 4px 28px ${G}66`; el.style.transform = 'translateY(-1px)'; }}
            onMouseOut={e => { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = `0 0 20px ${G}33`; el.style.transform = 'none'; }}>
            Open Account
          </button>
        </div>

        {/* Mobile hamburger button */}
        <button className="nav-mobile-btn" onClick={() => setMenuOpen(!menuOpen)} style={{
          display: 'none', background: 'none', border: `1px solid ${GBR}`, color: G,
          width: 40, height: 40, borderRadius: 8, cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', padding: 0,
        }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, zIndex: 199,
          background: isDark ? 'rgba(6,9,19,0.98)' : 'rgba(245,240,232,0.98)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', padding: '2rem',
          gap: 12, overflowY: 'auto',
        }}>
          {[
            { label: 'Private Banking', target: 'private-banking' },
            { label: 'Investments', target: 'investments' },
            { label: 'Security', target: 'security' },
            { label: 'About', target: 'about' },
          ].map(l => (
            <a key={l.label} href={`#${l.target}`} onClick={e => { e.preventDefault(); scrollTo(l.target); setMenuOpen(false); }}
              style={{ color: IV, fontSize: '1.1rem', fontWeight: 600, textDecoration: 'none', padding: '0.8rem 0', borderBottom: `1px solid ${GBR}`, cursor: 'pointer' }}>
              {l.label}
            </a>
          ))}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <button onClick={toggle} style={{
              background: 'none', border: `1px solid ${GBR}`, color: G,
              width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
            }}>
              {isDark ? '☀' : '🌙'}
            </button>
          </div>
          <button onClick={() => { onSignIn(); setMenuOpen(false); }} style={{
            background: 'none', border: `1px solid ${GBR}`, color: G,
            padding: '0.8rem', borderRadius: 8, cursor: 'pointer',
            fontSize: '1rem', fontWeight: 600, marginTop: 8,
          }}>
            Client Login
          </button>
          <button onClick={() => { onOpenAccount(); setMenuOpen(false); }} style={{
            background: G, color: isDark ? BG : '#fff', border: 'none',
            padding: '0.85rem', borderRadius: 8, cursor: 'pointer',
            fontSize: '1rem', fontWeight: 700, boxShadow: `0 0 20px ${G}33`,
          }}>
            Open Account
          </button>
        </div>
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
      `}</style>

      {/* ──────────────── HERO ──────────────── */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '8rem 2rem 0', overflow: 'hidden',
      }}>
        {/* Radial glow */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0,
          background: isDark
            ? 'radial-gradient(ellipse 90% 55% at 50% -15%, rgba(196,160,82,0.065) 0%, transparent 65%)'
            : 'radial-gradient(ellipse 90% 55% at 50% -15%, rgba(139,105,20,0.06) 0%, transparent 65%)' }}/>
        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: isDark ? 0.5 : 0.3,
          backgroundImage: `linear-gradient(${G}08 1px, transparent 1px), linear-gradient(90deg, ${G}08 1px, transparent 1px)`,
          backgroundSize: '80px 80px' }}/>
        {/* Orbs */}
        <div style={{ position: 'absolute', top: '8%', left: '6%', width: 480, height: 480, borderRadius: '50%',
          background: `radial-gradient(circle, ${G}0A 0%, transparent 70%)`,
          filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: '18%', right: '5%', width: 360, height: 360, borderRadius: '50%',
          background: isDark ? 'radial-gradient(circle, rgba(162,178,191,0.03) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(139,105,20,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }}/>  

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 840 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: GB, border: `1px solid ${GBR}`, borderRadius: 100,
            padding: '0.35rem 1rem', marginBottom: '1.8rem',
            fontSize: '0.72rem', color: G, fontWeight: 700, letterSpacing: '0.12em',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: G, boxShadow: `0 0 8px ${G}` }}/>
            PRIVATE BANKING · EST. 2020
          </div>

          <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5.8rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: '1.4rem' }}>
            <span style={{ display: 'block', color: IV }}>Wealth that works</span>
            <span style={{
              display: 'block',
              background: `linear-gradient(135deg, ${G} 0%, #DCC880 50%, ${G} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>as hard as you do.</span>
          </h1>

          <p style={{ fontSize: '1.08rem', color: PT, maxWidth: 540, margin: '0 auto 2.4rem', lineHeight: 1.82 }}>
            Londway Capital is the private bank for founders, executives, and families who demand more — combining
            institutional-grade security with the intelligence of modern technology.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <button onClick={onOpenAccount} style={{
              background: G, color: isDark ? BG : '#fff', border: 'none',
              padding: '0.9rem 2.4rem', borderRadius: 8, fontSize: '0.95rem',
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em',
              boxShadow: `0 0 40px ${G}47`, transition: 'all 0.25s',
            }}
              onMouseOver={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = `0 8px 50px ${G}73`; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'none'; el.style.boxShadow = `0 0 40px ${G}47`; }}>
              Open Your Account
            </button>
            <button onClick={onSignIn} style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: IV,
              border: `1px solid ${GBR}`,
              padding: '0.9rem 2rem', borderRadius: 8, fontSize: '0.95rem',
              fontWeight: 500, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.25s',
            }}
              onMouseOver={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = G; el.style.color = G; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = GBR; el.style.color = IV; }}>
              Sign In to Dashboard
            </button>
          </div>

          {/* Certifications */}
          <div style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap', opacity: isDark ? 0.35 : 0.55, fontSize: '0.7rem', color: PT, letterSpacing: '0.09em', fontWeight: 500 }}>
            {['FDIC INSURED', 'SOC 2 TYPE II', 'PCI DSS L1', 'ISO 27001', 'FINRA MEMBER'].map(c => (
              <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: G }}>✦</span>{c}
              </span>
            ))}
          </div>
        </div>

        {/* City skyline */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 340, zIndex: 0, pointerEvents: 'none' }}>
          <Cityscape/>
        </div>

        {/* ── Dashboard mockup ── */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: '3.5rem', width: '100%', maxWidth: 860, paddingBottom: '3rem' }}>
          <div style={{
            background: isDark ? `linear-gradient(145deg, ${S2} 0%, ${S1} 100%)` : `linear-gradient(145deg, #fff 0%, ${colors.surface2} 100%)`,
            border: `1px solid ${GBR}`, borderRadius: 16, padding: '1.8rem',
            boxShadow: isDark ? '0 40px 120px rgba(0,0,0,0.85), 0 0 60px rgba(196,160,82,0.03)' : '0 40px 120px rgba(0,0,0,0.15), 0 0 60px rgba(139,105,20,0.04)',
          }}>
            {/* Browser chrome */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', paddingBottom: '1.2rem', borderBottom: `1px solid ${GBR}` }}>
              <div style={{ display: 'flex', gap: 7 }}>
                {['#FF5F57','#FEBC2E','#28C840'].map(c => (
                  <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }}/>
                ))}
              </div>
              <div style={{ fontSize: '0.7rem', color: SL, fontWeight: 500, letterSpacing: '0.04em' }}>private.londwaycapital.com</div>
              <div style={{ fontSize: '0.7rem', color: SL }}>🔐 Encrypted</div>
            </div>
            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { l: 'Total Assets', v: '$1,248,592', c: G, d: '+4.2%' },
                { l: 'Portfolio Value', v: '$842,118', c: PT, d: '+11.7%' },
                { l: 'Vault Yield', v: '4.80% APY', c: colors.success, d: 'Active' },
              ].map(m => (
                <div key={m.l} style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '0.9rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}` }}>
                  <div style={{ fontSize: '0.64rem', color: SL, marginBottom: 5, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{m.l}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: '0.65rem', color: colors.success, marginTop: 3 }}>{m.d}</div>
                </div>
              ))}
            </div>
            {/* Chart bars */}
            <div style={{ height: 72, display: 'flex', alignItems: 'flex-end', gap: 5 }}>
              {[30, 45, 36, 60, 46, 72, 54, 82, 64, 90, 74, 96].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0',
                  background: `${G}${Math.round(26 + (i / 12) * 97).toString(16).padStart(2, '0')}` }}/>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STAT RULE ── */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent 0%, ${GBR} 20%, rgba(196,160,82,0.22) 50%, ${GBR} 80%, transparent 100%)`, margin: '0 3rem' }}/>
      <section style={{ padding: '3.5rem 3rem', maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
        {stats.map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: G, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: '0.75rem', color: SL, marginTop: 8, letterSpacing: '0.09em', textTransform: 'uppercase', fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </section>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent 0%, ${GBR} 20%, rgba(196,160,82,0.22) 50%, ${GBR} 80%, transparent 100%)`, margin: '0 3rem' }}/>

      {/* ──────────────── DIGITAL BANKING ──────────────── */}
      <PhotoSection
        id="private-banking"
        photoUrl="https://images.pexels.com/photos/4482903/pexels-photo-4482903.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1"
        bgPosition="center 40%"
        align="right"
        label="PRIVATE BANKING"
        headline={<>Manage your money<br/><span style={{ color: G }}>anywhere, anytime.</span></>}
        body="Access your complete financial life from any device. Real-time balances, instant transfers, international payments — all protected by biometric authentication and end-to-end encryption."
      />

      {/* ──────────────── FEATURES / INVESTMENTS ──────────────── */}
      <section id="investments" style={{ padding: '7rem 2rem', maxWidth: 1100, margin: '0 auto', scrollMarginTop: 80 }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ fontSize: '0.7rem', color: G, fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase' }}>CAPABILITIES</div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', color: IV, marginBottom: '0.9rem' }}>
            Private banking,<br/><span style={{ color: G }}>perfected.</span>
          </h2>
          <p style={{ color: SL, maxWidth: 460, margin: '0 auto', lineHeight: 1.8 }}>
            Every feature engineered for clients who expect the absolute best in security, performance, and service.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ background: S2, border: `1px solid ${GBR}`, borderRadius: 14, padding: '1.8rem', transition: 'all 0.3s', cursor: 'default' }}
              onMouseOver={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = G; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = isDark ? '0 18px 48px rgba(0,0,0,0.5)' : '0 18px 48px rgba(0,0,0,0.1)'; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = GBR; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: GB, border: `1px solid ${GBR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
                {f.icon}
              </div>
              <h3 style={{ color: IV, fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p style={{ color: SL, fontSize: '0.87rem', lineHeight: 1.72, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────── VAULT / SECURITY SPLIT ──────────────── */}
      <section id="security" style={{
        padding: '6rem 3rem', scrollMarginTop: 70,
        background: isDark
          ? `linear-gradient(180deg, transparent 0%, rgba(196,160,82,0.018) 50%, transparent 100%)`
          : `linear-gradient(180deg, transparent 0%, rgba(139,105,20,0.03) 50%, transparent 100%)`,
        borderTop: `1px solid ${GBR}`, borderBottom: `1px solid ${GBR}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
          {/* Text */}
          <div>
            <div style={{ fontSize: '0.7rem', color: G, fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1.2rem', textTransform: 'uppercase' }}>THE LONDWAY VAULT</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, color: IV, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '1.5rem' }}>
              Your wealth.<br/>Impenetrably<br/><span style={{ color: G }}>protected.</span>
            </h2>
            <p style={{ color: SL, lineHeight: 1.85, marginBottom: '2rem', fontSize: '0.93rem' }}>
              Your deposits are guarded by the same cryptographic architecture trusted by central banks and sovereign wealth funds.
              Every byte encrypted. Every transaction verified. Every anomaly investigated in milliseconds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                'Military-grade AES-256 encryption at rest & in transit',
                'Multi-factor authentication with biometric verification',
                'Real-time Anti fraud detection — 1,400+ signals per second',
                'SOC 2 Type II and ISO 27001 certified infrastructure',
                'FDIC insured up to $250,000 per depositor',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.88rem', color: PT }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: GB, border: `1px solid ${GBR}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.5rem', color: G }}>✓</span>
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          {/* Vault SVG */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 260, height: 260, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '-30px', borderRadius: '50%', background: `radial-gradient(circle, rgba(196,160,82,0.06) 0%, transparent 70%)` }}/>
              <VaultDoor/>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── TESTIMONIALS ──────────────── */}
      <section style={{ padding: '7rem 2rem', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', color: G, fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase' }}>CLIENT VOICES</div>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: IV, letterSpacing: '-0.02em', marginBottom: '3rem' }}>
          Trusted by those who<br/>demand <span style={{ color: G }}>excellence.</span>
        </h2>
        <div style={{ position: 'relative', minHeight: 240 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{
              position: i === tIdx ? 'relative' : 'absolute',
              top: 0, left: 0, right: 0,
              opacity: i === tIdx ? 1 : 0,
              transition: 'opacity 0.7s ease',
              pointerEvents: i === tIdx ? 'auto' : 'none',
            }}>
              <div style={{ background: S2, border: `1px solid ${GBR}`, borderRadius: 16, padding: '2.5rem' }}>
                <div style={{ fontSize: '2.5rem', color: G, opacity: 0.22, lineHeight: 1, marginBottom: '0.4rem', fontFamily: 'Georgia, serif' }}>&ldquo;</div>
                <p style={{ fontSize: '1rem', color: PT, lineHeight: 1.82, marginBottom: '1.8rem', fontStyle: 'italic' }}>{t.q}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${G}99, rgba(162,178,191,0.5))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.88rem', color: BG }}>{t.av}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: IV, fontSize: '0.88rem' }}>{t.name}</div>
                    <div style={{ color: SL, fontSize: '0.78rem' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 22 }}>
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setTIdx(i)} style={{ width: i === tIdx ? 20 : 7, height: 7, borderRadius: 100, border: 'none', background: i === tIdx ? G : 'rgba(196,160,82,0.18)', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }}/>
          ))}
        </div>
      </section>

      {/* ──────────────── ACCOUNT TIERS ──────────────── */}
      <section id="accounts" style={{ padding: '6rem 2rem', borderTop: `1px solid ${GBR}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: G, fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase' }}>MEMBERSHIP TIERS</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: IV, letterSpacing: '-0.02em' }}>
              Choose your <span style={{ color: G }}>membership</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {tiers.map((tier, i) => (
              <div key={i} style={{
                background: tier.featured ? S3 : S2,
                border: `1px solid ${tier.featured ? G : GBR}`,
                borderRadius: 16, padding: '2rem',
                boxShadow: tier.featured ? `0 0 60px ${G}0F` : 'none',
              }}>
                <div style={{ display: 'inline-block', background: `${tier.tagClr}18`, border: `1px solid ${tier.tagClr}44`, borderRadius: 100, padding: '0.25rem 0.85rem', fontSize: '0.7rem', fontWeight: 700, color: tier.tagClr, marginBottom: '1.2rem', letterSpacing: '0.07em' }}>
                  {tier.tag}
                </div>
                <h3 style={{ color: IV, fontWeight: 700, fontSize: '1.15rem', marginBottom: '1.4rem' }}>{tier.name}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tier.items.map(it => (
                    <li key={it} style={{ display: 'flex', gap: 10, fontSize: '0.88rem', color: SL, alignItems: 'center' }}>
                      <span style={{ color: tier.tagClr, fontSize: '0.65rem', flexShrink: 0 }}>✦</span>{it}
                    </li>
                  ))}
                </ul>
                <button onClick={onSignIn} style={{
                  width: '100%', background: tier.featured ? G : 'transparent',
                  color: tier.featured ? (isDark ? BG : '#fff') : tier.tagClr,
                  border: `1px solid ${tier.featured ? G : tier.tagClr + '44'}`,
                  borderRadius: 8, padding: '0.75rem', fontWeight: 700,
                  fontSize: '0.88rem', cursor: 'pointer', letterSpacing: '0.02em', transition: 'all 0.2s',
                }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.82'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── ABOUT LONDWAY CAPITAL ──────────────── */}
      <section id="about" style={{
        padding: '7rem 2rem', scrollMarginTop: 70,
        background: isDark
          ? `linear-gradient(180deg, transparent 0%, rgba(196,160,82,0.012) 50%, transparent 100%)`
          : `linear-gradient(180deg, transparent 0%, rgba(139,105,20,0.025) 50%, transparent 100%)`,
        borderTop: `1px solid ${GBR}`, borderBottom: `1px solid ${GBR}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: G, fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase' }}>ABOUT LONDWAY CAPITAL</div>
            <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', color: IV, marginBottom: '0.9rem' }}>
              Built for those who<br/><span style={{ color: G }}>demand excellence.</span>
            </h2>
            <p style={{ color: PT, maxWidth: 560, margin: '0 auto', lineHeight: 1.85, fontSize: '1rem' }}>
              Londway Capital was founded with a singular vision: to redefine private banking for the modern era. We combine centuries of financial wisdom with cutting-edge technology to serve founders, executives, and families worldwide.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: '🏛', title: 'Heritage & Trust', desc: 'Regulated by the OCC, FDIC insured, and trusted by 2.4 million members across 195 countries. Our commitment to fiduciary duty is unwavering.' },
              { icon: '⚡', title: 'Technology Forward', desc: 'AI-driven insights, real-time analytics, and military-grade encryption. Every feature is engineered for speed, security, and sophistication.' },
              { icon: '🤝', title: 'White-Glove Service', desc: 'Dedicated wealth advisors available 24/7, priority concierge banking, and bespoke financial strategies tailored to your goals.' },
            ].map((item, i) => (
              <div key={i} style={{
                background: S2, border: `1px solid ${GBR}`, borderRadius: 16, padding: '2rem',
                textAlign: 'center', transition: 'all 0.3s',
              }}
                onMouseOver={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = G; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = isDark ? '0 18px 48px rgba(0,0,0,0.5)' : '0 18px 48px rgba(0,0,0,0.1)'; }}
                onMouseOut={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = GBR; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{ color: IV, fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.7rem' }}>{item.title}</h3>
                <p style={{ color: PT, fontSize: '0.88rem', lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: '3.5rem', flexWrap: 'wrap' }}>
            {[
              { n: 'Est. 2020', l: 'Founded' },
              { n: '$89B+', l: 'Assets Under Custody' },
              { n: '2.4M', l: 'Global Members' },
              { n: '99.99%', l: 'Platform Uptime' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: G, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: '0.7rem', color: SL, marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── LONDWAY CARDS ──────────────── */}
      <PhotoSection
        photoUrl="https://images.pexels.com/photos/50987/money-card-business-credit-card-50987.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1"
        bgPosition="center 55%"
        align="left"
        height={600}
        label="LONDWAY CARDS"
        headline={<>Your card, your<br/><span style={{ color: G }}>privileges worldwide.</span></>}
        body="Premium metal cards accepted globally. Zero foreign transaction fees, unlimited cashback, airport lounge access, and real-time spending controls — built for people who move."
        footer={
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={onSignIn} style={{
              background: G, color: isDark ? BG : '#fff', border: 'none',
              padding: '0.8rem 1.8rem', borderRadius: 8, fontSize: '0.9rem',
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em',
              boxShadow: `0 0 30px ${G}4D`, transition: 'all 0.22s',
            }}
              onMouseOver={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = `0 8px 40px ${G}73`; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'none'; el.style.boxShadow = `0 0 30px ${G}4D`; }}>
              Apply for Debit Card
            </button>
            <button onClick={onSignIn} style={{
              background: `${G}14`, color: G,
              border: `1px solid ${G}4D`,
              padding: '0.8rem 1.8rem', borderRadius: 8, fontSize: '0.9rem',
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em',
              backdropFilter: 'blur(8px)', transition: 'all 0.22s',
            }}
              onMouseOver={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = `${G}26`; el.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = `${G}14`; el.style.transform = 'none'; }}>
              Apply for Credit Card
            </button>
          </div>
        }
      />

      {/* ──────────────── THE LONDWAY DIFFERENCE ──────────────── */}
      <PhotoSection
        photoUrl="https://images.pexels.com/photos/351264/pexels-photo-351264.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1"
        bgPosition="center 40%"
        align="left"
        label="THE LONDWAY DIFFERENCE"
        headline={<>Bank with confidence.<br/><span style={{ color: G }}>Grow with Londway.</span></>}
        body="Join 2.4 million members who've elevated their financial lives. When you bank with Londway Capital, you're not just managing money — you're building a legacy that lasts generations."
      />

      {/* ──────────────── FINAL CTA ──────────────── */}
      <section style={{ padding: '8rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${G}0A 0%, transparent 70%)` }}/>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', color: G, fontWeight: 700, letterSpacing: '0.15em', marginBottom: '1.4rem', textTransform: 'uppercase' }}>BEGIN TODAY</div>
          <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, color: IV, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.2rem' }}>
            The finest banking<br/>experience<br/><span style={{ color: G }}>awaits you.</span>
          </h2>
          <p style={{ color: SL, lineHeight: 1.8, maxWidth: 460, margin: '0 auto 2.5rem' }}>
            Join 2.4 million discerning members. Take control of your financial destiny with a bank built for people who refuse to settle.
          </p>
          <button onClick={onOpenAccount} style={{
            background: G, color: isDark ? BG : '#fff', border: 'none',
            padding: '1rem 3rem', borderRadius: 8, fontSize: '1rem', fontWeight: 700,
            cursor: 'pointer', boxShadow: `0 0 50px ${G}47`, transition: 'all 0.25s', letterSpacing: '0.03em',
          }}
            onMouseOver={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 14px 60px ${G}73`; }}
            onMouseOut={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'none'; el.style.boxShadow = `0 0 50px ${G}47`; }}>
            Open Your Account — It&apos;s Free
          </button>
          <p style={{ color: SL, fontSize: '0.76rem', marginTop: '1rem' }}>No credit check · No monthly fee · 5-minute setup</p>
        </div>
      </section>

      {/* ──────────────── FOOTER ──────────────── */}
      <footer style={{ borderTop: `1px solid ${GBR}`, padding: '3rem', background: isDark ? S1 : colors.surface2 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: '2.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="15.5" stroke={G} strokeWidth="1.3" fill="none"/>
                  <path d="M11,27 V15 C11,6.5 25,6.5 25,15 V27" stroke={G} strokeWidth="2" fill={`${G}08`} strokeLinejoin="round"/>
                  <line x1="7.5" y1="27" x2="28.5" y2="27" stroke={G} strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <span style={{ fontWeight: 700, color: IV, fontSize: '0.88rem', letterSpacing: '0.09em' }}>LONDWAY <span style={{ color: G }}>CAPITAL</span></span>
              </div>
              <p style={{ color: SL, fontSize: '0.8rem', lineHeight: 1.7, maxWidth: 200 }}>The private bank for the next generation of wealth creation.</p>
            </div>
            {[
              { title: 'Products', links: ['Checking', 'Savings Vaults', 'Investments', 'Business Banking'] },
              { title: 'Company', links: ['About Londway', 'Careers', 'Press Room', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms', 'Security', 'Disclosures'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ color: IV, fontWeight: 600, fontSize: '0.8rem', marginBottom: 14, letterSpacing: '0.06em' }}>{col.title}</div>
                {col.links.map(l => (
                  <div key={l} style={{ color: SL, fontSize: '0.8rem', marginBottom: 9, cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseOver={e => (e.currentTarget.style.color = G)}
                    onMouseOut={e => (e.currentTarget.style.color = SL)}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${GBR}`, paddingTop: '1.4rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ color: SL, fontSize: '0.72rem' }}>© 2026 Londway Capital, Inc. All rights reserved. FDIC Member.</div>
            <div style={{ color: SL, fontSize: '0.72rem' }}>Regulated by OCC · FINRA Member · SIPC Protected</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
