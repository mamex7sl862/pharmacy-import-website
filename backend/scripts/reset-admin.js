require('dotenv').config()
const bcrypt = require('bcrypt')
const pool = require('../src/db/pool')

async function resetAdmin() {
  const password = 'Admin@1234'
  const hash = await bcrypt.hash(password, 12)
  
  await pool.query(
    `INSERT INTO users (email, password_hash, full_name, company_name, role, is_active)
     VALUES ($1, $2, 'Admin User', 'PharmaLink Wholesale', 'admin', true)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = $2,
       role = 'admin',
       is_active = true`,
    ['admin@pharmalink.com', hash]
  )

  // Verify it works
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['admin@pharmalink.com'])
  const valid = await bcrypt.compare(password, rows[0].password_hash)
  
  console.log('Admin user created/updated')
  console.log('Password verify:', valid ? '✅ PASS' : '❌ FAIL')
  console.log('\nLogin credentials:')
  console.log('  Email:    admin@pharmalink.com')
  console.log('  Password: Admin@1234')
  
  await pool.end()
}

resetAdmin().catch(console.error)
