import PDFDocument from 'pdfkit';

// Seller/business details for the invoice header — configurable via env vars
// since only the store owner knows their real registered business info.
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'AXT — Attitude X T-Shirts';
const BUSINESS_ADDRESS = process.env.BUSINESS_ADDRESS || 'Ghaziabad, Uttar Pradesh, India';
const BUSINESS_GSTIN = process.env.BUSINESS_GSTIN || 'GSTIN NOT CONFIGURED';
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'support@axt.com';
const BUSINESS_PHONE = process.env.BUSINESS_PHONE || '';

const ACCENT = '#CCFF00';
const DARK = '#111111';
const GRAY = '#666666';

// Deterministic invoice number derived from the order's own Mongo _id and
// creation date — no separate counter/collection needed, and it's always
// identical for the same order (regenerating the PDF twice gives the same
// invoice number, which is exactly what you want for a real invoice).
const buildInvoiceNumber = (order) => {
  const date = new Date(order.createdAt);
  const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const shortId = order._id.toString().slice(-6).toUpperCase();
  return `AXT-INV-${yearMonth}-${shortId}`;
};

// Order.items[].color was saved as a plain string historically but a cart
// item's color is actually `{ name, hex }` — handle both shapes defensively
// so a schema mismatch never crashes invoice generation.
const formatColor = (color) => {
  if (!color) return '—';
  if (typeof color === 'string') return color;
  if (typeof color === 'object') return color.name || '—';
  return '—';
};

const money = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

/**
 * Streams a professional tax-invoice PDF for the given (already-populated)
 * order document directly onto the provided writable stream (typically the
 * Express `res` object).
 */
