import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Layout from '../components/Layout';
import Login from '../components/Login';
import Welcome from '../components/Welcome';
import BankLoader from '../components/BankLoader';
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LangProvider } from '../contexts/LanguageContext';

// Only one export default function allowed
export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<{ name: string; token: string; role: string } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    setHydrated(true);
  }, []);

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
    setShowLogin(false);
    setShowRegister(false);
  }
  function handleLogout() {
    setUser(null);
  }

  return (
    <ThemeProvider>
      <LangProvider>
        <Head>
          <title>Londway Capital — Premium Private Banking</title>
        </Head>
        {!hydrated ? null : (
          showLoader ? (
            <BankLoader onDone={() => setShowLoader(false)} />
          ) : user ? (
            user.role === 'admin' && typeof window !== 'undefined' && window.location.pathname !== '/admin' ? null : (
              <Layout onLogout={handleLogout} userName={user.name}>
                <Component {...pageProps} user={user} />
                {/* Fallback chat button for visibility */}
                <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
                  <button
                    style={{
                      background: '#FFD700',
                      color: '#181818',
                      border: 'none',
                      borderRadius: '50%',
                      width: 56,
                      height: 56,
                      boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
                      fontSize: '2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => {
                      if (window._smartsupp && window._smartsupp.api) {
                        window._smartsupp.api.openChat();
                      }
                    }}
                    title="Chat with support"
                  >💬</button>
                </div>
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
