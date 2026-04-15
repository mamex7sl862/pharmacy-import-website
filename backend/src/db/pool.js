const { Pool } = require('pg')

let poolConfig

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  }
} else {
  poolConfig = {
    host:     process.env.PGHOST     || 'localhost',
    port:     parseInt(process.env.PGPORT) || 5433,
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
