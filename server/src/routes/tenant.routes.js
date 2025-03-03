const express = require('express');
const TenantController = require('../controllers/tenant.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// All tenant routes require authentication
router.use(authMiddleware);

// Get tenant metrics
router.get('/metrics', TenantController.getTenantMetrics);

// Get all tenants for the host
router.get('/', TenantController.getTenants);

// Get specific tenant
router.get('/:tenantId', TenantController.getTenantById);

// Get tenants for specific space
router.get('/space/:spaceId', TenantController.getTenantsBySpace);

// Create new tenant
router.post('/', TenantController.createTenant);

// Update tenant
router.put('/:tenantId', TenantController.updateTenant);

// Delete tenant
router.delete('/:tenantId', TenantController.deleteTenant);

module.exports = router;