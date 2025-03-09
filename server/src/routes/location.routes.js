// server/src/routes/location.routes.js
const express = require('express');
const LocationController = require('../controllers/location.controller');

const router = express.Router();

/**
 * @route GET /api/locations/provinces
 * @desc Get all Vietnamese provinces/cities
 * @access Public
 */
router.get('/provinces', LocationController.getProvinces);

/**
 * @route GET /api/locations/provinces/:provinceCode/districts
 * @desc Get districts for a specific province
 * @access Public
 */
router.get('/provinces/:provinceCode/districts', LocationController.getDistricts);

/**
 * @route GET /api/locations/districts/:districtCode/wards
 * @desc Get wards for a specific district
 * @access Public
 */
router.get('/districts/:districtCode/wards', LocationController.getWards);

/**
 * @route GET /api/locations/details/:type/:code
 * @desc Get details of a specific location by type and code
 * @access Public
 */
router.get('/details/:type/:code', LocationController.getLocationDetails);

/**
 * @route GET /api/locations/search
 * @desc Search location by name
 * @access Public
 */
router.get('/search', LocationController.searchLocation);

module.exports = router;