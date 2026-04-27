const router = require('express').Router()
const multer = require('multer')
const pool = require('../db/pool')
const { requireAdmin } = require('../middleware/auth')
const { generateRFQPDF } = require('../services/pdf')
const { sendQuotationEmail } = require('../services/email')
const { cloudinary, storage } = require('../config/cloudinary')

// Multer for product images (images only)
const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only image files are allowed (JPG, PNG, WEBP)'))
  },
}).single('image')

// ── GET /api/admin/proxy-document — Fetch Cloudinary file and force PDF headers ────────
// This MUST remain before requireAdmin since standard browser link navigation cannot send Bearer tokens
router.get('/proxy-document', async (req, res, next) => {
  try {
    const { url } = req.query;
    
    // SSRF Protection: Only allow Cloudinary proxying!
    if (!url || !url.startsWith('https://res.cloudinary.com/')) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Only Cloudinary URLs can be proxied' });
    }
    
    const https = require('https');
    https.get(url, (response) => {
      if (response.statusCode >= 400) {
        return res.status(response.statusCode).send('Failed to fetch document from cloud storage.');
      }
      
      const contentType = response.headers['content-type'] || '';
      const isActuallyImage = contentType.startsWith('image/');
      
      if (!isActuallyImage && url.toLowerCase().includes('pdf') || !isActuallyImage && !contentType) {
        // Force PDF headers to make it viewable inline
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
      } else {
        res.setHeader('Content-Type', contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', 'inline');
      }
      
      response.pipe(res);
    }).on('error', (err) => {
      console.error('Proxy Error:', err.message);
      res.status(500).send('Proxy error occurred.');
    });
  } catch (err) { next(err) }
});

router.use(requireAdmin)

const VALID_STATUSES = ['NEW', 'UNDER_REVIEW', 'QUOTATION_SENT', 'CLOSED', 'DECLINED']

// ── POST /api/admin/upload-image — upload product image to Cloudinary ─────────
router.post('/upload-image', (req, res) => {
  imageUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'UPLOAD_FAILED', message: err.message })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'No image file provided.' })
    }
    try {
      // req.file.path is the Cloudinary secure URL when using multer-storage-cloudinary
      res.json({ url: req.file.path })
    } catch (e) {
      res.status(500).json({ error: 'UPLOAD_FAILED', message: e.message })
    }
  })
})


