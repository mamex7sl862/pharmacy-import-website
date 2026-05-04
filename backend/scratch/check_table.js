require('dotenv').config()
const pool = require('../src/db/pool')

async function check() {
  try {
    const r = await pool.query("SELECT to_regclass('public.password_reset_tokens') as tbl")
    console.log('password_reset_tokens table:', r.rows[0].tbl ? 'EXISTS ✅' : 'MISSING ❌')

    // Also try creating it just in case
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
    console.log('Table ensured ✅')
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    process.exit(0)
  }
}

check()
