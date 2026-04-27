const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder and resource_type based on common usage
    let folder = 'pharmalink/others';
    // Use 'raw' for PDFs to avoid Cloudinary security blocks on /image/ path
    const isPDF = file.originalname.toLowerCase().endsWith('.pdf') || file.mimetype === 'application/pdf';
    let resource_type = isPDF ? 'raw' : 'auto'; 

    if (file.fieldname === 'attachments') {
      folder = 'pharmalink/rfq/attachments';
    } else if (file.fieldname === 'legalDocument') {
      folder = 'pharmalink/rfq/legal';
    } else if (file.fieldname === 'image') {
      folder = 'pharmalink/products';
      resource_type = 'image';
    } else if (req.baseUrl.includes('chat')) {
      folder = 'pharmalink/chat';
    }

    // Strip extension to bypass Cloudinary's "Block delivery of PDF files" security rule for raw files
    const lastDotIndex = file.originalname.lastIndexOf('.');
    const baseName = lastDotIndex !== -1 ? file.originalname.substring(0, lastDotIndex) : file.originalname;
    
    // Only strip the extension if it's a PDF to avoid 401 Unauthorized
    const ext = isPDF ? '' : (lastDotIndex !== -1 ? file.originalname.substring(lastDotIndex) : '');
    
    return {
      folder: folder,
      resource_type: resource_type,
      public_id: `${Date.now()}-${baseName}${ext}`,
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};
