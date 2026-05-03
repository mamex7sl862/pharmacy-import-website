const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Returns true only when SMTP is fully configured with real (non-placeholder) credentials
function isSmtpConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_USER !== 'your@email.com' &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== 'your-app-password'
  )
}

async function sendCustomerConfirmation(email, rfqNumber, customerName) {
  if (!isSmtpConfigured()) {
    console.log(`[EMAIL SKIPPED] Confirmation to ${email} for ${rfqNumber}`)
    return
  }
  try {
    await transporter.sendMail({
      from: `"PharmaLink Wholesale" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `RFQ Received — ${rfqNumber}`,
      html: `
        <h2>Thank you, ${customerName}</h2>
        <p>Your Request for Quotation has been received.</p>
        <p><strong>RFQ Number:</strong> ${rfqNumber}</p>
        <p>Our team will review your request and respond within 24 hours.</p>
        <br/>
        <p>PharmaLink Wholesale Team</p>
      `,
    })
  } catch (err) {
    console.error('[EMAIL ERROR] Customer confirmation:', err.message)
  }
}

async function sendAdminNotification(rfqNumber, customerName, companyName, itemCount) {
  if (!isSmtpConfigured() || !process.env.ADMIN_EMAIL) {
    console.log(`[EMAIL SKIPPED] Admin notification for ${rfqNumber}`)
    return
  }
  try {
    await transporter.sendMail({
      from: `"PharmaLink System" <${process.env.SMTP_FROM}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New RFQ — ${rfqNumber}`,
      html: `
        <h2>New RFQ Submitted</h2>
        <p><strong>RFQ Number:</strong> ${rfqNumber}</p>
        <p><strong>Customer:</strong> ${customerName} (${companyName})</p>
        <p><strong>Items:</strong> ${itemCount}</p>
        <p>Log in to the admin panel to review and respond.</p>
      `,
    })
  } catch (err) {
    console.error('[EMAIL ERROR] Admin notification:', err.message)
  }
}

async function sendQuotationEmail(email, rfqNumber, pdfBuffer) {
  if (!isSmtpConfigured()) {
    console.log(`[EMAIL SKIPPED] Quotation to ${email} for ${rfqNumber}`)
    return
  }
  try {
    await transporter.sendMail({
      from: `"PharmaLink Wholesale" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: `Quotation for ${rfqNumber}`,
      html: `
        <h2>Your Quotation is Ready</h2>
        <p>Please find your quotation for <strong>${rfqNumber}</strong> attached.</p>
        <p>Contact us if you have any questions.</p>
        <br/>
        <p>PharmaLink Wholesale Team</p>
      `,
      attachments: pdfBuffer
        ? [{ filename: `${rfqNumber}-quotation.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
        : [],
    })
  } catch (err) {
    console.error('[EMAIL ERROR] Quotation email:', err.message)
    throw err // re-throw so caller knows it failed
  }
}

async function sendContactAutoReply(email, firstName) {
  if (!isSmtpConfigured()) {
    console.log(`[EMAIL SKIPPED] Contact auto-reply to ${email}`)
    return
  }
  try {
    await transporter.sendMail({
      from: `"PharmaLink Wholesale" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'We received your message — PharmaLink Wholesale',
      html: `
        <h2>Thank you, ${firstName}!</h2>
        <p>We have received your message and our team will get back to you within 1 business day.</p>
        <p>If your enquiry is urgent, please call us at <strong>+44 (0) 20 7946 0123</strong> (Mon–Fri, 9am–6pm GMT).</p>
        <br/>
        <p>Best regards,<br/>PharmaLink Wholesale Team</p>
      `,
    })
  } catch (err) {
    console.error('[EMAIL ERROR] Contact auto-reply:', err.message)
  }
}

async function sendPasswordResetEmail(email, resetUrl) {
  if (!isSmtpConfigured()) {
    console.log(`[EMAIL SKIPPED] Password reset for ${email}`)
    console.log(`[RESET LINK] ${resetUrl}`)
    return
  }
  try {
    await transporter.sendMail({
      from: `"PharmaLink Wholesale" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Reset your password — PharmaLink Wholesale',
      html: `
        <h2>Password Reset Request</h2>
        <p>We received a request to reset the password for your account.</p>
        <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
        <br/>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
        <br/><br/>
        <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p>PharmaLink Wholesale Team</p>
      `,
    })
  } catch (err) {
    console.error('[EMAIL ERROR] Password reset:', err.message)
    // Don't re-throw — token is saved, flow should still succeed
  }
}

module.exports = {
  sendCustomerConfirmation,
  sendAdminNotification,
  sendQuotationEmail,
  sendContactAutoReply,
  sendPasswordResetEmail,
}
