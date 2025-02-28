import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import api from '../../utils/api';

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/bookings/${bookingId}`);
        setBooking(response.data.booking);
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleCancelOpen = () => {
    setCancelDialogOpen(true);
  };

  const handleCancelClose = () => {
    setCancelDialogOpen(false);
  };

  const handleCancelBooking = async () => {
    try {
      setActionLoading(true);
      await api.put(`/bookings/${bookingId}/status`, {
        booking_status: 'canceled'
      });

      // Update booking status locally
      setBooking({ ...booking, booking_status: 'canceled' });
      handleCancelClose();
    } catch (error) {
      console.error('Error canceling booking:', error);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'canceled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <Alert severity="info">Booking not found</Alert>
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Button
        variant="outlined"
        onClick={() => navigate('/bookings')}
        sx={{ mb: 3 }}
      >
        Back to Bookings
      </Button>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Booking Details
          </Typography>
          <Chip
            label={booking.booking_status}
            color={getStatusColor(booking.booking_status)}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Space Information
            </Typography>
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              <strong>Space:</strong> {booking.space_title}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={() => navigate(`/spaces/${booking.space_id}`)}
            >
              View Space
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Booking Information
            </Typography>
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              <strong>Check-in:</strong> {new Date(booking.start_date).toLocaleDateString()}
            </Typography>
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              <strong>Check-out:</strong> {new Date(booking.end_date).toLocaleDateString()}
            </Typography>
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              <strong>Duration:</strong> {Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24))} days
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          {booking.booking_status !== 'canceled' && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancelOpen}
            >
              Cancel Booking
            </Button>
          )}
        </Box>
      </Paper>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCancelClose}
      >
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClose}>No, Keep Booking</Button>
          <Button
            onClick={handleCancelBooking}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            Yes, Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingDetails;