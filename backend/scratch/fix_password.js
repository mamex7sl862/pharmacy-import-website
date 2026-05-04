require('dotenv').config()
const pool = require('../src/db/pool')
const bcrypt = require('bcrypt')

async function run() {
  const email = 'mohammedshifa800@gmail.com'
  const newPassword = 'Reset1234!'

  const hash = await bcrypt.hash(newPassword, 12)
  const { rows } = await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email',
    [hash, email]
  )

  if (!rows.length) {
    console.log('❌ User not found:', email)
  } else {
    console.log('✅ Password reset for:', rows[0].email)
    console.log('   New password: ' + newPassword)
  }
  process.exit(0)
}

run().catch(e => { console.error(e.message); process.exit(1) })