export function generateInvoicePdf(order, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  const invoiceNumber = buildInvoiceNumber(order);
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // ---- Header ----
  doc
    .fillColor(DARK)
    .font('Helvetica-Bold')
    .fontSize(20)
    .text(BUSINESS_NAME, { continued: false });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(GRAY)
    .text(BUSINESS_ADDRESS)
    .text(`GSTIN: ${BUSINESS_GSTIN}`)
    .text(BUSINESS_PHONE ? `${BUSINESS_EMAIL}  |  ${BUSINESS_PHONE}` : BUSINESS_EMAIL);

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(DARK)
    .text('TAX INVOICE', doc.page.margins.left, 40, { width: pageWidth, align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(GRAY)
    .text(`Invoice #: ${invoiceNumber}`, { width: pageWidth, align: 'right' })
    .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, { width: pageWidth, align: 'right' })
    .text(`Order ID: ${order._id.toString().slice(-8).toUpperCase()}`, { width: pageWidth, align: 'right' });

  doc.moveDown(1.5);
  doc.strokeColor('#dddddd').lineWidth(1).moveTo(40, doc.y).lineTo(40 + pageWidth, doc.y).stroke();
  doc.moveDown(1);

  // ---- Bill To / Ship To ----
  const colTop = doc.y;
  const colWidth = pageWidth / 2 - 10;
  const shipToX = 40 + colWidth + 20;
  const lineHeight = 13;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text('BILL TO', 40, colTop);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text('SHIP TO', shipToX, colTop);

  const billLines = [
    order.user?.name || 'Guest Customer',
    order.user?.email || '—',
    order.user?.phoneNumber || '',
  ];
  const shipLines = [
    order.shippingAddress?.street || '',
    `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.postalCode || ''}`,
    order.shippingAddress?.country || '',
  ];

  doc.font('Helvetica').fontSize(9).fillColor(GRAY);
  billLines.forEach((line, i) => {
    doc.text(line, 40, colTop + lineHeight + i * lineHeight, { width: colWidth });
  });
  shipLines.forEach((line, i) => {
    doc.text(line, shipToX, colTop + lineHeight + i * lineHeight, { width: colWidth });
  });

  doc.y = colTop + lineHeight + billLines.length * lineHeight + 10;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(GRAY)
    .text(`Payment Method: ${order.paymentMethod}   |   Payment Status: ${order.isPaid ? 'PAID' : 'PENDING (Cash on Delivery)'}`, 40, doc.y);

  doc.moveDown(1);

  // ---- Items table ----
  const tableTop = doc.y;
  const colX = {
    idx: 40,
    item: 65,
    size: 300,
    color: 340,
    qty: 400,
    price: 440,
    amount: 500,
  };

  const drawTableHeader = (y) => {
    doc.rect(40, y, pageWidth, 20).fill('#f2f2f2');
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(DARK)
      .text('#', colX.idx + 4, y + 6)
      .text('ITEM', colX.item, y + 6)
      .text('SIZE', colX.size, y + 6)
      .text('COLOR', colX.color, y + 6)
      .text('QTY', colX.qty, y + 6)
      .text('PRICE', colX.price, y + 6)
      .text('AMOUNT', colX.amount, y + 6);
  };

  drawTableHeader(tableTop);
  let cursorY = tableTop + 26;

  order.items.forEach((item, idx) => {
    // Page-break safety for orders with many line items
    if (cursorY > doc.page.height - doc.page.margins.bottom - 100) {
      doc.addPage();
      cursorY = doc.page.margins.top;
      drawTableHeader(cursorY);
      cursorY += 26;
    }

    const lineTotal = item.price * item.quantity;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(DARK)
      .text(String(idx + 1), colX.idx + 4, cursorY, { width: 20 })
      .text(item.name, colX.item, cursorY, { width: colX.size - colX.item - 5 })
      .text(item.size || '—', colX.size, cursorY, { width: colX.color - colX.size - 5 })
      .text(formatColor(item.color), colX.color, cursorY, { width: colX.qty - colX.color - 5 })
      .text(String(item.quantity), colX.qty, cursorY, { width: colX.price - colX.qty - 5 })
      .text(money(item.price), colX.price, cursorY, { width: colX.amount - colX.price - 5 })
      .text(money(lineTotal), colX.amount, cursorY, { width: pageWidth - (colX.amount - 40) });

    cursorY += 20;
    doc.strokeColor('#eeeeee').lineWidth(0.5).moveTo(40, cursorY - 4).lineTo(40 + pageWidth, cursorY - 4).stroke();
  });

  doc.y = cursorY + 10;

  // ---- Totals summary ----
  const summaryX = 320;
  const summaryWidth = pageWidth - (summaryX - 40);
  const gstTotal = order.taxPrice || 0;
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;

  const summaryRow = (label, value, opts = {}) => {
    const rowFont = opts.bold ? 'Helvetica-Bold' : 'Helvetica';
    const rowSize = opts.bold ? 10 : 9;
    const y = doc.y;

    doc.font(rowFont).fontSize(rowSize).fillColor(opts.bold ? DARK : GRAY).text(label, summaryX, y, {
      width: summaryWidth * 0.6,
    });
    doc.font(rowFont).fontSize(rowSize).fillColor(DARK).text(value, summaryX, y, {
      width: summaryWidth,
      align: 'right',
    });

    doc.y = y + rowSize + 8;
  };

  summaryRow('Subtotal', money(order.itemsPrice));

  if (order.coupon?.discountAmount > 0) {
    summaryRow(`Discount (${order.coupon.code || 'Coupon'})`, `- ${money(order.coupon.discountAmount)}`);
  }

  summaryRow('Shipping', order.shippingPrice === 0 ? 'FREE' : money(order.shippingPrice));
  summaryRow('CGST (9%)', money(cgst));
  summaryRow('SGST (9%)', money(sgst));

  doc.moveDown(0.3);
  doc.strokeColor('#dddddd').lineWidth(1).moveTo(summaryX, doc.y).lineTo(40 + pageWidth, doc.y).stroke();
  doc.moveDown(0.5);

  summaryRow('GRAND TOTAL', money(order.totalPrice), { bold: true });

  // ---- Footer ----
  const footerY = doc.page.height - doc.page.margins.bottom - 40;
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(GRAY)
    .text(
      'This is a computer-generated invoice and does not require a physical signature.',
      40,
      footerY,
      { width: pageWidth, align: 'center' }
    )
    .text('Thank you for shopping with AXT — Attitude X T-Shirts.', 40, footerY + 12, {
      width: pageWidth,
      align: 'center',
    });

  doc.end();
}

export default generateInvoicePdf;

