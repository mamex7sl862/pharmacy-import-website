require('dotenv').config()
const pool = require('./pool')

async function migrateV3() {
  console.log('Running v3 database migration — stock management improvements...')
  const client = await pool.connect()
  try {
    // Gap 1 & 2: soft reservation column
    await client.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0;
    `)
    console.log('✅ Added column: products.reserved_quantity')

    // Gap 3: configurable low-stock threshold per product
    await client.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 100;
    `)
    console.log('✅ Added column: products.low_stock_threshold')

    // Ensure reserved_quantity never goes negative (safety constraint)
    await client.query(`
      ALTER TABLE products
        DROP CONSTRAINT IF EXISTS chk_reserved_non_negative;
      ALTER TABLE products
        ADD CONSTRAINT chk_reserved_non_negative CHECK (reserved_quantity >= 0);
    `)
    console.log('✅ Added constraint: reserved_quantity >= 0')

    console.log('✅ Migration v3 complete')
  } catch (err) {
    console.error('❌ Migration v3 failed:', err.message)
    throw err
  } finally {
    client.release()
  }
}

migrateV3()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
