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

module.exports = { upload, getFileUrl, useCloudinary }
