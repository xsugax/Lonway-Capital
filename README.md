# Londway Capital

A modern fintech banking platform combining the trust of traditional banks with the intelligence and design of next-generation finance apps.

## Live Site

- **Main App:** [londwaycapital.com](https://londwaycapital.com)
- **Admin Panel:** admin.londwaycapital.com (separate deployment)
- **API:** api.londwaycapital.com (server hosting required)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (User) | Next.js, React, TypeScript |
| Frontend (Admin) | Next.js, React, TypeScript |
| Backend API | NestJS, TypeScript |
| Hosting | GitHub Pages (static export) |
| CI/CD | GitHub Actions |

## Project Structure

```
apps/
  user/       — User-facing banking portal (Next.js)
  admin/      — Admin dashboard (Next.js)
  api/        — REST API (NestJS)
packages/
  ui/         — Shared UI components
  auth/       — Authentication module
  security/   — Security utilities
```

## Features

- Dashboard with financial snapshot, accounts overview, activity feed
- Multi-currency account management
- Transfer system (local & international)
- Goal-based savings vaults
- Investment center with live charts
- Financial health score
- Checkbook management
- Virtual card management
- Two-factor authentication
- Admin panel with user/transaction management & audit logs
- Dark/light theme support
- Multi-language support (8 languages)

## Development

```bash
# Install dependencies
cd apps/user && npm install
cd apps/admin && npm install
cd apps/api && npm install

# Run locally
npm run dev:user      # User app — http://localhost:3000
npm run dev:admin     # Admin app — http://localhost:3001
npm run dev:api       # API — http://localhost:4000

# Build all
npm run build:all
```

## Demo Credentials

- **Email:** user@londwaycapital.com
- **Password:** password123

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for DNS setup, GitHub Pages configuration, and production checklist.