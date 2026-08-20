const { upload } = require('../config/cloudinary');

/**
 * Multer middleware for single file upload
 * Field name: 'file'
 */
const uploadSingle = upload.single('file');

/**
 * Wrapper to handle multer errors gracefully
 */
const handleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File size too large. Maximum allowed size is 10MB.',
        });
      }
      if (err.message) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: 'File upload error' });
    }
    next();
  });
};

module.exports = { handleUpload };
