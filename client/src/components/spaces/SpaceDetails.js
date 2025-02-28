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
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../utils/api';

const SpaceDetails = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingDates, setBookingDates] = useState({
    startDate: null,
    endDate: null
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchSpaceDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/spaces/${spaceId}`);
        setSpace(response.data.space);
      } catch (error) {
        console.error('Error fetching space details:', error);
        setError('Failed to load space details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceDetails();
  }, [spaceId]);

  const handleBookingOpen = () => {
    setBookingDialogOpen(true);
  };

  const handleBookingClose = () => {
    setBookingDialogOpen(false);
    setBookingError('');
  };

  const handleBookingSubmit = async () => {
    try {
      setBookingError('');
      setBookingLoading(true);

      // Validate dates
      if (!bookingDates.startDate || !bookingDates.endDate) {
        setBookingError('Please select both start and end dates');
        setBookingLoading(false);
        return;
      }

      if (bookingDates.startDate >= bookingDates.endDate) {
        setBookingError('End date must be after start date');
        setBookingLoading(false);
        return;
      }

      // Submit booking request
      await api.post('/bookings', {
        space_id: spaceId,
        start_date: bookingDates.startDate.toISOString().split('T')[0],
        end_date: bookingDates.endDate.toISOString().split('T')[0]
      });

      // Close dialog and redirect to bookings page
      handleBookingClose();
      navigate('/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      setBookingError(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
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

  if (!space) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <Alert severity="info">Space not found</Alert>
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Button
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: 300,
                backgroundColor: '#eeeeee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Space Image Placeholder
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h1" gutterBottom>
              {space.title}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={space.space_type} color="primary" size="small" />
              <Chip label={`Capacity: ${space.capacity}`} size="small" />
            </Box>

            <Typography variant="body1" paragraph>
              {space.description || 'No description provided.'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {`${space.street_address}, ${space.city}, ${space.state} ${space.zip_code}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {space.country}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleBookingOpen}
            >
              Book This Space
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onClose={handleBookingClose} maxWidth="sm" fullWidth>
        <DialogTitle>Book This Space</DialogTitle>
        <DialogContent>
          {bookingError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {bookingError}
            </Alert>
          )}

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={bookingDates.startDate}
                  onChange={(date) => setBookingDates({ ...bookingDates, startDate: date })}
                  minDate={new Date()}
                  slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={bookingDates.endDate}
                  onChange={(date) => setBookingDates({ ...bookingDates, endDate: date })}
                  minDate={bookingDates.startDate || new Date()}
                  slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBookingClose}>Cancel</Button>
          <Button
            onClick={handleBookingSubmit}
            variant="contained"
            disabled={bookingLoading}
          >
            {bookingLoading ? 'Booking...' : 'Book Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SpaceDetails;