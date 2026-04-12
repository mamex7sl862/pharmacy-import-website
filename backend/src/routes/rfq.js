const router = require('express').Router()
const Joi = require('joi')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pool = require('../db/pool')
const { generateRFQNumber } = require('../services/rfqNumber')
const { sendCustomerConfirmation, sendAdminNotification } = require('../services/email')

// ── File upload config ────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true)
    else cb(new Error(`Invalid file type: ${file.mimetype}`))
  },
})

// ── Validation schema ─────────────────────────────────────────────────────────
const rfqSchema = Joi.object({
  customerInfo: Joi.object({
    fullName:     Joi.string().min(2).required(),
    companyName:  Joi.string().min(2).required(),
    businessType: Joi.string().required(),
    email:        Joi.string().email().required(),
    phone:        Joi.string().min(5).required(),
    country:      Joi.string().required(),
    city:         Joi.string().required(),
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
  }).optional().unknown(true), // allow any extra fields from the store
})

// ── Helper: is valid UUID ─────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUUID = (s) => UUID_RE.test(s)

// ── POST /api/rfq ─────────────────────────────────────────────────────────────
router.post('/', upload.array('attachments', 5), async (req, res, next) => {
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
        requested_delivery_date, shipping_method, message, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'NEW')
      RETURNING id, rfq_number AS "rfqNumber", submitted_at AS "submittedAt"`,
      [
        rfqNumber,
        customerId,
        customerInfo.fullName, customerInfo.companyName, customerInfo.businessType,
        customerInfo.email, customerInfo.phone, customerInfo.country, customerInfo.city,
        additionalInfo.requestedDeliveryDate || null,
        additionalInfo.shippingMethod || null,
        additionalInfo.message || null,
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
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUrl = `/uploads/${file.filename}`
        await client.query(
          `INSERT INTO rfq_attachments (rfq_id, file_name, file_url, file_size, mime_type)
           VALUES ($1,$2,$3,$4,$5)`,
          [rfq.id, file.originalname, fileUrl, file.size, file.mimetype]
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
