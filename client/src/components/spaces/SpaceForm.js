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
  FormHelperText,
  Tooltip,
  FormControlLabel,
  Switch,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import apiService from '../../utils/api';
import VietnameseLocationSelector from './VietnameseLocationSelector';

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

  // Toggle for Vietnamese address format
  const [useVietnameseFormat, setUseVietnameseFormat] = useState(true);

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
    country: 'Vietnam',
    is_active: true,
    // Vietnamese location specific fields
    province: null,
    district: null,
    ward: null
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
      // Skip Vietnamese-specific fields in this simple comparison if they're objects
      if (['province', 'district', 'ward'].includes(key) &&
          (formData[key] === null || typeof formData[key] === 'object')) {
        return false;
      }

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

  // Extract Vietnamese location from existing data (for edit mode)
  const extractVietnameseLocation = (spaceData) => {
    if (!spaceData) return {};

    // These values might be stored in a variety of ways depending on implementation:
    // 1. As JSON in a field
    // 2. As separate fields
    // 3. Parsed from city, state fields

    // This is a simplified approach - adjust based on actual data structure
    const result = {
      province: null,
      district: null,
      ward: null
    };

    // Option 1: If we have dedicated fields already
    if (spaceData.province) result.province = spaceData.province;
    if (spaceData.district) result.district = spaceData.district;
    if (spaceData.ward) result.ward = spaceData.ward;

    // Option 2: If location data is stored as JSON in a field
    if (spaceData.location_data) {
      try {
        const locationData = typeof spaceData.location_data === 'string'
          ? JSON.parse(spaceData.location_data)
          : spaceData.location_data;

        if (locationData.province) result.province = locationData.province;
        if (locationData.district) result.district = locationData.district;
        if (locationData.ward) result.ward = locationData.ward;
      } catch (e) {
        console.error('Error parsing location data:', e);
      }
    }

    return result;
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
            const vietnameseLocation = extractVietnameseLocation(spaceData);

            setFormData({
              ...spaceData,
              ...vietnameseLocation
            });
            setOriginalData(spaceData);

            // If this is a Vietnamese address
            if (spaceData.country === 'Vietnam' || vietnameseLocation.province) {
              setUseVietnameseFormat(true);
            } else {
              setUseVietnameseFormat(false);
            }
          } else {
            // Otherwise fetch from API
            const response = await apiService.spaces.getById(spaceId);
            if (response.data && response.data.space) {
              const spaceData = response.data.space;
              const vietnameseLocation = extractVietnameseLocation(spaceData);

              setFormData({
                ...spaceData,
                ...vietnameseLocation
              });
              setOriginalData(spaceData);

              // If this is a Vietnamese address
              if (spaceData.country === 'Vietnam' || vietnameseLocation.province) {
                setUseVietnameseFormat(true);
              } else {
                setUseVietnameseFormat(false);
              }
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

  // Handle Vietnamese location change
  const handleLocationChange = (locationData) => {
    // Clear validation errors
    const locationErrors = { ...errors };
    delete locationErrors.province;
    delete locationErrors.district;
    delete locationErrors.ward;
    delete locationErrors.city;
    delete locationErrors.state;
    setErrors(locationErrors);

    // Update form data with Vietnamese location
    setFormData({
      ...formData,
      province: locationData.province,
      district: locationData.district,
      ward: locationData.ward,
      // Update traditional fields for backward compatibility
      city: locationData.province ? locationData.province.name : '',
      state: locationData.district ? locationData.district.name : '',
    });
  };

  // Toggle between Vietnamese and international address format
  const handleFormatToggle = () => {
    setUseVietnameseFormat(!useVietnameseFormat);

    // Reset relevant validation errors
    const updatedErrors = { ...errors };
    delete updatedErrors.city;
    delete updatedErrors.state;
    delete updatedErrors.province;
    delete updatedErrors.district;
    delete updatedErrors.ward;
    setErrors(updatedErrors);

    // If switching to international format, copy province/district to city/state if needed
    if (useVietnameseFormat) {
      // Convert from Vietnamese format to international
      const updatedFormData = { ...formData };

      if (formData.province && !formData.city) {
        updatedFormData.city = formData.province.name || '';
      }

      if (formData.district && !formData.state) {
        updatedFormData.state = formData.district.name || '';
      }

      setFormData(updatedFormData);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields for all forms
    const requiredFields = [
      'title',
      'space_type',
      'capacity',
      'street_address',
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
        newErrors[field] = 'This field is required';
      }
    });

    // Validate Vietnamese format fields
    if (useVietnameseFormat) {
      if (!formData.province) {
        newErrors.province = 'Province is required';
      }
      if (!formData.district) {
        newErrors.district = 'District is required';
      }
      if (!formData.ward) {
        newErrors.ward = 'Ward is required';
      }
    } else {
      // Validate international format fields
      if (!formData.city || formData.city.trim() === '') {
        newErrors.city = 'City is required';
      }
      if (!formData.state || formData.state.trim() === '') {
        newErrors.state = 'State/Province is required';
      }
      if (!formData.zip_code || formData.zip_code.trim() === '') {
        newErrors.zip_code = 'ZIP/Postal code is required';
      }
    }

    // Capacity validation (must be a positive number)
    if (formData.capacity) {
      const capacity = parseInt(formData.capacity, 10);
      if (isNaN(capacity) || capacity <= 0) {
        newErrors.capacity = 'Capacity must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Prepare data for API submission
  const prepareSubmissionData = () => {
    // Process capacity value to ensure it's a number
    const processedData = {
      ...formData,
      capacity: parseInt(formData.capacity, 10)
    };

    // Process boolean fields that might be strings
    if (isEditMode && (processedData.is_active === 'true' || processedData.is_active === 'false')) {
      processedData.is_active = processedData.is_active === 'true';
    }

    // For Vietnamese format, ensure we have the right fields
    if (useVietnameseFormat) {
      // Set country explicitly for Vietnamese addresses
      processedData.country = 'Vietnam';

      // Generate a formatted postal code if using Vietnamese format
      if (processedData.province && processedData.district) {
        processedData.zip_code = `${processedData.province.code}${processedData.district.code}`;
      }

      // Format the address for storage & display
      const provinceName = processedData.province ? processedData.province.name : '';
      const districtName = processedData.district ? processedData.district.name : '';
      const wardName = processedData.ward ? processedData.ward.name : '';

      // Store complete location for Vietnamese addresses
      processedData.location_data = JSON.stringify({
        province: processedData.province,
        district: processedData.district,
        ward: processedData.ward
      });

      // Update city and state for backward compatibility
      processedData.city = provinceName;
      processedData.state = districtName;

      // Create a formatted full address
      if (!processedData.full_address && wardName && districtName && provinceName) {
        processedData.full_address = `${processedData.street_address}, ${wardName}, ${districtName}, ${provinceName}, Vietnam`;
      }
    }

    return processedData;
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
      const processedData = prepareSubmissionData();
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h2">
                    Location
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={useVietnameseFormat}
                      onChange={handleFormatToggle}
                    />
                  }
                  label="Vietnamese Address Format"
                />
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
                helperText={errors.street_address || "Building number, street, apartment/unit (if applicable)"}
              />
            </Grid>

            {useVietnameseFormat ? (
              // Vietnamese Location Selector (Province, District, Ward)
              <Grid item xs={12}>
                <VietnameseLocationSelector
                  value={{
                    province: formData.province,
                    district: formData.district,
                    ward: formData.ward
                  }}
                  onChange={handleLocationChange}
                  errors={{
                    province: errors.province,
                    district: errors.district,
                    ward: errors.ward
                  }}
                  disabled={saving}
                />
              </Grid>
            ) : (
              // International Format (City, State, ZIP, Country)
              <>
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
              </>
            )}

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