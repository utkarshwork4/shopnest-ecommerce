const express = require('express');
const { registerUser, resendEmailOtp, verifyEmailOtp, loginUser, getUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/resend-otp', resendEmailOtp);
router.post('/verify-otp', verifyEmailOtp);
router.post('/login', loginUser);
router.get('/users', protect, admin, getUsers);

module.exports = router;
