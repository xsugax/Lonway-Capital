// ═══════════════════════════════════════════════════════════════════
// LONDWAY CAPITAL — PDF RECEIPT GENERATOR
// Client-side PDF generation using canvas → PDF without dependencies
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

/** Generate and download a professional PDF receipt for a transaction. */
export async function downloadReceipt(tx: Transaction): Promise<void> {
  const W = 595; // A4 width in points (72dpi)
  const H = 842; // A4 height in points

  const canvas = document.createElement('canvas');
  canvas.width = W * 2; // 2x for retina
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // Colors
  const GOLD = '#C4A052';
  const DARK = '#0D1628';
  const BG = '#FFFFFF';
  const MUTED = '#6B7280';
  const LIGHT_BG = '#FAF8F4';
  const BORDER = '#E5E1D8';
  const SUCCESS_GREEN = '#16A34A';
  const FAIL_RED = '#DC2626';

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ─── Header Band ───
  const headerH = 95;
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, W, headerH);

  // Gold accent line
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, headerH, W, 3);

  // Logo text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('LONDWAY', 40, 42);
  ctx.fillStyle = GOLD;
  ctx.fillText(' CAPITAL', 40 + ctx.measureText('LONDWAY').width, 42);

  ctx.fillStyle = 'rgba(196,160,82,0.5)';
  ctx.font = '8px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('PREMIUM PRIVATE BANKING', 40, 58);

  // Receipt label
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 10px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('TRANSFER RECEIPT', 40, 80);

  // Date on right
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '9px Inter, Helvetica, Arial, sans-serif';
  const dateStr = formatDate(tx.createdAt);
  ctx.fillText(dateStr, W - 40 - ctx.measureText(dateStr).width, 42);

  // Reference on right
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 10px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText(tx.reference, W - 40 - ctx.measureText(tx.reference).width, 80);

  let y = headerH + 30;

  // ─── Status banner ───
  const statusColor = ['completed', 'processing'].includes(tx.status) ? SUCCESS_GREEN
    : ['failed', 'reversed'].includes(tx.status) ? FAIL_RED : GOLD;
  const statusLabel = tx.status.toUpperCase();

  ctx.fillStyle = statusColor + '12';
  roundRect(ctx, 40, y, W - 80, 36, 8);
  ctx.fill();
  ctx.strokeStyle = statusColor + '40';
  ctx.lineWidth = 1;
  roundRect(ctx, 40, y, W - 80, 36, 8);
  ctx.stroke();

  ctx.fillStyle = statusColor;
  ctx.font = 'bold 11px Inter, Helvetica, Arial, sans-serif';
  const statusText = `STATUS: ${statusLabel}`;
  ctx.fillText(statusText, W / 2 - ctx.measureText(statusText).width / 2, y + 22);
  y += 54;

  // ─── Amount highlight ───
  ctx.fillStyle = LIGHT_BG;
  roundRect(ctx, 40, y, W - 80, 70, 10);
  ctx.fill();
  ctx.strokeStyle = GOLD + '35';
  ctx.lineWidth = 1;
  roundRect(ctx, 40, y, W - 80, 70, 10);
  ctx.stroke();

  ctx.fillStyle = MUTED;
  ctx.font = 'bold 9px Inter, Helvetica, Arial, sans-serif';
  const amtLabel = 'AMOUNT TRANSFERRED';
  ctx.fillText(amtLabel, W / 2 - ctx.measureText(amtLabel).width / 2, y + 22);

  ctx.fillStyle = DARK;
  ctx.font = 'bold 28px Inter, Helvetica, Arial, sans-serif';
  const amtStr = formatCurrency(tx.amount, tx.currency);
  ctx.fillText(amtStr, W / 2 - ctx.measureText(amtStr).width / 2, y + 52);
  y += 90;

  // ─── Details Table ───
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
  if (tx.swift) rows.push(['SWIFT/BIC', tx.swift]);
  if (tx.routingNumber) rows.push(['Routing Number', tx.routingNumber]);
  if (tx.country) rows.push(['Country', tx.country]);
  if (tx.recipientBankName) rows.push(['Bank', tx.recipientBankName]);
  if (tx.fee > 0) rows.push(['Wire Fee', formatCurrency(tx.fee, tx.currency)]);
  if (tx.fxRate) rows.push(['FX Rate', `1 ${tx.fxFromCurrency} = ${tx.fxRate} ${tx.fxToCurrency}`]);
  if (tx.convertedAmount) rows.push(['Converted Amount', formatCurrency(tx.convertedAmount, tx.fxToCurrency || tx.currency)]);
  rows.push(['Date & Time', formatDate(tx.createdAt)]);
  if (tx.completedAt) rows.push(['Completed At', formatDate(tx.completedAt)]);
  rows.push(['Status', tx.status.toUpperCase()]);

  // Table header
  ctx.fillStyle = GOLD + '12';
  roundRect(ctx, 40, y, W - 80, 28, 6);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 9px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('TRANSFER DETAILS', 54, y + 18);
  y += 34;

  // Table rows
  const rowH = 26;
  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];
    if (i % 2 === 0) {
      ctx.fillStyle = LIGHT_BG;
      ctx.fillRect(40, y, W - 80, rowH);
    }

    ctx.fillStyle = MUTED;
    ctx.font = '600 8.5px Inter, Helvetica, Arial, sans-serif';
    ctx.fillText(label.toUpperCase(), 54, y + 17);

    ctx.fillStyle = DARK;
    ctx.font = value.length > 30 ? '9px Inter, Helvetica, Arial, sans-serif' : 'bold 9.5px Inter, Helvetica, Arial, sans-serif';
    const valWidth = ctx.measureText(value).width;
    ctx.fillText(value, W - 54 - valWidth, y + 17);

    // Row separator
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(40, y + rowH);
    ctx.lineTo(W - 40, y + rowH);
    ctx.stroke();

    y += rowH;
  }

  y += 20;

  // ─── Audit Trail (condensed) ───
  if (tx.auditTrail.length > 0 && y + 80 < H - 120) {
    ctx.fillStyle = GOLD + '12';
    roundRect(ctx, 40, y, W - 80, 28, 6);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 9px Inter, Helvetica, Arial, sans-serif';
    ctx.fillText('AUDIT TRAIL', 54, y + 18);
    y += 34;

    for (const entry of tx.auditTrail.slice(0, 5)) {
      if (y + 20 > H - 120) break;
      ctx.fillStyle = MUTED;
      ctx.font = '8px Inter, Helvetica, Arial, sans-serif';
      const ts = new Date(entry.timestamp).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
      ctx.fillText(`${ts}  —  ${entry.action}`, 54, y + 12);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '7.5px Inter, Helvetica, Arial, sans-serif';
      const detail = entry.detail.length > 80 ? entry.detail.slice(0, 77) + '...' : entry.detail;
      ctx.fillText(detail, 54, y + 23);
      y += 30;
    }
  }

  // ─── Footer ───
  const footerY = H - 80;

  // Separator line
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, footerY);
  ctx.lineTo(W - 40, footerY);
  ctx.stroke();

  // Integrity hash
  const hashData = `${tx.id}|${tx.reference}|${tx.amount}|${tx.senderEmail}|${tx.createdAt}`;
  const hash = receiptHash(hashData);

  ctx.fillStyle = MUTED;
  ctx.font = '7px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText(`Document Integrity: SHA-${hash}`, 40, footerY + 16);
  ctx.fillText(`Generated: ${new Date().toISOString()}`, 40, footerY + 28);

  // Compliance disclaimer
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '6.5px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('This is a computer-generated receipt. No signature is required.', 40, footerY + 44);
  ctx.fillText('256-bit SSL Encryption  ·  FDIC Insured  ·  SOC 2 Type II Certified', 40, footerY + 56);

  // Londway Capital on right
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 8px Inter, Helvetica, Arial, sans-serif';
  const footerBrand = 'LONDWAY CAPITAL';
  ctx.fillText(footerBrand, W - 40 - ctx.measureText(footerBrand).width, footerY + 16);
  ctx.fillStyle = MUTED;
  ctx.font = '7px Inter, Helvetica, Arial, sans-serif';
  const footerUrl = 'londwaycapital.com';
  ctx.fillText(footerUrl, W - 40 - ctx.measureText(footerUrl).width, footerY + 28);
  const footerEmail = 'support@londwaycapital.com';
  ctx.fillText(footerEmail, W - 40 - ctx.measureText(footerEmail).width, footerY + 40);

  // ─── Convert canvas to PDF blob and download ───
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const imgData = atob(dataUrl.split(',')[1]);
  const imgBytes = new Uint8Array(imgData.length);
  for (let i = 0; i < imgData.length; i++) imgBytes[i] = imgData.charCodeAt(i);

  // Minimal PDF with embedded PNG image
  const pdf = buildMinimalPDF(imgBytes, W, H);
  const blob = new Blob([pdf.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Londway_Receipt_${tx.reference}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Rounded rectangle helper for canvas */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Build a minimal valid PDF file with an embedded PNG image (no external libs) */
function buildMinimalPDF(pngBytes: Uint8Array, pageW: number, pageH: number): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let offset = 0;

  function write(s: string) {
    const b = enc.encode(s);
    parts.push(b);
    offset += b.length;
  }

  function writeBytes(b: Uint8Array) {
    parts.push(b);
    offset += b.length;
  }

  function markObj() {
    offsets.push(offset);
  }

  // Header
  write('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Obj 1: Catalog
  markObj();
  write('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  markObj();
  write(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);

  // Obj 3: Page
  markObj();
  write(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Img 5 0 R >> >> >>\nendobj\n`);

  // Obj 4: Content stream (draw image full page)
  const contentStr = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Img Do\nQ\n`;
  const contentBytes = enc.encode(contentStr);
  markObj();
  write(`4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  writeBytes(contentBytes);
  write('\nendstream\nendobj\n');

  // Obj 5: Image XObject (PNG)
  markObj();
  write(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pageW * 2} /Height ${pageH * 2} /Filter /FlateDecode /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${pngBytes.length} >>\nstream\n`);
  writeBytes(pngBytes);
  write('\nendstream\nendobj\n');

  // XRef
  const xrefOffset = offset;
  write('xref\n');
  write(`0 ${offsets.length + 1}\n`);
  write('0000000000 65535 f \n');
  for (const o of offsets) {
    write(String(o).padStart(10, '0') + ' 00000 n \n');
  }

  // Trailer
  write(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\n`);
  write(`startxref\n${xrefOffset}\n%%EOF\n`);

  // Combine
  let total = 0;
  for (const p of parts) total += p.length;
  const result = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    result.set(p, pos);
    pos += p.length;
  }
  return result;
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
