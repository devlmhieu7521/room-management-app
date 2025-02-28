const express = require('express');
const UserController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// Get current user profile
router.get('/me', UserController.getUserProfile);

// Update current user profile
router.put('/me', UserController.updateUserProfile);

// Change password
router.put('/me/password', UserController.changePassword);

module.exports = router;