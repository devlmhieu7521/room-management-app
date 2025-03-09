import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  Snackbar,
  Divider,
  IconButton,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent
} from '@mui/material';
import {
  Person as PersonIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Save as SaveIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import apiService from '../../utils/api';

const AddTenant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { spaceId: urlSpaceId } = useParams(); // Optional: Get spaceId from URL if present

  // Active step for stepper
  const [activeStep, setActiveStep] = useState(0);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [spacesLoading, setSpacesLoading] = useState(true);

  // Error and notification states
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Spaces data
  const [spaces, setSpaces] = useState([]);

  // Format today's date for default values
  const today = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Set initial state - check if we have a default space ID from the location state or URL
  const defaultSpaceId = urlSpaceId || (location.state?.defaultSpaceId || '');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    space_id: defaultSpaceId,
    start_date: formatDateForInput(today),
    end_date: formatDateForInput(oneYearFromNow),
    rent_amount: '',
    security_deposit: '',
    notes: ''
  });

  // Fetch spaces for dropdown
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setSpacesLoading(true);
        const response = await apiService.spaces.getMySpaces();

        if (response.data && response.data.spaces) {
          // Filter to only active spaces
          const activeSpaces = response.data.spaces.filter(space => space.is_active);
          setSpaces(activeSpaces);

          // If we have spaces but no default space is selected, select the first one
          if (activeSpaces.length > 0 && !formData.space_id) {
            setFormData(prev => ({
              ...prev,
              space_id: activeSpaces[0].space_id
            }));
          }

          // If no active spaces are available
          if (activeSpaces.length === 0) {
            setError('No active spaces available. Please create or activate a space first.');
          }
        } else {
          setError('No spaces available. Please create a space first.');
        }
      } catch (error) {
        console.error('Error fetching spaces:', error);
        setError(apiService.handleError(error, 'Failed to load spaces. Please try again later.'));
      } finally {
        setSpacesLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear any error for this field
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

  // Validate the current step
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Tenant Information
        if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
        if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Enter a valid email address';
        if (formData.phone_number && !/^\d{10}$/.test(formData.phone_number.replace(/\D/g, ''))) {
          newErrors.phone_number = 'Enter a valid 10-digit phone number';
        }
        break;

      case 1: // Space and Lease Information
        if (!formData.space_id) newErrors.space_id = 'Please select a space';
        if (!formData.start_date) newErrors.start_date = 'Start date is required';
        if (!formData.end_date) newErrors.end_date = 'End date is required';
        else {
          const startDate = new Date(formData.start_date);
          const endDate = new Date(formData.end_date);
          if (endDate <= startDate) newErrors.end_date = 'End date must be after start date';
        }
        break;

      case 2: // Financial Information
        if (formData.rent_amount && (isNaN(parseFloat(formData.rent_amount)) || parseFloat(formData.rent_amount) < 0)) {
          newErrors.rent_amount = 'Rent amount must be a positive number';
        }
        if (formData.security_deposit && (isNaN(parseFloat(formData.security_deposit)) || parseFloat(formData.security_deposit) < 0)) {
          newErrors.security_deposit = 'Security deposit must be a positive number';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    } else {
      setNotification({
        open: true,
        message: 'Please fix the errors before proceeding.',
        severity: 'error'
      });
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation check
    if (!validateStep(activeStep)) {
      setNotification({
        open: true,
        message: 'Please fix the errors before submitting.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Process numeric values to ensure they're numbers
      const processedData = {
        ...formData,
        rent_amount: formData.rent_amount ? Number(formData.rent_amount) : 0,
        security_deposit: formData.security_deposit ? Number(formData.security_deposit) : 0,
        phone_number: formData.phone_number ? formData.phone_number.replace(/\D/g, '') : ''
      };

      // Submit the form
      const response = await apiService.tenants.create(processedData);

      if (response.data && response.data.tenant) {
        setNotification({
          open: true,
          message: 'Tenant added successfully!',
          severity: 'success'
        });

        // Navigate to the tenant details page after a delay
        setTimeout(() => {
          if (urlSpaceId || defaultSpaceId) {
            // If we came from a space page, return to that space's management
            navigate(`/spaces/${urlSpaceId || defaultSpaceId}/manage`, {
              state: { refreshTenants: true }
            });
          } else {
            // Otherwise go to the tenant details
            navigate(`/tenants/${response.data.tenant.tenant_id}`);
          }
        }, 1500);
      } else {
        throw new Error('Failed to add tenant. Please try again.');
      }
    } catch (error) {
      console.error('Error adding tenant:', error);
      setError(apiService.handleError(error, 'Failed to add tenant. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Get title of currently selected space
  const getSelectedSpaceTitle = () => {
    if (!formData.space_id || !spaces.length) return 'No space selected';
    const selectedSpace = spaces.find(space => space.space_id === formData.space_id);
    return selectedSpace ? selectedSpace.title : 'Unknown space';
  };

  // Steps for stepper
  const steps = [
    'Tenant Information',
    'Space & Lease Details',
    'Financial Information',
    'Review & Confirm'
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => navigate(defaultSpaceId ? `/spaces/${defaultSpaceId}/manage` : '/tenants')}
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Add New Tenant
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Step 1: Tenant Information */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Tenant Personal Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
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
                  error={!!errors.last_name}
                  helperText={errors.last_name}
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
                  error={!!errors.email}
                  helperText={errors.email || "Used for notifications and communication"}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  error={!!errors.phone_number}
                  helperText={errors.phone_number || "Format: (123) 456-7890"}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">📞</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          )}

          {/* Step 2: Space and Lease Information */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HomeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Space & Lease Details
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth required error={!!errors.space_id}>
                  <InputLabel>Space</InputLabel>
                  <Select
                    name="space_id"
                    value={formData.space_id}
                    onChange={handleChange}
                    label="Space"
                    disabled={spacesLoading || defaultSpaceId !== ''}
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
                  {errors.space_id && <FormHelperText>{errors.space_id}</FormHelperText>}
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
                  error={!!errors.start_date}
                  helperText={errors.start_date}
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
                  error={!!errors.end_date}
                  helperText={errors.end_date}
                />
              </Grid>
            </Grid>
          )}

          {/* Step 3: Financial Information */}
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MoneyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Financial Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
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
                  error={!!errors.rent_amount}
                  helperText={errors.rent_amount || "Leave empty if not applicable"}
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
                  error={!!errors.security_deposit}
                  helperText={errors.security_deposit || "Leave empty if not applicable"}
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
                  error={!!errors.notes}
                  helperText={errors.notes || "Additional notes about this tenant (optional)"}
                />
              </Grid>
            </Grid>
          )}

          {/* Step 4: Review and Submit */}
          {activeStep === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Review Tenant Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Please review the information below before adding the tenant.
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Tenant Details
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Name:</strong> {formData.first_name} {formData.last_name}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Email:</strong> {formData.email}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Phone:</strong> {formData.phone_number || 'Not provided'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Space & Lease
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Space:</strong> {getSelectedSpaceTitle()}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Lease Period:</strong> {new Date(formData.start_date).toLocaleDateString()} to {new Date(formData.end_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Duration:</strong> {Math.round((new Date(formData.end_date) - new Date(formData.start_date)) / (1000 * 60 * 60 * 24 * 30))} months
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Financial Information
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Monthly Rent:</strong> ${formData.rent_amount || '0'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Security Deposit:</strong> ${formData.security_deposit || '0'}
                    </Typography>
                    {formData.notes && (
                      <>
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                          Notes
                        </Typography>
                        <Typography variant="body2">
                          {formData.notes}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={activeStep === 0
                ? () => navigate(defaultSpaceId ? `/spaces/${defaultSpaceId}/manage` : '/tenants')
                : handleBack
              }
              startIcon={<NavigateBeforeIcon />}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || spaces.length === 0}
                startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
              >
                {loading ? 'Adding...' : 'Add Tenant'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={spaces.length === 0}
                endIcon={<NavigateNextIcon />}
              >
                Next
              </Button>
            )}
          </Box>
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

export default AddTenant;