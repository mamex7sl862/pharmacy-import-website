const router = require('express').Router()
const pool = require('../db/pool')
const { verifyToken } = require('../middleware/auth')
const { generateRFQPDF } = require('../services/pdf')

router.use(verifyToken)

// Stock reserve — minimum stock that must remain after any order
const STOCK_RESERVE = 50

// GET /api/customer/profile
router.get('/profile', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, full_name AS "fullName", company_name AS "companyName",
              business_type AS "businessType", phone, country, city, role
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

// PUT /api/customer/profile
router.put('/profile', async (req, res, next) => {
  try {
    const { companyName, businessType, phone, country, city } = req.body
    const { rows } = await pool.query(
      `UPDATE users SET
        company_name  = COALESCE($1, company_name),
        business_type = COALESCE($2, business_type),
        phone         = COALESCE($3, phone),
        country       = COALESCE($4, country),
        city          = COALESCE($5, city),
        updated_at    = NOW()
       WHERE id = $6
       RETURNING id, email, full_name AS "fullName", company_name AS "companyName",
                 business_type AS "businessType", phone, country, city, role`,
      [companyName || null, businessType || null, phone || null, country || null, city || null, req.user.id]
    )
    res.json(rows[0])
  } catch (err) { next(err) }
})

// GET /api/customer/rfqs
router.get('/rfqs', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.rfq_number AS "rfqNumber", r.status,
              r.submitted_at AS "submittedAt",
              r.requested_delivery_date AS "requestedDeliveryDate",
              r.shipping_method AS "shippingMethod",
              r.decline_reason AS "declineReason",
              COUNT(ri.id)::int AS "itemCount"
       FROM rfqs r
       LEFT JOIN rfq_items ri ON ri.rfq_id = r.id
       WHERE r.customer_id = $1
       GROUP BY r.id ORDER BY r.submitted_at DESC`,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// GET /api/customer/rfqs/:id
router.get('/rfqs/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.full_name AS "customerName", u.company_name AS "companyName",
              u.email, u.phone, u.country, u.city, u.business_type AS "businessType"
       FROM rfqs r LEFT JOIN users u ON u.id = r.customer_id
       WHERE r.id = $1 AND r.customer_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })
    const rfq = rows[0]
    const [{ rows: items }, { rows: attachments }] = await Promise.all([
      pool.query('SELECT * FROM rfq_items WHERE rfq_id = $1 ORDER BY id', [rfq.id]),
      pool.query('SELECT * FROM rfq_attachments WHERE rfq_id = $1', [rfq.id]),
    ])
    rfq.items = items
    rfq.attachments = attachments
    res.json(rfq)
  } catch (err) { next(err) }
})

// POST /api/customer/rfqs/:id/decline — Decline quotation
router.post('/rfqs/:id/decline', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT id, status, rfq_number FROM rfqs WHERE id = $1 AND customer_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'RFQ not found' })
    const rfq = rows[0]
    if (rfq.status !== 'QUOTATION_SENT') {
      return res.status(400).json({ error: 'Only a QUOTATION_SENT RFQ can be declined' })
    }
    const { reason } = req.body
    await client.query(
      `UPDATE rfqs SET status = 'DECLINED', decline_reason = $1, updated_at = NOW() WHERE id = $2`,
      [reason || null, rfq.id]
    )
    res.json({ success: true, message: 'Quotation declined.', rfqNumber: rfq.rfq_number })
  } catch (err) {
    next(err)
  } finally {
    client.release()
  }
})

// POST /api/customer/rfqs/:id/accept — Accept quotation, close RFQ, deduct stock
router.post('/rfqs/:id/accept', async (req, res, next) => {
  const client = await pool.connect()
  try {
    // Verify RFQ belongs to this customer and is in QUOTATION_SENT status
    const { rows } = await client.query(
      `SELECT id, status, rfq_number FROM rfqs WHERE id = $1 AND customer_id = $2`,
      [req.params.id, req.user.id]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'RFQ not found' })
    }

    const rfq = rows[0]

    if (rfq.status !== 'QUOTATION_SENT') {
      return res.status(400).json({ error: 'Only a QUOTATION_SENT RFQ can be accepted' })
    }

    // Get all items that are linked to a product (so we can deduct stock)
    const { rows: items } = await client.query(
      `SELECT product_id, quantity FROM rfq_items
       WHERE rfq_id = $1 AND product_id IS NOT NULL`,
      [rfq.id]
    )

    // Run everything in a single transaction
    await client.query('BEGIN')

    // 1. Deduct stock for each linked product — never go below STOCK_RESERVE
    for (const item of items) {
      // Check available stock (above reserve) before deducting
      const { rows: stockRows } = await client.query(
        'SELECT stock_quantity FROM products WHERE id = $1',
        [item.product_id]
      )
      if (stockRows.length) {
        const available = Math.max(0, stockRows[0].stock_quantity - STOCK_RESERVE)
        if (item.quantity > available) {
          await client.query('ROLLBACK')
          return res.status(400).json({
            error: 'INSUFFICIENT_STOCK',
            message: `Insufficient available stock for one or more items. Only ${available} units available (${STOCK_RESERVE} units reserved).`,
          })
        }
      }
      await client.query(
        `UPDATE products
         SET stock_quantity = GREATEST($2, stock_quantity - $1),
             updated_at     = NOW()
         WHERE id = $3`,
        [item.quantity, STOCK_RESERVE, item.product_id]
      )
    }

    // 2. Close the RFQ
    await client.query(
      `UPDATE rfqs SET status = 'CLOSED', updated_at = NOW() WHERE id = $1`,
      [rfq.id]
    )

    await client.query('COMMIT')

    res.json({
      success: true,
      message: 'Quotation accepted. Your order is confirmed.',
      rfqNumber: rfq.rfq_number,
    })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    next(err)
  } finally {
    client.release()
  }
})

// GET /api/customer/rfqs/:id/pdf
router.get('/rfqs/:id/pdf', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.full_name AS "customerName", u.company_name AS "companyName",
              u.email, u.phone, u.country, u.city
       FROM rfqs r LEFT JOIN users u ON u.id = r.customer_id
       WHERE r.id = $1 AND r.customer_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })
    const rfq = rows[0]
    const { rows: items } = await pool.query(
      'SELECT * FROM rfq_items WHERE rfq_id = $1 ORDER BY id', [rfq.id]
    )
    const pdfData = {
      rfqNumber: rfq.rfq_number, submittedAt: rfq.submitted_at,
      customerName: rfq.customerName, companyName: rfq.companyName,
      email: rfq.email, phone: rfq.phone, city: rfq.city, country: rfq.country,
      message: rfq.message,
      quoteNotes: rfq.quote_notes,
      requestedDeliveryDate: rfq.requested_delivery_date,
      shippingMethod: rfq.shipping_method,
      items: items.map((i) => ({
        productName: i.product_name, brand: i.brand,
        quantity: i.quantity, unit: i.unit, notes: i.notes,
        unitPrice: i.unit_price, currency: i.currency || 'USD',
      })),
    }
    const pdfBuffer = await generateRFQPDF(pdfData)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${rfq.rfq_number}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) { next(err) }
})

module.exports = router
