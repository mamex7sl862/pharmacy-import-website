const router = require('express').Router()
const pool = require('../db/pool')

// GET /api/testimonials (public)
router.get('/testimonials', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, customer_name AS "customerName", company_name AS "companyName", comment
       FROM testimonials WHERE is_active = true ORDER BY sort_order ASC`
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// GET /api/content/site/:section — public fetch of any site_content section
router.get('/site/:section', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT data FROM site_content WHERE section = $1',
      [req.params.section]
    )
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(rows[0].data)
  } catch (err) {
    if (err.code === '42P01') return res.status(404).json({ error: 'NOT_FOUND' })
    // If section not found, return empty object instead of 404 to avoid console noise
    res.json({}) 
  }
})

// Admin testimonials CRUD (no auth middleware here — admin routes handle it)
router.get('/admin/testimonials', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, customer_name AS "customerName", company_name AS "companyName", comment, is_active AS "isActive", sort_order AS "sortOrder"
       FROM testimonials ORDER BY sort_order ASC`
    )
    res.json(rows)
  } catch (err) { next(err) }
})

router.post('/admin/testimonials', async (req, res, next) => {
  try {
    const { customerName, companyName, comment } = req.body
    const { rows } = await pool.query(
      `INSERT INTO testimonials (customer_name, company_name, comment, is_active, sort_order)
       VALUES ($1,$2,$3,true,(SELECT COALESCE(MAX(sort_order),0)+1 FROM testimonials))
       RETURNING id`,
      [customerName, companyName || '', comment]
    )
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

router.put('/admin/testimonials/:id', async (req, res, next) => {
  try {
    const { customerName, companyName, comment } = req.body
    await pool.query(
      `UPDATE testimonials SET customer_name=$1, company_name=$2, comment=$3 WHERE id=$4`,
      [customerName, companyName || '', comment, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.delete('/admin/testimonials/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
})

// GET /api/content/:blockKey
router.get('/:blockKey', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT content FROM content_blocks WHERE block_key = $1',
      [req.params.blockKey]
    )
    if (!rows.length) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(rows[0].content)
  } catch (err) { next(err) }
})

module.exports = router
