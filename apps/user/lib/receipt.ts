// ═══════════════════════════════════════════════════════════════════
// LONDWAY CAPITAL — PDF RECEIPT GENERATOR
// Professional HTML/CSS receipt with branded logo — Save as PDF
// ═══════════════════════════════════════════════════════════════════

import type { Transaction } from './ledger';
import { presentHtmlDocument } from './presentDocument';

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
    ...(tx.description ? [['Description', tx.description] as [string, string]] : []),
    ['Sender', tx.senderName],
    ['Sender Account', tx.senderAccountName],
    ['Recipient', tx.recipientName],
    ['Recipient Account', tx.recipientAccountId && tx.recipientAccountId !== 'external' ? tx.recipientAccountId : tx.recipientAccountName],
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

  const detailRowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:12px 0;font-size:13px;color:#8a8172;font-weight:600;border-bottom:1px solid #efe8dc;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:12px 0 12px 16px;font-size:14px;color:#1a1505;font-weight:600;text-align:right;border-bottom:1px solid #efe8dc;vertical-align:top;word-break:break-word;">${escapeHtml(value)}</td>
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
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Receipt ${escapeHtml(tx.reference)} — Londway Capital</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f3eee6; color: #1a1505; font-family: "Segoe UI", Inter, Helvetica, Arial, sans-serif; }
  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .sheet { box-shadow: none !important; margin: 0 !important; }
  }
</style>
</head>
<body>
  <div class="no-print" style="text-align:center;padding:18px 16px 0;">
    <button onclick="window.print()" style="background:#c4a052;color:#1a1505;border:0;border-radius:8px;padding:11px 22px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;">Print / Save as PDF</button>
  </div>
  <div class="sheet" style="max-width:720px;margin:18px auto 28px;background:#fff;border:1px solid #e4dccf;box-shadow:0 16px 40px rgba(40,28,10,0.08);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1628;color:#fff;">
      <tr>
        <td style="width:58%;padding:28px 32px;vertical-align:middle;">
          <div style="font-size:13px;letter-spacing:3px;font-weight:700;color:#c4a052;">LONDWAY CAPITAL</div>
          <div style="font-size:22px;font-weight:700;margin-top:6px;letter-spacing:-0.3px;">Transfer receipt</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.62);margin-top:4px;">Private banking · New York</div>
        </td>
        <td style="width:42%;padding:28px 32px;text-align:right;vertical-align:middle;white-space:nowrap;">
          <div style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#c4a052;font-weight:700;">Reference</div>
          <div style="font-family:Consolas,'Courier New',monospace;font-size:14px;font-weight:700;margin-top:6px;">${escapeHtml(tx.reference)}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.62);margin-top:6px;">${escapeHtml(new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.62);">${escapeHtml(new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))}</div>
        </td>
      </tr>
    </table>
    <div style="height:3px;background:#c4a052;"></div>
    <div style="padding:28px 32px 8px;text-align:center;">
      <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#8a8172;font-weight:700;">Amount</div>
      <div style="font-size:36px;font-weight:800;letter-spacing:-0.8px;margin-top:6px;">${escapeHtml(formatCurrency(tx.amount, tx.currency))}</div>
      <div style="display:inline-block;margin-top:12px;padding:5px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1px;color:${statusColor};border:1px solid ${statusColor};">${escapeHtml(statusLabel)}</div>
    </div>
    <div style="padding:8px 32px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">
        <tr>
          <td colspan="2" style="padding:14px 0 8px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#c4a052;font-weight:700;border-bottom:1px solid #efe8dc;">Details</td>
        </tr>
        ${detailRowsHtml}
      </table>
      ${auditHtml}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #efe8dc;">
        <tr>
          <td style="padding-top:14px;font-size:11px;color:#8a8172;line-height:1.55;vertical-align:top;">
            Document ${hash}<br>
            This receipt was prepared for the account holder. No signature is required.
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
</body>
</html>`;


  const safeRef = String(tx.reference || 'receipt').replace(/[^\w.-]+/g, '_');
  presentHtmlDocument(html, `Londway_Receipt_${safeRef}.html`, `Receipt ${tx.reference || ''}`.trim());
}

/** Quick receipt download from transaction data (for use in history tables) */
export function downloadReceiptFromLegacy(transfer: {
  id: string;
  reference: string;
  recipientName: string;
  toAccountId?: string;
  amount: number;
  currency: string;
  type: 'local' | 'international' | 'credit' | 'debit' | string;
  status: string;
  description?: string;
  createdAt: string;
  country?: string;
  bankName?: string;
  senderName?: string;
  fee?: number;
}, senderName: string, senderEmail: string): void {
  // Convert legacy format to Transaction shape for the PDF generator
  const mockTx: Transaction = {
    id: transfer.id,
    reference: transfer.reference,
    type: transfer.type === 'international' ? 'international_wire' : transfer.type === 'credit' ? 'deposit' : transfer.type === 'debit' ? 'withdrawal' : 'local_transfer',
    status: (transfer.status as any) || 'pending',
    amount: transfer.amount,
    currency: transfer.currency,
    description: transfer.description && !/^(local transfer|international wire)$/i.test(transfer.description.trim()) ? transfer.description : '',
    senderAccountId: 'checking',
    senderAccountName: 'Primary Checking',
    senderEmail,
    senderName: transfer.senderName || senderName,
    recipientAccountId: transfer.toAccountId || 'external',
    recipientAccountName: transfer.toAccountId || transfer.recipientName,
    recipientName: transfer.recipientName,
    recipientBankName: transfer.bankName,
    country: transfer.country,
    transferType: transfer.type === 'international' || transfer.type === 'local' ? transfer.type : undefined,
    fee: Number(transfer.fee) || 0,
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
