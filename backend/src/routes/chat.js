const router = require('express').Router()
const pool = require('../db/pool')
const { requireAdmin } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const { storage } = require('../config/cloudinary')

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for chat files
})

// ── ADMIN: GET /api/chat/admin/sessions — list all chats for admin ──────────────────
router.get('/admin/sessions', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, 
              (SELECT message FROM chat_messages m WHERE m.chat_id = c.id ORDER BY created_at DESC LIMIT 1) as "lastMessage",
              u.full_name as "customerFull",
              (SELECT COUNT(*)::int FROM chat_messages m WHERE m.chat_id = c.id AND m.is_from_admin = false AND m.is_read = false) as "unreadCount"
       FROM chats c
       LEFT JOIN users u ON u.id = c.customer_id
       ORDER BY last_msg_at DESC`
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// ── POST /api/chat/admin/:chatId/read — mark all as read ─────────────────────
router.post('/admin/:chatId/read', requireAdmin, async (req, res, next) => {
  try {
    const { chatId } = req.params
    await pool.query(
      "UPDATE chat_messages SET is_read = true WHERE chat_id = $1 AND is_from_admin = false",
      [chatId]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ── ADMIN: PATCH /api/chat/admin/:chatId/status ─────────────────────────────
router.patch('/admin/:chatId/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body
    const { rows } = await pool.query(
      'UPDATE chats SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.chatId]
    )
    if (!rows.length) return res.status(404).json({ error: 'CHAT_NOT_FOUND' })
    res.json(rows[0])
  } catch (err) { next(err) }
})

// ── POST /api/chat/session — start or join a session ─────────────────────────
router.post('/session', async (req, res, next) => {
  try {
    const { guestName, customerId, chatId: existingChatId } = req.body
    console.log('[Backend Chat] Session request:', { guestName, customerId, existingChatId })
    
    // If we have an existing session ID, update it with newest user info
    if (existingChatId) {
      const { rows } = await pool.query(
        `UPDATE chats SET customer_id = $1, guest_name = $2 
         WHERE id = $3 RETURNING *`,
        [customerId || null, guestName || 'Guest', existingChatId]
      )
      if (rows.length) {
        console.log('[Backend Chat] Updated existing session info:', existingChatId)
        return res.json(rows[0])
      }
    }

    // Otherwise, check if there's an open session for this customer
    let chat
    if (customerId) {
      const { rows } = await pool.query(
        "SELECT * FROM chats WHERE customer_id = $1 AND status = 'OPEN' ORDER BY created_at DESC LIMIT 1",
        [customerId]
      )
      chat = rows[0]
    }

    if (!chat) {
      const { rows } = await pool.query(
        `INSERT INTO chats (customer_id, guest_name) VALUES ($1, $2) RETURNING *`,
        [customerId || null, guestName || 'Guest']
      )
      chat = rows[0]
      console.log('[Backend Chat] New chat created:', chat.id)
      
      // Auto-insert a greeting message from Admin
      await pool.query(
        `INSERT INTO chat_messages (chat_id, sender_name, message, is_from_admin, is_read)
         VALUES ($1, 'PharmaLink Support', 'Hi there! How can we help you today?', true, true)`,
        [chat.id]
      )
    } else {
      console.log('[Backend Chat] Resuming chat:', chat.id)
    }

    res.json(chat)
  } catch (err) { 
    console.error('[Backend Chat] Session error:', err)
    next(err) 
  }
})

// ── GET /api/chat/:chatId/messages ───────────────────────────────────────────
router.get('/:chatId/messages', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC`,
      [req.params.chatId]
    )
    res.json(rows)
  } catch (err) { next(err) }
})

// ── POST /api/chat/:chatId/messages ──────────────────────────────────────────
router.post('/:chatId/messages', async (req, res, next) => {
  try {
    const { message, senderName, senderId, isAdmin = false } = req.body
    console.log('[Backend Chat] Incoming message:', { chatId: req.params.chatId, senderName, isAdmin })
    
    const { rows } = await pool.query(
      `INSERT INTO chat_messages (chat_id, sender_id, sender_name, message, is_from_admin, file_url, file_name, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.chatId, senderId || null, senderName, message, isAdmin, null, null, null]
    )
    
    await pool.query('UPDATE chats SET last_msg_at = NOW() WHERE id = $1', [req.params.chatId])
    
    res.status(201).json(rows[0])
  } catch (err) { 
    console.error('[Backend Chat] Message error:', err)
    next(err) 
  }
})

// ── POST /api/chat/:chatId/files — handle attachments ────────────────────────
router.post('/:chatId/files', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'NO_FILE' })
    
    const { senderName, senderId, isAdmin = 'false' } = req.body
    const is_admin = isAdmin === 'true'
    const fileUrl = req.file.path // Cloudinary full URL

    const { rows } = await pool.query(
      `INSERT INTO chat_messages (
        chat_id, sender_id, sender_name, message, is_from_admin, 
        file_url, file_name, mime_type
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.params.chatId, 
        senderId || null, 
        senderName || (is_admin ? 'Admin' : 'Guest'), 
        `Sent a file: ${req.file.originalname}`, 
        is_admin,
        fileUrl, 
        req.file.originalname, 
        req.file.mimetype
      ]
    )

    await pool.query('UPDATE chats SET last_msg_at = NOW() WHERE id = $1', [req.params.chatId])
    res.status(201).json(rows[0])
  } catch (err) { next(err) }
})

module.exports = router
