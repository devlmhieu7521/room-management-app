const express = require('express');
const SpaceController = require('../controllers/space.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', SpaceController.getSpaces);
router.get('/:spaceId', SpaceController.getSpaceById);

// Protected routes - require authentication
router.post('/', authMiddleware, SpaceController.createSpace);
router.get('/host/my-spaces', authMiddleware, SpaceController.getHostSpaces);
router.put('/:spaceId', authMiddleware, SpaceController.updateSpace);
router.delete('/:spaceId', authMiddleware, SpaceController.deleteSpace);

module.exports = router;