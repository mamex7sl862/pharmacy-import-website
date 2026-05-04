require('dotenv').config()
const nodemailer = require('nodemailer')

console.log('SMTP config:')
console.log('  HOST:', process.env.SMTP_HOST)
console.log('  PORT:', process.env.SMTP_PORT)
console.log('  USER:', process.env.SMTP_USER)
console.log('  PASS:', process.env.SMTP_PASS ? `${process.env.SMTP_PASS.slice(0,4)}...` : 'NOT SET')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

async function run() {
  try {
    console.log('\nVerifying connection...')
    await transporter.verify()
    console.log('✅ SMTP connection OK')

    console.log('Sending test email...')
    const info = await transporter.sendMail({
      from: `"PharmaLink Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'PharmaLink — SMTP Test',
      text: 'If you see this, SMTP is working correctly.',
    })
    console.log('✅ Email sent! Message ID:', info.messageId)
  } catch (err) {
    console.error('❌ Error:', err.message)
    if (err.code) console.error('   Code:', err.code)
    if (err.response) console.error('   Response:', err.response)
  } finally {
    process.exit(0)
  }
}

run()
