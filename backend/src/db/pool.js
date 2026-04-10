const { Pool } = require('pg')

// Parse DATABASE_URL manually OR use individual params
// This avoids issues with special characters (@, #, etc.) in passwords
let poolConfig

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL)
    poolConfig = {
      host:     url.hostname,
      port:     parseInt(url.port) || 5432,
      database: url.pathname.replace('/', ''),
      user:     url.username,
      password: decodeURIComponent(url.password), // handles %40 → @
    }
  } catch {
    // Fallback: use individual env vars
    poolConfig = {
      host:     process.env.PGHOST     || 'localhost',
      port:     parseInt(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'pharmalink',
      user:     process.env.PGUSER     || 'postgres',
      password: process.env.PGPASSWORD,
    }
  }
} else {
  poolConfig = {
    host:     process.env.PGHOST     || 'localhost',
    port:     parseInt(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'pharmalink',
    user:     process.env.PGUSER     || 'postgres',
    password: process.env.PGPASSWORD,
  }
}

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err)
})

module.exports = pool
