const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Adding "price" column to "products" table if it doesn\'t exist...');
    await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS price DECIMAL(12,2);');
    
    console.log('Migration successful!');
    client.release();
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
