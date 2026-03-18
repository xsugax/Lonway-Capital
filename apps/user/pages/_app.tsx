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
        if (parsed && parsed.token) setUser(parsed);
      }
    } catch {}
    setHydrated(true);
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
    setUser(u);
    try { localStorage.setItem('londway_session', JSON.stringify(u)); } catch {}
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
          <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
          <meta httpEquiv="Pragma" content="no-cache" />
          <meta httpEquiv="Expires" content="0" />
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
          <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        {!hydrated ? null : (
          showLoader ? (
            <BankLoader onDone={() => setShowLoader(false)} />
          ) : user ? (
            user.role === 'admin' && typeof window !== 'undefined' && window.location.pathname !== '/admin' ? null : (
              <Layout onLogout={handleLogout} userName={user.name}>
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
      </LangProvider>
    </ThemeProvider>
  );
}
