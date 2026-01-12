import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directories exist
const resumesDir = path.join(process.cwd(), 'uploads', 'resumes');

if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// Blog images are now stored on Cloudinary, no local directory needed

// Configure multer for resume uploads
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'resume-' + uniqueSuffix + extension);
  }
});

// Blog images are now handled by Cloudinary
// Local storage removed for blog images

// File filter for resumes
const resumeFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

// File filter for blog images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, JPEG, PNG, GIF, WEBP) are allowed'), false);
  }
};

export const upload = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Blog image upload now handled by Cloudinary in config/cloudinary.js
// This export is kept for backward compatibility but not used
export const blogImageUpload = null;