import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CircularProgress,
  InputAdornment,
  Snackbar
} from '@mui/material';
import { api } from '../../utils/api';

const EditTenant = () => {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    space_id: '',
    start_date: '',
    end_date: '',
    rent_amount: '',
    security_deposit: '',
    notes: ''
  });

  // Load tenant and spaces data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);

        // Fetch tenant details
        try {
          const response = await api.get(`/tenants/${tenantId}`);
          console.log('Tenant data response:', response);

          if (response.data && response.data.tenant) {
            const tenant = response.data.tenant;

            // Format dates for form fields
            const formatDate = (dateString) => {
              if (!dateString) return '';
              const date = new Date(dateString);
              return date.toISOString().split('T')[0];
            };

            setFormData({
              first_name: tenant.first_name || '',
              last_name: tenant.last_name || '',
              email: tenant.email || '',
              phone_number: tenant.phone_number || '',
              space_id: tenant.space_id || '',
              start_date: formatDate(tenant.start_date),
              end_date: formatDate(tenant.end_date),
              rent_amount: tenant.rent_amount || '',
              security_deposit: tenant.security_deposit || '',
              notes: tenant.notes || ''
            });
            console.log('Form data initialized:', {
              first_name: tenant.first_name,
              space_id: tenant.space_id,
              start_date: formatDate(tenant.start_date)
            });
          } else {
            setError('Could not load tenant details');
          }
        } catch (error) {
          console.error('Error fetching tenant details:', error);
          setError('Failed to load tenant information. Please try again later.');
        }

        // Fetch spaces data
        try {
          setSpacesLoading(true);
          const spacesResponse = await api.get('/spaces/host/my-spaces');

          if (spacesResponse.data && spacesResponse.data.spaces) {
            setSpaces(spacesResponse.data.spaces);
            console.log('Spaces loaded:', spacesResponse.data.spaces.length);
          } else {
            console.warn('No spaces available');
          }
        } catch (error) {
          console.error('Error fetching spaces:', error);
          setError('Failed to load spaces. Tenant cannot be reassigned to a different space.');
        } finally {
          setSpacesLoading(false);
        }

      } catch (error) {
        console.error('Error in data fetching:', error);
        setError('An error occurred while loading data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

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

      // Process numeric values to ensure they're numbers
      const processedData = {
        ...formData,
        rent_amount: formData.rent_amount ? Number(formData.rent_amount) : 0,
        security_deposit: formData.security_deposit ? Number(formData.security_deposit) : 0
      };

      console.log('Submitting tenant update:', processedData);

      // Use direct axios call instead of apiService to debug
      const response = await api.put(`/tenants/${tenantId}`, processedData);
      console.log('Update response:', response);

      if (response.data && (response.data.tenant || response.data.success)) {
        setNotification({
          open: true,
          message: 'Tenant updated successfully!',
          severity: 'success'
        });

        // Navigate to the tenant details page after a delay
        setTimeout(() => {
          navigate(`/tenants/${tenantId}`);
        }, 1500);
      } else {
        throw new Error('Failed to update tenant. Please try again.');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update tenant. Please try again.');
      setLoading(false); // Make sure to reset loading state on error
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Edit Tenant
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
                        {space.title} {space.city && space.state ? `- ${space.city}, ${space.state}` : ''}
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
                  min: formData.start_date
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Rent Amount"
                name="rent_amount"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
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
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/tenants/${tenantId}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditTenant;