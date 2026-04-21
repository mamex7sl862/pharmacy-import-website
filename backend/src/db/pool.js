const { Pool } = require('pg')

let poolConfig

if (process.env.DATABASE_URL) {
  // For local dev, disable SSL. For production (Heroku/Render/Supabase), enable it.
  const isProduction = process.env.NODE_ENV === 'production'
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  }
} else {
  poolConfig = {
    host:     process.env.PGHOST     || 'localhost',
    port:     parseInt(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'pharmalink',
    user:     process.env.PGUSER     || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    ssl:      false,
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
