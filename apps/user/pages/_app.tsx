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

type UserType = { name: string; token: string; role: string };

export default function MyApp({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem('londway_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (user) window.localStorage.setItem('londway_user', JSON.stringify(user));
  }, [user]);

  const handleLogin = (u: UserType) => {
    setUser(u);
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleLogout = () => {
    setUser(null);
    window.localStorage.removeItem('londway_user');
  };

  if (!hydrated) return null;

  return (
    <ThemeProvider>
      <LangProvider>
        <Head>
          <title>Londway Capital — Premium Private Banking</title>
        </Head>
        {showLoader ? (
          <BankLoader onDone={() => setShowLoader(false)} />
        ) : user ? (
          (() => {
            if (user.role === 'admin' && typeof window !== 'undefined' && window.location.pathname !== '/admin') {
              window.location.href = '/admin';
              return null;
            }
            const PageComponent = Component as React.ComponentType<any>;
            return (
              <Layout onLogout={handleLogout} userName={user.name}>
                <PageComponent {...pageProps} user={user} />
              </Layout>
            );
          })()
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
        )}
      </LangProvider>
    </ThemeProvider>
  );
}
