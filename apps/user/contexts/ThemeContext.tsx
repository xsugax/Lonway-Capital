'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  navBg: string;
  border: string;
  borderStrong: string;
  gold: string;
  goldDim: string;
  goldBg: string;
  ivory: string;
  text: string;
  textMuted: string;
  textFaint: string;
  success: string;
  danger: string;
  inputBg: string;
  inputBorder: string;
  overlayBg: string;
}

const DARK: ThemeColors = {
  bg: '#060913',
  surface: '#0D1628',
  surface2: '#091220',
  navBg: '#09101F',
  border: 'rgba(196,160,82,0.1)',
  borderStrong: 'rgba(196,160,82,0.22)',
  gold: '#C4A052',
  goldDim: 'rgba(196,160,82,0.65)',
  goldBg: 'rgba(196,160,82,0.07)',
  ivory: '#EAE0D0',
  text: '#EAE0D0',
  textMuted: '#A2B2BF',
  textFaint: '#60707E',
  success: '#3D9E7A',
  danger: '#ff4d4f',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(196,160,82,0.18)',
  overlayBg: 'rgba(6,9,19,0.85)',
};

const LIGHT: ThemeColors = {
  bg: '#F5F0E8',
  surface: '#FFFFFF',
  surface2: '#EDE8DF',
  navBg: '#FFFFFF',
  border: 'rgba(139,105,20,0.15)',
  borderStrong: 'rgba(139,105,20,0.3)',
  gold: '#8B6914',
  goldDim: 'rgba(139,105,20,0.65)',
  goldBg: 'rgba(139,105,20,0.08)',
  ivory: '#1A1505',
  text: '#1A1505',
  textMuted: '#4A5568',
  textFaint: '#718096',
  success: '#1E7A52',
  danger: '#C53030',
  inputBg: 'rgba(0,0,0,0.04)',
  inputBorder: 'rgba(139,105,20,0.25)',
  overlayBg: 'rgba(245,240,232,0.92)',
};

interface ThemeCtx {
  theme: Theme;
  colors: ThemeColors;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', colors: DARK, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('londway_theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {}
  }, []);

  const toggle = () => {
    setTheme(t => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('londway_theme', next); } catch {}
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ theme, colors: theme === 'dark' ? DARK : LIGHT, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() { return useContext(Ctx); }