// ── GET /api/admin/rfqs ───────────────────────────────────────────────────────
router.get('/rfqs', async (req, res, next) => {
  try {
    let { rfqNumber, customerName, companyName, status, dateFrom, dateTo, page = 1, limit = 20 } = req.query
    page = Math.max(1, parseInt(page))
    limit = Math.min(100, parseInt(limit))
    const offset = (page - 1) * limit

    const conditions = []
    const params = []

    // FIX: use ${params.length} not ${params.length}
    if (rfqNumber)    { params.push(`%${rfqNumber}%`);    conditions.push(`r.rfq_number ILIKE $${params.length}`) }
    if (customerName) { params.push(`%${customerName}%`); conditions.push(`(COALESCE(u.full_name, r.guest_full_name) ILIKE $${params.length})`) }
    if (companyName)  { params.push(`%${companyName}%`);  conditions.push(`(COALESCE(u.company_name, r.guest_company) ILIKE $${params.length})`) }
    if (status && VALID_STATUSES.includes(status)) { params.push(status); conditions.push(`r.status = $${params.length}`) }
    if (dateFrom) { params.push(dateFrom); conditions.push(`r.submitted_at >= $${params.length}`) }
    if (dateTo)   { params.push(dateTo);   conditions.push(`r.submitted_at <= $${params.length}`) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM rfqs r LEFT JOIN users u ON u.id = r.customer_id ${where}`, params
    )

    params.push(limit, offset)
    const { rows } = await pool.query(
      `SELECT r.id, r.rfq_number AS "rfqNumber", r.status, r.submitted_at AS "submittedAt",
              COALESCE(u.full_name, r.guest_full_name) AS "customerName",
              COALESCE(u.company_name, r.guest_company) AS "companyName",
              COUNT(ri.id)::int AS "itemCount"
       FROM rfqs r
       LEFT JOIN users u ON u.id = r.customer_id
       LEFT JOIN rfq_items ri ON ri.rfq_id = r.id
       ${where}
       GROUP BY r.id, u.full_name, u.company_name
       ORDER BY r.submitted_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    res.json({ items: rows, totalCount: parseInt(countResult.rows[0].count), page, limit })
  } catch (err) { next(err) }
})

// ── GET /api/admin/rfqs/:id ───────────────────────────────────────────────────
router.get('/rfqs/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, r.legal_document_url AS "legalDocumentUrl", r.is_legitimate AS "isLegitimate",
              r.verification_feedback AS "verificationFeedback",
              u.full_name AS "customerName", u.company_name AS "companyName",
              u.email, u.phone, u.country, u.city, u.business_type AS "businessType"
       FROM rfqs r LEFT JOIN users u ON u.id = r.customer_id
       WHERE r.id = $1`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })

    const rfq = rows[0]
    const [{ rows: items }, { rows: attachments }] = await Promise.all([
      pool.query(
        `SELECT ri.id, ri.product_name, ri.brand, ri.quantity, ri.unit, ri.notes,
                COALESCE(ri.unit_price, p.price, p2.price)          AS "unitPrice",
                COALESCE(ri.currency,  p.currency, p2.currency, 'USD') AS currency
         FROM rfq_items ri
         LEFT JOIN products p  ON p.id   = ri.product_id
         LEFT JOIN products p2 ON p2.name = ri.product_name AND p2.is_active = true
         WHERE ri.rfq_id = $1 ORDER BY ri.id`,
        [rfq.id]
      ),
      pool.query('SELECT * FROM rfq_attachments WHERE rfq_id = $1', [rfq.id]),
    ])
    rfq.items = items
    rfq.attachments = attachments

    res.json(rfq)
  } catch (err) { next(err) }
})

// ── DELETE /api/admin/rfqs/:id ───────────────────────────────────────────────
router.delete('/rfqs/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, rfq_number FROM rfqs WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })
    // Cascade deletes rfq_items and rfq_attachments automatically
    await pool.query('DELETE FROM rfqs WHERE id = $1', [req.params.id])
    res.json({ success: true, deleted: rows[0].rfq_number })
  } catch (err) { next(err) }
})

// ── POST /api/admin/rfqs/bulk-delete ──────────────────────────────────────────
router.post('/rfqs/bulk-delete', async (req, res, next) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'INVALID_IDS' })
    }
    // Cascade deletes rfq_items and rfq_attachments automatically in SQL
    await pool.query('DELETE FROM rfqs WHERE id = ANY($1)', [ids])
    res.json({ success: true, count: ids.length })
  } catch (err) { next(err) }
})

// ── PATCH /api/admin/rfqs/:id/status ─────────────────────────────────────────
router.patch('/rfqs/:id/status', async (req, res, next) => {
  try {
    const { status, verificationFeedback } = req.body
    console.log('Status update request:', { id: req.params.id, status, verificationFeedback })
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'INVALID_STATUS' })

    // Prevent changing status of a locked RFQ (unless we are unlocking it/changing notes)
    const { rows: current } = await pool.query('SELECT status FROM rfqs WHERE id = $1', [req.params.id])
    if (!current.length) return res.status(404).json({ error: 'NOT_FOUND' })
    
    // Allow updating feedback even if locked, or changing status if it's not locked.
    // However, if we're changing status TO closed/declined, we might want to save feedback.
    
    await pool.query(
      'UPDATE rfqs SET status = $1, verification_feedback = COALESCE($2, verification_feedback), updated_at = NOW() WHERE id = $3',
      [status, verificationFeedback || null, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ── PATCH /api/admin/rfqs/:id/legitimacy ─────────────────────────────────────
router.patch('/rfqs/:id/legitimacy', async (req, res, next) => {
  try {
    let { isLegitimate, verificationFeedback } = req.body
    
    // Convert anything to boolean/null
    if (isLegitimate === 'true' || isLegitimate === true || isLegitimate === 1 || isLegitimate === '1') isLegitimate = true;
    else if (isLegitimate === 'false' || isLegitimate === false || isLegitimate === 0 || isLegitimate === '0') isLegitimate = false;
    else isLegitimate = null;

    console.log(`[Legitimacy Debug] ID: ${req.params.id}, Resolved Value: ${isLegitimate}, Feedback: ${verificationFeedback}`);

    // Require reason ONLY if definitively marking as false
    if (isLegitimate === false && (!verificationFeedback || !verificationFeedback.trim())) {
       return res.status(400).json({ 
         error: 'REASON_REQUIRED', 
         message: 'Please provide a reason why this business was marked as fraudulent.' 
       })
    }

    try {
        let status = isLegitimate === false ? 'DECLINED' : undefined
        if (isLegitimate === null) {
          const { rows: current } = await pool.query('SELECT status FROM rfqs WHERE id = $1', [req.params.id])
          if (current.length && current[0].status === 'DECLINED') status = 'NEW'
        }
        
        if (status) {
          await pool.query(
            'UPDATE rfqs SET is_legitimate = $1, status = $2, verification_feedback = $3, updated_at = NOW() WHERE id = $4',
            [isLegitimate, status, verificationFeedback || null, req.params.id]
          )
        } else {
          await pool.query(
            'UPDATE rfqs SET is_legitimate = $1, verification_feedback = $2, updated_at = NOW() WHERE id = $3',
            [isLegitimate, verificationFeedback || null, req.params.id]
          )
        }
        res.json({ success: true, processedAs: isLegitimate })
    } catch (dbErr) {
        console.error('[Legitimacy DB Error]:', dbErr.message);
        if (dbErr.message.includes('column') || dbErr.message.includes('does not exist')) {
            return res.status(400).json({ 
                error: 'DATABASE_OUT_OF_SYNC', 
                message: 'The database is missing the required columns. Please restart the backend to run migrations.',
                details: dbErr.message
            });
        }
        throw dbErr; // let global handler take it
    }
  } catch (err) { next(err) }
})

// ── PATCH /api/admin/rfqs/:id/notes — save internal notes ────────────────────
router.patch('/rfqs/:id/notes', async (req, res, next) => {
  try {
    const { notes } = req.body
    await pool.query(
      'UPDATE rfqs SET internal_notes = $1, updated_at = NOW() WHERE id = $2',
      [notes, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ── POST /api/admin/rfqs/:id/respond — generate PDF + send quotation email ───
router.post('/rfqs/:id/respond', async (req, res, next) => {
  try {
    const { rows: check } = await pool.query('SELECT status FROM rfqs WHERE id = $1', [req.params.id])
    if (!check.length) return res.status(404).json({ error: 'NOT_FOUND' })
    if (['CLOSED', 'DECLINED'].includes(check[0].status)) {
      return res.status(400).json({ error: 'RFQ_LOCKED', message: 'Cannot send a quotation on a closed or declined RFQ.' })
    }
    // Check legitimacy
    const { rows: rfqCheck } = await pool.query('SELECT is_legitimate FROM rfqs WHERE id = $1', [req.params.id])
    if (rfqCheck[0].is_legitimate !== true) {
      return res.status(400).json({ error: 'NOT_LEGITIMATE', message: 'You must verify the legal documents for this RFQ before sending prices.' })
    }
    const { quoteNotes, itemPrices = {} } = req.body // itemPrices: { [rfqItemId]: { unitPrice, currency } }

    const { rows } = await pool.query(
      `SELECT r.*,
              COALESCE(u.full_name, r.guest_full_name) AS "customerName",
              COALESCE(u.company_name, r.guest_company) AS "companyName",
              COALESCE(u.email, r.guest_email) AS "customerEmail"
       FROM rfqs r LEFT JOIN users u ON u.id = r.customer_id WHERE r.id = $1`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })

    const rfq = rows[0]

    // Save prices per item
    console.log('itemPrices received:', JSON.stringify(itemPrices))
    for (const [itemId, pricing] of Object.entries(itemPrices)) {
      const price = pricing.unitPrice !== '' ? parseFloat(pricing.unitPrice) : null
      console.log(`Saving item ${itemId}: price=${price}, currency=${pricing.currency}`)
      await pool.query(
        'UPDATE rfq_items SET unit_price = $1, currency = $2 WHERE id = $3 AND rfq_id = $4',
        [price, pricing.currency || 'USD', itemId, rfq.id]
      )
    }

    // Save quote notes
    if (quoteNotes !== undefined) {
      await pool.query('UPDATE rfqs SET quote_notes = $1 WHERE id = $2', [quoteNotes, rfq.id])
    }

    const { rows: items } = await pool.query(
      'SELECT * FROM rfq_items WHERE rfq_id = $1 ORDER BY id', [rfq.id]
    )
    rfq.items = items

    const pdfData = {
      rfqNumber:   rfq.rfq_number,
      submittedAt: rfq.submitted_at,
      customerName: rfq.customerName,
      companyName:  rfq.companyName,
      email:        rfq.customerEmail,
      phone:        rfq.guest_phone,
      city:         rfq.guest_city,
      country:      rfq.guest_country,
      message:      rfq.message,
      quoteNotes:   quoteNotes || rfq.quote_notes,
      items:        items.map((i) => ({
        productName: i.product_name,
        brand:       i.brand,
        quantity:    i.quantity,
        unit:        i.unit,
        notes:       i.notes,
        unitPrice:   i.unit_price,
        currency:    i.currency || 'USD',
      })),
    }

    const pdfBuffer = await generateRFQPDF(pdfData)

    // Send email non-blocking — don't fail the whole request if email is down
    sendQuotationEmail(rfq.customerEmail, rfq.rfq_number, pdfBuffer)
      .catch((err) => console.error('Quotation email failed (non-fatal):', err.message))

    await pool.query(
      "UPDATE rfqs SET status = 'QUOTATION_SENT', updated_at = NOW() WHERE id = $1",
      [rfq.id]
    )

    res.json({ success: true, message: `Quotation sent to ${rfq.customerEmail}` })
  } catch (err) { next(err) }
})

// ── GET /api/admin/rfqs/:id/pdf — download RFQ as PDF ────────────────────────
router.get('/rfqs/:id/pdf', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*,
              COALESCE(u.full_name, r.guest_full_name) AS "customerName",
              COALESCE(u.company_name, r.guest_company) AS "companyName",
              COALESCE(u.email, r.guest_email) AS "customerEmail"
       FROM rfqs r LEFT JOIN users u ON u.id = r.customer_id WHERE r.id = $1`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })

    const rfq = rows[0]
    const { rows: items } = await pool.query(
      'SELECT * FROM rfq_items WHERE rfq_id = $1 ORDER BY id', [rfq.id]
    )

    const pdfData = {
      rfqNumber:    rfq.rfq_number,
      submittedAt:  rfq.submitted_at,
      customerName: rfq.customerName,
      companyName:  rfq.companyName,
      email:        rfq.customerEmail,
      phone:        rfq.guest_phone,
      city:         rfq.guest_city,
      country:      rfq.guest_country,
      message:      rfq.message,
      items:        items.map((i) => ({
        productName: i.product_name,
        brand:       i.brand,
        quantity:    i.quantity,
        unit:        i.unit,
        notes:       i.notes,
      })),
    }

    const pdfBuffer = await generateRFQPDF(pdfData)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${rfq.rfq_number}.pdf"`)
    res.send(pdfBuffer)
  } catch (err) { next(err) }
})



