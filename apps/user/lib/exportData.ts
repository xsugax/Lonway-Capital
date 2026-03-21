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

function gatherData(email: string): { rows: ExportTransaction[]; accountName: string; accountNumber: string } {
  const accounts = getBankAccounts(email);
  const checking = accounts.find((a: any) => a.type === 'checking') || accounts[0];
  const transfers = getTransfers(email);

  const rows: ExportTransaction[] = [];
  let running = 0;

  // Account transactions
  if (checking?.transactions) {
    for (const tx of [...checking.transactions].sort((a: any, b: any) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())) {
      const amt = Number(tx.amount) || 0;
      running += tx.type === 'credit' ? amt : -amt;
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
    rows.push({
      date: formatDate(tx.createdAt || ''),
      description: `Transfer to ${tx.recipientName || 'Unknown'}`,
      type: 'Transfer',
      amount: '-' + Number(tx.amount).toFixed(2),
      currency: tx.currency || 'USD',
      balance: '',
      reference: tx.reference || tx.id || '',
      status: (tx.status || 'pending').charAt(0).toUpperCase() + (tx.status || 'pending').slice(1),
    });
  }

  return {
    rows: rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    accountName: checking?.name || 'Checking Account',
    accountNumber: checking?.accountNumber || '',
  };
}

export function exportCSV(email: string, userName: string) {
  const { rows, accountName, accountNumber } = gatherData(email);
  const headers = ['Date', 'Description', 'Type', 'Amount', 'Currency', 'Balance', 'Reference', 'Status'];
  const csvLines = [
    `Londway Capital — Account Statement`,
    `Account Holder: ${userName}`,
    `Account: ${accountName} (${accountNumber})`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    headers.map(escCsv).join(','),
    ...rows.map((r) => [r.date, r.description, r.type, r.amount, r.currency, r.balance, r.reference, r.status].map(escCsv).join(',')),
  ];
  download(csvLines.join('\n'), `Londway_Statement_${Date.now()}.csv`, 'text/csv');
}

export function exportPDF(email: string, userName: string) {
  const { rows, accountName, accountNumber } = gatherData(email);
  const now = new Date().toLocaleString();
  const tableRows = rows.map((r) =>
    `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f0ece4;font-size:11px;color:#374151;">${r.date}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0ece4;font-size:11px;color:#374151;">${r.description}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0ece4;font-size:11px;font-weight:600;color:${r.type === 'Credit' ? '#16a34a' : '#dc2626'};">${r.amount}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0ece4;font-size:11px;color:#374151;">${r.currency}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0ece4;font-size:11px;color:#374151;">${r.reference}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0ece4;font-size:11px;"><span style="background:${r.status === 'Completed' || r.status === 'Approved' ? 'rgba(34,197,94,0.1)' : r.status === 'Pending' ? 'rgba(196,160,82,0.15)' : 'rgba(255,77,79,0.1)'};color:${r.status === 'Completed' || r.status === 'Approved' ? '#16a34a' : r.status === 'Pending' ? '#C4A052' : '#dc2626'};padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;">${r.status}</span></td>
    </tr>`
  ).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Londway Capital Statement</title>
<style>@media print{body{margin:0}@page{margin:20mm 15mm}}</style></head>
<body style="font-family:Inter,system-ui,sans-serif;background:#fff;color:#0d1628;margin:0;padding:40px;">
<div style="max-width:800px;margin:0 auto;">
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #C4A052;padding-bottom:20px;margin-bottom:30px;">
    <div>
      <div style="font-size:24px;font-weight:900;color:#0d1628;">Londway Capital</div>
      <div style="font-size:12px;color:#C4A052;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Premium Private Banking</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#6b7280;">
      <div style="font-weight:700;color:#0d1628;">Account Statement</div>
      <div>${now}</div>
    </div>
  </div>
  <div style="background:#faf8f4;border:1px solid rgba(196,160,82,0.2);border-radius:10px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;">
    <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;">Account Holder</div><div style="font-size:14px;font-weight:700;margin-top:4px;">${userName}</div></div>
    <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;">Account</div><div style="font-size:14px;font-weight:700;margin-top:4px;">${accountName}</div></div>
    <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:700;">Account Number</div><div style="font-size:14px;font-weight:700;margin-top:4px;font-family:monospace;">${accountNumber}</div></div>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ece4;border-radius:8px;overflow:hidden;">
    <thead><tr style="background:#0d1628;">
      <th style="padding:10px;font-size:10px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1px;">Date</th>
      <th style="padding:10px;font-size:10px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1px;">Description</th>
      <th style="padding:10px;font-size:10px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1px;">Amount</th>
      <th style="padding:10px;font-size:10px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1px;">Currency</th>
      <th style="padding:10px;font-size:10px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1px;">Reference</th>
      <th style="padding:10px;font-size:10px;color:#C4A052;text-align:left;text-transform:uppercase;letter-spacing:1px;">Status</th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div style="margin-top:30px;padding-top:20px;border-top:1px solid #f0ece4;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;">
    <span>Total Transactions: ${rows.length}</span>
    <span>londwaycapital.com</span>
    <span>Confidential — For Account Holder Only</span>
  </div>
</div></body></html>`;

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
