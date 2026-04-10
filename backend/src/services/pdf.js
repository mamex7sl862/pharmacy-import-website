const PDFDocument = require('pdfkit')

function generateRFQPDF(rfq) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const primary = '#003f87'
    const muted   = '#727784'
    const dark    = '#191c1d'

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(primary)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
       .text('PharmaLink Wholesale', 50, 25)
    doc.fillColor('#bbd0ff').font('Helvetica').fontSize(10)
       .text('Request for Quotation', 50, 52)

    // RFQ number top-right
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11)
       .text(rfq.rfqNumber || rfq.rfq_number || '', 0, 30, { align: 'right', width: doc.page.width - 50 })
    doc.fillColor('#bbd0ff').font('Helvetica').fontSize(9)
       .text(`Submitted: ${new Date(rfq.submittedAt || rfq.submitted_at).toLocaleDateString()}`, 0, 48, { align: 'right', width: doc.page.width - 50 })

    doc.moveDown(3)

    // ── Customer Info ────────────────────────────────────────────────────────
    doc.fillColor(primary).font('Helvetica-Bold').fontSize(12).text('Customer Information')
    doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4).strokeColor('#e7e8e9').stroke()
    doc.moveDown(0.8)

    const customerFields = [
      ['Name',          rfq.customerName],
      ['Company',       rfq.companyName],
      ['Email',         rfq.email],
      ['Phone',         rfq.phone],
      ['Location',      [rfq.city, rfq.country].filter(Boolean).join(', ')],
    ]

    customerFields.forEach(([label, value]) => {
      if (!value) return
      doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), { continued: false })
      doc.fillColor(dark).font('Helvetica').fontSize(10).text(value)
      doc.moveDown(0.3)
    })

    doc.moveDown(0.5)

    // ── Products Table ───────────────────────────────────────────────────────
    doc.fillColor(primary).font('Helvetica-Bold').fontSize(12).text('Requested Products')
    doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4).strokeColor('#e7e8e9').stroke()
    doc.moveDown(0.8)

    // Table header
    const cols = { name: 50, brand: 230, qty: 360, unit: 420, notes: 470 }
    const headerY = doc.y
    doc.rect(50, headerY - 4, doc.page.width - 100, 20).fill('#f3f4f5')
    doc.fillColor(muted).font('Helvetica-Bold').fontSize(8)
    doc.text('PRODUCT NAME',  cols.name,  headerY, { width: 170 })
    doc.text('BRAND',         cols.brand, headerY, { width: 120 })
    doc.text('QTY',           cols.qty,   headerY, { width: 55 })
    doc.text('UNIT',          cols.unit,  headerY, { width: 45 })
    doc.text('NOTES',         cols.notes, headerY, { width: 80 })
    doc.moveDown(1.2)

    const items = rfq.items || []
    items.forEach((item, i) => {
      const rowY = doc.y
      if (i % 2 === 0) {
        doc.rect(50, rowY - 2, doc.page.width - 100, 18).fill('#fafafa')
      }
      doc.fillColor(dark).font('Helvetica').fontSize(9)
      doc.text(item.productName || item.product_name || '', cols.name,  rowY, { width: 170 })
      doc.text(item.brand || '—',                           cols.brand, rowY, { width: 120 })
      doc.text(String(item.quantity),                       cols.qty,   rowY, { width: 55 })
      doc.text(item.unit || 'units',                        cols.unit,  rowY, { width: 45 })
      doc.text(item.notes || '',                            cols.notes, rowY, { width: 80 })
      doc.moveDown(0.8)
    })

    doc.moveDown(0.5)

    // ── Logistics ────────────────────────────────────────────────────────────
    const deliveryDate = rfq.requestedDeliveryDate || rfq.requested_delivery_date
    const shippingMethod = rfq.shippingMethod || rfq.shipping_method
    if (deliveryDate || shippingMethod) {
      doc.fillColor(primary).font('Helvetica-Bold').fontSize(12).text('Logistics')
      doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 100, doc.y + 4).strokeColor('#e7e8e9').stroke()
      doc.moveDown(0.8)
      if (deliveryDate) {
        doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text('REQUIRED DELIVERY DATE')
        doc.fillColor(dark).font('Helvetica').fontSize(10).text(deliveryDate)
        doc.moveDown(0.3)
      }
      if (shippingMethod) {
        doc.fillColor(muted).font('Helvetica-Bold').fontSize(8).text('SHIPPING METHOD')
        doc.fillColor(dark).font('Helvetica').fontSize(10).text(shippingMethod)
        doc.moveDown(0.3)
      }
      doc.moveDown(0.5)
    }

    // ── Message ──────────────────────────────────────────────────────────────
    if (rfq.message) {
      doc.fillColor(primary).font('Helvetica-Bold').fontSize(12).text('Special Instructions')
      doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 100, doc.y + 4).strokeColor('#e7e8e9').stroke()
      doc.moveDown(0.8)
      doc.fillColor(dark).font('Helvetica').fontSize(10).text(rfq.message, { width: doc.page.width - 100 })
      doc.moveDown(0.5)
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 60
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).strokeColor('#e7e8e9').stroke()
    doc.fillColor(muted).font('Helvetica').fontSize(8)
       .text('PharmaLink Wholesale | procurement@pharmalinkwholesale.com | +44 (0) 20 7946 0123',
             50, footerY + 10, { align: 'center', width: doc.page.width - 100 })
    doc.text('This document is confidential and intended solely for the named recipient.',
             50, footerY + 22, { align: 'center', width: doc.page.width - 100 })

    doc.end()
  })
}

module.exports = { generateRFQPDF }
