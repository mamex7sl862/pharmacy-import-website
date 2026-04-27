const PDFDocument = require('pdfkit')

function generateRFQPDF(rfq) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end',  () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── Page dimensions ───────────────────────────────────────────────────────
    const W  = doc.page.width   // 595.28
    const H  = doc.page.height  // 841.89
    const ML = 48               // left margin
    const MR = 48               // right margin
    const TW = W - ML - MR      // table / content width = 499.28

    // ── Colour palette ────────────────────────────────────────────────────────
    const C = {
      navy:    '#0B2559',
      blue:    '#1A56DB',
      accent:  '#3B82F6',
      sky:     '#DBEAFE',
      muted:   '#6B7280',
      dark:    '#111827',
      white:   '#FFFFFF',
      green:   '#059669',
      amber:   '#D97706',
      border:  '#E5E7EB',
      rowAlt:  '#F8FAFF',
      rowEven: '#FFFFFF',
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    const fmt = (n) => parseFloat(n || 0).toFixed(2)
    const rfqNum   = rfq.rfqNumber   || rfq.rfq_number   || ''
    const dateStr  = (rfq.submittedAt || rfq.submitted_at)
      ? new Date(rfq.submittedAt || rfq.submitted_at)
          .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const delivery = rfq.requestedDeliveryDate || rfq.requested_delivery_date || 'To be confirmed'
    const shipping = rfq.shippingMethod        || rfq.shipping_method         || 'To be confirmed'
    const items    = rfq.items || []
    const hasPrice = items.some((i) => i.unitPrice != null && parseFloat(i.unitPrice) > 0)
    const currency = items.find((i) => i.currency)?.currency || 'USD'

    // ── ① HEADER ─────────────────────────────────────────────────────────────
    const HDR_H = 100
    doc.rect(0, 0, W, HDR_H).fill(C.navy)

    // Subtle diagonal accent
    doc.save()
    doc.rect(0, 0, W, HDR_H).clip()
    doc.polygon([W - 180, 0], [W, 0], [W, HDR_H], [W - 240, HDR_H]).fill(C.blue)
    doc.polygon([W - 90,  0], [W, 0], [W, HDR_H], [W - 130, HDR_H]).fillOpacity(0.35).fill(C.accent)
    doc.restore()

    // Logo
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(24)
       .text('PharmaLink', ML, 26, { continued: true })
    doc.font('Helvetica').fillColor('#93C5FD').text(' Wholesale')
    doc.fillColor('#93C5FD').font('Helvetica').fontSize(9)
       .text('Pharmaceutical Wholesale & Import Solutions', ML, 58)

    // RFQ number badge (top-right)
    const BW = 148, BH = 58, BX = W - MR - BW, BY = 21
    doc.roundedRect(BX, BY, BW, BH, 6).fill('rgba(255,255,255,0.10)')
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(11)
       .text(rfqNum, BX, BY + 10, { width: BW, align: 'center' })
    doc.fillColor('#93C5FD').font('Helvetica').fontSize(7.5)
       .text('QUOTATION REFERENCE', BX, BY + 26, { width: BW, align: 'center' })
    doc.fillColor('#BFDBFE').font('Helvetica').fontSize(8)
       .text(dateStr, BX, BY + 40, { width: BW, align: 'center' })

    // ── ② RIBBON ─────────────────────────────────────────────────────────────
    doc.rect(0, HDR_H, W, 16).fill(C.accent)
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7)
       .text('OFFICIAL QUOTATION  ·  CONFIDENTIAL  ·  PHARMALINK WHOLESALE', 0, HDR_H + 5, { width: W, align: 'center' })

    let y = HDR_H + 16 + 18  // start of content

    // ── ③ INFO CARDS (2 columns) ──────────────────────────────────────────────
    const cardW = (TW - 16) / 2
    const cardH = 118
    const cardPad = 14

    // Helper: draw one info card
    function infoCard(x, title, rows) {
      doc.roundedRect(x, y, cardW, cardH, 5).fill(C.sky)
      // Title bar
      doc.roundedRect(x, y, cardW, 26, 5).fill(C.navy)
      // Fix bottom corners of title bar
      doc.rect(x, y + 16, cardW, 10).fill(C.navy)
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8)
         .text(title, x + cardPad, y + 9, { width: cardW - cardPad * 2 })

      let ry = y + 32
      rows.forEach(([label, value]) => {
        if (!value) return
        doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(6.5)
           .text(label.toUpperCase(), x + cardPad, ry, { width: cardW - cardPad * 2 })
        doc.fillColor(C.dark).font('Helvetica').fontSize(8.5)
           .text(String(value), x + cardPad, ry + 8, { width: cardW - cardPad * 2, lineBreak: false })
        ry += 20
      })
    }

    infoCard(ML, 'CUSTOMER INFORMATION', [
      ['Name',         rfq.customerName],
      ['Company',      rfq.companyName],
      ['Email',        rfq.email],
      ['Phone',        rfq.phone],
      ['Location',     [rfq.city, rfq.country].filter(Boolean).join(', ')],
    ])

    infoCard(ML + cardW + 16, 'QUOTATION DETAILS', [
      ['Issue Date',      dateStr],
      ['Delivery By',     delivery],
      ['Shipping Method', shipping],
      ['Valid For',       '30 days from issue date'],
    ])

    y += cardH + 22

    // ── ④ PRODUCTS TABLE ──────────────────────────────────────────────────────
    // Section title
    doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(11)
       .text('Quoted Products & Pricing', ML, y)
    doc.moveTo(ML, y + 15).lineTo(W - MR, y + 15)
       .strokeColor(C.accent).lineWidth(1.5).stroke()
    y += 22

    // ── Column layout (all within TW = 499) ──────────────────────────────────
    // #(20) | Product(170) | Brand(100) | Qty(35) | Unit(44) | UnitPrice(65) | Total(65)
    // Total with price:  20+170+100+35+44+65+65 = 499 ✓
    // Total without:     20+170+100+35+44        = 369 (brand gets extra)
    const COL = hasPrice
      ? { num: 20, name: 170, brand: 100, qty: 35, unit: 44, price: 65, total: 65 }
      : { num: 20, name: 200, brand: 150, qty: 40, unit: 89 }

    // Build x positions
    const cx = {}
    let xCursor = ML
    Object.entries(COL).forEach(([k, w]) => { cx[k] = xCursor; xCursor += w })

    // Header row
    const HDR_ROW = 22
    doc.rect(ML, y, TW, HDR_ROW).fill(C.navy)
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5)
    doc.text('#',            cx.num,   y + 7, { width: COL.num,   align: 'center' })
    doc.text('PRODUCT NAME', cx.name,  y + 7, { width: COL.name,  align: 'left' })
    doc.text('BRAND',        cx.brand, y + 7, { width: COL.brand, align: 'left' })
    doc.text('QTY',          cx.qty,   y + 7, { width: COL.qty,   align: 'right' })
    doc.text('UNIT',         cx.unit,  y + 7, { width: COL.unit,  align: 'center' })
    if (hasPrice) {
      doc.text('UNIT PRICE', cx.price, y + 7, { width: COL.price, align: 'right' })
      doc.text('TOTAL',      cx.total, y + 7, { width: COL.total, align: 'right' })
    }
    y += HDR_ROW

    // Data rows
    let grandTotal = 0
    const ROW_H = 26

    items.forEach((item, i) => {
      const up        = (item.unitPrice != null && item.unitPrice !== '') ? parseFloat(item.unitPrice) : null
      const lineTotal = up != null ? up * item.quantity : null
      if (lineTotal != null) grandTotal += lineTotal

      // Row background
      doc.rect(ML, y, TW, ROW_H).fill(i % 2 === 0 ? C.rowEven : C.rowAlt)

      // Row number
      doc.fillColor(C.accent).font('Helvetica-Bold').fontSize(7.5)
         .text(String(i + 1).padStart(2, '0'), cx.num, y + 8, { width: COL.num, align: 'center' })

      // Product name (bold, truncated)
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8)
         .text(item.productName || item.product_name || '', cx.name, y + 8,
               { width: COL.name - 4, lineBreak: false })

      // Brand
      doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
         .text(item.brand || '—', cx.brand, y + 8,
               { width: COL.brand - 4, lineBreak: false })

      // Qty
      doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(9)
         .text(String(item.quantity), cx.qty, y + 7, { width: COL.qty, align: 'right' })

      // Unit
      doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
         .text(item.unit || 'units', cx.unit, y + 8, { width: COL.unit, align: 'center' })

      if (hasPrice) {
        // Unit price
        doc.fillColor(C.dark).font('Helvetica').fontSize(8)
           .text(up != null ? `${currency} ${fmt(up)}` : '—',
                 cx.price, y + 8, { width: COL.price, align: 'right' })

        // Line total
        doc.fillColor(lineTotal != null ? C.green : C.muted)
           .font('Helvetica-Bold').fontSize(8)
           .text(lineTotal != null ? `${currency} ${fmt(lineTotal)}` : '—',
                 cx.total, y + 8, { width: COL.total, align: 'right' })
      }

      // Row bottom border
      doc.moveTo(ML, y + ROW_H).lineTo(W - MR, y + ROW_H)
         .strokeColor(C.border).lineWidth(0.4).stroke()

      y += ROW_H
    })

    // Grand total row
    if (hasPrice) {
      const subTotal = grandTotal;
      const vat = subTotal * 0.15;
      const finalTotal = subTotal + vat;

      const SUM_H = 75
      doc.rect(ML, y, TW, SUM_H).fill(C.navy)
      
      const lblX = ML + 12;
      const lblW = TW - COL.total - 24;

      // Subtotal
      doc.fillColor(C.sky).font('Helvetica').fontSize(8)
         .text('SUBTOTAL', lblX, y + 14, { width: lblW, align: 'right' })
      doc.fillColor(C.sky).font('Helvetica').fontSize(8)
         .text(`${currency} ${fmt(subTotal)}`, cx.total, y + 14, { width: COL.total, align: 'right' })

      // VAT (15%)
      doc.fillColor(C.sky).font('Helvetica').fontSize(8)
         .text('VAT (15%)', lblX, y + 28, { width: lblW, align: 'right' })
      doc.fillColor(C.sky).font('Helvetica').fontSize(8)
         .text(`${currency} ${fmt(vat)}`, cx.total, y + 28, { width: COL.total, align: 'right' })

      // Divider
      doc.moveTo(cx.total - 24, y + 44).lineTo(W - MR - 12, y + 44).strokeColor('rgba(255,255,255,0.2)').lineWidth(1).stroke()

      // Grand Total
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9)
         .text('GRAND TOTAL', lblX, y + 54, { width: lblW, align: 'right' })
      doc.fillColor('#FCD34D').font('Helvetica-Bold').fontSize(11)
         .text(`${currency} ${fmt(finalTotal)}`, cx.total, y + 53, { width: COL.total, align: 'right' })

      y += SUM_H
    }

    y += 20

    // ── ⑤ NOTES / INSTRUCTIONS ───────────────────────────────────────────────
    if (rfq.quoteNotes || rfq.message) {
      const noteText = rfq.quoteNotes || rfq.message
      const noteH    = 64
      doc.roundedRect(ML, y, TW, noteH, 5).fill(C.sky)
      doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(8.5)
         .text(rfq.quoteNotes ? 'QUOTATION NOTES' : 'SPECIAL INSTRUCTIONS', ML + 12, y + 10)
      doc.fillColor(C.dark).font('Helvetica').fontSize(8.5)
         .text(noteText, ML + 12, y + 24, { width: TW - 24, height: noteH - 28 })
      y += noteH + 14
    }

    // ── ⑥ TERMS & CONDITIONS ─────────────────────────────────────────────────
    const termsH = 48
    doc.roundedRect(ML, y, TW, termsH, 5)
       .strokeColor(C.border).lineWidth(0.8).stroke()
    doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(8)
       .text('Terms & Conditions', ML + 12, y + 10)
    doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
       .text(
         'Prices are valid for 30 days from the issue date. Payment: 50% advance, 50% prior to dispatch. ' +
         'Unit prices are exclusive of VAT. A 15% VAT is strictly applied to the final total in accordance with Ethiopian business regulations.',
         ML + 12, y + 22, { width: TW - 24 }
       )
    y += termsH + 14

    // ── ⑦ SIGNATURE BLOCK ────────────────────────────────────────────────────
    const sigY = Math.max(y, H - 130)
    doc.moveTo(ML, sigY).lineTo(ML + 160, sigY)
       .strokeColor(C.border).lineWidth(0.8).stroke()
    doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
       .text('Authorised Signature', ML, sigY + 5)
    doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
       .text('Date: ___________________', ML + 200, sigY + 5)

    // ── ⑧ FOOTER ─────────────────────────────────────────────────────────────
    const FTR_H = 44
    const FTR_Y = H - FTR_H
    doc.rect(0, FTR_Y, W, FTR_H).fill(C.navy)

    // Left: brand
    doc.fillColor('#93C5FD').font('Helvetica-Bold').fontSize(8.5)
       .text('PharmaLink Wholesale', ML, FTR_Y + 10)
    doc.fillColor('#BFDBFE').font('Helvetica').fontSize(7)
       .text('procurement@pharmalinkwholesale.com  ·  +44 (0) 20 7946 0123', ML, FTR_Y + 24)

    // Right: confidentiality
    doc.fillColor('#BFDBFE').font('Helvetica').fontSize(7)
       .text('Confidential — for named recipient only', 0, FTR_Y + 24,
             { width: W - MR, align: 'right' })

    // Page number
    doc.fillColor('#93C5FD').font('Helvetica').fontSize(7)
       .text('Page 1 of 1', 0, FTR_Y + 10, { width: W - MR, align: 'right' })

    doc.end()
  })
}

module.exports = { generateRFQPDF }
