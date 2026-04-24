const router = require('express').Router()
const pool = require('../db/pool')

const VALID_CATEGORIES = ['prescription', 'otc', 'medical-supplies', 'surgical', 'laboratory', 'personal-care']

// Units always kept in reserve — not available for customer ordering
const STOCK_RESERVE = 50

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    let { text, category, page = 1, limit = 24 } = req.query
    page  = Math.max(1, parseInt(page))
    limit = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (page - 1) * limit

    const conditions = ['p.is_active = true']
    const params = []

    if (category && VALID_CATEGORIES.includes(category)) {
      params.push(category)
      conditions.push(`p.category = $${params.length}`)
    }

    let orderBy = 'p.name ASC'
    if (text && text.trim()) {
      params.push(text.trim())
      conditions.push(
        `to_tsvector('english', p.name || ' ' || COALESCE(p.generic_name,'') || ' ' || COALESCE(p.brand,'')) @@ plainto_tsquery('english', $${params.length})`
      )
      orderBy = `ts_rank(to_tsvector('english', p.name || ' ' || COALESCE(p.generic_name,'') || ' ' || COALESCE(p.brand,'')), plainto_tsquery('english', $${params.length})) DESC`
    }

    const where = conditions.join(' AND ')

    const countResult = await pool.query(`SELECT COUNT(*) FROM products p WHERE ${where}`, params)
    const totalCount  = parseInt(countResult.rows[0].count)

    params.push(limit, offset)
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.generic_name AS "genericName", p.brand, p.category,
              p.package_size AS "packageSize", p.description, p.image_url AS "imageUrl",
              p.price, p.currency, p.stock_quantity AS "stockQuantity",
              GREATEST(0, p.stock_quantity - ${STOCK_RESERVE}) AS "availableQuantity",
              p.is_featured AS "isFeatured",
              p.dosage_form AS "dosageForm", p.country_of_origin AS "countryOfOrigin"
       FROM products p WHERE ${where} ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    res.json({ items: rows, totalCount, page, limit })
  } catch (err) { next(err) }
})

// GET /api/products/featured
router.get('/featured', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, generic_name AS "genericName", brand, category,
              package_size AS "packageSize", description, image_url AS "imageUrl",
              price, currency, stock_quantity AS "stockQuantity",
              GREATEST(0, stock_quantity - ${STOCK_RESERVE}) AS "availableQuantity",
              dosage_form AS "dosageForm", country_of_origin AS "countryOfOrigin"
       FROM products WHERE is_active = true AND is_featured = true
       ORDER BY name ASC LIMIT 8`
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, generic_name AS "genericName", brand, category,
              package_size AS "packageSize", description, image_url AS "imageUrl",
              price, currency, stock_quantity AS "stockQuantity",
              GREATEST(0, stock_quantity - ${STOCK_RESERVE}) AS "availableQuantity",
              dosage_form AS "dosageForm", country_of_origin AS "countryOfOrigin"
       FROM products WHERE id = $1 AND is_active = true`,
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

router.get('/meta/categories', async (req, res) => {
  res.json(VALID_CATEGORIES)
})

module.exports = router
