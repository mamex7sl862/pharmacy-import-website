const router = require('express').Router()
const Joi = require('joi')
const path = require('path')
const pool = require('../db/pool')
const { generateRFQNumber } = require('../services/rfqNumber')
const { sendCustomerConfirmation, sendAdminNotification } = require('../services/email')
const { generateRFQPDF } = require('../services/pdf')
const { upload, getFileUrl } = require('../services/upload')

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

const uploadMiddleware = upload.fields([
  { name: 'attachments', maxCount: 5 },
  { name: 'legalDocument', maxCount: 1 },
])

// ── Validation schema ─────────────────────────────────────────────────────────
const rfqSchema = Joi.object({
  customerInfo: Joi.object({
    fullName:     Joi.string().min(2).required(),
    companyName:  Joi.string().allow('', null).optional(),
    businessType: Joi.string().allow('', null).optional(),
    email:        Joi.string().email().required(),
    phone:        Joi.string().allow('', null).optional(),
    country:      Joi.string().allow('', null).optional(),
    city:         Joi.string().allow('', null).optional(),
  }).required(),
  products: Joi.array().items(
    Joi.object({
      productId:   Joi.string().required(),          // allow any string — static IDs are not UUIDs
      productName: Joi.string().required(),
      brand:       Joi.string().allow('', null),
      quantity:    Joi.number().integer().min(1).required(),
      unit:        Joi.string().default('units'),
      notes:       Joi.string().allow('', null),
    })
  ).min(1).required(),
  additionalInfo: Joi.object({
    requestedDeliveryDate: Joi.string().allow('', null),
    shippingMethod:        Joi.string().allow('', null),
    message:               Joi.string().allow('', null),
    attachmentNames:       Joi.array().items(Joi.string()).optional(), // UI-only field
    attachments:           Joi.array().optional(), // persisted store field
    legalDocumentName:     Joi.string().allow('', null).optional(),
  }).optional().unknown(true), // allow any extra fields from the store
})

// ── Helper: is valid UUID ─────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUUID = (s) => UUID_RE.test(s)

