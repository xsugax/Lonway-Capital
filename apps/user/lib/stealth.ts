/**
 * Stealth & Anti-Forensics Module for Londway Capital
 * Prevents reverse engineering, DevTools inspection, DOM tampering,
 * and origin tracking. Runs silently on page load.
 */

// ═══════════════════════════════════════════
// localStorage Transparent Encryption Layer
// Intercepts all reads/writes for londway_* keys
// so ALL existing code automatically gets obfuscation
// ═══════════════════════════════════════════

const _xK = '\x4c\x43\x2d\x56\x61\x75\x6c\x74\x2d\x4b\x65\x79\x2d\x32\x30\x32\x36\x2d\x53\x74\x65\x61\x6c\x74\x68';

function _xorEncode(data: string): string {
  let out = '';
  for (let i = 0; i < data.length; i++) {
    out += String.fromCharCode(data.charCodeAt(i) ^ _xK.charCodeAt(i % _xK.length));
  }
  return btoa(unescape(encodeURIComponent(out)));
}

function _xorDecode(encoded: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(encoded)));
    let out = '';
    for (let i = 0; i < decoded.length; i++) {
      out += String.fromCharCode(decoded.charCodeAt(i) ^ _xK.charCodeAt(i % _xK.length));
    }
    return out;
  } catch {
    return encoded;
  }
}

function _isPlainJSON(raw: string): boolean {
  if (!raw) return false;
  const c = raw[0];
  return c === '[' || c === '{' || c === '"' || c === 't' || c === 'f' || c === 'n' || (c >= '0' && c <= '9');
}

/** Keys that should be obfuscated in localStorage */
function _shouldObfuscate(key: string): boolean {
  return key.startsWith('londway_') || key.startsWith('__londway_');
}

let _storagePatched = false;

export function patchLocalStorage() {
  if (typeof window === 'undefined' || _storagePatched) return;
  _storagePatched = true;

  const _origSetItem = Storage.prototype.setItem;
  const _origGetItem = Storage.prototype.getItem;

  Storage.prototype.setItem = function(key: string, value: string) {
    if (_shouldObfuscate(key) && _isPlainJSON(value)) {
      return _origSetItem.call(this, key, _xorEncode(value));
    }
    return _origSetItem.call(this, key, value);
  };

  Storage.prototype.getItem = function(key: string): string | null {
    const raw = _origGetItem.call(this, key);
    if (raw === null) return null;
    if (_shouldObfuscate(key) && !_isPlainJSON(raw)) {
      // Attempt to decode — if it fails, return raw (legacy data)
      try {
        const decoded = _xorDecode(raw);
        // Verify it's valid JSON
        JSON.parse(decoded);
        return decoded;
      } catch {
        return raw;
      }
    }
    return raw;
  };

  // Auto-upgrade existing plain-text londway_* keys to obfuscated
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && _shouldObfuscate(key)) {
        const raw = _origGetItem.call(localStorage, key);
        if (raw && _isPlainJSON(raw)) {
          _origSetItem.call(localStorage, key, _xorEncode(raw));
        }
      }
    }
  } catch {}
}

// ═══════════════════════════════════════════
// Anti-DevTools Detection
// ═══════════════════════════════════════════

let _devToolsOpen = false;

function detectDevTools() {
  // Method 1: window outer/inner size comparison (detects docked DevTools)
  if (
    window.outerWidth - window.innerWidth > 200 ||
    window.outerHeight - window.innerHeight > 300
  ) {
    _devToolsOpen = true;
    onDevToolsDetected();
  }
}

function onDevToolsDetected() {
  // Clear session and redirect away — nothing to inspect
  try {
    sessionStorage.clear();
    localStorage.removeItem('londway_session');
  } catch {}
  try {
    window.location.replace('about:blank');
  } catch {}
}

// ═══════════════════════════════════════════
// Block Keyboard Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
// ═══════════════════════════════════════════

function blockInspectShortcuts() {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // F12
    if (e.key === 'F12') { e.preventDefault(); e.stopPropagation(); return false; }
    // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element picker)
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl+S (Save Page)
    if (e.ctrlKey && e.key.toUpperCase() === 'S') {
      e.preventDefault(); e.stopPropagation(); return false;
    }
  }, true);
}

// ═══════════════════════════════════════════
// Block Right-Click Context Menu
// ═══════════════════════════════════════════

function blockContextMenu() {
  document.addEventListener('contextmenu', (e: Event) => {
    e.preventDefault();
    return false;
  }, true);
}

// ═══════════════════════════════════════════
// Block Text Selection & Drag (prevent copying page content)
// ═══════════════════════════════════════════

function blockSelection() {
  document.addEventListener('selectstart', (e: Event) => {
    // Allow selection in input/textarea elements
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    e.preventDefault();
    return false;
  }, true);
  document.addEventListener('dragstart', (e: Event) => {
    e.preventDefault();
    return false;
  }, true);
}

// ═══════════════════════════════════════════
// Console Poisoning — wipe console methods in production
// ═══════════════════════════════════════════

function poisonConsole() {
  if (process.env.NODE_ENV !== 'production') return;
  const noop = () => {};
  const methods: (keyof Console)[] = [
    'log', 'warn', 'error', 'info', 'debug', 'trace',
    'dir', 'dirxml', 'table', 'group', 'groupEnd', 'groupCollapsed',
    'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd',
    'time', 'timeLog', 'timeEnd', 'timeStamp',
  ];
  for (const m of methods) {
    try { (console as any)[m] = noop; } catch {}
  }
  // Overwrite console object to prevent reassignment
  try {
    Object.defineProperty(window, 'console', {
      get: () => {
        const proxy: any = {};
        for (const m of methods) proxy[m] = noop;
        return proxy;
      },
      set: () => {},
      configurable: false,
    });
  } catch {}
}

