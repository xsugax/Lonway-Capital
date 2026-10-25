import { getBankAccounts, getTransfers } from './store';
import { presentHtmlDocument } from './presentDocument';

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

const GENERIC_NOTE = /^(local transfer|international wire|admin credit|admin debit|wire transfer received|account adjustment|admin balance adjustment|admin balance correction|administration top up|transaction|wire transfer)$/i;

function esc(value: string): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function money(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `-${formatted}` : formatted;
}

function usd(value: string): string {
  return value.startsWith('-') ? `-$${value.slice(1)}` : `$${value}`;
}

function titleCase(value: string): string {
  const text = String(value || 'pending');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function transferNote(tx: any, credit: boolean): string {
  const note = String(tx.description || '').trim();
  const who = tx.recipientName || tx.recipient_name || '';
  if (note && !GENERIC_NOTE.test(note)) {
    if (!credit && who && !note.toLowerCase().includes(who.toLowerCase())) return `${note} — to ${who}`;
    return note;
  }
  if (credit) return who ? `Received from ${who}` : 'Credit';
  return who ? `Transfer to ${who}` : (note || 'Transfer');
}

function gatherData(email: string): { rows: ExportTransaction[]; accountName: string; accountNumber: string; openingBalance: string; closingBalance: string; periodStart: string; periodEnd: string; totalCredits: string; totalDebits: string } {
  const accounts = getBankAccounts(email);
  const checking = accounts.find((a: any) => a.type === 'Checking') || accounts[0];
  const transfers = getTransfers(email);
  const seen = new Set<string>();
  const events: { iso: string; description: string; type: string; signed: number; currency: string; reference: string; status: string }[] = [];

  const remember = (id: unknown) => {
    const key = String(id || '').trim();
    if (!key) return false;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  };

  if (checking?.transactions) {
    for (const tx of checking.transactions) {
      remember(tx.id);
      remember(tx.reference);
      const amt = Math.abs(Number(tx.amount) || 0);
      const credit = tx.type === 'credit' || tx.type === 'interest';
      events.push({
        iso: tx.date || tx.createdAt || '',
        description: String(tx.description || 'Transaction'),
        type: credit ? 'Credit' : 'Debit',
        signed: credit ? amt : -amt,
        currency: tx.currency || 'USD',
        reference: String(tx.reference || tx.id || ''),
        status: 'Completed',
      });
    }
  }

  for (const tx of transfers) {
    if (remember(tx.id) || remember(tx.reference)) continue;
    const amt = Math.abs(Number(tx.amount) || 0);
    const kind = String(tx.type || '').toLowerCase();
    const credit = kind === 'credit' || kind === 'interest';
    events.push({
      iso: tx.createdAt || tx.created_at || '',
      description: transferNote(tx, credit),
      type: credit ? 'Credit' : kind === 'debit' ? 'Debit' : 'Transfer',
      signed: credit ? amt : -amt,
      currency: tx.currency || 'USD',
      reference: String(tx.reference || tx.id || ''),
      status: titleCase(tx.status || 'pending'),
    });
  }

  events.sort((a, b) => new Date(a.iso || 0).getTime() - new Date(b.iso || 0).getTime());
  const net = events.reduce((sum, event) => sum + event.signed, 0);
  const accountBalance = Number(checking?.balance);
  const closing = Number.isFinite(accountBalance) ? accountBalance : net;
  const opening = Math.round((closing - net) * 100) / 100;
  let running = opening;
  let totalCredits = 0;
  let totalDebits = 0;

  const rows: ExportTransaction[] = events.map((event) => {
    running = Math.round((running + event.signed) * 100) / 100;
    if (event.signed >= 0) totalCredits += event.signed;
    else totalDebits += Math.abs(event.signed);
    return {
      date: formatDate(event.iso),
      description: event.description,
      type: event.type,
      amount: (event.signed >= 0 ? '+' : '-') + money(Math.abs(event.signed)),
      currency: event.currency,
      balance: usd(money(running)),
      reference: event.reference,
      status: event.status,
    };
  });

  return {
    rows,
    accountName: checking?.name || 'Checking Account',
    accountNumber: checking?.accountNumber || '',
    openingBalance: money(opening),
    closingBalance: money(closing),
    periodStart: rows.length > 0 ? rows[0].date : formatDate(new Date().toISOString()),
    periodEnd: rows.length > 0 ? rows[rows.length - 1].date : formatDate(new Date().toISOString()),
    totalCredits: money(totalCredits),
    totalDebits: money(totalDebits),
  };
}

function statementHtml(input: {
  userName: string;
  accountName: string;
  accountNumber: string;
  openingBalance: string;
  closingBalance: string;
  periodStart: string;
  periodEnd: string;
  totalCredits: string;
  totalDebits: string;
  rows: ExportTransaction[];
  stmtId: string;
  now: string;
  csv?: { base64: string; filename: string };
}): string {
  const bodyRows = input.rows.length === 0
    ? `<tr><td colspan="5" style="padding:28px 16px;text-align:center;color:#8a8172;font-size:14px;">No transactions in this period.</td></tr>`
    : input.rows.map((row, index) => {
      const credit = row.amount.startsWith('+');
      return `<tr style="background:${index % 2 === 0 ? '#ffffff' : '#faf8f4'};">
        <td style="padding:12px 14px;border-bottom:1px solid #efe8dc;font-size:13px;color:#1a1505;vertical-align:top;white-space:nowrap;">${esc(row.date)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #efe8dc;font-size:13px;color:#1a1505;vertical-align:top;word-break:break-word;">${esc(row.description)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #efe8dc;font-size:13px;font-weight:700;text-align:right;vertical-align:top;white-space:nowrap;color:${credit ? '#16794a' : '#9b2c2c'};">${esc(row.amount)} ${esc(row.currency)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #efe8dc;font-size:13px;text-align:right;vertical-align:top;white-space:nowrap;color:#1a1505;">${esc(row.balance)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #efe8dc;font-size:12px;color:#8a8172;vertical-align:top;word-break:break-word;">${esc(row.reference)}<div style="margin-top:3px;font-size:11px;letter-spacing:0.4px;text-transform:uppercase;">${esc(row.status)}</div></td>
      </tr>`;
    }).join('');

  const csvButton = input.csv
    ? `<button onclick="downloadCSV()" style="background:#fff;color:#1a1505;border:1px solid #e4dccf;border-radius:8px;padding:11px 18px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;">Download CSV</button>`
    : '';
  const csvScript = input.csv
    ? `<script>
function downloadCSV(){
  var bytes=atob("${input.csv.base64}");
  var blob=new Blob([bytes],{type:'text/csv;charset=utf-8;'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download="${input.csv.filename.replace(/"/g, '')}";
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 60000);
}
</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Statement ${esc(input.stmtId)} — Londway Capital</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f3eee6; color: #1a1505; font-family: "Segoe UI", Inter, Helvetica, Arial, sans-serif; }
  table { border-collapse: collapse; }
  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
  }
</style>
</head>
<body>
  <div class="no-print" style="text-align:center;padding:18px 16px 0;">
    <button onclick="window.print()" style="background:#c4a052;color:#1a1505;border:0;border-radius:8px;padding:11px 22px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;">Print / Save as PDF</button>
    ${csvButton}
  </div>
  <div class="sheet" style="max-width:920px;margin:18px auto 32px;background:#fff;border:1px solid #e4dccf;box-shadow:0 16px 40px rgba(40,28,10,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1628;color:#fff;">
      <tr>
        <td style="padding:26px 28px;vertical-align:middle;">
          <div style="font-size:13px;letter-spacing:3px;font-weight:700;color:#c4a052;">LONDWAY CAPITAL</div>
          <div style="font-size:22px;font-weight:700;margin-top:6px;">Account statement</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.62);margin-top:4px;">Private banking · New York</div>
        </td>
        <td style="padding:26px 28px;text-align:right;vertical-align:middle;">
          <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#c4a052;font-weight:700;">Statement</div>
          <div style="font-family:Consolas,'Courier New',monospace;font-size:14px;font-weight:700;margin-top:6px;">${esc(input.stmtId)}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.62);margin-top:6px;">${esc(input.periodStart)} – ${esc(input.periodEnd)}</div>
        </td>
      </tr>
    </table>
    <div style="height:3px;background:#c4a052;"></div>
    <div style="padding:22px 28px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
        <tr>
          <td style="width:25%;padding:0 10px 0 0;vertical-align:top;">
            <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#8a8172;font-weight:700;">Account holder</div>
            <div style="font-size:15px;font-weight:700;margin-top:4px;">${esc(input.userName)}</div>
          </td>
          <td style="width:25%;padding:0 10px;vertical-align:top;">
            <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#8a8172;font-weight:700;">Account</div>
            <div style="font-size:15px;font-weight:700;margin-top:4px;">${esc(input.accountName)}</div>
          </td>
          <td style="width:25%;padding:0 10px;vertical-align:top;">
            <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#8a8172;font-weight:700;">Number</div>
            <div style="font-size:15px;font-weight:700;margin-top:4px;font-family:Consolas,'Courier New',monospace;">${esc(input.accountNumber || '—')}</div>
          </td>
          <td style="width:25%;padding:0 0 0 10px;vertical-align:top;text-align:right;white-space:nowrap;">
            <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#8a8172;font-weight:700;">Prepared</div>
            <div style="font-size:14px;font-weight:700;margin-top:4px;">${esc(input.now)}</div>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;border:1px solid #efe8dc;">
        <tr>
          <td style="width:25%;padding:14px 12px;background:#faf8f4;border-right:1px solid #efe8dc;">
            <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#8a8172;font-weight:700;">Opening</div>
            <div style="font-size:18px;font-weight:800;margin-top:4px;">${esc(usd(input.openingBalance))}</div>
          </td>
          <td style="width:25%;padding:14px 12px;border-right:1px solid #efe8dc;">
            <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#16794a;font-weight:700;">Credits</div>
            <div style="font-size:18px;font-weight:800;margin-top:4px;color:#16794a;">+${esc(usd(input.totalCredits))}</div>
          </td>
          <td style="width:25%;padding:14px 12px;border-right:1px solid #efe8dc;">
            <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9b2c2c;font-weight:700;">Debits</div>
            <div style="font-size:18px;font-weight:800;margin-top:4px;color:#9b2c2c;">-${esc(usd(input.totalDebits))}</div>
          </td>
          <td style="width:25%;padding:14px 12px;background:#0d1628;color:#fff;">
            <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#c4a052;font-weight:700;">Closing</div>
            <div style="font-size:18px;font-weight:800;margin-top:4px;color:#c4a052;">${esc(usd(input.closingBalance))}</div>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;">
        <colgroup>
          <col style="width:16%">
          <col style="width:38%">
          <col style="width:18%">
          <col style="width:14%">
          <col style="width:14%">
        </colgroup>
        <thead>
          <tr>
            <th style="padding:10px 14px;text-align:left;font-size:11px;letter-spacing:1.1px;text-transform:uppercase;color:#8a8172;border-bottom:2px solid #c4a052;font-weight:700;">Date</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;letter-spacing:1.1px;text-transform:uppercase;color:#8a8172;border-bottom:2px solid #c4a052;font-weight:700;">Description</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px;letter-spacing:1.1px;text-transform:uppercase;color:#8a8172;border-bottom:2px solid #c4a052;font-weight:700;">Amount</th>
            <th style="padding:10px 14px;text-align:right;font-size:11px;letter-spacing:1.1px;text-transform:uppercase;color:#8a8172;border-bottom:2px solid #c4a052;font-weight:700;">Balance</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;letter-spacing:1.1px;text-transform:uppercase;color:#8a8172;border-bottom:2px solid #c4a052;font-weight:700;">Reference</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;border-top:1px solid #efe8dc;">
        <tr>
          <td style="padding-top:14px;font-size:11px;color:#8a8172;line-height:1.55;vertical-align:top;">
            ${input.rows.length} entries · ${esc(input.stmtId)}<br>
            Prepared for the account holder. Review it and contact support within 60 days about any entry you do not recognize.
          </td>
          <td style="padding-top:14px;text-align:right;font-size:11px;color:#8a8172;line-height:1.55;vertical-align:top;">
            <strong style="color:#1a1505;">Londway Capital</strong><br>
            support@londwaycapital.com<br>
            FDIC insured · SOC 2
          </td>
        </tr>
      </table>
    </div>
  </div>
  ${csvScript}
</body>
</html>`;
}

export function exportCSV(email: string, userName: string) {
  const data = gatherData(email);
  const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const stmtId = `STM-${Date.now().toString(36).toUpperCase()}`;
  const filename = `Londway_Statement_${userName.replace(/\s+/g, '_')}_${Date.now().toString(36)}.csv`;
  const headers = ['Date', 'Description', 'Type', 'Amount', 'Currency', 'Balance', 'Reference', 'Status'];
  const csvLines = [
    'LONDWAY CAPITAL — ACCOUNT STATEMENT',
    '',
    `Account Holder,${escCsv(userName)}`,
    `Account Name,${escCsv(data.accountName)}`,
    `Account Number,${escCsv(data.accountNumber)}`,
    `Statement Period,${escCsv(data.periodStart + ' — ' + data.periodEnd)}`,
    `Generated,${escCsv(now)}`,
    '',
    `Opening Balance,${escCsv(data.openingBalance)}`,
    `Total Credits,${escCsv(data.totalCredits)}`,
    `Total Debits,${escCsv(data.totalDebits)}`,
    `Closing Balance,${escCsv(data.closingBalance)}`,
    '',
    headers.map(escCsv).join(','),
    ...data.rows.map((row) => [row.date, row.description, row.type, row.amount, row.currency, row.balance, row.reference, row.status].map(escCsv).join(',')),
  ];
  const csvContent = csvLines.join('\n');
  const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));
  const html = statementHtml({ ...data, userName, stmtId, now, csv: { base64: csvBase64, filename } });
  presentHtmlDocument(html, filename.replace(/\.csv$/i, '.html'), 'Account statement');
}

export function exportPDF(email: string, userName: string) {
  const data = gatherData(email);
  const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const stmtId = `STM-${Date.now().toString(36).toUpperCase()}`;
  const html = statementHtml({ ...data, userName, stmtId, now });
  presentHtmlDocument(html, `Londway_Statement_${stmtId}.html`, 'Account statement');
}

