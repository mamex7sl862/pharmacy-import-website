require('dotenv').config()
const pool = require('../src/db/pool')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

async function run() {
  const email = 'mohammedshifa800@gmail.com'

  // Get user
  const { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  if (!users.length) { console.log('User not found'); process.exit(1) }
  const user = users[0]
  console.log('User id:', user.id)
  console.log('Password updated_at:', user.updated_at)

  // Manually update the password to 'NewPassword123' to verify the UPDATE works
  const testPassword = 'TestReset999'
  const hash = await bcrypt.hash(testPassword, 12)
  await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, user.id])

  // Verify
  const { rows: updated } = await pool.query('SELECT updated_at, LEFT(password_hash,20) as h FROM users WHERE id = $1', [user.id])
  console.log('Updated at:', updated[0].updated_at)
  console.log('New hash preview:', updated[0].h)
  console.log(`\n✅ Password manually set to: ${testPassword}`)
  console.log('Try logging in with this password to confirm DB writes work.')

  process.exit(0)
}

run().catch(e => { console.error(e.message); process.exit(1) })
