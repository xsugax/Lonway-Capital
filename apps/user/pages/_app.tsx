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
import { startInactivityTimer, stopInactivityTimer } from '../lib/crypto';
import { initStealth, patchLocalStorage } from '../lib/stealth';

// Patch localStorage BEFORE any component renders — encrypts all londway_* keys
if (typeof window !== 'undefined') patchLocalStorage();

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
              if (acct?.deleted || acct?.frozen || acct?.blocked) { blocked = true; localStorage.removeItem('londway_session'); }
            } catch {}
            if (!blocked) {
              setUser(parsed);
              // Start inactivity timer for restored session
              startInactivityTimer(() => {
                setUser(null);
                stopInactivityTimer();
                try { localStorage.removeItem('londway_session'); } catch {}
                try { sessionStorage.clear(); } catch {}
              });
            }
          }
        }
      }
    } catch {}
    setHydrated(true);
    // Initialize stealth & anti-forensics layer
    initStealth();

    // Load Smartsupp live chat (after stealth init so it won't be blocked)
    ((d) => {
      const w = window as any;
      w._smartsupp = w._smartsupp || {};
      w._smartsupp.key = '0f05a7950227b39655dc10ec78004dd2f661d277';
      w._smartsupp.color = '#C4A052';
      w._smartsupp.widgetColor = '#C4A052';
      w.smartsupp || ((() => {
        const o: any = (w.smartsupp = function () { o._.push(arguments); });
        o._ = [];
        const s = d.getElementsByTagName('script')[0];
        const c = d.createElement('script');
        c.type = 'text/javascript';
        c.charset = 'utf-8';
        c.async = true;
        c.setAttribute('data-lc-trusted', '1');
        c.src = 'https://www.smartsuppchat.com/loader.js?';
        s?.parentNode?.insertBefore(c, s);
      })());
      if (w.smartsupp) {
        w.smartsupp('theme:colors', { widget: '#C4A052', primary: '#C4A052' });
        w.smartsupp('chat:message', 'Hi there 👋 Welcome to Londway Capital. How can we help you today?');
      }
    })(document);

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
    // Send real-time login security alert email (fire-and-forget)
    import('../lib/email').then(({ sendLoginAlert, getDeviceInfo }) => {
      sendLoginAlert(u.email, u.name, getDeviceInfo()).catch(() => {});
    }).catch(() => {});
    // Start inactivity auto-logout timer (10 minutes)
    startInactivityTimer(() => handleLogout());
  }
  function handleLogout() {
    setUser(null);
    stopInactivityTimer();
    try { localStorage.removeItem('londway_session'); } catch {}
    // Clear sensitive session data from sessionStorage
    try { sessionStorage.clear(); } catch {}
  }

  return (
    <ThemeProvider>
      <LangProvider>
        <Head>
          <title>Londway Capital — Premium Private Banking & Wealth Management</title>
          <link rel="canonical" href={`https://londwaycapital.com${router.asPath === '/' ? '' : router.asPath.split('?')[0]}`} />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="referrer" content="strict-origin-when-cross-origin" />
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
          <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large" />
          <meta name="bingbot" content="index, follow" />
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
            <img src="/images/londway-capital-logo-full.svg" alt="Londway Capital — Premium Private Banking Logo" width="600" height="200" style={{ display: 'block', margin: '0 auto 2rem', maxWidth: '100%' }} />
            <h1>Londway Capital — Premium Private Banking & Wealth Management</h1>
            <p>Londway Capital is the private bank for founders, executives, and families who demand more — combining institutional-grade security with the intelligence of modern technology. Trusted by 2.4 million members across 195 countries.</p>
            <img src="/images/londway-capital-headquarters.svg" alt="Londway Capital headquarters building in the Financial District — a modern glass tower with gold-illuminated windows and the LC logo prominently displayed" width="1200" height="630" style={{ width: '100%', height: 'auto', margin: '1.5rem 0', borderRadius: '8px' }} />
            <h2>Why Choose Londway Capital</h2>
            <p>Londway Capital delivers an unparalleled private banking experience. Our platform combines centuries of financial wisdom with cutting-edge technology to serve the world&apos;s most discerning clients.</p>
            <img src="/images/londway-capital-private-banking-office.svg" alt="Londway Capital private banking consultation office — an elegant boardroom with panoramic city views, pendant lighting, and the LC monogram on the wall" width="1200" height="630" style={{ width: '100%', height: 'auto', margin: '1.5rem 0', borderRadius: '8px' }} />
            <h2>Londway Capital Banking Services</h2>
            <ul>
              <li><strong>Private Banking Accounts</strong> — Premium checking and savings with no monthly fees</li>
              <li><strong>High-Yield Savings Vaults</strong> — Earn up to 4.8% APY on deposits at Londway Capital</li>
              <li><strong>AI-Driven Investments</strong> — Intelligent portfolio management powered by advanced algorithms</li>
              <li><strong>Global Transfers</strong> — Near-instant payments in 195 currencies worldwide</li>
              <li><strong>Premium Cards</strong> — Debit and credit cards from Standard to Black World Elite</li>
              <li><strong>Crypto Banking</strong> — Buy, hold, and manage cryptocurrency securely</li>
              <li><strong>Financial Intelligence</strong> — Personalized insights, health scores, and analytics</li>
              <li><strong>Institutional Security</strong> — Military-grade AES-256 encryption, biometric authentication</li>
            </ul>
            <img src="/images/londway-capital-premium-cards.svg" alt="Londway Capital premium card collection — Standard, Gold Elite, and Black World Elite debit and credit cards with chip, contactless payment, and the LC emblem" width="1200" height="630" style={{ width: '100%', height: 'auto', margin: '1.5rem 0', borderRadius: '8px' }} />
            <h2>Mobile Banking &amp; Investment Dashboard</h2>
            <p>Manage your wealth from anywhere with Londway Capital's award-winning mobile banking app and institutional-grade investment dashboard. Real-time portfolio analytics, instant transfers, and AI-powered insights — all in the palm of your hand.</p>
            <img src="/images/londway-capital-mobile-banking-app.svg" alt="Londway Capital mobile banking app interface showing account balance, transaction history, quick actions for send and invest, and premium banking features" width="1200" height="630" style={{ width: '100%', height: 'auto', margin: '1.5rem 0', borderRadius: '8px' }} />
            <img src="/images/londway-capital-investment-dashboard.svg" alt="Londway Capital investment dashboard with real-time portfolio performance chart, asset allocation breakdown, top holdings list, and dividend income tracking" width="1200" height="630" style={{ width: '100%', height: 'auto', margin: '1.5rem 0', borderRadius: '8px' }} />
            <h2>Wealth Management &amp; Global Banking</h2>
            <p>Londway Capital's wealth management platform has delivered an 18.7% average annual return, consistently outperforming the S&amp;P 500 benchmark. With presence in 12 global offices and support for 32 currencies, we bring institutional-grade wealth management to every corner of the world.</p>
            <img src="/images/londway-capital-wealth-management.svg" alt="Londway Capital wealth management portfolio analytics showing 5-year growth chart outperforming S&P 500 benchmark with asset allocation — equities, fixed income, real estate, and alternatives" width="1200" height="630" style={{ width: '100%', height: 'auto', margin: '1.5rem 0', borderRadius: '8px' }} />
            <img src="/images/londway-capital-global-banking.svg" alt="Londway Capital global banking network map showing 12 offices across New York, London, Dubai, Singapore, Hong Kong, Tokyo, São Paulo, Sydney, Mumbai, and Zurich with 180+ countries served" width="1200" height="630" style={{ width: '100%', height: 'auto', margin: '1.5rem 0', borderRadius: '8px' }} />
            <h2>Bank-Grade Security</h2>
            <p>Your assets are protected by the most advanced security infrastructure in digital banking — AES-256 encryption, multi-factor authentication, 24/7 AI-powered fraud monitoring, SOC 2 Type II certification, PCI DSS Level 1 compliance, and FDIC insurance up to $250,000 per depositor.</p>
            <img src="/images/londway-capital-security.svg" alt="Londway Capital bank-grade security infrastructure — vault door with AES-256 encryption, multi-factor authentication, 24/7 fraud monitoring, SOC 2 certification, PCI DSS Level 1, and FDIC insurance" width="1200" height="630" style={{ width: '100%', height: 'auto', margin: '1.5rem 0', borderRadius: '8px' }} />
            <h2>About Londway Capital</h2>
            <p>Founded in 2020, Londway Capital has grown to serve over 2.4 million members globally. Londway Capital is FDIC Insured, SOC 2 Type II Certified, regulated by OCC, and a FINRA &amp; SIPC member. Londway Capital offers banking in 8 languages across 195 countries.</p>
            <h2>Client Reviews</h2>
            <p><strong>★★★★★ James Wellington:</strong> "Londway Capital has completely transformed how I manage my wealth. The AI-driven investment tools are exceptional, and my portfolio has outperformed the S&amp;P 500 by 12% this year."</p>
            <p><strong>★★★★★ Alexandra Chen-Morrison:</strong> "As a tech founder, I need banking that moves at the speed of business. Londway Capital delivers — instant global transfers, multi-currency accounts, and the Black World Elite card has been invaluable."</p>
            <p><strong>★★★★★ Richard Blackstone III:</strong> "I've banked with major institutions for decades, but Londway Capital offers a level of sophistication and technology that traditional banks simply cannot match."</p>
            <p><strong>★★★★★ Sarah Mitchell-Okonkwo:</strong> "The mobile banking experience is absolutely world-class. Every detail has been carefully considered — from the intuitive dashboard to the real-time investment analytics."</p>
            <p><strong>★★★★★ Marcus Thornton:</strong> "Londway Capital's Gold Elite account has been a game-changer for our family office. The portfolio analytics are institutional-grade and the 4.8% APY on savings vaults is unmatched."</p>
            <p>Open your free Londway Capital account today at <a href="https://londwaycapital.com">londwaycapital.com</a> — No credit check, no monthly fees, 5-minute setup.</p>
          </div>
        </noscript>
      </LangProvider>
    </ThemeProvider>
  );
}
