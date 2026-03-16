# Londway Capital — Deployment & DNS Guide

## Domain Architecture

| Subdomain | Purpose | App |
|---|---|---|
| `londwaycapital.com` | User-facing banking portal | `apps/user` (Next.js) |
| `www.londwaycapital.com` | Redirects to `londwaycapital.com` | — |
| `admin.londwaycapital.com` | Admin dashboard | `apps/admin` (Next.js) |
| `api.londwaycapital.com` | REST API | `apps/api` (NestJS) |

---

## DNS Records

Configure the following DNS records at your domain registrar or DNS provider (e.g., Cloudflare, Namecheap, Route 53):

### GitHub Pages + API Host

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 3600 |
| A | `@` | `185.199.109.153` | 3600 |
| A | `@` | `185.199.110.153` | 3600 |
| A | `@` | `185.199.111.153` | 3600 |
| CNAME | `www` | `YOUR_USERNAME.github.io` | 3600 |
| CNAME | `admin` | `YOUR_USERNAME.github.io` | 3600 |
| CNAME | `api` | Your API host (Railway/Render provided value) | 3600 |

### Email (Optional — for `@londwaycapital.com` emails)

| Type | Name | Value | Priority |
|---|---|---|---|
| MX | `@` | Your mail provider (e.g. `mx1.privateemail.com`) | 10 |
| TXT | `@` | `v=spf1 include:_spf.yourprovider.com ~all` | — |

---

## SSL / TLS

- **GitHub Pages**: SSL is automatic once "Enforce HTTPS" is enabled in Settings → Pages.
- **API host (Railway/Render)**: SSL is automatic for custom domains.

---

## Environment Variables

### User Frontend (`apps/user`)

| Variable | Dev Value | Production Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `https://api.londwaycapital.com` |

### Admin Frontend (`apps/admin`)

| Variable | Dev Value | Production Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `https://api.londwaycapital.com` |
| `NEXT_PUBLIC_DOMAIN` | `localhost:3001` | `admin.londwaycapital.com` |

### API (`apps/api`)

| Variable | Dev Value | Production Value |
|---|---|---|
| `PORT` | `4000` | `4000` (or platform-defined) |
| `NODE_ENV` | `development` | `production` |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | `https://londwaycapital.com,https://www.londwaycapital.com,https://admin.londwaycapital.com` |

---

## Deployment Guides

### GitHub Pages (User Frontend — Primary)

The user-facing app (`apps/user`) is deployed to GitHub Pages automatically via the `deploy.yml` workflow.

**How it works:**
1. On push to `main`, GitHub Actions builds the Next.js app with `output: 'export'`
2. The static `out/` folder is uploaded as a Pages artifact
3. GitHub Pages serves it at `londwaycapital.com`

**Setup steps:**
1. Go to **GitHub repo → Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Under **Custom domain**, enter `londwaycapital.com`
4. Check **Enforce HTTPS**
5. Push to `main` — the deploy workflow runs automatically

> **Note:** GitHub Pages supports ONE custom domain per repository. The admin app (`admin.londwaycapital.com`) needs a separate GitHub repo with its own Pages deployment, or a different hosting platform.

### Admin App (Separate Repo)

Since GitHub Pages allows one domain per repo, create a second repository for the admin app:

1. Create a new repo (e.g., `londway-admin`)
2. Copy `apps/admin/` contents into it
3. Add the same `deploy.yml` workflow (change `apps/user` → `.` and CNAME to `admin.londwaycapital.com`)
4. In that repo's Settings → Pages, set custom domain to `admin.londwaycapital.com`

### API (Needs Server Hosting)

GitHub Pages cannot run server-side code. The NestJS API needs a platform like:

- **Railway** — Connect your GitHub repo, set root to `apps/api`, add env vars
- **Render** — Free tier available, auto-deploys from GitHub
- **Fly.io** — Generous free tier, good for API hosting

Whichever platform you choose, set the custom domain to `api.londwaycapital.com` and configure the DNS CNAME accordingly.

---

## GitHub Pages Setup

### GitHub Actions

Two workflows are configured in `.github/workflows/`:

| Workflow | File | Trigger | Purpose |
|---|---|---|---|
| **CI** | `ci.yml` | Push/PR to `main` | Builds all 3 apps to catch errors |
| **Deploy** | `deploy.yml` | Push to `main` + manual | Builds user app & deploys to GitHub Pages |

### Repository Settings

1. Go to **Settings → Pages → Source** → select **GitHub Actions**
2. Go to **Settings → Pages → Custom domain** → enter `londwaycapital.com`
3. Optionally go to **Settings → Variables → Actions** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.londwaycapital.com` |

### Pushing to GitHub

```bash
cd "AURIX BANK"
git init
git add .
git commit -m "Initial commit — Londway Capital"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

After pushing, the deploy workflow will automatically build and publish to GitHub Pages.

---

## Production Checklist

- [ ] Code pushed to GitHub repository
- [ ] GitHub Actions CI passing (green check on `main`)
- [ ] GitHub Secrets configured for deployment
- [ ] Deploy workflow uncommented for chosen platform
- [ ] DNS records configured for all subdomains
- [ ] SSL certificates active (verify with `https://`)
- [ ] Environment variables set in deployment platform
- [ ] CORS origins restricted to production domains
- [ ] `NODE_ENV=production` set for API
- [ ] Security headers active (X-Frame-Options, CSP, etc.)
- [ ] Database connected and migrated (replace in-memory stores)
- [ ] Rate limiting configured
- [ ] Monitoring / logging enabled
- [ ] `.env` files excluded from git (check `.gitignore`)
