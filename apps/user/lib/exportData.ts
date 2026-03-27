import { getBankAccounts, getTransfers } from './store';

interface ExportTransaction {
  date: string;
  description: string;
  type: string;
  amount: string;
  currency: string;
  balance: string;
  reference: string;
  status: string;
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function escCsv(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}

function gatherData(email: string): { rows: ExportTransaction[]; accountName: string; accountNumber: string; openingBalance: string; closingBalance: string; periodStart: string; periodEnd: string; totalCredits: string; totalDebits: string } {
  const accounts = getBankAccounts(email);
  const checking = accounts.find((a: any) => a.type === 'Checking') || accounts[0];
  const transfers = getTransfers(email);

  const rows: ExportTransaction[] = [];
  let running = 0;
  let totalCredits = 0;
  let totalDebits = 0;

  // Account transactions
  if (checking?.transactions) {
    for (const tx of [...checking.transactions].sort((a: any, b: any) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())) {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'credit') { running += amt; totalCredits += amt; } else { running -= amt; totalDebits += amt; }
      rows.push({
        date: formatDate(tx.date || tx.createdAt || ''),
        description: tx.description || 'Transaction',
        type: tx.type === 'credit' ? 'Credit' : 'Debit',
        amount: (tx.type === 'credit' ? '+' : '-') + amt.toFixed(2),
        currency: tx.currency || 'USD',
        balance: running.toFixed(2),
        reference: tx.id || '',
        status: 'Completed',
      });
    }
  }

  // Transfer history
  for (const tx of [...transfers].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())) {
    const amt = Number(tx.amount);
    totalDebits += amt;
    rows.push({
      date: formatDate(tx.createdAt || ''),
      description: `Transfer to ${tx.recipientName || 'Unknown'}`,
      type: 'Transfer',
      amount: '-' + amt.toFixed(2),
      currency: tx.currency || 'USD',
      balance: '',
      reference: tx.reference || tx.id || '',
      status: (tx.status || 'pending').charAt(0).toUpperCase() + (tx.status || 'pending').slice(1),
    });
  }

  const sorted = rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const periodStart = sorted.length > 0 ? sorted[0].date : formatDate(new Date().toISOString());
  const periodEnd = sorted.length > 0 ? sorted[sorted.length - 1].date : formatDate(new Date().toISOString());

  return {
    rows: sorted,
    accountName: checking?.name || 'Checking Account',
    accountNumber: checking?.accountNumber || '',
    openingBalance: '0.00',
    closingBalance: running.toFixed(2),
    periodStart,
    periodEnd,
    totalCredits: totalCredits.toFixed(2),
    totalDebits: totalDebits.toFixed(2),
  };
}

