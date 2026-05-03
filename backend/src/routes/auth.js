const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const Joi = require('joi')
const pool = require('../db/pool')
const { sendPasswordResetEmail } = require('../services/email')

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(2).required(),
  companyName: Joi.string().min(2).required(),
  businessType: Joi.string().min(1).required(),
  phone: Joi.string().min(5).required(),
  country: Joi.string().min(2).required(),
  city: Joi.string().min(2).required(),
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
      `INSERT INTO users (email, password_hash, full_name, company_name, business_type, phone, country, city)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, email, full_name, company_name, business_type, phone, country, city, role`,
      [value.email, passwordHash, value.fullName, value.companyName, value.businessType, value.phone, value.country, value.city]
    )
    const user = rows[0]
    res.status(201).json({
      accessToken: signToken(user),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        companyName: user.company_name,
        businessType: user.business_type,
        phone: user.phone,
        country: user.country,
        city: user.city,
        role: user.role
      },
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'VALIDATION_ERROR' })

    // Always respond 200 to avoid user enumeration
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1 AND is_active = true', [email])
    if (rows.length) {
      const user = rows[0]

      // Invalidate any existing unused tokens for this user
      await pool.query(
        'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
        [user.id]
      )

      // Generate a secure random token
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, tokenHash, expiresAt]
      )

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const resetUrl = `${frontendUrl}/reset-password?id=${user.id}&token=${rawToken}`

      await sendPasswordResetEmail(email, resetUrl)
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    console.error('[FORGOT-PASSWORD ERROR]', err.message, err.stack)
    next(err)
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { id, token, newPassword } = req.body
    if (!id || !token || !newPassword) return res.status(400).json({ error: 'VALIDATION_ERROR' })
    if (newPassword.length < 8) return res.status(400).json({ error: 'PASSWORD_TOO_SHORT' })

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find a valid, unused, non-expired token
    const { rows } = await pool.query(
      `SELECT prt.id, prt.user_id
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.user_id = $1
         AND prt.token_hash = $2
         AND prt.used = false
         AND prt.expires_at > NOW()
         AND u.is_active = true`,
      [id, tokenHash]
    )

    if (!rows.length) {
      console.log('[RESET-PASSWORD] Token not found or expired for user:', id)
      return res.status(400).json({ error: 'TOKEN_EXPIRED' })
    }

    const tokenRow = rows[0]
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Mark token used first
    await pool.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [tokenRow.id])

    // Update the password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email',
      [passwordHash, tokenRow.user_id]
    )

    console.log('[RESET-PASSWORD] Password updated for:', result.rows[0]?.email)
    res.json({ message: 'Password updated successfully.' })
  } catch (err) {
    console.error('[RESET-PASSWORD ERROR]', err.message)
    next(err)
  }
})

module.exports = router
