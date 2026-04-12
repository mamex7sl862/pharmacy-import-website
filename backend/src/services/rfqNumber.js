const pool = require('../db/pool')

/**
 * Generates a unique RFQ number: RFQ-{year}-{NNNN}
 * Uses a dedicated sequence table with FOR UPDATE SKIP LOCKED
 * to prevent duplicates under concurrent submissions.
 */
async function generateRFQNumber(client, year) {
  // Ensure the sequence table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS rfq_sequences (
      year    INTEGER PRIMARY KEY,
      last_seq INTEGER NOT NULL DEFAULT 0
    )
  `)

  // Upsert the year row and atomically increment
  const { rows } = await client.query(
    `INSERT INTO rfq_sequences (year, last_seq) VALUES ($1, 1)
     ON CONFLICT (year) DO UPDATE
       SET last_seq = rfq_sequences.last_seq + 1
     RETURNING last_seq`,
    [year]
  )

  const sequence = rows[0].last_seq
  return `RFQ-${year}-${String(sequence).padStart(4, '0')}`
}

module.exports = { generateRFQNumber }
