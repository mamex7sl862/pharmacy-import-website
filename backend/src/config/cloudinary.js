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
    let resource_type = 'auto'; // allow image, video, raw (pdf)

    if (file.fieldname === 'attachments') {
      folder = 'pharmalink/rfq/attachments';
    } else if (file.fieldname === 'legalDocument') {
      folder = 'pharmalink/rfq/legal';
    } else if (req.baseUrl.includes('chat')) {
      folder = 'pharmalink/chat';
    }

    return {
      folder: folder,
      resource_type: resource_type,
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};
