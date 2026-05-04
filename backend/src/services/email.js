const nodemailer = require('nodemailer')

// ── Resend (HTTP-based, works on Render free tier) ────────────────────────────
function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  try {
    const { Resend } = require('resend')
    return new Resend(process.env.RESEND_API_KEY)
  } catch {
    return null
  }
}

// ── SMTP fallback (nodemailer) ────────────────────────────────────────────────
function getSmtpTransporter() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    process.env.SMTP_USER === 'your@email.com' ||
    !process.env.SMTP_PASS ||
    process.env.SMTP_PASS === 'your-app-password'
  ) return null

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

// ── Generic send ──────────────────────────────────────────────────────────────
async function sendMail({ to, subject, html }) {
  const resend = getResend()
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pharmalinkwholesale.com'

  if (resend) {
    // Use Resend (works on Render)
    const { error } = await resend.emails.send({ from: `PharmaLink Wholesale <${from}>`, to, subject, html })
    if (error) throw new Error(error.message)
    return
  }

  const transporter = getSmtpTransporter()
  if (transporter) {
    await transporter.sendMail({ from: `"PharmaLink Wholesale" <${from}>`, to, subject, html })
    return
  }

  // No email provider configured — log and skip
  console.log(`[EMAIL SKIPPED] No provider configured. To: ${to} | Subject: ${subject}`)
}

// ── Public functions ──────────────────────────────────────────────────────────

async function sendCustomerConfirmation(email, rfqNumber, customerName) {
  try {
    await sendMail({
      to: email,
      subject: `RFQ Received — ${rfqNumber}`,
      html: `
        <h2>Thank you, ${customerName}</h2>
        <p>Your Request for Quotation has been received.</p>
        <p><strong>RFQ Number:</strong> ${rfqNumber}</p>
        <p>Our team will review your request and respond within 24 hours.</p>
        <br/><p>PharmaLink Wholesale Team</p>
      `,
    })
  } catch (err) {
    console.error('[EMAIL ERROR] Customer confirmation:', err.message)
  }
}

