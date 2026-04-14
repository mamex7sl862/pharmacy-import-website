const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Joi = require('joi')
const pool = require('../db/pool')

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(2).required(),
})

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) return res.status(400).json({ error: 'VALIDATION_ERROR', message: error.message })

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [value.email])
    if (exists.rows.length) return res.status(409).json({ error: 'EMAIL_EXISTS' })

    const passwordHash = await bcrypt.hash(value.password, 12)
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1,$2,$3) RETURNING id, email, full_name, role`,
      [value.email, passwordHash, value.fullName]
    )
    const user = rows[0]
    res.status(201).json({
      accessToken: signToken(user),
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'VALIDATION_ERROR' })

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email])
    if (!rows.length) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })

    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })

    res.json({
      accessToken: signToken(user),
      user: { id: user.id, email: user.email, fullName: user.full_name, companyName: user.company_name, role: user.role },
    })
  } catch (err) { next(err) }
})

module.exports = router
