require('dotenv').config()
const pool = require('../src/db/pool')

async function run() {
  try {
    // Check if any reset tokens exist and their status
    const tokens = await pool.query(`
      SELECT t.id, t.used, t.expires_at, t.created_at, u.email
      FROM password_reset_tokens t
      JOIN users u ON u.id = t.user_id
      ORDER BY t.created_at DESC
      LIMIT 5
    `)
    console.log('Recent reset tokens:')
    tokens.rows.forEach(r => console.log(' ', r.email, '| used:', r.used, '| expires:', r.expires_at))

    // Check the actual password hash in DB for the user
    const user = await pool.query(`
      SELECT email, LEFT(password_hash, 20) as hash_preview, updated_at
      FROM users WHERE email = 'mohammedshifa800@gmail.com'
    `)
    if (user.rows.length) {
      console.log('\nUser in DB:')
      console.log('  email:', user.rows[0].email)
      console.log('  hash preview:', user.rows[0].hash_preview)
      console.log('  updated_at:', user.rows[0].updated_at)
    } else {
      console.log('User not found')
    }
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    process.exit(0)
  }
}

run()
