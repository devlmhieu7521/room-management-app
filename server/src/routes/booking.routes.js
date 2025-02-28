const express = require('express');
const BookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// All booking routes require authentication
router.use(authMiddleware);

// Get user's bookings (as tenant)
router.get('/', BookingController.getBookings);

// Get bookings for user's spaces (as host)
router.get('/host', BookingController.getHostBookings);

// Get specific booking
router.get('/:bookingId', BookingController.getBookingById);

// Create new booking
router.post('/', BookingController.createBooking);

// Update booking status
router.put('/:bookingId/status', BookingController.updateBookingStatus);

module.exports = router;