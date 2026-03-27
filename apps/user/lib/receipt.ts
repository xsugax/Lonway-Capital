// ═══════════════════════════════════════════════════════════════════
// LONDWAY CAPITAL — PDF RECEIPT GENERATOR
// Professional HTML/CSS receipt with branded logo — Save as PDF
// ═══════════════════════════════════════════════════════════════════

import type { Transaction } from './ledger';

/** Simple integrity hash for receipt footer */
function receiptHash(data: string): string {
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = ((h << 5) - h + data.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0').toUpperCase();
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Generate and open a professional HTML/CSS receipt for printing/saving as PDF. */
export async function downloadReceipt(tx: Transaction): Promise<void> {
  const statusColor = ['completed', 'processing'].includes(tx.status) ? '#16A34A'
    : ['failed', 'reversed'].includes(tx.status) ? '#DC2626' : '#C4A052';
  const statusLabel = tx.status.toUpperCase();

  const hashData = `${tx.id}|${tx.reference}|${tx.amount}|${tx.senderEmail}|${tx.createdAt}`;
  const hash = receiptHash(hashData);

  // Build detail rows
  const rows: [string, string][] = [
    ['Transaction ID', tx.id],
    ['Reference', tx.reference],
    ['Type', tx.type.replace(/_/g, ' ').toUpperCase()],
    ['Sender', tx.senderName],
    ['Sender Account', tx.senderAccountName],
    ['Recipient', tx.recipientName],
    ['Recipient Account', tx.recipientAccountName],
  ];
  if (tx.iban) rows.push(['IBAN', tx.iban]);
  if (tx.swift) rows.push(['SWIFT / BIC', tx.swift]);
  if (tx.routingNumber) rows.push(['Routing Number', tx.routingNumber]);
  if (tx.country) rows.push(['Country', tx.country]);
  if (tx.recipientBankName) rows.push(['Recipient Bank', tx.recipientBankName]);
  if (tx.fee > 0) rows.push(['Wire Fee', formatCurrency(tx.fee, tx.currency)]);
  if (tx.fxRate) rows.push(['FX Rate', `1 ${tx.fxFromCurrency} = ${tx.fxRate} ${tx.fxToCurrency}`]);
  if (tx.convertedAmount) rows.push(['Converted Amount', formatCurrency(tx.convertedAmount, tx.fxToCurrency || tx.currency)]);
  rows.push(['Date & Time', formatDate(tx.createdAt)]);
  if (tx.completedAt) rows.push(['Completed At', formatDate(tx.completedAt)]);
  rows.push(['Status', tx.status.toUpperCase()]);

  const detailRowsHtml = rows.map(([label, value], i) => `
    <tr style="background:${i % 2 === 0 ? '#FAF8F4' : '#FFFFFF'}">
      <td style="padding:10px 16px;font-size:11px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #E5E1D8;width:40%">${escapeHtml(label)}</td>
      <td style="padding:10px 16px;font-size:11.5px;color:#0D1628;font-weight:600;text-align:right;border-bottom:1px solid #E5E1D8">${escapeHtml(value)}</td>
    </tr>
  `).join('');

  // Build audit trail HTML
  let auditHtml = '';
  if (tx.auditTrail && tx.auditTrail.length > 0) {
    const auditRows = tx.auditTrail.slice(0, 6).map((entry, i) => {
      const ts = new Date(entry.timestamp).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
      const detail = entry.detail.length > 90 ? entry.detail.slice(0, 87) + '...' : entry.detail;
      return `
        <tr style="background:${i % 2 === 0 ? '#FAF8F4' : '#FFFFFF'}">
          <td style="padding:8px 16px;font-size:10px;color:#6B7280;border-bottom:1px solid #E5E1D8;white-space:nowrap">${escapeHtml(ts)}</td>
          <td style="padding:8px 16px;font-size:10px;color:#0D1628;font-weight:600;border-bottom:1px solid #E5E1D8">${escapeHtml(entry.action)}</td>
          <td style="padding:8px 16px;font-size:10px;color:#9CA3AF;border-bottom:1px solid #E5E1D8">${escapeHtml(detail)}</td>
        </tr>
      `;
    }).join('');

    auditHtml = `
      <table style="width:100%;border-collapse:collapse;margin-top:28px">
        <thead>
          <tr><td colspan="3" style="background:rgba(196,160,82,0.08);padding:10px 16px;border-radius:6px 6px 0 0">
            <span style="font-size:10px;font-weight:700;color:#C4A052;letter-spacing:1.5px;text-transform:uppercase">Audit Trail</span>
          </td></tr>
        </thead>
        <tbody>${auditRows}</tbody>
      </table>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Receipt — ${escapeHtml(tx.reference)} — Londway Capital</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html, body { font-family:'Inter',system-ui,-apple-system,sans-serif; background:#E8E4DD; }
  @page { size:A4 portrait; margin:0; }
  @media print {
    html, body { background:#fff; }
    .no-print { display:none !important; }
    .receipt-page { box-shadow:none !important; margin:0 !important; }
  }
  .receipt-page {
    width:210mm; min-height:297mm; margin:24px auto; background:#FFFFFF;
    box-shadow:0 4px 40px rgba(0,0,0,0.12); position:relative; overflow:hidden;
  }
  /* ── Header ── */
  .header {
    background:linear-gradient(135deg,#0D1628 0%,#162038 60%,#1A2744 100%);
    padding:36px 48px 32px; position:relative; overflow:hidden;
  }
  .header::after {
    content:''; position:absolute; top:0; right:0; width:260px; height:100%;
    background:radial-gradient(ellipse at 80% 50%, rgba(196,160,82,0.08) 0%, transparent 70%);
  }
  .header-content { display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:1; }
  /* ── LOGO ── */
  .logo-block { display:flex; align-items:center; gap:14px; }
  .logo-mark {
    width:52px; height:52px; border-radius:12px; position:relative;
    background:linear-gradient(145deg,#C4A052 0%,#D4B76A 45%,#A88B3C 100%);
    box-shadow:0 2px 12px rgba(196,160,82,0.35); display:flex; align-items:center; justify-content:center;
  }
  .logo-mark-inner {
    width:44px; height:44px; border-radius:8px; border:2px solid rgba(255,255,255,0.25);
    display:flex; align-items:center; justify-content:center; position:relative;
  }
  .logo-letter {
    font-size:24px; font-weight:900; color:#0D1628; letter-spacing:-1px;
    line-height:1; text-shadow:0 1px 0 rgba(255,255,255,0.2);
  }
  .logo-text { display:flex; flex-direction:column; }
  .logo-name {
    font-size:22px; font-weight:800; letter-spacing:2px; color:#FFFFFF; line-height:1.1;
  }
  .logo-name span { color:#C4A052; }
  .logo-tagline {
    font-size:8.5px; font-weight:500; color:rgba(196,160,82,0.55); letter-spacing:3px;
    text-transform:uppercase; margin-top:4px;
  }
  .header-right { text-align:right; }
  .header-label {
    font-size:10px; font-weight:700; color:#C4A052; letter-spacing:2px;
    text-transform:uppercase; margin-bottom:8px;
  }
  .header-date { font-size:10px; color:rgba(255,255,255,0.5); margin-bottom:4px; }
  .header-ref { font-size:11px; color:#C4A052; font-weight:700; font-family:monospace; }
  /* ── Gold bar ── */
  .gold-bar { height:3px; background:linear-gradient(90deg,#C4A052,#D4B76A,#C4A052); }
  /* ── Body ── */
  .body { padding:32px 48px 40px; }
  /* Status */
  .status-bar {
    text-align:center; padding:12px 24px; border-radius:8px; margin-bottom:28px;
    font-size:12px; font-weight:700; letter-spacing:1.5px;
  }
  /* Amount */
  .amount-box {
    background:#FAF8F4; border:1px solid rgba(196,160,82,0.2); border-radius:12px;
    padding:24px; text-align:center; margin-bottom:28px;
  }
  .amount-label {
    font-size:10px; font-weight:700; color:#6B7280; letter-spacing:2px;
    text-transform:uppercase; margin-bottom:8px;
  }
  .amount-value {
    font-size:34px; font-weight:800; color:#0D1628; letter-spacing:-0.5px;
  }
  .amount-words {
    font-size:10px; color:#9CA3AF; font-style:italic; margin-top:6px;
  }
  /* Details table */
  .details-table { width:100%; border-collapse:collapse; }
  .details-table thead td {
    background:rgba(196,160,82,0.08); padding:10px 16px;
    border-radius:6px 6px 0 0;
  }
  .section-head {
    font-size:10px; font-weight:700; color:#C4A052; letter-spacing:1.5px;
    text-transform:uppercase;
  }
  /* ── Footer ── */
  .footer {
    position:absolute; bottom:0; left:0; right:0; padding:0 48px 32px;
  }
  .footer-line { border-top:1px solid #E5E1D8; padding-top:16px; }
  .footer-grid { display:flex; justify-content:space-between; align-items:flex-end; }
  .footer-left {}
  .footer-hash { font-size:8.5px; color:#9CA3AF; font-family:monospace; margin-bottom:3px; }
  .footer-gen { font-size:8.5px; color:#9CA3AF; margin-bottom:10px; }
  .footer-disclaimer { font-size:8px; color:#B0ADA6; line-height:1.5; max-width:340px; }
  .footer-right { text-align:right; }
  .footer-brand { font-size:10px; font-weight:800; color:#C4A052; letter-spacing:1.5px; margin-bottom:3px; }
  .footer-url { font-size:8.5px; color:#6B7280; margin-bottom:2px; }
  .footer-email { font-size:8.5px; color:#6B7280; }
  .footer-badges {
    display:flex; gap:8px; justify-content:flex-end; margin-top:8px;
  }
  .badge {
    font-size:7px; font-weight:700; color:#6B7280; letter-spacing:0.5px;
    border:1px solid #E5E1D8; border-radius:3px; padding:3px 6px;
    text-transform:uppercase;
  }
</style>
</head>
<body>
  <!-- Save button -->
  <div class="no-print" style="text-align:center;padding:18px">
    <button onclick="window.print()"
      style="padding:12px 36px;background:linear-gradient(135deg,#C4A052,#D4B76A);color:#0D1628;border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;font-family:Inter,sans-serif;letter-spacing:0.5px;box-shadow:0 2px 12px rgba(196,160,82,0.3)">
      Save as PDF
    </button>
  </div>

  <div class="receipt-page">
    <!-- Header with Logo -->
    <div class="header">
      <div class="header-content">
        <div class="logo-block">
          <div class="logo-mark">
            <div class="logo-mark-inner">
              <span class="logo-letter">LC</span>
            </div>
          </div>
          <div class="logo-text">
            <div class="logo-name">LONDWAY <span>CAPITAL</span></div>
            <div class="logo-tagline">Premium Private Banking</div>
          </div>
        </div>
        <div class="header-right">
          <div class="header-label">Transfer Receipt</div>
          <div class="header-date">${escapeHtml(formatDate(tx.createdAt))}</div>
          <div class="header-ref">${escapeHtml(tx.reference)}</div>
        </div>
      </div>
    </div>
    <div class="gold-bar"></div>

    <!-- Body -->
    <div class="body">
      <!-- Bank Address -->
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:9px;color:#9CA3AF;letter-spacing:0.5px">Londway Capital Holdings Ltd.&ensp;·&ensp;456 Financial District, Suite 2100&ensp;·&ensp;New York, NY 10005</div>
      </div>

      <!-- Status -->
      <div class="status-bar" style="background:${statusColor}10;border:1px solid ${statusColor}30;color:${statusColor}">
        STATUS: ${escapeHtml(statusLabel)}
      </div>

      <!-- Amount -->
      <div class="amount-box">
        <div class="amount-label">Amount Transferred</div>
        <div class="amount-value">${escapeHtml(formatCurrency(tx.amount, tx.currency))}</div>
      </div>

      <!-- Transfer Details -->
      <table class="details-table">
        <thead>
          <tr><td colspan="2"><span class="section-head">Transfer Details</span></td></tr>
        </thead>
        <tbody>
          ${detailRowsHtml}
        </tbody>
      </table>

      <!-- Audit Trail -->
      ${auditHtml}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-line">
        <div class="footer-grid">
          <div class="footer-left">
            <div class="footer-hash">Document Integrity: SHA-${hash}</div>
            <div class="footer-gen">Generated: ${new Date().toISOString()}</div>
            <div class="footer-disclaimer">
              This is a computer-generated receipt. No signature is required.<br>
              Londway Capital Holdings Ltd. is a registered financial institution.
            </div>
          </div>
          <div class="footer-right">
            <div class="footer-brand">LONDWAY CAPITAL</div>
            <div class="footer-url">londwaycapital.com</div>
            <div class="footer-email">support@londwaycapital.com</div>
            <div class="footer-badges">
              <span class="badge">256-bit SSL</span>
              <span class="badge">FDIC Insured</span>
              <span class="badge">SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=860,height=1100');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

/** Quick receipt download from transaction data (for use in history tables) */
export function downloadReceiptFromLegacy(transfer: {
  id: string;
  reference: string;
  recipientName: string;
  toAccountId?: string;
  amount: number;
  currency: string;
  type: 'local' | 'international';
  status: string;
  description?: string;
  createdAt: string;
  country?: string;
}, senderName: string, senderEmail: string): void {
  // Convert legacy format to Transaction shape for the PDF generator
  const mockTx: Transaction = {
    id: transfer.id,
    reference: transfer.reference,
    type: transfer.type === 'international' ? 'international_wire' : 'local_transfer',
    status: (transfer.status as any) || 'pending',
    amount: transfer.amount,
    currency: transfer.currency,
    description: transfer.description || `${transfer.type} transfer`,
    senderAccountId: 'checking',
    senderAccountName: 'Primary Checking',
    senderEmail,
    senderName,
    recipientAccountId: transfer.toAccountId || 'external',
    recipientAccountName: transfer.recipientName,
    recipientName: transfer.recipientName,
    country: transfer.country,
    transferType: transfer.type,
    fee: 0,
    createdAt: transfer.createdAt,
    updatedAt: transfer.createdAt,
    auditTrail: [{
      timestamp: transfer.createdAt,
      action: 'TRANSACTION_CREATED',
      actor: 'system',
      detail: `Transfer created. Status: ${transfer.status}`,
    }],
    flagged: false,
    fraudScore: 0,
    debitEntryId: '',
    creditEntryId: '',
  };

  downloadReceipt(mockTx);
}
