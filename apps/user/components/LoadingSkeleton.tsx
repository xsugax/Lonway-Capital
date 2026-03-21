import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const shimmer = `
@keyframes lc-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

function Bone({ width = '100%', height = 16, radius = 8, style }: { width?: string | number; height?: number; radius?: number; style?: React.CSSProperties }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const base = dark ? '#1a2244' : '#e5e7eb';
  const shine = dark ? '#253060' : '#f3f4f6';
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${base} 25%, ${shine} 50%, ${base} 75%)`,
        backgroundSize: '800px 100%',
        animation: 'lc-shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function CardSkeleton() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const card = dark ? '#0D1628' : '#fff';
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ background: card, borderRadius: 18, padding: 28, border: `1px solid ${dark ? 'rgba(196,160,82,0.1)' : 'rgba(0,0,0,0.06)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Bone width={120} height={14} />
          <Bone width={60} height={14} />
        </div>
        <Bone width="70%" height={32} style={{ marginBottom: 16 }} />
        <Bone width="50%" height={12} style={{ marginBottom: 12 }} />
        <Bone width="90%" height={12} />
      </div>
    </>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const card = dark ? '#0D1628' : '#fff';
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ background: card, borderRadius: 14, padding: 20, border: `1px solid ${dark ? 'rgba(196,160,82,0.1)' : 'rgba(0,0,0,0.06)'}` }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <Bone width="25%" height={14} />
          <Bone width="20%" height={14} />
          <Bone width="15%" height={14} />
          <Bone width="20%" height={14} />
          <Bone width="20%" height={14} />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <Bone width="25%" height={12} />
            <Bone width="20%" height={12} />
            <Bone width="15%" height={12} />
            <Bone width="20%" height={12} />
            <Bone width="20%" height={12} />
          </div>
        ))}
      </div>
    </>
  );
}

export function DashboardSkeleton() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const card = dark ? '#0D1628' : '#fff';
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ padding: '24px 0' }}>
        {/* Hero */}
        <div style={{ background: card, borderRadius: 18, padding: 32, marginBottom: 24, border: `1px solid ${dark ? 'rgba(196,160,82,0.1)' : 'rgba(0,0,0,0.06)'}` }}>
          <Bone width={200} height={20} style={{ marginBottom: 12 }} />
          <Bone width={160} height={40} style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <Bone width={100} height={36} radius={10} />
            <Bone width={100} height={36} radius={10} />
          </div>
        </div>
        {/* Cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        {/* Chart placeholder */}
        <div style={{ background: card, borderRadius: 18, padding: 28, border: `1px solid ${dark ? 'rgba(196,160,82,0.1)' : 'rgba(0,0,0,0.06)'}` }}>
          <Bone width={140} height={16} style={{ marginBottom: 20 }} />
          <Bone width="100%" height={200} radius={12} />
        </div>
      </div>
    </>
  );
}

export function PageSkeleton() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const card = dark ? '#0D1628' : '#fff';
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Bone width={180} height={24} />
          <Bone width={120} height={36} radius={10} />
        </div>
        <div style={{ background: card, borderRadius: 18, padding: 28, marginBottom: 20, border: `1px solid ${dark ? 'rgba(196,160,82,0.1)' : 'rgba(0,0,0,0.06)'}` }}>
          <Bone width="60%" height={16} style={{ marginBottom: 16 }} />
          <Bone width="40%" height={14} style={{ marginBottom: 12 }} />
          <Bone width="80%" height={14} style={{ marginBottom: 12 }} />
          <Bone width="55%" height={14} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </>
  );
}

export default function LoadingSkeleton({ variant = 'page' }: { variant?: 'dashboard' | 'page' | 'table' | 'card' }) {
  switch (variant) {
    case 'dashboard': return <DashboardSkeleton />;
    case 'table': return <TableSkeleton />;
    case 'card': return <CardSkeleton />;
    default: return <PageSkeleton />;
  }
}
