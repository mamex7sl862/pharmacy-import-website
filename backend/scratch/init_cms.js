const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function init() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Ensuring "pgcrypto" extension exists...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    
    console.log('Creating "site_content" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section    VARCHAR(100) UNIQUE NOT NULL,
        data       JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating "testimonials" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_name VARCHAR(255) NOT NULL,
        company_name  VARCHAR(255),
        comment       TEXT NOT NULL,
        is_active     BOOLEAN NOT NULL DEFAULT true,
        sort_order    INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Creating "content_blocks" table (legacy support)...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_blocks (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        block_key  VARCHAR(100) UNIQUE NOT NULL,
        content    JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('CMS initialization successful!');
    client.release();
  } catch (err) {
    console.error('Initialization failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
