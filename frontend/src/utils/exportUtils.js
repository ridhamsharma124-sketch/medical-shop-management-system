import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const BRAND = [193, 89, 46];
const INK = [43, 33, 27];
const MUTED = [110, 95, 85];
const ALT = [250, 244, 236];

export function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportExcel(filename, sheets) {
  const wb = XLSX.utils.book_new();
  for (const { name, headers, rows } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, String(name).slice(0, 31));
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportTablePdf({ filename, title, subtitle, headers, rows, summaryLines = [], alignRight = [] }) {
  const doc = new jsPDF();

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, 10.5);

  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  let top = 22;
  if (subtitle) {
    doc.text(subtitle, 14, top);
    top += 6;
  }

  if (summaryLines.length) {
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    summaryLines.forEach((line) => {
      doc.text(line, 196, top, { align: 'right' });
      top += 5;
    });
    top += 2;
  }

  const columnStyles = {};
  alignRight.forEach((i) => {
    columnStyles[i] = { halign: 'right' };
  });

  autoTable(doc, {
    startY: top,
    head: [headers],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.2, textColor: INK },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ALT },
    columnStyles,
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}

export function exportInvoicePdf({ bill = {}, items = [], title = 'MedHeritage' }) {
  const doc = new jsPDF();

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Pharmacy · Invoice', 14, 18);

  doc.setTextColor(...MUTED);
  doc.setFontSize(8.5);
  doc.text('GST', 196, 12, { align: 'right' });
  doc.text('PAYMENT', 196, 17, { align: 'right' });
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(bill.invoiceNumber || '—', 196, 12, { align: 'right' });
  doc.text(String(bill.paymentMethod || '—').toUpperCase(), 196, 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Bill Date:  ${bill.billDate || bill.createdAt || '—'}`, 14, 30);

  let y = 38;
  doc.setFillColor(246, 240, 232);
  doc.rect(14, y, 90, 18, 'F');
  doc.setTextColor(...MUTED);
  doc.setFontSize(7.5);
  doc.text('CUSTOMER', 17, y + 6);
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(bill.customerName || bill.customer?.name || '—', 17, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(bill.customerPhone || bill.customer?.phoneNumber || '', 17, y + 16.5);

  doc.setFillColor(246, 240, 232);
  doc.rect(106, y, 90, 18, 'F');
  doc.setTextColor(...MUTED);
  doc.setFontSize(7.5);
  doc.text('CASHIER', 109, y + 6);
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(bill.performedBy?.name || '—', 109, y + 12);

  if (typeof bill.pharmacist === 'object' && bill.pharmacist) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Pharmacist: ${bill.pharmacist.name || '—'}`, 109, y + 16.5);
  }

  const summaryRight = [];
  if (bill.subtotal !== undefined) summaryRight.push(`Subtotal        ${num(bill.subtotal)}`);
  if (bill.gstAmount !== undefined) summaryRight.push(`GST             ${num(bill.gstAmount)}`);
  if (bill.discountAmount) summaryRight.push(`Discount       −${num(bill.discountAmount)}`);
  if (bill.grandTotal !== undefined) summaryRight.push(`GRAND TOTAL   ${num(bill.grandTotal)}`);

  autoTable(doc, {
    startY: y + 24,
    head: [['Medicine', 'GST', 'Qty', 'Price', 'Total']],
    body: items.map((it) => [
      it.medicine?.name || '—',
      it.gstPercentage ? `${it.gstPercentage}%` : '—',
      String(it.quantity ?? ''),
      num(it.price),
      num(it.total),
    ]),
    styles: { fontSize: 8, cellPadding: 2.2, textColor: INK },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ALT },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    foot: summaryRight.length ? [summaryRight, ...Array(Math.max(0, 3 - summaryRight.length)).fill('')] : undefined,
    footStyles: summaryRight.length ? { fillColor: [255, 255, 255], textColor: INK, fontSize: 9, fontStyle: 'bold', cellPadding: 2.5 } : {},
    didParseCell: (data) => {
      if (data.section === 'foot' && data.row.index === summaryRight.length - 1) {
        data.cell.styles.textColor = BRAND;
      }
    },
  });

  const finalY = doc.lastAutoTable.finalY + 6;
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.6);
  doc.line(14, finalY, 196, finalY);
  doc.setTextColor(...MUTED);
  doc.setFontSize(7.5);
  doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, 14, finalY + 5);
  doc.text('Thank you for your purchase', 196, finalY + 5, { align: 'right' });

  doc.save(`${bill.invoiceNumber || 'invoice'}.pdf`);
}

function num(n) {
  const v = Number(n || 0);
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}