// ── Product management ────────────────────────────────────────────────────────
router.get('/products', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, generic_name AS "genericName", brand, category,
              package_size AS "packageSize", description, image_url AS "imageUrl",
              price, currency, stock_quantity AS "stockQuantity",
              is_active AS "isActive", is_featured AS "isFeatured",
              dosage_form AS "dosageForm", country_of_origin AS "countryOfOrigin"
       FROM products ORDER BY name ASC`
    )
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/products', async (req, res, next) => {
  try {
    const { name, genericName, brand, category, packageSize, description, imageUrl, isFeatured, price, currency, stockQuantity, dosageForm, countryOfOrigin } = req.body
    const { rows } = await pool.query(
      `INSERT INTO products (name, generic_name, brand, category, package_size, description, image_url, is_featured, price, currency, stock_quantity, dosage_form, country_of_origin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, genericName, brand, category, packageSize, description, imageUrl, isFeatured || false, price || null, currency || 'USD', stockQuantity || 0, dosageForm || null, countryOfOrigin || null]
    )
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

router.put('/products/:id', async (req, res, next) => {
  try {
    const { name, genericName, brand, category, packageSize, description, imageUrl, isActive, isFeatured, price, currency, stockQuantity, dosageForm, countryOfOrigin } = req.body
    await pool.query(
      `UPDATE products SET name=$1, generic_name=$2, brand=$3, category=$4, package_size=$5,
       description=$6, image_url=$7, is_active=$8, is_featured=$9, price=$10, currency=$11,
       stock_quantity=$12, updated_at=NOW(), dosage_form=$14, country_of_origin=$15 WHERE id=$13`,
      [name, genericName, brand, category, packageSize, description, imageUrl, isActive, isFeatured, price || null, currency || 'USD', stockQuantity || 0, req.params.id, dosageForm || null, countryOfOrigin || null]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ── PATCH /api/admin/products/:id/publish — toggle is_active ─────────────────
router.patch('/products/:id/publish', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE products SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_active AS "isActive", name`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json({ success: true, isActive: rows[0].isActive, name: rows[0].name })
  } catch (err) { next(err) }
})

router.delete('/products/:id', async (req, res, next) => {
  try {
    await pool.query('UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ── Site Content CRUD ─────────────────────────────────────────────────────────
router.get('/site-content', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT section, data, updated_at FROM site_content ORDER BY section')
    res.json(rows)
  } catch (err) {
    if (err.code === '42P01') return res.json([]) // table doesn't exist yet
    next(err)
  }
})

router.get('/site-content/:section', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT data FROM site_content WHERE section = $1', [req.params.section])
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(rows[0].data)
  } catch (err) {
    if (err.code === '42P01') return res.status(404).json({ error: 'TABLE_NOT_FOUND', message: 'Run seed-content.sql first' })
    next(err)
  }
})

router.put('/site-content/:section', async (req, res, next) => {
  try {
    const { data } = req.body
    // Auto-create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section    VARCHAR(100) UNIQUE NOT NULL,
        data       JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(
      `INSERT INTO site_content (section, data) VALUES ($1, $2)
       ON CONFLICT (section) DO UPDATE SET data = $2, updated_at = NOW()`,
      [req.params.section, JSON.stringify(data)]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ── Testimonials management ───────────────────────────────────────────────────
router.get('/testimonials', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM testimonials ORDER BY sort_order ASC')
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/testimonials', async (req, res, next) => {
  try {
    const { customerName, companyName, comment, isActive, sortOrder } = req.body
    const { rows } = await pool.query(
      `INSERT INTO testimonials (customer_name, company_name, comment, is_active, sort_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [customerName, companyName, comment, isActive ?? true, sortOrder ?? 0]
    )
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

router.put('/testimonials/:id', async (req, res, next) => {
  try {
    const { customerName, companyName, comment, isActive, sortOrder } = req.body
    await pool.query(
      `UPDATE testimonials SET customer_name=$1, company_name=$2, comment=$3, is_active=$4, sort_order=$5 WHERE id=$6`,
      [customerName, companyName, comment, isActive, sortOrder, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.delete('/testimonials/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
})

// Admin testimonials (proxied through content routes) — REMOVED (duplicates above)

module.exports = router
