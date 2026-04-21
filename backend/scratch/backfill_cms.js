const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:newpassword123@localhost:5432/pharmalink',
});

const DEFAULT_COMPANY = {
  name: 'PharmaLink Wholesale',
  tagline: 'Trusted Pharmaceutical Wholesale & Import Solutions',
  description: 'PharmaLink Pro operates at the intersection of medical necessity and logistical precision.',
  address: 'Medical Park West, Floor 14, London, UK EC1A 4HQ',
  phone: '+44 (0) 20 7946 0123',
  hours: 'Mon–Fri, 9am – 6pm GMT',
  email: 'support@pharmalinkwholesale.com',
  procurementEmail: 'procurement@pharmalinkwholesale.com',
  yearsExp: '15+',
  countries: '50+',
  products: '10,000+',
  accuracy: '99.8%',
  aboutImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=90',
  aboutHeading: 'The Essential Bridge in Healthcare Supply Chains',
  missionTitle: 'Our Mission',
  missionText: 'To make pharmaceutical procurement transparent, efficient, and accessible for every healthcare institution worldwide.',
  visionTitle: 'Our Vision',
  visionText: 'A world where no patient goes without medicine due to supply chain failures or procurement inefficiencies.',
};

async function backfill() {
  const client = await pool.connect();
  try {
    // Get current company_info
    const { rows } = await client.query("SELECT data FROM site_content WHERE section = 'company_info'");
    
    if (rows.length > 0) {
      const existing = rows[0].data;
      // Merge defaults with existing (existing values win)
      const merged = { ...DEFAULT_COMPANY, ...existing };
      await client.query(
        `UPDATE site_content SET data = $1, updated_at = NOW() WHERE section = 'company_info'`,
        [JSON.stringify(merged)]
      );
      console.log('✅ company_info updated with merged defaults');
      console.log('aboutImage:', merged.aboutImage);
    } else {
      // Insert full defaults
      await client.query(
        `INSERT INTO site_content (section, data) VALUES ('company_info', $1)`,
        [JSON.stringify(DEFAULT_COMPANY)]
      );
      console.log('✅ company_info inserted with defaults');
    }

    // Verify
    const { rows: verify } = await client.query("SELECT data->>'aboutImage' as img FROM site_content WHERE section = 'company_info'");
    console.log('Verified aboutImage:', verify[0]?.img);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

backfill();