// ═══════════════════════════════════════════
// DOM Integrity Monitor (MutationObserver)
// Detects script injection, iframe injection, localStorage overrides
// ═══════════════════════════════════════════

function monitorDOMIntegrity() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          const tag = node.tagName.toLowerCase();
          // Block injected scripts — allow Next.js, inline, and trusted third-party scripts
          if (tag === 'script' && !node.getAttribute('data-lc-trusted')) {
            const src = node.getAttribute('src') || '';
            if (!src || src.startsWith('/') || src.startsWith('.') || src.includes('/_next/')) continue;
            if (src.includes('smartsuppchat') || src.includes('smartsupp') || src.includes('googletagmanager')) continue;
            node.remove();
          }
        }
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

// ═══════════════════════════════════════════
// Origin / IP Obfuscation Headers
// Force browsers to not leak referrer info
// ═══════════════════════════════════════════

function enforceReferrerPolicy() {
  // Add meta referrer tag if not present
  if (!document.querySelector('meta[name="referrer"]')) {
    const meta = document.createElement('meta');
    meta.name = 'referrer';
    meta.content = 'no-referrer';
    document.head.appendChild(meta);
  }
  // Override existing referrer to strictest policy
  const existing = document.querySelector('meta[name="referrer"]') as HTMLMetaElement;
  if (existing) existing.content = 'no-referrer';
}

// ═══════════════════════════════════════════
// Hide Framework Fingerprints
// ═══════════════════════════════════════════

function hideFrameworkFingerprints() {
  // Remove __NEXT_DATA__ script tag (reveals Next.js)
  setTimeout(() => {
    const nextData = document.getElementById('__NEXT_DATA__');
    if (nextData) {
      // Overwrite contents with empty data before removing
      nextData.textContent = '{}';
      // Don't remove entirely — Next.js needs it for hydration
      // But blank the build ID
      try {
        const data = JSON.parse(nextData.textContent || '{}');
        delete data.buildId;
        delete data.assetPrefix;
        delete data.runtimeConfig;
        nextData.textContent = JSON.stringify(data);
      } catch {}
    }
    // Remove data-reactroot attribute
    const root = document.getElementById('__next');
    if (root) root.removeAttribute('data-reactroot');
    // Clean up any generator meta tags
    document.querySelectorAll('meta[name="generator"]').forEach(el => el.remove());
  }, 0);
}

// ═══════════════════════════════════════════
// Freeze Critical Prototypes
// Prevent prototype pollution attacks
// ═══════════════════════════════════════════

// freezePrototypes removed — freezing Object/Array/Function prototypes breaks React internals

// ═══════════════════════════════════════════
// Anti-Fetch Intercept — prevent fetch/XHR hooks
// that attackers might inject to intercept API calls
// ═══════════════════════════════════════════

// protectFetchXHR removed — freezing fetch/XHR breaks Next.js internal patching

// ═══════════════════════════════════════════
// Periodic Integrity Sweep
// Re-checks every 5 seconds for tampering
// ═══════════════════════════════════════════

function startIntegritySweep() {
  setInterval(() => {
    // Check for injected scripts
    document.querySelectorAll('script:not([data-lc-trusted])').forEach((el) => {
      const src = el.getAttribute('src') || '';
      const type = el.getAttribute('type') || '';
      if (type === 'application/ld+json') return;
      if (src && !src.startsWith('/') && !src.startsWith('.') &&
          !src.includes('googletagmanager') && !src.includes('smartsuppchat') &&
          !src.includes('smartsupp') && !src.includes('/_next/')) {
        el.remove();
      }
    });
    // Verify session hasn't been tampered with
    try {
      const session = localStorage.getItem('londway_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (!parsed.token || typeof parsed.token !== 'string' || parsed.token.length < 32) {
          localStorage.removeItem('londway_session');
          window.location.reload();
        }
      }
    } catch {
      localStorage.removeItem('londway_session');
    }
  }, 5000);
}

// ═══════════════════════════════════════════
// Prevent Automated Scraping / Bot Detection
// ═══════════════════════════════════════════

function detectBots() {
  const botSignals = [
    navigator.webdriver,  // Selenium, Puppeteer
    !navigator.languages || navigator.languages.length === 0,
    // @ts-ignore
    window._phantom || window.__nightmare || window.callPhantom,
    // @ts-ignore
    window.domAutomation || window.domAutomationController,
  ];
  if (botSignals.some(Boolean)) {
    try { window.location.replace('about:blank'); } catch {}
  }
}

// ═══════════════════════════════════════════
// Initialize All Stealth Measures
// ═══════════════════════════════════════════

export function initStealth() {
  if (typeof window === 'undefined') return;

  // Layer 0: Transparent localStorage encryption (MUST be first)
  patchLocalStorage();

  // Layer 1: Console poisoning (first, to prevent logging)
  poisonConsole();

  // Layer 2: Anti-inspection
  blockInspectShortcuts();
  blockContextMenu();
  blockSelection();

  // Layer 3: Framework fingerprint removal
  hideFrameworkFingerprints();
  enforceReferrerPolicy();

  // Layer 4: Protection against injection/tampering
  monitorDOMIntegrity();

  // Layer 5: Bot detection
  detectBots();

  // Layer 6: Continuous integrity sweep (every 5s)
  startIntegritySweep();

  // Layer 7: DevTools detection (periodic, subtle)
  // Only in production to avoid annoying development
  if (process.env.NODE_ENV === 'production') {
    setInterval(detectDevTools, 3000);
  }
}
