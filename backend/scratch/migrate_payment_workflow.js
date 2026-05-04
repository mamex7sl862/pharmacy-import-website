require('dotenv').config()
const pool = require('../src/db/pool')

async function run() {
  console.log('Running payment workflow migrations...')

  await pool.query(`ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS tracking_info VARCHAR(500)`)
  await pool.query(`ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS payment_rejection_note TEXT`)
  console.log('✅ rfqs columns added')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rfq_payment_proofs (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
      file_url    VARCHAR(500) NOT NULL,
      file_name   VARCHAR(255) NOT NULL,
      file_size   INTEGER NOT NULL,
      mime_type   VARCHAR(100) NOT NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_rfq_payment_proofs_rfq ON rfq_payment_proofs(rfq_id)`)
  console.log('✅ rfq_payment_proofs table created')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rfq_chats (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES users(id),
      status      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
      last_msg_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(rfq_id)
    )
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_rfq_chats_rfq ON rfq_chats(rfq_id)`)
  console.log('✅ rfq_chats table created')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rfq_chat_messages (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rfq_chat_id   UUID NOT NULL REFERENCES rfq_chats(id) ON DELETE CASCADE,
      sender_id     UUID REFERENCES users(id),
      sender_name   VARCHAR(255) NOT NULL,
      message       TEXT NOT NULL DEFAULT '',
      is_from_admin BOOLEAN NOT NULL DEFAULT false,
      is_read       BOOLEAN NOT NULL DEFAULT false,
      file_url      VARCHAR(500),
      file_name     VARCHAR(255),
      mime_type     VARCHAR(100),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_rfq_chat_messages_chat ON rfq_chat_messages(rfq_chat_id)`)
  console.log('✅ rfq_chat_messages table created')

  console.log('✅ All payment workflow migrations complete')
  process.exit(0)
}

run().catch(e => { console.error('❌', e.message); process.exit(1) })
