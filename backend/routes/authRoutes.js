const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  registerValidation,
  loginValidation,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
