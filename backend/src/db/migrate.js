require('dotenv').config()
const fs = require('fs')
const path = require('path')
const pool = require('./pool')

async function migrate() {
  console.log('Running database migration...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET ✓' : 'NOT SET ✗')

  const client = await pool.connect()
  try {
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Separate ALTER TABLE lines from the main DDL
    const lines = schema.split('\n')
    const mainLines = []
    const alterLines = []

    for (const line of lines) {
      if (line.trim().startsWith('ALTER TABLE')) {
        alterLines.push(line)
      } else {
        mainLines.push(line)
      }
    }

    // Run main schema as one block (CREATE TABLE, CREATE INDEX, etc.)
    console.log('Creating tables and indexes...')
    await client.query(mainLines.join('\n'))
    console.log('✅ Tables and indexes created')

    // Run ALTER statements individually (safe with IF NOT EXISTS)
    const alters = alterLines
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.toUpperCase().startsWith('ALTER'))

    for (const alter of alters) {
      try {
        await client.query(alter)
        console.log(`✅ ${alter.substring(0, 70)}`)
      } catch (err) {
        if (err.code === '42701' || (err.message && err.message.includes('already exists'))) {
          console.log(`⚠️  Already exists (skipping): ${alter.substring(0, 60)}`)
        } else {
          console.error(`❌ ALTER failed [${err.code}]: ${err.message}`)
          throw err
        }
      }
    }

    console.log('✅ Migration successful')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    console.error(err.stack)
    process.exit(1)
  } finally {
    client.release()
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration error:', err.message)
    process.exit(1)
  })
