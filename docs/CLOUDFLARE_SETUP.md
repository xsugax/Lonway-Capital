# Cloudflare Pages setup — Londway Capital

Deploy **without GitHub Actions**. Cloudflare builds when you push to GitHub.

---

## 1. Create Cloudflare account

1. Go to https://dash.cloudflare.com/sign-up  
2. Verify email  

---

## 2. Connect GitHub & create project

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**  
2. Authorize GitHub → select repo **`xsugax/Lonway-Capital`**  
3. **Set up builds:**

| Field | Value |
|--------|--------|
| Project name | `londway-capital` (any name) |
| Production branch | `main` |
| Framework preset | **None** |
| Build command | `npm run build:site` |
| Build output directory | `apps/user/out` |
| Root directory | `/` (leave empty = repo root) |

4. **Environment variables** → **Add variable** (Production):

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → anon public key |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | EmailJS dashboard |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_OTP` | EmailJS |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_WELCOME` | EmailJS |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | EmailJS |
| `NEXT_PUBLIC_API_URL` | `https://api.londwaycapital.com` (optional) |

5. Click **Save and Deploy**  

First build takes ~3–5 minutes. Check **Deployments** for a green **Success**.

---

## 3. Custom domain (londwaycapital.com)

1. In your Pages project → **Custom domains** → **Set up a custom domain**  
2. Enter `londwaycapital.com` and `www.londwaycapital.com`  

### If your domain is already on Cloudflare

- DNS records are added automatically.

### If domain is elsewhere (Namecheap, etc.)

**Option A — Move DNS to Cloudflare (recommended)**  
1. Cloudflare → **Add a site** → enter `londwaycapital.com`  
2. Copy the two nameservers Cloudflare gives you  
3. At your registrar, replace nameservers with Cloudflare’s  
4. Wait up to 24h (often &lt; 1 hour)  
5. Pages custom domain will then work  

**Option B — CNAME only**  
At your registrar, add:

| Type | Name | Target |
|------|------|--------|
| CNAME | `@` or `www` | `londway-capital.pages.dev` (your `*.pages.dev` URL from Cloudflare) |

(Use the exact hostname Cloudflare shows in the Custom domains tab.)

---

## 4. Turn off GitHub Pages deploy (optional)

GitHub Actions may still fail with billing errors. That no longer affects Cloudflare.

- Repo → **Settings** → **Pages** → Source: **None**  
- Or ignore failed **Deploy to GitHub Pages** workflows (push deploy is disabled in repo; use Cloudflare only)

---

## 5. Supabase (database)

Use a **working** Supabase project (new free account if the old one is locked).

1. Run SQL from `apps/user/.env.local.example` (CREATE TABLE `accounts`)  
2. Run `supabase/add_user_data_column.sql`  
3. Run `supabase/create_cards_table.sql`  
4. Put URL + anon key in **Cloudflare Pages env vars** (step 2), not GitHub Secrets  
5. **Redeploy** after changing env vars: Deployments → **Retry deployment**

---

## 6. Verify

- [ ] `https://<your-project>.pages.dev` loads  
- [ ] `https://londwaycapital.com` loads (after DNS)  
- [ ] `https://londwaycapital.com/admin` — admin panel  
- [ ] Admin header shows **☁ Cloud live**  
- [ ] Create test user → row in Supabase **accounts** table  
- [ ] Log in on another device with same email  

---

## 7. Redeploy after code changes

Push to `main` on GitHub → Cloudflare rebuilds automatically.

Manual: Cloudflare → your project → **Deployments** → **Retry deployment**.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails `npm` | Check build log; ensure `npm run build:site` works locally |
| Cloud offline in admin | Wrong/missing Supabase env vars → fix and **Retry deployment** |
| Old site still shows | Hard refresh; wait for DNS; purge Cloudflare cache |
| CSP blocks Supabase | Rebuild with correct `NEXT_PUBLIC_SUPABASE_URL` set in Cloudflare |

---

## Local test before pushing

```bash
npm run build:site
```

Serve folder `apps/user/out` with any static server, or open `apps/user/out/index.html`.
