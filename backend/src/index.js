require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')

const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/products')
const rfqRoutes = require('./routes/rfq')
const customerRoutes = require('./routes/customer')
const adminRoutes = require('./routes/admin')
const contentRoutes = require('./routes/content')
const chatRoutes = require('./routes/chat')
const contactRoutes = require('./routes/contact')
const newsletterRoutes = require('./routes/newsletter')

const app = express()

// Security
app.use(helmet())

const allowedOrigins = [
  (process.env.FRONTEND_URL || '').replace(/\/$/, ''),
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    if (origin.endsWith('.vercel.app')) return callback(null, true)
    callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files (local dev)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// File proxy — streams Cloudinary files through our server to avoid 401
app.get('/api/files/:attachmentId', async (req, res) => {
  try {
    const pool = require('./db/pool')
    const https = require('https')
    const http = require('http')

    const { rows } = await pool.query(
      'SELECT file_url, file_name, mime_type FROM rfq_attachments WHERE id = $1',
      [req.params.attachmentId]
    )
    if (!rows.length) return res.status(404).json({ error: 'File not found' })

    const { file_url, file_name, mime_type } = rows[0]

    if (!file_url.startsWith('http')) {
      return res.sendFile(path.join(__dirname, '../uploads', path.basename(file_url)))
    }

    const protocol = file_url.startsWith('https') ? https : http
    protocol.get(file_url, (stream) => {
      res.setHeader('Content-Type', mime_type || 'application/octet-stream')
      res.setHeader('Content-Disposition', `inline; filename="${file_name}"`)
      stream.pipe(res)
    }).on('error', () => res.status(500).json({ error: 'Failed to fetch file' }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Legal document proxy
app.get('/api/legal/:rfqId', async (req, res) => {
  try {
    const pool = require('./db/pool')
    const https = require('https')
    const http = require('http')

    const { rows } = await pool.query(
      'SELECT legal_document_url FROM rfqs WHERE id = $1',
      [req.params.rfqId]
    )
    if (!rows.length || !rows[0].legal_document_url) return res.status(404).json({ error: 'Document not found' })

    const fileUrl = rows[0].legal_document_url

    if (!fileUrl.startsWith('http')) {
      return res.sendFile(path.join(__dirname, '../uploads', path.basename(fileUrl)))
    }

    const protocol = fileUrl.startsWith('https') ? https : http
    protocol.get(fileUrl, (stream) => {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'inline; filename="legal-document.pdf"')
      stream.pipe(res)
    }).on('error', () => res.status(500).json({ error: 'Failed to fetch document' }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Rate limiting for RFQ submissions
const rfqLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 10 : 1000, // relaxed in dev
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many RFQ submissions. Try again later.' },
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/rfq', rfqLimiter, rfqRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/newsletter', newsletterRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Dev-only auto-login endpoint — returns admin token without password
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/auth/dev-login', async (req, res) => {
    try {
      const jwt = require('jsonwebtoken')
      const pool = require('./db/pool')
      const { rows } = await pool.query(
        "SELECT id, email, full_name, company_name, role FROM users WHERE role = 'admin' LIMIT 1"
      )
      if (!rows.length) {
        // No admin in DB yet — return a mock token
        const mockUser = { id: 'dev-admin', email: 'admin@pharmalink.com', role: 'admin' }
        return res.json({
          accessToken: jwt.sign(mockUser, process.env.JWT_SECRET, { expiresIn: '7d' }),
          user: { id: mockUser.id, email: mockUser.email, fullName: 'Dev Admin', companyName: 'PharmaLink', role: 'admin' },
        })
      }
      const u = rows[0]
      res.json({
        accessToken: jwt.sign({ id: u.id, email: u.email, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' }),
        user: { id: u.id, email: u.email, fullName: u.full_name, companyName: u.company_name, role: u.role },
      })
    } catch (err) {
      res.status(500).json({ error: 'DEV_LOGIN_FAILED' })
    }
  })
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  console.log(`PharmaLink API running on port ${PORT}`)
  // Test DB connection on startup
  try {
    const pool = require('./db/pool')
    
    // Auto-migrate RFQ legitimacy columns + password reset tokens
    console.log('⏳ Running auto-migrations...')
    await pool.query(`
      ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS legal_document_url VARCHAR(255);
      ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS is_legitimate BOOLEAN DEFAULT NULL;
      ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS verification_feedback TEXT;
      ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS decline_reason TEXT;
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used       BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id)`)
    console.log('✅ Auto-migrations completed')

    const result = await pool.query('SELECT COUNT(*) FROM products')
    console.log(`✅ Database connected — ${result.rows[0].count} products in catalog`)
  } catch (err) {
    console.error('❌ Database connection failed:', err.message)
    console.error('   Check DATABASE_URL in backend/.env')
  }
})
