import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Layout from '../components/Layout';
import Login from '../components/Login';
import Welcome from '../components/Welcome';
import BankLoader from '../components/BankLoader';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LangProvider } from '../contexts/LanguageContext';
import { trackPageVisit } from '../lib/trackVisit';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Only one export default function allowed
export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<{ name: string; token: string; role: string; email: string } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showLoader, setShowLoader] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('activate=')) return false;
    return true;
  });

  const router = useRouter();

  useEffect(() => {
    // Restore session from localStorage on first load
    try {
      const saved = localStorage.getItem('londway_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token) {
          // Session expires after 24 hours
          const SESSION_MAX_MS = 24 * 60 * 60 * 1000;
          if (parsed.loginAt && Date.now() - parsed.loginAt > SESSION_MAX_MS) {
            localStorage.removeItem('londway_session');
          } else {
            // Re-validate account status — block deleted/frozen users from restoring session
            let blocked = false;
            try {
              const accts = JSON.parse(localStorage.getItem('londway_accounts') || '[]');
              const acct = accts.find((a: any) => a.email === parsed.email);
              if (acct?.deleted || acct?.frozen) { blocked = true; localStorage.removeItem('londway_session'); }
            } catch {}
            if (!blocked) setUser(parsed);
          }
        }
      }
    } catch {}
    setHydrated(true);
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    // Track initial page visit
    trackPageVisit(window.location.pathname + window.location.search);
    // Auto-open login modal when activation link is detected
    if (typeof window !== 'undefined' && window.location.search.includes('activate=')) {
      setShowLogin(true);
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => trackPageVisit(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  useEffect(() => {
    if (
      user &&
      user.role === 'admin' &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/admin'
    ) {
      window.location.href = '/admin';
    }
  }, [user]);

  function handleLogin(u: any) {
    const session = { ...u, loginAt: Date.now() };
    setUser(session);
    try { localStorage.setItem('londway_session', JSON.stringify(session)); } catch {}
    setShowLogin(false);
    setShowRegister(false);
  }
  function handleLogout() {
    setUser(null);
    try { localStorage.removeItem('londway_session'); } catch {}
  }

  return (
    <ThemeProvider>
      <LangProvider>
        <Head>
          <title>Londway Capital — Premium Private Banking</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
          <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        </Head>
        {/* SEO: Render Welcome in pre-rendered HTML so Google can index content */}
        {!hydrated ? (
          <Welcome onSignIn={() => {}} onOpenAccount={() => {}} />
        ) : (
          showLoader ? (
            <BankLoader onDone={() => setShowLoader(false)} />
          ) : user ? (
            user.role === 'admin' && typeof window !== 'undefined' && window.location.pathname !== '/admin' ? null : (
              <Layout onLogout={handleLogout} userName={user.name} userEmail={user.email}>
                <Component {...pageProps} user={user} />
              </Layout>
            )
          ) : (
            <>
              <Welcome onSignIn={() => setShowLogin(true)} onOpenAccount={() => setShowRegister(true)} />
              {showLogin && (
                <Login onLogin={handleLogin} onClose={() => setShowLogin(false)} modal mode="login"
                  onSwitchMode={(m) => { setShowLogin(m === 'login'); setShowRegister(m === 'register'); }} />
              )}
              {showRegister && (
                <Login onLogin={handleLogin} onClose={() => setShowRegister(false)} modal mode="register"
                  onSwitchMode={(m) => { setShowLogin(m === 'login'); setShowRegister(m === 'register'); }} />
              )}
            </>
          )
        )}
        {/* Fallback for crawlers that don't execute JS */}
        <noscript>
          <div style={{ maxWidth: 800, margin: '80px auto', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#0D1628' }}>
            <h1>Londway Capital — Premium Private Banking</h1>
            <p>Londway Capital is the private bank for founders, executives, and families who demand more — combining institutional-grade security with the intelligence of modern technology.</p>
            <h2>Our Services</h2>
            <ul>
              <li>Institutional Security — Military-grade AES-256 encryption, biometric authentication</li>
              <li>Intelligent Investing — AI-driven portfolio management</li>
              <li>Frictionless Transfers — Near-instant payments in 195 currencies</li>
              <li>Premium Accounts — High-yield Savings Vaults (4.8% APY)</li>
              <li>Financial Intelligence — Personalized health scores and analytics</li>
              <li>White-Glove Service — 24/7 dedicated wealth advisors</li>
            </ul>
            <p>Trusted by 2.4 million members across 195 countries. FDIC Insured. SOC 2 Type II Certified.</p>
            <p>Visit <a href="https://londwaycapital.com">londwaycapital.com</a> to open your account.</p>
          </div>
        </noscript>
      </LangProvider>
    </ThemeProvider>
  );
}
