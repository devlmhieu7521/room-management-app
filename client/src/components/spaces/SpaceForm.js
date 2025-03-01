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
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiService from '../../utils/api';

const spaceTypes = [
  'Meeting Room',
  'Office Space',
  'Conference Room',
  'Event Space',
  'Studio',
  'Coworking Space',
  'Apartment'
];

const SpaceForm = () => {
  const { spaceId } = useParams();
  const location = useLocation();
  const isEditMode = Boolean(spaceId);

  // Default form data
  const defaultFormData = {
    title: '',
    description: '',
    space_type: '',
    capacity: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    is_active: true
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const navigate = useNavigate();

  useEffect(() => {
    // If in edit mode, load the space data
    if (isEditMode) {
      const fetchSpaceDetails = async () => {
        try {
          setInitialLoading(true);

          // If we have space data in location state, use it
          if (location.state && location.state.spaceData) {
            setFormData(location.state.spaceData);
          } else {
            // Otherwise fetch from API
            const response = await apiService.spaces.getById(spaceId);
            if (response.data && response.data.space) {
              setFormData(response.data.space);
            } else {
              setError('Could not load space details');
            }
          }
        } catch (error) {
          console.error('Error fetching space details:', error);
          setError('Failed to load space details. Please try again later.');
        } finally {
          setInitialLoading(false);
        }
      };

      fetchSpaceDetails();
    }
  }, [spaceId, isEditMode, location.state]);

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

      // Process capacity value to ensure it's a number
      const processedData = {
        ...formData,
        capacity: parseInt(formData.capacity, 10)
      };

      // Process boolean fields
      if (isEditMode && (processedData.is_active === 'true' || processedData.is_active === 'false')) {
        processedData.is_active = processedData.is_active === 'true';
      }

      let response;

      // If editing, update the space; otherwise create new
      if (isEditMode) {
        response = await apiService.spaces.update(spaceId, processedData);
      } else {
        response = await apiService.spaces.create(processedData);
      }

      // Check if the API call was successful
      if (response.data && (response.data.space || response.data.success)) {
        setSuccess(true);

        // Redirect after success
        setTimeout(() => {
          if (isEditMode) {
            navigate(`/spaces/${spaceId}/manage`, {
              state: { spaceData: response.data.space }
            });
          } else {
            navigate('/my-spaces', {
              state: { spaceAdded: true }
            });
          }
        }, 1500);
      } else {
        throw new Error('API response missing expected data');
      }
    } catch (error) {
      console.error('Error with space:', error);
      setError(error.message || 'Failed to process space. Please try again.');
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
          {isEditMode ? 'Edit Space' : 'Add New Space'}
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
                helperText="A descriptive name for your space"
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
                helperText="Detailed description of your space"
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
                helperText="Select the type of space"
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
                helperText="Maximum number of people"
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
                helperText="Full street address of the space"
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

            {isEditMode && (
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  name="is_active"
                  value={formData.is_active === true || formData.is_active === "true" ? "true" : "false"}
                  onChange={handleChange}
                  helperText="Active spaces are visible and available for booking"
                >
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </TextField>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => isEditMode ? navigate(`/spaces/${spaceId}/manage`) : navigate('/my-spaces')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Space')}
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
          {isEditMode ? 'Space updated successfully!' : 'Space created successfully!'} Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SpaceForm;