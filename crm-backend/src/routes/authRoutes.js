const express = require('express');
const router = express.Router();
const {
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  logoutUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword); // See controller notes about client-side flow
router.post('/logout', protect, logoutUser); // protect ensures a user is logged in to log out
router.get('/me', protect, getMe); // Protect this route

module.exports = router;
