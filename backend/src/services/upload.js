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

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isPDF = file.mimetype === 'application/pdf'
      return {
        folder: 'pharmalink/rfq-attachments',
        resource_type: isPDF ? 'raw' : 'image',
        type: 'upload',
        access_mode: 'public',
        use_filename: false,
        unique_filename: true,
        format: isPDF ? 'pdf' : undefined,
      }
    },
  })

  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
  })
} else {
  // Local disk fallback for development
  const UPLOAD_DIR = path.join(__dirname, '../../uploads')
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
      cb(null, `${unique}${path.extname(file.originalname)}`)
    },
  })

  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
  })
}

/**
 * Get the public URL for a file.
 * Cloudinary returns a full URL; local storage returns a /uploads/... path.
 */
function getFileUrl(file) {
  if (useCloudinary) {
    // file.path is the secure_url from Cloudinary — use it as-is
    return file.path
  }
  return `/uploads/${file.filename}`
}

module.exports = { upload, getFileUrl, useCloudinary }
