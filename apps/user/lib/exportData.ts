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
  const headers = ['Date', 'Description', 'Type', 'Amount', 'Currency', 'Running Balance', 'Reference', 'Status'];
  const csvLines = [
    `"LONDWAY CAPITAL — OFFICIAL ACCOUNT STATEMENT"`,
    ``,
    `"Account Holder:","${escCsv(userName)}"`,
    `"Account Name:","${escCsv(accountName)}"`,
    `"Account Number:","${escCsv(accountNumber)}"`,
    `"Statement Period:","${escCsv(periodStart)} — ${escCsv(periodEnd)}"`,
    `"Generated:","${new Date().toLocaleString()}"`,
    ``,
    `"Opening Balance:","${openingBalance}"`,
    `"Total Credits:","${totalCredits}"`,
    `"Total Debits:","${totalDebits}"`,
    `"Closing Balance:","${closingBalance}"`,
    ``,
    headers.map(escCsv).join(','),
    ...rows.map((r) => [r.date, r.description, r.type, r.amount, r.currency, r.balance, r.reference, r.status].map(escCsv).join(',')),
    ``,
    `"End of Statement"`,
    `"This is a computer-generated statement. No signature is required."`,
    `"Londway Capital — londwaycapital.com — FDIC Insured"`,
  ];
  download(csvLines.join('\n'), `Londway_Statement_${userName.replace(/\s+/g, '_')}_${periodStart.replace(/[\s,]/g, '')}-${periodEnd.replace(/[\s,]/g, '')}.csv`, 'text/csv');
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
