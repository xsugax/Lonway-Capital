# Professional hosting (no GitHub Actions billing)

GitHub **Pages + Actions** bills your GitHub account for CI minutes. When that locks, your site stops updating even though your code on GitHub is fine.

**Fix:** host the static site on a platform that builds on *their* servers when you connect the repo. Keep GitHub only for source code.

---

## Recommended stack (least code change)

| Layer | Service | Why |
|-------|---------|-----|
| **Source code** | GitHub | Keep as-is; no deploy dependency |
| **Website + admin** | [Cloudflare Pages](https://pages.cloudflare.com) | Free, builds on Cloudflare (not GitHub Actions), custom domain, SSL |
| **Database** | [Neon](https://neon.tech) or new [Supabase](https://supabase.com) | Postgres + REST; your app already uses Supabase-style API |
| **Email OTP** | EmailJS | Already integrated |

You do **not** need MongoDB unless you also deploy `apps/api` as a server.

---

## Option A — Cloudflare Pages (recommended for deploy)

### 1. Build locally once (test)

```bash
npm run build:site
```

Output folder: `apps/user/out` (includes `/admin`).

### 2. Cloudflare dashboard

1. Sign up at https://dash.cloudflare.com  
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**  
3. Select repo `Lonway-Capital`  
4. **Build settings:**

| Setting | Value |
|---------|--------|
| Framework preset | None |
| Build command | `npm run build:site` |
| Build output directory | `apps/user/out` |
| Root directory | `/` (repo root) |

5. **Environment variables** (Production):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_OTP`
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_WELCOME`
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
- `NEXT_PUBLIC_API_URL` = `https://api.londwaycapital.com` (optional)

6. **Custom domains:** `londwaycapital.com`, `www.londwaycapital.com`  
7. Point DNS to Cloudflare (or move domain to Cloudflare nameservers).

Pushes to `main` deploy automatically — **no GitHub Actions required.**

### 3. Disable GitHub Pages deploy (optional)

Turn off the **Deploy to GitHub Pages** workflow or remove `.github/workflows/deploy.yml` so you are not confused by failed Actions runs.

---

## Option B — Vercel

Good for Next.js, but your repo has **two** static apps (user + admin under `/admin`). Cloudflare’s single `build:site` script is simpler.

If you use Vercel: two projects or one project with `build:site` and output `apps/user/out`.

---

## Database: avoid Supabase billing lock

### Path 1 — New Supabase (fastest)

- New email → new free project → run SQL from `apps/user/.env.local.example` + `supabase/*.sql`  
- Put URL + anon key in **Cloudflare Pages env vars** (not GitHub Secrets)

### Path 2 — Neon (professional Postgres)

- Free tier: https://neon.tech  
- Create database, use **Supabase-compatible REST** only if you add PostgREST, OR keep Supabase client pointed at Neon via connection string — **note:** your app uses Supabase REST, not raw Postgres. Easiest is still Supabase or Firebase for browser apps.

### Path 3 — Firebase (Google, very stable free tier)

- **Firebase Hosting** + **Firestore**  
- Requires rewriting `apps/user/lib/cloud.ts` to Firestore SDK  
- Best long-term if you want one vendor (Google) for hosting + DB

### Path 4 — MongoDB (only with an API)

- **MongoDB Atlas** (free M0) + deploy `apps/api` on **Railway** or **Render**  
- User app calls `api.londwaycapital.com` instead of Supabase  
- Most work; most “enterprise” if you need a real backend later

---

## What we do NOT recommend for your current app

| Approach | Problem |
|----------|---------|
| MongoDB from browser only | Insecure; no connection string in frontend |
| Keep relying on GitHub Actions | Billing lock blocks deploy |
| Only localStorage | Data lost on new phone |

---

## Quick comparison

| | GitHub Pages + Actions | Cloudflare Pages | Firebase |
|--|------------------------|------------------|----------|
| Deploy when GH billing locked | ❌ | ✅ | ✅ |
| Works with current Supabase code | ✅ | ✅ | ❌ (rewrite) |
| Custom domain | ✅ | ✅ | ✅ |
| Cost | GH limits | Free tier generous | Free tier generous |

---

## After migration checklist

- [ ] `npm run build:site` succeeds on your PC  
- [ ] Cloudflare Pages shows green deploy  
- [ ] `londwaycapital.com` loads new build (hard refresh)  
- [ ] Admin shows **☁ Cloud live**  
- [ ] Create test user → row in Supabase **accounts** table  
- [ ] Log in on second device / incognito with same email  

---

## Support

- Cloudflare Pages docs: https://developers.cloudflare.com/pages/  
- Neon: https://neon.tech/docs/introduction  
- Firebase: https://firebase.google.com/docs/hosting  
