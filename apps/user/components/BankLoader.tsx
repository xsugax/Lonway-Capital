'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const MESSAGES = [
  'Establishing encrypted connection\u2026',
  'Verifying security protocols\u2026',
  'Loading financial profile\u2026',
  'Synchronizing account data\u2026',
  'Welcome to Londway Capital.',
];

// Floating gold particle
function Particle({ x, y, size, dur, delay, color }: { x: number; y: number; size: number; dur: number; delay: number; color: string }) {
  return (
    <div style={{
      position: 'absolute', left: x + '%', top: y + '%',
      width: size, height: size, borderRadius: '50%',
      background: color, opacity: 0,
      animation: `loaderFloat ${dur}s ${delay}s ease-in-out infinite`,
    }}/>
  );
}

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  x: Math.round(5 + (i * 53) % 90),
  y: Math.round(10 + (i * 37) % 80),
  size: 1 + (i % 3),
  dur: 3 + (i % 4),
  delay: -(i * 0.7),
}));

export default function BankLoader({ onDone }: { onDone: () => void }) {
  const { theme, colors } = useTheme();
  const dark = theme === 'dark';
  const G = colors.gold;
  const ink = colors.text;
  const line = dark ? 'rgba(196,160,82,0.16)' : 'rgba(139,105,20,0.22)';
  const lineFaint = dark ? 'rgba(196,160,82,0.07)' : 'rgba(139,105,20,0.14)';
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const DURATION = 2800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(100, ((now - start) / DURATION) * 100));
      setProgress(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setFading(true);
        setTimeout(onDone, 750);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onDone]);

  const msgIdx = Math.min(MESSAGES.length - 1, Math.floor((progress / 100) * MESSAGES.length));
  const spokes = [0, 60, 120, 180, 240, 300];
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const dash = (progress / 100) * CIRC;
  const spokeSpeed = Math.max(0.6, 3 - (progress / 100) * 2.4);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: colors.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.75s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${lineFaint} 1px,transparent 1px),linear-gradient(90deg,${lineFaint} 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }}/>

      {/* Glow */}
      <div style={{
        position: 'absolute', width: 700, height: 700, borderRadius: '50%',
        background: `radial-gradient(circle,${dark ? 'rgba(196,160,82,0.055)' : 'rgba(139,105,20,0.12)'} 0%,transparent 65%)`,
        filter: 'blur(60px)',
      }}/>

      {/* Particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {PARTICLES.map((p, i) => <Particle key={i} {...p} color={G}/>)}
      </div>

      {/* Corner accent lines */}
      {[[0,0,'0 0 0 1px','right bottom'],[1,0,'0 0 1px 0','left bottom'],[0,1,'0 1px 0 0','right top'],[1,1,'1px 0 0 0','left top']].map(([cx,cy,br,_to],i) => (
        <div key={i} style={{
          position: 'absolute',
          left: cx ? undefined : 32,
          right: cx ? 32 : undefined,
          top: cy ? undefined : 32,
          bottom: cy ? 32 : undefined,
          width: 40, height: 40,
          borderColor: line,
          borderStyle: 'solid',
          borderWidth: br as string,
        }}/>
      ))}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Main vault + progress ring SVG */}
        <svg width="172" height="172" viewBox="0 0 172 172">
          <defs>
            <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={dark ? '#E8D080' : '#C4A052'}/>
              <stop offset="100%" stopColor={G}/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>

          {/* Outer track */}
          <circle cx="86" cy="86" r={R} fill="none" stroke={lineFaint} strokeWidth="2.5"/>
          {/* Progress arc */}
          <circle cx="86" cy="86" r={R} fill="none"
            stroke="url(#pg)" strokeWidth="2.5"
            strokeDasharray={`${dash} ${CIRC}`}
            strokeLinecap="round"
            transform="rotate(-90 86 86)"
            filter="url(#glow)"
            style={{ transition: 'stroke-dasharray 0.08s linear' }}
          />

          {/* Vault door outer rect */}
          <rect x="46" y="46" width="80" height="80" rx="7"
            fill={colors.goldBg} stroke={line} strokeWidth="1.2"/>
          {/* Vault door ring */}
          <circle cx="86" cy="86" r="30"
            fill={colors.goldBg} stroke={line} strokeWidth="1.2"/>
          <circle cx="86" cy="86" r="21"
            fill={colors.goldBg} stroke={lineFaint} strokeWidth="0.8"/>

          {/* Rotating spokes group */}
          <g style={{ transformOrigin: '86px 86px', animation: `loaderVaultSpin ${spokeSpeed}s linear infinite` }}>
            {spokes.map(angle => {
              const rad = (angle * Math.PI) / 180;
              return (
                <line key={angle}
                  x1={86 + 21 * Math.cos(rad)} y1={86 + 21 * Math.sin(rad)}
                  x2={86 + 29 * Math.cos(rad)} y2={86 + 29 * Math.sin(rad)}
                  stroke={G} strokeWidth="4" strokeLinecap="round" opacity="0.32"/>
              );
            })}
          </g>

          {/* Center dot */}
          <circle cx="86" cy="86" r="6" fill={G} opacity="0.55"/>
          <circle cx="86" cy="86" r="2.8" fill={G} opacity="1"/>

          {/* Handle */}
          <circle cx="112" cy="86" r="8"
            fill={colors.goldBg} stroke={G} strokeWidth="1.2" opacity="0.45"/>
          <circle cx="112" cy="86" r="3.5" fill={G} opacity="0.22"/>

          {/* Corner bolts */}
          {[[50,50],[122,50],[50,122],[122,122]].map(([bx,by]) => (
            <circle key={`${bx}${by}`} cx={bx} cy={by} r="3"
              fill={colors.goldBg} stroke={G} strokeWidth="0.7" opacity="0.45"/>
          ))}

          {/* Tick marks around progress ring */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(angle => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const inner = 48, outer = angle % 90 === 0 ? 44 : 46;
            return (
              <line key={`t${angle}`}
                x1={86 + inner * Math.cos(rad)} y1={86 + inner * Math.sin(rad)}
                x2={86 + outer * Math.cos(rad)} y2={86 + outer * Math.sin(rad)}
                stroke={line} strokeWidth={angle % 90 === 0 ? 1.5 : 0.8}/>
            );
          })}
        </svg>

        {/* Name */}
        <div style={{ textAlign: 'center', marginTop: -6, marginBottom: 30 }}>
          <div style={{
            fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.2em',
            color: ink, fontFamily: "'Inter',sans-serif",
          }}>
            LONDWAY<span style={{ color: G }}> CAPITAL</span>
          </div>
          <div style={{
            fontSize: '0.58rem', color: dark ? 'rgba(196,160,82,0.55)' : G,
            letterSpacing: '0.26em', marginTop: 5, fontFamily: "'Inter',sans-serif",
          }}>PRIVATE BANKING</div>
        </div>

        {/* Progress bar track */}
        <div style={{ width: 220, marginBottom: 14 }}>
          <div style={{
            height: 2, background: lineFaint,
            borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: `linear-gradient(90deg, ${line}, ${G}, ${dark ? 'rgba(220,200,128,0.9)' : G})`,
              width: `${progress}%`,
              transition: 'width 0.08s linear',
              boxShadow: `0 0 10px ${dark ? 'rgba(196,160,82,0.55)' : 'rgba(139,105,20,0.35)'}`,
            }}/>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 8,
            fontSize: '0.6rem', color: dark ? 'rgba(196,160,82,0.45)' : G,
            fontFamily: "'Inter',sans-serif", letterSpacing: '0.05em',
          }}>
            <span>SECURE</span>
            <span>{Math.round(progress)}%</span>
            <span>ENCRYPTED</span>
          </div>
        </div>

        {/* Status message */}
        <div style={{
          fontSize: '0.7rem', color: colors.textMuted,
          letterSpacing: '0.05em', fontFamily: "'Inter',sans-serif",
          minHeight: 19, textAlign: 'center',
          transition: 'opacity 0.3s',
        }}>
          {MESSAGES[msgIdx]}
        </div>

        {/* Security badges row */}
        <div style={{
          display: 'flex', gap: 16, marginTop: 32, opacity: dark ? 0.28 : 0.55,
          fontSize: '0.55rem', color: G, letterSpacing: '0.1em',
          fontFamily: "'Inter',sans-serif",
        }}>
          {['FDIC', 'SOC 2', 'AES-256', 'PCI DSS'].map(b => (
            <span key={b} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 7 }}>&#9632;</span>{b}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes loaderVaultSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes loaderFloat {
          0%,100% { opacity:0; transform:translateY(0px); }
          20%     { opacity:0.35; }
          50%     { opacity:0.18; transform:translateY(-22px); }
          80%     { opacity:0.3; }
        }
      `}</style>
    </div>
  );
}
