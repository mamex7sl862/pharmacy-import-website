const PDFDocument = require('pdfkit')

function generateRFQPDF(rfq) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const W = doc.page.width   // 595
    const H = doc.page.height  // 842
    const M = 45               // margin

    const navy   = '#0a2463'
    const blue   = '#1e5fa8'
    const accent = '#3a86ff'
    const light  = '#e8f0fe'
    const muted  = '#6b7280'
    const dark   = '#111827'
    const white  = '#ffffff'
    const green  = '#059669'
    const border = '#e5e7eb'

    // ── HEADER BAND ──────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 110).fill(navy)

    // Diagonal accent stripe
    doc.save()
    doc.rect(0, 0, W, 110).clip()
    doc.moveTo(W - 160, 0).lineTo(W, 0).lineTo(W, 110).lineTo(W - 220, 110).fill(blue)
    doc.moveTo(W - 80, 0).lineTo(W, 0).lineTo(W, 110).lineTo(W - 120, 110).fill(accent).opacity(0.4)
    doc.restore()

    // Logo text
    doc.fillColor(white).font('Helvetica-Bold').fontSize(26)
       .text('PharmaLink', M, 28, { continued: true })
       .font('Helvetica').fillColor('#93c5fd').text(' Wholesale')

    doc.fillColor('#93c5fd').font('Helvetica').fontSize(10)
       .text('Official Quotation Document', M, 62)

    // RFQ badge top-right
    const badgeX = W - 180
    doc.roundedRect(badgeX, 22, 140, 66, 8).fill('rgba(255,255,255,0.12)')
    doc.fillColor(white).font('Helvetica-Bold').fontSize(13)
       .text(rfq.rfqNumber || rfq.rfq_number || '', badgeX, 32, { width: 140, align: 'center' })
    doc.fillColor('#93c5fd').font('Helvetica').fontSize(9)
       .text('QUOTATION NUMBER', badgeX, 50, { width: 140, align: 'center' })
    const dateStr = rfq.submittedAt || rfq.submitted_at
      ? new Date(rfq.submittedAt || rfq.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    doc.fillColor('#bfdbfe').font('Helvetica').fontSize(8)
       .text(dateStr, badgeX, 66, { width: 140, align: 'center' })

    let y = 128

    // ── STATUS RIBBON ────────────────────────────────────────────────────────
    doc.rect(0, 110, W, 18).fill(accent)
    doc.fillColor(white).font('Helvetica-Bold').fontSize(7.5)
       .text('OFFICIAL QUOTATION  ·  CONFIDENTIAL  ·  PHARMALINK WHOLESALE', 0, 115, { width: W, align: 'center' })

    // ── TWO-COLUMN INFO SECTION ──────────────────────────────────────────────
    const colW = (W - M * 2 - 20) / 2

    // Left card: Customer Info
    doc.roundedRect(M, y, colW, 130, 6).fill(light)
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
       .text('CUSTOMER INFORMATION', M + 14, y + 14)
    doc.moveTo(M + 14, y + 28).lineTo(M + colW - 14, y + 28).strokeColor(accent).lineWidth(1.5).stroke()

    const custFields = [
      ['Name',     rfq.customerName],
      ['Company',  rfq.companyName],
      ['Email',    rfq.email],
      ['Phone',    rfq.phone],
      ['Location', [rfq.city, rfq.country].filter(Boolean).join(', ')],
    ].filter(([, v]) => v)

    let cy = y + 36
    custFields.forEach(([label, value]) => {
      doc.fillColor(muted).font('Helvetica-Bold').fontSize(7).text(label.toUpperCase(), M + 14, cy)
      doc.fillColor(dark).font('Helvetica').fontSize(9).text(value, M + 14, cy + 9, { width: colW - 28 })
      cy += 22
    })

    // Right card: Quotation Details
    const rx = M + colW + 20
    doc.roundedRect(rx, y, colW, 130, 6).fill(light)
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
       .text('QUOTATION DETAILS', rx + 14, y + 14)
    doc.moveTo(rx + 14, y + 28).lineTo(rx + colW - 14, y + 28).strokeColor(accent).lineWidth(1.5).stroke()

    const deliveryDate = rfq.requestedDeliveryDate || rfq.requested_delivery_date
    const shippingMethod = rfq.shippingMethod || rfq.shipping_method
    const detailFields = [
      ['Issue Date',      dateStr],
      ['Delivery By',     deliveryDate || 'To be confirmed'],
      ['Shipping Method', shippingMethod || 'To be confirmed'],
      ['Valid For',       '30 days from issue date'],
    ]

    let dy = y + 36
    detailFields.forEach(([label, value]) => {
      doc.fillColor(muted).font('Helvetica-Bold').fontSize(7).text(label.toUpperCase(), rx + 14, dy)
      doc.fillColor(dark).font('Helvetica').fontSize(9).text(value, rx + 14, dy + 9, { width: colW - 28 })
      dy += 22
    })

    y += 148

    // ── PRODUCTS TABLE ───────────────────────────────────────────────────────
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('Quoted Products & Pricing', M, y)
    doc.moveTo(M, y + 16).lineTo(W - M, y + 16).strokeColor(accent).lineWidth(2).stroke()
    y += 24

    const items = rfq.items || []
    const hasPrice = items.some((i) => i.unitPrice != null && i.unitPrice !== '')
    const currency = items[0]?.currency || 'USD'

    // Table header
    const tH = 24
    doc.rect(M, y, W - M * 2, tH).fill(navy)

    // Column positions
    const c = {
      num:   M + 8,
      name:  M + 30,
      brand: M + 200,
      qty:   M + 320,
      unit:  M + 365,
      price: M + 415,
      total: M + 465,
    }
    const tableW = W - M * 2

    doc.fillColor(white).font('Helvetica-Bold').fontSize(7.5)
    doc.text('#',            c.num,   y + 8, { width: 20 })
    doc.text('PRODUCT NAME', c.name,  y + 8, { width: 165 })
    doc.text('BRAND',        c.brand, y + 8, { width: 115 })
    doc.text('QTY',          c.qty,   y + 8, { width: 40, align: 'right' })
    doc.text('UNIT',         c.unit,  y + 8, { width: 45 })
    if (hasPrice) {
      doc.text(`UNIT PRICE`,  c.price, y + 8, { width: 55, align: 'right' })
      doc.text('TOTAL',       c.total, y + 8, { width: 55, align: 'right' })
    }
    y += tH

    let grandTotal = 0
    items.forEach((item, i) => {
      const rowH = 28
      // Alternating rows
      doc.rect(M, y, tableW, rowH).fill(i % 2 === 0 ? white : '#f8faff')

      const up = item.unitPrice != null && item.unitPrice !== '' ? parseFloat(item.unitPrice) : null
      const lineTotal = up != null ? up * item.quantity : null
      if (lineTotal != null) grandTotal += lineTotal

      doc.fillColor(accent).font('Helvetica-Bold').fontSize(8)
         .text(String(i + 1).padStart(2, '0'), c.num, y + 10, { width: 20 })

      doc.fillColor(dark).font('Helvetica-Bold').fontSize(8.5)
         .text(item.productName || item.product_name || '', c.name, y + 10, { width: 165 })

      doc.fillColor(muted).font('Helvetica').fontSize(8)
         .text(item.brand || '—', c.brand, y + 10, { width: 115 })

      doc.fillColor(navy).font('Helvetica-Bold').fontSize(9)
         .text(String(item.quantity), c.qty, y + 10, { width: 40, align: 'right' })

      doc.fillColor(muted).font('Helvetica').fontSize(8)
         .text(item.unit || 'units', c.unit, y + 10, { width: 45 })

      if (hasPrice) {
        doc.fillColor(dark).font('Helvetica').fontSize(8.5)
           .text(up != null ? `${currency} ${up.toFixed(2)}` : '—', c.price, y + 10, { width: 55, align: 'right' })

        doc.fillColor(up != null ? green : muted).font('Helvetica-Bold').fontSize(8.5)
           .text(lineTotal != null ? `${currency} ${lineTotal.toFixed(2)}` : '—', c.total, y + 10, { width: 55, align: 'right' })
      }

      // Bottom border
      doc.moveTo(M, y + rowH).lineTo(W - M, y + rowH).strokeColor(border).lineWidth(0.5).stroke()
      y += rowH
    })

    // Grand total row
    if (hasPrice) {
      const gtH = 32
      doc.rect(M, y, tableW, gtH).fill(navy)
      doc.fillColor(white).font('Helvetica-Bold').fontSize(10)
         .text('GRAND TOTAL', M + 14, y + 10, { width: tableW - 80 })
      doc.fillColor('#fbbf24').font('Helvetica-Bold').fontSize(12)
         .text(`${currency} ${grandTotal.toFixed(2)}`, c.total - 10, y + 9, { width: 65, align: 'right' })
      y += gtH
    }

    y += 20

    // ── QUOTE NOTES ──────────────────────────────────────────────────────────
    if (rfq.quoteNotes || rfq.message) {
      const noteText = rfq.quoteNotes || rfq.message
      doc.roundedRect(M, y, W - M * 2, 70, 6).fill(light)
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
         .text(rfq.quoteNotes ? 'QUOTATION NOTES' : 'SPECIAL INSTRUCTIONS', M + 14, y + 12)
      doc.fillColor(dark).font('Helvetica').fontSize(9)
         .text(noteText, M + 14, y + 28, { width: W - M * 2 - 28, height: 32 })
      y += 80
    }

    // ── TERMS BOX ────────────────────────────────────────────────────────────
    doc.roundedRect(M, y, W - M * 2, 50, 6).strokeColor(border).lineWidth(1).stroke()
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(9).text('Terms & Conditions', M + 14, y + 10)
    doc.fillColor(muted).font('Helvetica').fontSize(7.5)
       .text('Prices are valid for 30 days. Payment terms: 50% advance, 50% on delivery. All prices are exclusive of applicable taxes and duties. Subject to product availability.', M + 14, y + 24, { width: W - M * 2 - 28 })

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const footerY = H - 48
    doc.rect(0, footerY, W, 48).fill(navy)

    doc.fillColor('#93c5fd').font('Helvetica-Bold').fontSize(8)
       .text('PharmaLink Wholesale', M, footerY + 10)
    doc.fillColor('#bfdbfe').font('Helvetica').fontSize(7.5)
       .text('procurement@pharmalinkwholesale.com  ·  +44 (0) 20 7946 0123  ·  www.pharmalinkwholesale.com', M, footerY + 24)

    doc.fillColor('#bfdbfe').font('Helvetica').fontSize(7)
       .text('This document is confidential and intended solely for the named recipient.', 0, footerY + 24, { width: W - M, align: 'right' })

    doc.end()
  })
}

module.exports = { generateRFQPDF }
