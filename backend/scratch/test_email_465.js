require('dotenv').config()
const nodemailer = require('nodemailer')

async function tryConfig(label, config) {
  const t = nodemailer.createTransport(config)
  try {
    console.log(`\nTrying ${label}...`)
    await t.verify()
    console.log(`✅ ${label} — connection OK`)
    // Try sending
    const info = await t.sendMail({
      from: `"PharmaLink Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'PharmaLink SMTP Test',
      text: 'SMTP is working.',
    })
    console.log(`✅ Email sent! ID: ${info.messageId}`)
    return true
  } catch (err) {
    console.error(`❌ ${label} failed: ${err.message}`)
    return false
  }
}

async function run() {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  await tryConfig('Gmail 465 SSL', { host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } })
  await tryConfig('Gmail 587 STARTTLS', { host: 'smtp.gmail.com', port: 587, secure: false, auth: { user, pass } })
  await tryConfig('Gmail 587 TLS direct', { host: 'smtp.gmail.com', port: 587, secure: true, auth: { user, pass } })

  process.exit(0)
}

run()
