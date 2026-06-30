const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/verify-register-otp', authController.verifyRegisterOtp);
router.post('/resend-register-otp', authController.resendRegisterOtp);
router.post('/login', authController.login);
router.post('/social-login', authController.socialLogin);
router.post('/change-password', authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password-otp', authController.resetPasswordOtp);

module.exports = router;
