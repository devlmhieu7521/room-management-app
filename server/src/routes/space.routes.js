const express = require('express');
const SpaceController = require('../controllers/space.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', SpaceController.getSpaces);
router.get('/:spaceId', SpaceController.getSpaceById);

// Protected routes - require authentication
router.use(authMiddleware);

// Space CRUD operations
router.post('/', SpaceController.createSpace);
router.put('/:spaceId', SpaceController.updateSpace);
router.delete('/:spaceId', SpaceController.deleteSpace);

// Host-specific routes
router.get('/host/my-spaces', SpaceController.getHostSpaces);
router.get('/host/metrics', SpaceController.getSpaceMetrics);

module.exports = router;