// ── POST /api/rfq ─────────────────────────────────────────────────────────────
router.post('/', uploadMiddleware, async (req, res, next) => {
  const client = await pool.connect()
  try {
    // Body may come as JSON string when using multipart/form-data
    let body = req.body
    if (typeof body.customerInfo === 'string') {
      try { body.customerInfo = JSON.parse(body.customerInfo) } catch {}
    }
    if (typeof body.products === 'string') {
      try { body.products = JSON.parse(body.products) } catch {}
    }
    if (typeof body.additionalInfo === 'string') {
      try { body.additionalInfo = JSON.parse(body.additionalInfo) } catch {}
    }

    const { error, value } = rfqSchema.validate(body)
    if (error) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: error.message })
    }

    const { customerInfo, products, additionalInfo = {} } = value
    const year = new Date().getFullYear()

    // Identify logged-in customer from JWT if present
    let customerId = null
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET)
        customerId = decoded.id || null
      } catch {} // guest submission — no token
    }

    await client.query('BEGIN')

    const rfqNumber = await generateRFQNumber(client, year)

    const { rows: [rfq] } = await client.query(
      `INSERT INTO rfqs (
        rfq_number, customer_id,
        guest_full_name, guest_company, guest_business_type,
        guest_email, guest_phone, guest_country, guest_city,
        requested_delivery_date, shipping_method, message, status,
        legal_document_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'NEW',$13)
      RETURNING id, rfq_number AS "rfqNumber", submitted_at AS "submittedAt"`,
      [
        rfqNumber,
        customerId,
        customerInfo.fullName, customerInfo.companyName, customerInfo.businessType,
        customerInfo.email, customerInfo.phone, customerInfo.country, customerInfo.city,
        additionalInfo.requestedDeliveryDate || null,
        additionalInfo.shippingMethod || null,
        additionalInfo.message || null,
        additionalInfo.legalDocumentUrl || null,
      ]
    )

    // Insert items — only link product_id if it's a real UUID in the DB
    for (const item of products) {
      let resolvedProductId = null
      if (isUUID(item.productId)) {
        const check = await client.query('SELECT id FROM products WHERE id = $1', [item.productId])
        if (check.rows.length) resolvedProductId = item.productId
      }
      await client.query(
        `INSERT INTO rfq_items (rfq_id, product_id, product_name, brand, quantity, unit, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [rfq.id, resolvedProductId, item.productName, item.brand || null,
         item.quantity, item.unit, item.notes || null]
      )
    }

    // Save uploaded attachments
    if (req.files) {
      // General attachments
      if (req.files.attachments) {
        for (const file of req.files.attachments) {
          const fileUrl = getFileUrl(file)
          await client.query(
            `INSERT INTO rfq_attachments (rfq_id, file_name, file_url, file_size, mime_type)
             VALUES ($1,$2,$3,$4,$5)`,
            [rfq.id, file.originalname, fileUrl, file.size, file.mimetype]
          )
        }
      }
      // Legal document
      if (req.files.legalDocument) {
        const file = req.files.legalDocument[0]
        const fileUrl = getFileUrl(file)
        await client.query(
          `UPDATE rfqs SET legal_document_url = $1 WHERE id = $2`,
          [fileUrl, rfq.id]
        )
      }
    }

    await client.query('COMMIT')

    // Emails — non-blocking, graceful failure
    Promise.all([
      sendCustomerConfirmation(customerInfo.email, rfqNumber, customerInfo.fullName),
      sendAdminNotification(rfqNumber, customerInfo.fullName, customerInfo.companyName, products.length),
    ]).catch((err) => console.error('Email dispatch error:', err))

    res.status(201).json({
      rfqNumber: rfq.rfqNumber,
      rfqId: rfq.id,
      submittedAt: rfq.submittedAt,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    // Clean up uploaded files on failure
    if (req.files) req.files.forEach((f) => fs.unlink(f.path, () => {}))
    next(err)
  } finally {
    client.release()
  }
})

// ── GET /api/rfq/:rfqNumber/pdf — public PDF download ────────────────────────
router.get('/:rfqNumber/pdf', async (req, res, next) => {
  try {
    const { rfqNumber } = req.params

    const { rows } = await pool.query(
      `SELECT r.id, r.rfq_number, r.submitted_at, r.message,
              r.guest_full_name, r.guest_company, r.guest_email,
              r.guest_phone, r.guest_city, r.guest_country,
              COALESCE(u.full_name, r.guest_full_name)   AS customer_name,
              COALESCE(u.company_name, r.guest_company)  AS company_name,
              COALESCE(u.email, r.guest_email)            AS email
       FROM rfqs r
       LEFT JOIN users u ON u.id = r.customer_id
       WHERE r.rfq_number = $1`,
      [rfqNumber]
    )

    if (!rows.length) return res.status(404).json({ error: 'RFQ_NOT_FOUND' })

    const rfq = rows[0]

    const { rows: items } = await pool.query(
      `SELECT product_name, brand, quantity, unit, notes
       FROM rfq_items WHERE rfq_id = $1`,
      [rfq.id]
    )

    const pdfData = {
      rfqNumber:    rfq.rfq_number,
      submittedAt:  rfq.submitted_at,
      customerName: rfq.customer_name,
      companyName:  rfq.company_name,
      email:        rfq.email,
      phone:        rfq.guest_phone,
      city:         rfq.guest_city,
      country:      rfq.guest_country,
      message:      rfq.message,
      items: items.map((i) => ({
        productName: i.product_name,
        brand:       i.brand,
        quantity:    i.quantity,
        unit:        i.unit,
        notes:       i.notes,
      })),
    }

    const buffer = await generateRFQPDF(pdfData)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${rfqNumber}.pdf"`)
    res.send(buffer)
  } catch (err) { next(err) }
})

// ── GET /api/rfq/:rfqNumber — public status lookup ───────────────────────────
router.get('/:rfqNumber', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT rfq_number AS "rfqNumber", status, submitted_at AS "submittedAt"
       FROM rfqs WHERE rfq_number = $1`,
      [req.params.rfqNumber]
    )
    if (!rows.length) return res.status(404).json({ error: 'RFQ_NOT_FOUND' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

module.exports = router
