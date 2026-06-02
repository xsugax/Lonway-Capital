/**
 * Merges user + admin static exports for Cloudflare Pages / manual deploy.
 * Output: apps/user/out (with admin at /admin)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const userOut = path.join(root, 'apps', 'user', 'out');
const adminOut = path.join(root, 'apps', 'admin', 'out');
const adminDest = path.join(userOut, 'admin');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(userOut)) {
  console.error('Missing apps/user/out — run build:user first');
  process.exit(1);
}
if (!fs.existsSync(adminOut)) {
  console.error('Missing apps/admin/out — run build:admin first');
  process.exit(1);
}

if (fs.existsSync(adminDest)) fs.rmSync(adminDest, { recursive: true, force: true });
copyDir(adminOut, adminDest);

fs.writeFileSync(path.join(userOut, '.nojekyll'), '');
fs.writeFileSync(path.join(userOut, 'CNAME'), 'londwaycapital.com\n');

// Cloudflare Pages: ensure /admin resolves to admin app
fs.writeFileSync(path.join(userOut, '_redirects'), '/admin  /admin/  301\n');

console.log('Merged admin → apps/user/out/admin');
console.log('Deploy directory: apps/user/out');
