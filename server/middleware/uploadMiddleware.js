
import multer from 'multer';
import AppError from '../utils/appError.js';

// Memory storage — the file buffer is streamed straight to Cloudinary in the
// controller, never touching disk (important on ephemeral hosts like Render).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
});

export default upload;