export function exportCSV(email: string, userName: string) {
  const { rows, accountName, accountNumber, openingBalance, closingBalance, periodStart, periodEnd, totalCredits, totalDebits } = gatherData(email);
  const now = new Date().toLocaleString();
  const stmtId = `CSV-${Date.now().toString(36).toUpperCase()}`;
  const filename = `Londway_Statement_${userName.replace(/\s+/g, '_')}_${periodStart.replace(/[\s,]/g, '')}-${periodEnd.replace(/[\s,]/g, '')}.csv`;

  // Build the raw CSV content for download
  const headers = ['Date', 'Description', 'Type', 'Amount', 'Currency', 'Running Balance', 'Reference', 'Status'];
  const csvLines = [
    `"LONDWAY CAPITAL — OFFICIAL ACCOUNT STATEMENT"`,
    ``,
    `"Account Holder:","${escCsv(userName)}"`,
    `"Account Name:","${escCsv(accountName)}"`,
    `"Account Number:","${escCsv(accountNumber)}"`,
    `"Statement Period:","${escCsv(periodStart)} — ${escCsv(periodEnd)}"`,
    `"Generated:","${now}"`,
    ``,
    `"Opening Balance:","$${openingBalance}"`,
    `"Total Credits:","$${totalCredits}"`,
    `"Total Debits:","$${totalDebits}"`,
    `"Closing Balance:","$${closingBalance}"`,
    ``,
    headers.map(escCsv).join(','),
    ...rows.map((r) => [r.date, r.description, r.type, r.amount, r.currency, r.balance, r.reference, r.status].map(escCsv).join(',')),
    ``,
    `"End of Statement"`,
    `"This is a computer-generated statement. No signature is required."`,
    `"Londway Capital — londwaycapital.com — FDIC Insured"`,
  ];
  const csvContent = csvLines.join('\n');
  const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

  // Build transaction table rows for the HTML preview
  const tableRows = rows.map((r, i) =>
    `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#FAF8F4'}">
      <td style="padding:10px 14px;border-bottom:1px solid #E5E1D8;font-size:11px;color:#374151;white-space:nowrap;font-weight:500">${r.date}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E1D8;font-size:11px;color:#374151;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500">${r.description}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E1D8;font-size:10px;text-align:center"><span style="background:${r.type === 'Credit' ? 'rgba(34,197,94,0.08)' : r.type === 'Debit' ? 'rgba(220,38,38,0.08)' : 'rgba(196,160,82,0.1)'};color:${r.type === 'Credit' ? '#16a34a' : r.type === 'Debit' ? '#dc2626' : '#C4A052'};padding:3px 10px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase">${r.type}</span></td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E1D8;font-size:11.5px;font-weight:700;text-align:right;color:${r.type === 'Credit' ? '#16a34a' : '#dc2626'};font-family:'SF Mono','Courier New',monospace">${r.amount}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E1D8;font-size:11px;text-align:center;color:#6B7280;font-weight:600">${r.currency}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E1D8;font-size:11px;text-align:right;color:#374151;font-weight:700;font-family:'SF Mono','Courier New',monospace">${r.balance ? '$' + r.balance : '—'}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E1D8;font-size:9.5px;color:#9CA3AF;font-family:'SF Mono','Courier New',monospace">${r.reference}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #E5E1D8;font-size:10px;text-align:center"><span style="background:${r.status === 'Completed' || r.status === 'Approved' ? 'rgba(34,197,94,0.08)' : r.status === 'Pending' ? 'rgba(196,160,82,0.1)' : 'rgba(255,77,79,0.08)'};color:${r.status === 'Completed' || r.status === 'Approved' ? '#16a34a' : r.status === 'Pending' ? '#C4A052' : '#dc2626'};padding:3px 10px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:0.3px">${r.status}</span></td>
    </tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CSV Statement — Londway Capital</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html, body { font-family:'Inter',system-ui,-apple-system,sans-serif; background:#E8E4DD; }
  @page { size:A4 landscape; margin:0; }
  @media print {
    html, body { background:#fff; }
    .no-print { display:none !important; }
    .statement-page { box-shadow:none !important; margin:0 !important; }
  }
  .statement-page {
    width:297mm; min-height:210mm; margin:24px auto; background:#FFFFFF;
    box-shadow:0 4px 40px rgba(0,0,0,0.12); position:relative; overflow:hidden;
  }
  .header {
    background:linear-gradient(135deg,#0D1628 0%,#162038 60%,#1A2744 100%);
    padding:32px 48px 28px; position:relative; overflow:hidden;
  }
  .header::after {
    content:''; position:absolute; top:0; right:0; width:260px; height:100%;
    background:linear-gradient(135deg,transparent 0%,rgba(196,160,82,0.06) 100%);
    pointer-events:none;
  }
  .logo-mark {
    width:44px; height:44px; border:2px solid rgba(196,160,82,0.5);
    border-radius:12px; display:flex; align-items:center; justify-content:center;
    background:rgba(196,160,82,0.08); flex-shrink:0;
  }
  .logo-mark span {
    font-size:18px; font-weight:900; color:#C4A052; letter-spacing:-1px;
  }
  .dl-btn {
    display:inline-flex; align-items:center; gap:8px;
    background:#0D1628; color:#C4A052; border:2px solid rgba(196,160,82,0.4);
    border-radius:12px; padding:12px 28px; font-size:13px; font-weight:800;
    cursor:pointer; font-family:Inter,sans-serif; letter-spacing:0.5px;
    transition:all 0.2s ease;
  }
  .dl-btn:hover { background:#162038; border-color:#C4A052; transform:translateY(-1px); box-shadow:0 4px 16px rgba(196,160,82,0.15); }
  .dl-btn svg { width:16px; height:16px; }
</style>
</head>
<body>
<div class="statement-page">

  <!-- ═══ HEADER ═══ -->
  <div class="header">
    <div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="logo-mark"><span>LC</span></div>
        <div>
          <div style="font-size:22px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px">LONDWAY <span style="color:#C4A052">CAPITAL</span></div>
          <div style="font-size:8px;color:rgba(196,160,82,0.7);letter-spacing:4px;text-transform:uppercase;margin-top:3px;font-weight:600">ACCOUNT STATEMENT — CSV EXPORT</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:9px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;font-weight:700">Statement ID</div>
        <div style="font-size:13px;color:#C4A052;font-weight:800;margin-top:2px;font-family:'SF Mono','Courier New',monospace">${stmtId}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.35);margin-top:4px">${now}</div>
      </div>
    </div>
  </div>

  <!-- Gold accent bar -->
  <div style="height:3px;background:linear-gradient(90deg,#C4A052 0%,#D4B76A 50%,#C4A052 100%)"></div>

  <div style="padding:28px 48px 36px">

    <!-- ═══ ACCOUNT INFO + BALANCES ═══ -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
      <!-- Account Details Card -->
      <div style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:12px;padding:20px 24px">
        <div style="font-size:8px;color:#C4A052;text-transform:uppercase;font-weight:800;letter-spacing:2px;margin-bottom:14px">Account Details</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <div style="font-size:8px;color:#9CA3AF;text-transform:uppercase;font-weight:700;letter-spacing:0.8px">Account Holder</div>
            <div style="font-size:13px;font-weight:800;color:#0D1628;margin-top:4px">${userName}</div>
          </div>
          <div>
            <div style="font-size:8px;color:#9CA3AF;text-transform:uppercase;font-weight:700;letter-spacing:0.8px">Account Name</div>
            <div style="font-size:13px;font-weight:800;color:#0D1628;margin-top:4px">${accountName}</div>
          </div>
          <div>
            <div style="font-size:8px;color:#9CA3AF;text-transform:uppercase;font-weight:700;letter-spacing:0.8px">Account Number</div>
            <div style="font-size:13px;font-weight:800;color:#0D1628;margin-top:4px;font-family:'SF Mono','Courier New',monospace">${accountNumber}</div>
          </div>
          <div>
            <div style="font-size:8px;color:#9CA3AF;text-transform:uppercase;font-weight:700;letter-spacing:0.8px">Statement Period</div>
            <div style="font-size:12px;font-weight:700;color:#C4A052;margin-top:4px">${periodStart} — ${periodEnd}</div>
          </div>
        </div>
      </div>

      <!-- Balance Summary Card -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E5E1D8;border:1px solid #E5E1D8;border-radius:12px;overflow:hidden">
        <div style="background:#FAF8F4;padding:14px 18px;text-align:center">
          <div style="font-size:7.5px;color:#9CA3AF;text-transform:uppercase;font-weight:800;letter-spacing:1px">Opening Balance</div>
          <div style="font-size:17px;font-weight:900;color:#0D1628;margin-top:6px">$${openingBalance}</div>
        </div>
        <div style="background:rgba(34,197,94,0.04);padding:14px 18px;text-align:center">
          <div style="font-size:7.5px;color:#16A34A;text-transform:uppercase;font-weight:800;letter-spacing:1px">Total Credits</div>
          <div style="font-size:17px;font-weight:900;color:#16A34A;margin-top:6px">+$${totalCredits}</div>
        </div>
        <div style="background:rgba(220,38,38,0.04);padding:14px 18px;text-align:center">
          <div style="font-size:7.5px;color:#DC2626;text-transform:uppercase;font-weight:800;letter-spacing:1px">Total Debits</div>
          <div style="font-size:17px;font-weight:900;color:#DC2626;margin-top:6px">-$${totalDebits}</div>
        </div>
        <div style="background:#0D1628;padding:14px 18px;text-align:center">
          <div style="font-size:7.5px;color:#C4A052;text-transform:uppercase;font-weight:800;letter-spacing:1px">Closing Balance</div>
          <div style="font-size:17px;font-weight:900;color:#C4A052;margin-top:6px">$${closingBalance}</div>
        </div>
      </div>
    </div>

    <!-- ═══ TRANSACTION TABLE ═══ -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-size:9px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:1.5px">Transaction History <span style="color:#C4A052;font-weight:800">(${rows.length} entries)</span></div>
      <div style="font-size:9px;color:#9CA3AF;font-weight:600">Format: Comma-Separated Values (CSV)</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E1D8;border-radius:10px;overflow:hidden;border-collapse:collapse">
      <thead>
        <tr style="background:#0D1628">
          <th style="padding:11px 14px;font-size:8px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1.2px;font-weight:800">Date</th>
          <th style="padding:11px 14px;font-size:8px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1.2px;font-weight:800">Description</th>
          <th style="padding:11px 14px;font-size:8px;color:#C4A052;text-align:center;text-transform:uppercase;letter-spacing:1.2px;font-weight:800">Type</th>
          <th style="padding:11px 14px;font-size:8px;color:#C4A052;text-align:right;text-transform:uppercase;letter-spacing:1.2px;font-weight:800">Amount</th>
          <th style="padding:11px 14px;font-size:8px;color:#C4A052;text-align:center;text-transform:uppercase;letter-spacing:1.2px;font-weight:800">Ccy</th>
          <th style="padding:11px 14px;font-size:8px;color:#C4A052;text-align:right;text-transform:uppercase;letter-spacing:1.2px;font-weight:800">Balance</th>
          <th style="padding:11px 14px;font-size:8px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1.2px;font-weight:800">Reference</th>
          <th style="padding:11px 14px;font-size:8px;color:#C4A052;text-align:center;text-transform:uppercase;letter-spacing:1.2px;font-weight:800">Status</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    ${rows.length === 0 ? `
    <div style="text-align:center;padding:40px;color:#9CA3AF;font-size:13px;font-weight:600">
      <div style="font-size:32px;margin-bottom:10px;opacity:0.3">📋</div>
      No transactions found for this period.
    </div>` : ''}

    <!-- ═══ FOOTER ═══ -->
    <div style="margin-top:32px;padding-top:18px;border-top:2px solid #C4A052">
      <div style="display:flex;justify-content:space-between;font-size:9px;color:#9CA3AF;margin-bottom:14px">
        <span>Total Transactions: <strong style="color:#374151">${rows.length}</strong></span>
        <span>Statement ID: <strong style="color:#374151">${stmtId}</strong></span>
        <span>Generated: <strong style="color:#374151">${now}</strong></span>
      </div>
      <div style="background:#FAF8F4;border:1px solid #E5E1D8;border-radius:10px;padding:14px 20px;font-size:8.5px;color:#9CA3AF;line-height:1.9">
        <div style="font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:1px;font-size:8px;margin-bottom:6px">Important Information</div>
        <div>This statement was prepared by Londway Capital Holdings Ltd. and is intended solely for the account holder referenced above.</div>
        <div>Please review your transactions carefully. Report any discrepancies within 60 days by contacting support@londwaycapital.com.</div>
        <div style="margin-top:6px">This is a computer-generated statement and does not require a signature. &middot; 256-bit SSL Encryption &middot; FDIC Insured &middot; SOC 2 Type II Certified</div>
      </div>
      <div style="text-align:center;margin-top:16px;font-size:8px;color:#C0BBB2">
        &copy; ${new Date().getFullYear()} Londway Capital Holdings Ltd. &middot; All rights reserved. &middot; londwaycapital.com
      </div>
    </div>

  </div>
</div>

<!-- ═══ FLOATING DOWNLOAD BUTTON ═══ -->
<div class="no-print" style="position:fixed;bottom:28px;right:28px;z-index:9999;display:flex;gap:12px;align-items:center">
  <button onclick="window.print()" class="dl-btn" style="background:transparent;border-color:rgba(196,160,82,0.3)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    Print
  </button>
  <button onclick="downloadCSV()" class="dl-btn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Download CSV
  </button>
</div>

<script>
function downloadCSV(){
  var b=atob("${csvBase64}");
  var blob=new Blob([b],{type:'text/csv;charset=utf-8;'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download="${filename.replace(/"/g, '\\"')}";
  a.click();
  URL.revokeObjectURL(a.href);
}
</script>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function exportPDF(email: string, userName: string) {
  const { rows, accountName, accountNumber, openingBalance, closingBalance, periodStart, periodEnd, totalCredits, totalDebits } = gatherData(email);
  const now = new Date().toLocaleString();
  const stmtId = `STM-${Date.now().toString(36).toUpperCase()}`;

  const tableRows = rows.map((r, i) =>
    `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#faf9f6'};">
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;font-size:11px;color:#374151;white-space:nowrap;">${r.date}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;font-size:11px;color:#374151;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.description}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;font-size:11px;font-weight:700;text-align:right;color:${r.type === 'Credit' ? '#16a34a' : '#dc2626'};">${r.amount}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;font-size:11px;text-align:right;color:#374151;font-weight:600;font-family:'Courier New',monospace;">${r.balance || '—'}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;font-size:10px;color:#6b7280;font-family:'Courier New',monospace;">${r.reference}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;font-size:10px;text-align:center;"><span style="background:${r.status === 'Completed' || r.status === 'Approved' ? 'rgba(34,197,94,0.1)' : r.status === 'Pending' ? 'rgba(196,160,82,0.15)' : 'rgba(255,77,79,0.1)'};color:${r.status === 'Completed' || r.status === 'Approved' ? '#16a34a' : r.status === 'Pending' ? '#C4A052' : '#dc2626'};padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;">${r.status}</span></td>
    </tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Account Statement — Londway Capital</title>
<style>
  @media print { body { margin: 0; } @page { margin: 18mm 14mm; size: A4; } .no-print { display: none !important; } }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif; background: #fff; color: #0d1628; margin: 0; padding: 0; font-size: 12px; line-height: 1.5; }
</style></head>
<body>
<div style="max-width:820px;margin:0 auto;padding:42px 36px;">

  <!-- ═══ BANK HEADER ═══ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;margin-bottom:0;">
    <div>
      <div style="font-size:28px;font-weight:900;color:#0d1628;letter-spacing:-0.5px;">LONDWAY</div>
      <div style="font-size:28px;font-weight:900;color:#C4A052;letter-spacing:-0.5px;margin-top:-6px;">CAPITAL</div>
      <div style="font-size:9px;color:#C4A052;letter-spacing:4px;text-transform:uppercase;margin-top:5px;font-weight:600;">Premium Private Banking</div>
    </div>
    <div style="text-align:right;font-size:10px;color:#6b7280;line-height:1.6;">
      <div style="font-weight:800;font-size:11px;color:#0d1628;margin-bottom:4px;">Londway Capital Holdings Ltd.</div>
      <div>456 Financial District, Suite 2100</div>
      <div>New York, NY 10005</div>
      <div style="margin-top:4px;">Tel: +1 (212) 555-0180</div>
      <div>support@londwaycapital.com</div>
      <div>londwaycapital.com</div>
    </div>
  </div>

  <!-- Gold rule -->
  <div style="height:3px;background:linear-gradient(90deg,#C4A052,#D4B76A,#C4A052);margin-bottom:28px;border-radius:2px;"></div>

  <!-- ═══ STATEMENT TITLE BAR ═══ -->
  <div style="background:#0d1628;border-radius:8px;padding:14px 22px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
    <div>
      <div style="font-size:15px;font-weight:800;color:#C4A052;letter-spacing:0.5px;">ACCOUNT STATEMENT</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.5);margin-top:3px;font-weight:600;letter-spacing:0.5px;">STATEMENT ID: ${stmtId}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px;color:rgba(255,255,255,0.7);">Statement Period</div>
      <div style="font-size:12px;color:#C4A052;font-weight:700;margin-top:2px;">${periodStart} — ${periodEnd}</div>
    </div>
  </div>

  <!-- ═══ ACCOUNT INFO GRID ═══ -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1px;background:#e8e4dc;border:1px solid #e8e4dc;border-radius:10px;overflow:hidden;margin-bottom:24px;">
    <div style="background:#faf8f4;padding:14px 16px;">
      <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;font-weight:800;letter-spacing:1px;">Account Holder</div>
      <div style="font-size:13px;font-weight:800;margin-top:6px;color:#0d1628;">${userName}</div>
    </div>
    <div style="background:#faf8f4;padding:14px 16px;">
      <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;font-weight:800;letter-spacing:1px;">Account Name</div>
      <div style="font-size:13px;font-weight:800;margin-top:6px;color:#0d1628;">${accountName}</div>
    </div>
    <div style="background:#faf8f4;padding:14px 16px;">
      <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;font-weight:800;letter-spacing:1px;">Account Number</div>
      <div style="font-size:13px;font-weight:800;margin-top:6px;color:#0d1628;font-family:'Courier New',monospace;">${accountNumber}</div>
    </div>
    <div style="background:#faf8f4;padding:14px 16px;">
      <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;font-weight:800;letter-spacing:1px;">Statement Date</div>
      <div style="font-size:13px;font-weight:800;margin-top:6px;color:#0d1628;">${now.split(',')[0]}</div>
    </div>
  </div>

  <!-- ═══ BALANCE SUMMARY ═══ -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:28px;">
    <div style="background:#faf8f4;border:1px solid #e8e4dc;border-radius:10px;padding:16px 18px;text-align:center;">
      <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;font-weight:800;letter-spacing:1px;">Opening Balance</div>
      <div style="font-size:18px;font-weight:900;color:#0d1628;margin-top:6px;">$${openingBalance}</div>
    </div>
    <div style="background:rgba(34,197,94,0.04);border:1px solid rgba(34,197,94,0.15);border-radius:10px;padding:16px 18px;text-align:center;">
      <div style="font-size:8px;color:#16a34a;text-transform:uppercase;font-weight:800;letter-spacing:1px;">Total Credits</div>
      <div style="font-size:18px;font-weight:900;color:#16a34a;margin-top:6px;">+$${totalCredits}</div>
    </div>
    <div style="background:rgba(220,38,38,0.04);border:1px solid rgba(220,38,38,0.15);border-radius:10px;padding:16px 18px;text-align:center;">
      <div style="font-size:8px;color:#dc2626;text-transform:uppercase;font-weight:800;letter-spacing:1px;">Total Debits</div>
      <div style="font-size:18px;font-weight:900;color:#dc2626;margin-top:6px;">-$${totalDebits}</div>
    </div>
    <div style="background:#0d1628;border-radius:10px;padding:16px 18px;text-align:center;">
      <div style="font-size:8px;color:#C4A052;text-transform:uppercase;font-weight:800;letter-spacing:1px;">Closing Balance</div>
      <div style="font-size:18px;font-weight:900;color:#C4A052;margin-top:6px;">$${closingBalance}</div>
    </div>
  </div>

  <!-- ═══ TRANSACTION TABLE ═══ -->
  <div style="font-size:9px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">Transaction History (${rows.length} entries)</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4dc;border-radius:8px;overflow:hidden;border-collapse:collapse;">
    <thead><tr style="background:#0d1628;">
      <th style="padding:11px 12px;font-size:9px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1.2px;font-weight:800;">Date</th>
      <th style="padding:11px 12px;font-size:9px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1.2px;font-weight:800;">Description</th>
      <th style="padding:11px 12px;font-size:9px;color:#C4A052;text-align:right;text-transform:uppercase;letter-spacing:1.2px;font-weight:800;">Amount</th>
      <th style="padding:11px 12px;font-size:9px;color:#C4A052;text-align:right;text-transform:uppercase;letter-spacing:1.2px;font-weight:800;">Balance</th>
      <th style="padding:11px 12px;font-size:9px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1.2px;font-weight:800;">Reference</th>
      <th style="padding:11px 12px;font-size:9px;color:#C4A052;text-align:center;text-transform:uppercase;letter-spacing:1.2px;font-weight:800;">Status</th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table>

  <!-- ═══ FOOTER ═══ -->
  <div style="margin-top:36px;padding-top:18px;border-top:2px solid #C4A052;">
    <div style="display:flex;justify-content:space-between;font-size:9px;color:#9ca3af;margin-bottom:14px;">
      <span>Total Transactions: <strong style="color:#374151;">${rows.length}</strong></span>
      <span>Statement ID: <strong style="color:#374151;">${stmtId}</strong></span>
      <span>Page 1 of 1</span>
    </div>
    <div style="background:#faf8f4;border:1px solid #e8e4dc;border-radius:8px;padding:14px 18px;font-size:8.5px;color:#9ca3af;line-height:1.8;">
      <div style="font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-size:8px;margin-bottom:6px;">Important Information</div>
      <div>This statement was prepared by Londway Capital Holdings Ltd. and is intended solely for the account holder referenced above.</div>
      <div>Please review your transactions carefully. Report any discrepancies within 60 days by contacting support@londwaycapital.com.</div>
      <div style="margin-top:6px;">This is a computer-generated statement and does not require a signature.  ·  256-bit SSL Encryption  ·  FDIC Insured  ·  SOC 2 Type II Certified</div>
    </div>
    <div style="text-align:center;margin-top:16px;font-size:8px;color:#c0bbb2;">
      © ${new Date().getFullYear()} Londway Capital Holdings Ltd.  ·  All rights reserved.  ·  londwaycapital.com
    </div>
  </div>

</div>

<!-- Print button (hidden when printed) -->
<div class="no-print" style="position:fixed;bottom:24px;right:24px;z-index:9999;">
  <button onclick="window.print()" style="background:#0d1628;color:#C4A052;border:2px solid #C4A052;border-radius:10px;padding:12px 28px;font-size:13px;font-weight:800;cursor:pointer;font-family:Inter,sans-serif;letter-spacing:0.5px;">
    ⬇ Save as PDF
  </button>
</div>

</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
    };
  }
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
