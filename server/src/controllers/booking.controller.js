const BookingModel = require('../models/booking.model');
const SpaceModel = require('../models/space.model');

class BookingController {
  static async createBooking(req, res) {
    try {
      const bookingData = {
        ...req.body,
        tenant_id: req.user.id // From JWT token
      };

      // Validate dates
      const startDate = new Date(bookingData.start_date);
      const endDate = new Date(bookingData.end_date);

      if (startDate >= endDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      // Check if space exists
      const space = await SpaceModel.findById(bookingData.space_id);
      if (!space) {
        return res.status(404).json({ message: 'Space not found' });
      }

      // Don't allow users to book their own spaces
      if (space.host_id === req.user.id) {
        return res.status(400).json({ message: 'You cannot book your own space' });
      }

      // Create booking
      const booking = await BookingModel.create(bookingData);

      return res.status(201).json({
        message: 'Booking created successfully',
        booking
      });
    } catch (error) {
      console.error('Booking creation error:', error);
      return res.status(500).json({ message: 'Server error during booking creation' });
    }
  }

  static async getBookings(req, res) {
    try {
      // Get user's bookings (as a tenant)
      const bookings = await BookingModel.findByUser(req.user.id);

      return res.status(200).json({
        bookings
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return res.status(500).json({ message: 'Server error while fetching bookings' });
    }
  }

  static async getHostBookings(req, res) {
    try {
      // Get bookings for spaces hosted by this user
      const bookings = await BookingModel.findBySpaceHost(req.user.id);

      return res.status(200).json({
        bookings
      });
    } catch (error) {
      console.error('Error fetching host bookings:', error);
      return res.status(500).json({ message: 'Server error while fetching host bookings' });
    }
  }

  static async getBookingById(req, res) {
    try {
      const { bookingId } = req.params;
      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if user is authorized to view this booking
      const isHost = await this.isUserSpaceHost(booking.space_id, req.user.id);

      if (booking.tenant_id !== req.user.id && !isHost) {
        return res.status(403).json({ message: 'Not authorized to view this booking' });
      }

      return res.status(200).json({
        booking
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      return res.status(500).json({ message: 'Server error while fetching booking' });
    }
  }

  static async updateBookingStatus(req, res) {
    try {
      const { bookingId } = req.params;
      const { booking_status } = req.body;

      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Check if user is authorized to update this booking status
      const isHost = await this.isUserSpaceHost(booking.space_id, req.user.id);

      // Tenant can only cancel their own booking
      if (booking_status === 'canceled' && booking.tenant_id === req.user.id) {
        // Allow tenant to cancel
      }
      // Only host can confirm or reject bookings
      else if (!isHost) {
        return res.status(403).json({ message: 'Not authorized to update this booking' });
      }

      // Update booking status
      const updatedBooking = await BookingModel.update(bookingId, { booking_status });

      return res.status(200).json({
        message: 'Booking status updated successfully',
        booking: updatedBooking
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      return res.status(500).json({ message: 'Server error while updating booking status' });
    }
  }

  // Helper method to check if a user is the host of a space
  static async isUserSpaceHost(spaceId, userId) {
    try {
      const space = await SpaceModel.findById(spaceId);
      return space && space.host_id === userId;
    } catch (error) {
      console.error('Error checking space host:', error);
      return false;
    }
  }
}

module.exports = BookingController;