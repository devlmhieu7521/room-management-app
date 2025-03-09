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
  CircularProgress,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardMedia,
  Chip,
  FormHelperText,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiService from '../../utils/api';

// Space type options
const spaceTypes = [
  'Meeting Room',
  'Office Space',
  'Conference Room',
  'Event Space',
  'Studio',
  'Coworking Space',
  'Apartment',
  'House',
  'Room',
  'Loft',
  'Other'
];

const SpaceForm = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're in edit mode
  const isEditMode = Boolean(spaceId);

  // Form validation state
  const [errors, setErrors] = useState({});

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

  // State hooks
  const [formData, setFormData] = useState(defaultFormData);
  const [originalData, setOriginalData] = useState(null); // For comparing changes
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Helper function to check if form has changed from original
  const hasFormChanged = () => {
    if (!originalData) return true; // If no original data, assume changed

    // Compare each field that's editable
    return Object.keys(formData).some(key => {
      // Special handling for boolean values that might be strings
      if (key === 'is_active') {
        const formValue = formData[key] === true || formData[key] === 'true';
        const origValue = originalData[key] === true || originalData[key] === 'true';
        return formValue !== origValue;
      }

      // Normal comparison for other fields
      return formData[key] !== originalData[key];
    });
  };

  // Fetch space data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchSpaceDetails = async () => {
        try {
          setLoading(true);
          setError('');

          // If we have space data in location state, use it
          if (location.state && location.state.spaceData) {
            const spaceData = location.state.spaceData;
            setFormData(spaceData);
            setOriginalData(spaceData);
          } else {
            // Otherwise fetch from API
            const response = await apiService.spaces.getById(spaceId);
            if (response.data && response.data.space) {
              const spaceData = response.data.space;
              setFormData(spaceData);
              setOriginalData(spaceData);
            } else {
              setError('Could not load space details');
            }
          }
        } catch (error) {
          console.error('Error fetching space details:', error);
          setError(apiService.handleError(error, 'Failed to load space details. Please try again later.'));
        } finally {
          setLoading(false);
        }
      };

      fetchSpaceDetails();
    }
  }, [spaceId, isEditMode, location.state]);

  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    const requiredFields = [
      'title',
      'space_type',
      'capacity',
      'street_address',
      'city',
      'state',
      'zip_code'
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });

    // Capacity validation (must be a positive number)
    if (formData.capacity) {
      const capacity = parseInt(formData.capacity, 10);
      if (isNaN(capacity) || capacity <= 0) {
        newErrors.capacity = 'Capacity must be a positive number';
      }
    }

    // ZIP code validation (basic format check)
    if (formData.zip_code && !/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      setNotification({
        open: true,
        message: 'Please fix the errors in the form before submitting.',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Process capacity value to ensure it's a number
      const processedData = {
        ...formData,
        capacity: parseInt(formData.capacity, 10)
      };

      // Process boolean fields that might be strings
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
        setNotification({
          open: true,
          message: isEditMode ? 'Space updated successfully!' : 'Space created successfully!',
          severity: 'success'
        });

        // Update original data if in edit mode
        if (isEditMode && response.data.space) {
          setOriginalData(response.data.space);
          setFormData(response.data.space);
        }

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
      setError(apiService.handleError(error, 'Failed to process space. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => navigate(isEditMode ? `/spaces/${spaceId}/manage` : '/my-spaces')}
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Space' : 'Add New Space'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HomeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Basic Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Space Title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title || "A descriptive name for your space"}
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
                error={!!errors.description}
                helperText={errors.description || "Detailed description of your space"}
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
                error={!!errors.space_type}
                helperText={errors.space_type || "Select the type of space"}
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
                error={!!errors.capacity}
                helperText={errors.capacity || "Maximum number of people"}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Location Information Section */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Location
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Street Address"
                name="street_address"
                value={formData.street_address || ''}
                onChange={handleChange}
                error={!!errors.street_address}
                helperText={errors.street_address || "Full street address of the space"}
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
                error={!!errors.city}
                helperText={errors.city}
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
                error={!!errors.state}
                helperText={errors.state}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="ZIP/Postal Code"
                name="zip_code"
                value={formData.zip_code || ''}
                onChange={handleChange}
                error={!!errors.zip_code}
                helperText={errors.zip_code}
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
                error={!!errors.country}
                helperText={errors.country}
              />
            </Grid>

            {/* Visibility Setting (only in edit mode) */}
            {isEditMode && (
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h2">
                    Space Settings
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Visibility Status"
                    name="is_active"
                    value={formData.is_active === true || formData.is_active === "true" ? "true" : "false"}
                    onChange={handleChange}
                    helperText="Active spaces are visible and available for booking"
                  >
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            )}

            {/* Submit Button Section */}
            <Grid item xs={12} sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => isEditMode ? navigate(`/spaces/${spaceId}/manage`) : navigate('/my-spaces')}
                  startIcon={<ArrowBackIcon />}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={saving || (isEditMode && !hasFormChanged())}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving
                    ? (isEditMode ? 'Saving...' : 'Creating...')
                    : (isEditMode ? 'Save Changes' : 'Create Space')
                  }
                </Button>
              </Box>

              {isEditMode && !hasFormChanged() && (
                <FormHelperText sx={{ textAlign: 'right', mt: 1 }}>
                  No changes have been made
                </FormHelperText>
              )}
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
        <Alert severity={notification.severity} onClose={handleCloseNotification}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SpaceForm;