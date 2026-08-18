// We use memory storage so we can pass the image buffer directly to Cloudinary
const multer = require('multer');
const storage = multer.memoryStorage(); 

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit image size to 5MB
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

module.exports = upload;