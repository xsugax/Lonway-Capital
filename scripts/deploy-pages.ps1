# Manual deploy to GitHub Pages (gh-pages branch) — no GitHub Actions required.
# Usage: from repo root, run:  .\scripts\deploy-pages.ps1
# Optional: copy apps\user\.env.local with NEXT_PUBLIC_SUPABASE_* and EmailJS vars for a full production build.

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

Set-Location $root

$envFile = "$root\apps\user\.env.local"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
      $name = $matches[1].Trim()
      $val = $matches[2].Trim().Trim('"')
      Set-Item -Path "env:$name" -Value $val
    }
  }
  Write-Host 'Loaded apps/user/.env.local'
} else {
  Write-Host 'No .env.local — building without extra env (cloud may be disabled in bundle).'
}

npm run build:user
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build:admin
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node scripts/merge-static-site.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx --yes gh-pages@6 -d apps/user/out -m "Deploy $(git rev-parse --short HEAD)"
Write-Host 'Published to gh-pages. Site updates in 1-3 minutes at https://londwaycapital.com'