async function sendAdminNotification(rfqNumber, customerName, companyName, itemCount) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) { console.log(`[EMAIL SKIPPED] No ADMIN_EMAIL set`); return }
  try {
    await sendMail({
      to: adminEmail,
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
  // Resend doesn't support nodemailer attachments directly — use SMTP for this
  const transporter = getSmtpTransporter()
  if (!transporter && !getResend()) {
    console.log(`[EMAIL SKIPPED] Quotation to ${email} for ${rfqNumber}`)
    return
  }
  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pharmalinkwholesale.com'
    if (transporter) {
      await transporter.sendMail({
        from: `"PharmaLink Wholesale" <${from}>`,
        to: email,
        subject: `Quotation for ${rfqNumber}`,
        html: `
          <h2>Your Quotation is Ready</h2>
          <p>Please find your quotation for <strong>${rfqNumber}</strong> attached.</p>
          <p>Contact us if you have any questions.</p>
          <br/><p>PharmaLink Wholesale Team</p>
        `,
        attachments: pdfBuffer
          ? [{ filename: `${rfqNumber}-quotation.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
          : [],
      })
    } else {
      // Resend — send without attachment (PDF attachments need base64)
      const resend = getResend()
      await resend.emails.send({
        from: `PharmaLink Wholesale <${from}>`,
        to: email,
        subject: `Quotation for ${rfqNumber}`,
        html: `
          <h2>Your Quotation is Ready</h2>
          <p>Your quotation for <strong>${rfqNumber}</strong> has been prepared.</p>
          <p>Please log in to your portal to download it, or contact us for the PDF.</p>
          <br/><p>PharmaLink Wholesale Team</p>
        `,
        ...(pdfBuffer ? {
          attachments: [{ filename: `${rfqNumber}-quotation.pdf`, content: pdfBuffer.toString('base64') }]
        } : {}),
      })
    }
  } catch (err) {
    console.error('[EMAIL ERROR] Quotation email:', err.message)
    throw err
  }
}

async function sendContactAutoReply(email, firstName) {
  try {
    await sendMail({
      to: email,
      subject: 'We received your message — PharmaLink Wholesale',
      html: `
        <h2>Thank you, ${firstName}!</h2>
        <p>We have received your message and our team will get back to you within 1 business day.</p>
        <p>If your enquiry is urgent, please call us at <strong>+44 (0) 20 7946 0123</strong> (Mon–Fri, 9am–6pm GMT).</p>
        <br/><p>Best regards,<br/>PharmaLink Wholesale Team</p>
      `,
    })
  } catch (err) {
    console.error('[EMAIL ERROR] Contact auto-reply:', err.message)
  }
}

async function sendAwaitingPaymentEmail(email, customerName, rfqNumber) {
  try {
    await sendMail({
      to: email,
      subject: `Payment Required — ${rfqNumber}`,
      html: `
        <h2>Your Quotation Has Been Accepted</h2>
        <p>Dear ${customerName},</p>
        <p>Thank you for accepting the quotation for <strong>${rfqNumber}</strong>.</p>
        <p>To proceed with your order, please make your payment via bank transfer and upload your payment proof (receipt or screenshot) through your customer portal.</p>
        <p><strong>Steps:</strong></p>
        <ol>
          <li>Log in to your customer portal</li>
          <li>Open RFQ <strong>${rfqNumber}</strong></li>
          <li>Upload your payment proof (JPEG, PNG, or PDF)</li>
        </ol>
        <p>Our team will verify your payment and begin processing your order.</p>
        <br/><p>PharmaLink Wholesale Team</p>
      `,
    })
    console.log(`[EMAIL] Awaiting payment sent to ${email}`)
  } catch (err) {
    console.error('[EMAIL ERROR] Awaiting payment:', err.message)
  }
}

async function sendPaymentConfirmedEmail(email, customerName, rfqNumber) {
  try {
    await sendMail({
      to: email,
      subject: `Payment Confirmed — ${rfqNumber}`,
      html: `
        <h2>Payment Verified ✓</h2>
        <p>Dear ${customerName},</p>
        <p>We have successfully verified your payment for order <strong>${rfqNumber}</strong>.</p>
        <p>Your order is now being prepared for shipment. We will notify you once it has been dispatched.</p>
        <br/><p>PharmaLink Wholesale Team</p>
      `,
    })
    console.log(`[EMAIL] Payment confirmed sent to ${email}`)
  } catch (err) {
    console.error('[EMAIL ERROR] Payment confirmed:', err.message)
  }
}

async function sendShippedEmail(email, customerName, rfqNumber, trackingInfo) {
  try {
    await sendMail({
      to: email,
      subject: `Your Order Has Been Shipped — ${rfqNumber}`,
      html: `
        <h2>Your Order Is On Its Way 🚚</h2>
        <p>Dear ${customerName},</p>
        <p>Great news! Your order <strong>${rfqNumber}</strong> has been dispatched.</p>
        ${trackingInfo ? `<p><strong>Tracking Information:</strong> ${trackingInfo}</p>` : ''}
        <p>Please log in to your portal to confirm delivery once you receive your order.</p>
        <br/><p>PharmaLink Wholesale Team</p>
      `,
    })
    console.log(`[EMAIL] Shipped email sent to ${email}`)
  } catch (err) {
    console.error('[EMAIL ERROR] Shipped email:', err.message)
  }
}

async function sendPasswordResetEmail(email, resetUrl) {
  try {
    await sendMail({
      to: email,
      subject: 'Reset your password — PharmaLink Wholesale',
      html: `
        <h2>Password Reset Request</h2>
        <p>We received a request to reset the password for your account.</p>
        <p>Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
        <br/>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
        <br/><br/>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>PharmaLink Wholesale Team</p>
      `,
    })
    console.log(`[EMAIL] Password reset sent to ${email}`)
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
  sendAwaitingPaymentEmail,
  sendPaymentConfirmedEmail,
  sendShippedEmail,
  sendPasswordResetEmail,
}
