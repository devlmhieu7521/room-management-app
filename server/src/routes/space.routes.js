const express = require('express');
const SpaceController = require('../controllers/space.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Protected routes - require authentication
router.use(authMiddleware);

// Host-specific routes - ORDER MATTERS HERE
router.get('/host/metrics', SpaceController.getSpaceMetrics);
router.get('/host/my-spaces', SpaceController.getHostSpaces);

// Space CRUD operations
router.post('/', SpaceController.createSpace);
router.put('/:spaceId', SpaceController.updateSpace);
router.delete('/:spaceId', SpaceController.deleteSpace);

// This route should come AFTER the /host/* routes
router.get('/:spaceId', SpaceController.getSpaceById);
module.exports = router;