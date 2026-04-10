const router = require('express').Router()
const pool = require('../db/pool')
const { verifyToken } = require('../middleware/auth')
const { generateRFQPDF } = require('../services/pdf')

router.use(verifyToken)

// GET /api/customer/rfqs
router.get('/rfqs', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.rfq_number AS "rfqNumber", r.status,
              r.submitted_at AS "submittedAt",
              r.requested_delivery_date AS "requestedDeliveryDate",
              r.shipping_method AS "shippingMethod",
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
      items: items.map((i) => ({ productName: i.product_name, brand: i.brand, quantity: i.quantity, unit: i.unit, notes: i.notes })),
    }
    const pdfBuffer = await generateRFQPDF(pdfData)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${rfq.rfq_number}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) { next(err) }
})

module.exports = router
