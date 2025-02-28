const express = require('express');
const AuthController = require('../controllers/auth.controller');

const router = express.Router();

// Register new user
router.post('/register', AuthController.register);

// Login user
router.post('/login', AuthController.login);

module.exports = router;