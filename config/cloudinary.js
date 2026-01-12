import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const blogStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blogs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 630, crop: 'limit' }]
  }
});

export const blogImageUpload = multer({ 
  storage: blogStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

export default cloudinary;
