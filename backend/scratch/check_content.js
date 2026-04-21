const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:newpassword123@localhost:5432/pharmalink',
});

async function check() {
  try {
    const res = await pool.query("SELECT section, data FROM site_content WHERE section = 'why_choose_us'");
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
