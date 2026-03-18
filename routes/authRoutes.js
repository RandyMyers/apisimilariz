const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword } = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/auth');
const { validateLogin, validateRegister, validateForgotPassword } = require('../middleware/validators/authValidator');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.get('/me', protect, isAdmin, getMe);

module.exports = router;
