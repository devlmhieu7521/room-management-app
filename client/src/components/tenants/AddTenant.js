import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../../utils/api';

const AddTenant = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [error, setError] = useState('');
  const [spaces, setSpaces] = useState([]);

  // Format today's date for default values
  const today = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    space_id: '',
    start_date: formatDateForInput(today),
    end_date: formatDateForInput(oneYearFromNow),
    rent_amount: '',
    security_deposit: '',
    notes: ''
  });

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setSpacesLoading(true);
        const response = await api.get('/spaces/host/my-spaces');
        setSpaces(response.data.spaces || []);
      } catch (error) {
        console.error('Error fetching spaces:', error);
        // For development, let's add some mock data
        setSpaces([
          { space_id: '1', title: 'Apartment 4B', address: '123 Main St' },
          { space_id: '2', title: 'Office Suite 7', address: '456 Business Ave' },
          { space_id: '3', title: 'Studio 7C', address: '789 Creative Blvd' }
        ]);
      } finally {
        setSpacesLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.space_id) {
        throw new Error('Please fill all required fields');
      }

      if (!formData.start_date || !formData.end_date) {
        throw new Error('Please select lease start and end dates');
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (startDate >= endDate) {
        throw new Error('Lease end date must be after start date');
      }

      await api.post('/tenants', formData);

      // Navigate to tenants list
      navigate('/tenants');
    } catch (error) {
      console.error('Error adding tenant:', error);
      setError(error.message || 'Failed to add tenant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Add New Tenant
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Space</InputLabel>
                <Select
                  name="space_id"
                  value={formData.space_id}
                  onChange={handleChange}
                  label="Space"
                >
                  {spacesLoading ? (
                    <MenuItem disabled>Loading spaces...</MenuItem>
                  ) : spaces.length === 0 ? (
                    <MenuItem disabled>No spaces available</MenuItem>
                  ) : (
                    spaces.map((space) => (
                      <MenuItem key={space.space_id} value={space.space_id}>
                        {space.title} {space.address ? `- ${space.address}` : ''}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Lease Start Date"
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: formatDateForInput(today)
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Lease End Date"
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: formData.start_date || formatDateForInput(today)
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Rent Amount"
                name="rent_amount"
                type="number"
                InputProps={{ startAdornment: '$' }}
                value={formData.rent_amount}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Security Deposit"
                name="security_deposit"
                type="number"
                InputProps={{ startAdornment: '$' }}
                value={formData.security_deposit}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/tenants')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Tenant'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddTenant;