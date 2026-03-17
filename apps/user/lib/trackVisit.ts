// Visitor tracking — writes geo-tagged page visits to localStorage
// so the admin panel can display country / state of each click.
// Uses ipapi.co (no API key required) and caches the geo for 1 hour
// so every navigation click doesn't fire a new API call.

const CLICKS_KEY = 'londway_link_clicks';
const GEO_CACHE_KEY = 'londway_geo_cache';

interface GeoData {
  country: string;
  countryCode: string;
  state: string;
  city: string;
  ip: string;
}

async function getGeo(): Promise<GeoData> {
  if (typeof window === 'undefined') return { country: 'Unknown', countryCode: '', state: 'Unknown', city: 'Unknown', ip: 'Unknown' };
  try {
    // Return cached result if still fresh (< 1 hour old)
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.ts === 'number' && Date.now() - p.ts < 3_600_000) return p.data as GeoData;
    }
  } catch { /* continue to fresh fetch */ }

  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (!res.ok) throw new Error('geo fetch failed');
    const d = await res.json();
    const geo: GeoData = {
      country:     d.country_name  || d.country || 'Unknown',
      countryCode: (d.country_code || '').toUpperCase(),
      state:       d.region        || 'Unknown',
      city:        d.city          || 'Unknown',
      ip:          d.ip            || 'Unknown',
    };
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: geo }));
    return geo;
  } catch {
    return { country: 'Unknown', countryCode: '', state: 'Unknown', city: 'Unknown', ip: 'Unknown' };
  }
}

/**
 * Record a page visit with geolocation.
 * Call this on every route change from _app.tsx.
 */
export async function trackPageVisit(page: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const geo = await getGeo();
    const entry = {
      id:        'lc-' + Date.now(),
      page,
      country:     geo.country,
      countryCode: geo.countryCode,
      state:       geo.state,
      city:        geo.city,
      ip:          geo.ip,
      timestamp:   new Date().toISOString(),
      userAgent:   (typeof navigator !== 'undefined' ? navigator.userAgent : '').slice(0, 120),
    };
    const existing: unknown[] = (() => {
      try { return JSON.parse(localStorage.getItem(CLICKS_KEY) || '[]'); } catch { return []; }
    })();
    localStorage.setItem(CLICKS_KEY, JSON.stringify([entry, ...existing].slice(0, 200)));
  } catch { /* silent fail — never break the app */ }
}
