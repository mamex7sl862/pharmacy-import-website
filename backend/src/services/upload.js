const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)

let upload

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  // Upload PDFs as 'image' resource type with fl_attachment flag
  // This avoids the 401 that 'raw' resource type causes
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: 'pharmalink/rfq-attachments',
      resource_type: 'image',
      use_filename: false,
      unique_filename: true,
      format: 'pdf',
    }),
  })

  upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })
} else {
  const UPLOAD_DIR = path.join(__dirname, '../../uploads')
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

  upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        cb(null, `${unique}${path.extname(file.originalname)}`)
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  })
}

function getFileUrl(file) {
  if (useCloudinary) {
    // file.path is the secure_url set by multer-storage-cloudinary
    return file.path
  }
  return `/uploads/${file.filename}`
}

// ── Payment proof upload (images + PDFs, max 10MB) ────────────────────────────
let paymentUpload
if (useCloudinary) {
  const paymentStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: 'pharmalink/payment-proofs',
      resource_type: 'auto',
      use_filename: false,
      unique_filename: true,
    }),
  })
  paymentUpload = multer({
    storage: paymentStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (allowed.includes(file.mimetype)) cb(null, true)
      else cb(Object.assign(new Error('INVALID_FILE_TYPE'), { code: 'INVALID_FILE_TYPE' }))
    },
  }).single('file')
} else {
  const UPLOAD_DIR = path.join(__dirname, '../../uploads')
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  paymentUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        cb(null, `payment-${unique}${path.extname(file.originalname)}`)
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (allowed.includes(file.mimetype)) cb(null, true)
      else cb(Object.assign(new Error('INVALID_FILE_TYPE'), { code: 'INVALID_FILE_TYPE' }))
    },
  }).single('file')
}

// ── RFQ chat file upload (any file type, max 10MB) ────────────────────────────
let chatFileUpload
if (useCloudinary) {
  const chatStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: 'pharmalink/rfq-chat',
      resource_type: 'auto',
      use_filename: false,
      unique_filename: true,
    }),
  })
  chatFileUpload = multer({
    storage: chatStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
  }).single('file')
} else {
  const UPLOAD_DIR = path.join(__dirname, '../../uploads/chat')
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  chatFileUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
        cb(null, `chat-${unique}${path.extname(file.originalname)}`)
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  }).single('file')
}

module.exports = { upload, paymentUpload, chatFileUpload, getFileUrl, useCloudinary }
