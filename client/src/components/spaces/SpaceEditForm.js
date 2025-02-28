import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';

const spaceTypes = [
  'Meeting Room',
  'Office Space',
  'Conference Room',
  'Event Space',
  'Studio',
  'Coworking Space',
  'Apartment'
];

const SpaceEditForm = () => {
  const { spaceId } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    space_type: '',
    capacity: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    is_active: true
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpaceDetails = async () => {
      try {
        setInitialLoading(true);
        const response = await api.get(`/spaces/${spaceId}`);

        if (response.data && response.data.space) {
          setFormData(response.data.space);
        } else {
          setError('Space not found');
        }
      } catch (error) {
        console.error('Error fetching space details:', error);
        setError('Failed to load space details. Please try again later.');
      } finally {
        setInitialLoading(false);
      }
    };

    if (spaceId) {
      fetchSpaceDetails();
    }
  }, [spaceId]);

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
      // Perform validation
      if (!formData.title || !formData.space_type || !formData.capacity) {
        throw new Error('Please fill all required fields');
      }

      // Use the api utility to update the space
      const response = await api.put(`/spaces/${spaceId}`, formData);

      console.log('Space updated successfully:', response.data);
      setSuccess(true);

      // Redirect to manage space after a delay
      setTimeout(() => {
        navigate(`/spaces/${spaceId}/manage`);
      }, 2000);
    } catch (error) {
      console.error('Error updating space:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update space');
    } finally {
      setLoading(false);
    }
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
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Space
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={4}
                value={formData.description || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Space Type"
                name="space_type"
                value={formData.space_type || ''}
                onChange={handleChange}
              >
                {spaceTypes.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Capacity"
                name="capacity"
                type="number"
                value={formData.capacity || ''}
                onChange={handleChange}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Street Address"
                name="street_address"
                value={formData.street_address || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="City"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="State/Province"
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Zip/Postal Code"
                name="zip_code"
                value={formData.zip_code || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Country"
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Status"
                name="is_active"
                value={formData.is_active === true || formData.is_active === "true" ? "true" : "false"}
                onChange={handleChange}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(`/spaces/${spaceId}/manage`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Space updated successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SpaceEditForm;