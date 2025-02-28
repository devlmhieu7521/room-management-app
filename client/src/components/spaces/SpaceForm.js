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
    // If in edit mode, try to load the space data
    if (isEditMode) {
      const fetchSpaceDetails = async () => {
        try {
          setInitialLoading(true);

          // If we have space data in location state, use it
          if (location.state && location.state.spaceData) {
            console.log("Using space data from location state:", location.state.spaceData);
            setFormData(location.state.spaceData);
          } else {
            // Otherwise try to fetch from API
            try {
              const response = await api.get(`/spaces/${spaceId}`);
              if (response.data && response.data.space) {
                setFormData(response.data.space);
              } else {
                // If API doesn't return data, use mock data
                setMockData();
              }
            } catch (error) {
              console.error('Error fetching space details:', error);
              setMockData();
            }
          }
        } catch (error) {
          console.error('Error setting up space data:', error);
          setError('Failed to load space details. Please try again later.');
          setMockData();
        } finally {
          setInitialLoading(false);
        }
      };

      fetchSpaceDetails();
    }
  }, [spaceId, isEditMode, location.state]);

  // For development - set mock data
  const setMockData = () => {
    setFormData({
      title: 'Modern Downtown Apartment',
      description: 'Stylish apartment in the heart of downtown with great amenities.',
      space_type: 'Apartment',
      capacity: 2,
      street_address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      country: 'USA',
      is_active: true
    });
  };

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

      // If editing, update the space; otherwise create new
      if (isEditMode) {
        // In a real app, you'd call the API here
        // await api.put(`/spaces/${spaceId}`, formData);

        setSuccess(true);

        // Redirect after success
        setTimeout(() => {
          navigate(`/spaces/${spaceId}/manage`, {
            state: {
              spaceData: formData
            }
          });
        }, 1500);
      } else {
        // In a real app, you'd call the API here
        // const response = await api.post('/spaces', formData);
        // const newSpaceId = response.data.space.space_id;

        // For development, generate a fake ID
        const newSpaceId = Math.floor(Math.random() * 10000).toString();

        setSuccess(true);

        // Redirect after success
        setTimeout(() => {
          navigate('/my-spaces', {
            state: {
              spaceAdded: true
            }
          });
        }, 1500);
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
                value={formData.title}
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
                value={formData.description}
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
                value={formData.space_type}
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
                value={formData.capacity}
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
                value={formData.street_address}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="State/Province"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Zip/Postal Code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
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