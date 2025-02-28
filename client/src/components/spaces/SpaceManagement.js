import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar
} from '@mui/material';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material';
import api from '../../utils/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`space-tabpanel-${index}`}
      aria-labelledby={`space-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SpaceManagement = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [value, setValue] = useState(0);
  const [space, setSpace] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Get space data - try to get it from location state first, then fetch from API
  useEffect(() => {
    const fetchSpaceData = async () => {
      try {
        setLoading(true);

        // If we have space data in the location state, use it
        if (location.state && location.state.spaceData) {
          console.log("Using space data from location state:", location.state.spaceData);
          setSpace(location.state.spaceData);

          // For tenants, still use mock data for now
          setMockTenants();
        } else {
          // Otherwise try to fetch from API
          try {
            const response = await api.get(`/spaces/${spaceId}`);
            if (response.data && response.data.space) {
              setSpace(response.data.space);
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
        setLoading(false);
      }
    };

    fetchSpaceData();
  }, [spaceId, location.state]);

  const setMockData = () => {
    // Mock space data for testing
    console.log("Setting mock space data for ID:", spaceId);

    setSpace({
      space_id: spaceId,
      title: 'Modern Downtown Apartment',
      description: 'Stylish apartment in the heart of downtown with great amenities.',
      space_type: 'Apartment',
      capacity: 2,
      street_address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      country: 'USA',
      is_active: true,
      created_at: '2024-01-15T00:00:00Z'
    });

    // Set mock tenants data too
    setMockTenants();
  };

  const setMockTenants = () => {
    // Mock tenants data
    setTenants([
      {
        tenant_id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '(555) 123-4567',
        start_date: '2024-01-15',
        end_date: '2025-01-14',
        rent_amount: 2000,
        status: 'active'
      }
    ]);
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = !space.is_active;

      // In a real app, you'd call the API here
      // await api.put(`/spaces/${spaceId}`, { is_active: newStatus });

      // But for now, just update the local state
      setSpace({
        ...space,
        is_active: newStatus
      });

      setNotification({
        open: true,
        message: `Space ${space.is_active ? 'deactivated' : 'activated'} successfully`,
        severity: 'success'
      });

      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating space status:', error);
      setNotification({
        open: true,
        message: 'Failed to update space status',
        severity: 'error'
      });
    }
  };

  const handleDeleteSpace = async () => {
    try {
      // In a real app, you'd call the API here
      // await api.delete(`/spaces/${spaceId}`);

      setNotification({
        open: true,
        message: 'Space deleted successfully',
        severity: 'success'
      });

      // Redirect to my spaces after a delay
      setTimeout(() => {
        navigate('/my-spaces');
      }, 2000);
    } catch (error) {
      console.error('Error deleting space:', error);
      setNotification({
        open: true,
        message: 'Failed to delete space',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" onClick={() => navigate('/my-spaces')}>
          Back to My Spaces
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Space header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {space.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {space.street_address}, {space.city}, {space.state} {space.zip_code}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip label={space.space_type} color="primary" size="small" />
                  <Chip label={`Capacity: ${space.capacity}`} size="small" />
                  <Chip
                    label={space.is_active ? 'Active' : 'Inactive'}
                    color={space.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color={space.is_active ? "error" : "success"}
                  startIcon={space.is_active ? <ToggleOffIcon /> : <ToggleOnIcon />}
                  onClick={() => setStatusDialogOpen(true)}
                >
                  {space.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/spaces/${spaceId}/edit`, { state: { spaceData: space } })}
                >
                  Edit Space
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Tabs navigation */}
        <Grid item xs={12}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={value}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<HomeIcon />} label="Overview" />
              <Tab icon={<PeopleIcon />} label="Tenants" />
              <Tab icon={<MoneyIcon />} label="Finances" />
              <Tab icon={<SettingsIcon />} label="Settings" />
            </Tabs>

            {/* Overview Tab */}
            <TabPanel value={value} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Space Details
                  </Typography>
                  <Typography paragraph>
                    {space.description || 'No description provided.'}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Space Type
                          </Typography>
                          <Typography variant="body1">
                            {space.space_type}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Capacity
                          </Typography>
                          <Typography variant="body1">
                            {space.capacity} {space.capacity === 1 ? 'person' : 'people'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Status
                          </Typography>
                          <Typography variant="body1">
                            {space.is_active ? 'Active' : 'Inactive'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Listed Since
                          </Typography>
                          <Typography variant="body1">
                            {new Date(space.created_at).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" gutterBottom>
                    Location
                  </Typography>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="body1">
                        {space.street_address}
                      </Typography>
                      <Typography variant="body1">
                        {space.city}, {space.state} {space.zip_code}
                      </Typography>
                      <Typography variant="body1">
                        {space.country}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Quick Statistics
                  </Typography>
                  <Card sx={{ mb: 3 }}>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Current Tenants"
                          secondary={tenants.filter(t => t.status === 'active').length || 0}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <EventIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Occupancy Rate"
                          secondary={space.capacity > 0 ? `${Math.round((tenants.filter(t => t.status === 'active').length / space.capacity) * 100)}%` : '0%'}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <MoneyIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Monthly Revenue"
                          secondary={`$${tenants.filter(t => t.status === 'active').reduce((sum, tenant) => sum + (tenant.rent_amount || 0), 0).toLocaleString()}`}
                        />
                      </ListItem>
                    </List>
                  </Card>

                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PeopleIcon />}
                      onClick={() => navigate(`/tenants/add`, { state: { defaultSpaceId: spaceId } })}
                    >
                      Add Tenant
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/spaces/${spaceId}/edit`, { state: { spaceData: space } })}
                    >
                      Edit Space Details
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Delete Space
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Tenants Tab */}
            <TabPanel value={value} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Tenants
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate(`/tenants/add`, { state: { defaultSpaceId: spaceId } })}
                >
                  Add Tenant
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Lease Period</TableCell>
                      <TableCell>Rent</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No tenants found. Add your first tenant to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenants.map((tenant) => (
                        <TableRow key={tenant.tenant_id}>
                          <TableCell>
                            {tenant.first_name} {tenant.last_name}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{tenant.email}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {tenant.phone_number}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {new Date(tenant.start_date).toLocaleDateString()} to {new Date(tenant.end_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>${tenant.rent_amount?.toLocaleString() || 0}</TableCell>
                          <TableCell>
                            <Chip
                              label={tenant.status || 'active'}
                              color={tenant.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/tenants/${tenant.tenant_id}`)}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Finances Tab */}
            <TabPanel value={value} index={2}>
              <Typography variant="h6" gutterBottom>
                Financial Overview
              </Typography>
              <Typography paragraph>
                Financial management features will be implemented in future updates.
              </Typography>
            </TabPanel>

            {/* Settings Tab */}
            <TabPanel value={value} index={3}>
              <Typography variant="h6" gutterBottom>
                Space Settings
              </Typography>
              <Typography paragraph>
                Space settings and configuration options will be implemented in future updates.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/spaces/${spaceId}/edit`, { state: { spaceData: space } })}
              >
                Edit Space Details
              </Button>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Status Toggle Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      >
        <DialogTitle>
          {space.is_active ? 'Deactivate Space' : 'Activate Space'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {space.is_active
              ? 'Deactivating this space will hide it from searches and prevent new bookings. Current tenants will not be affected.'
              : 'Activating this space will make it available for searches and allow new bookings.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={space.is_active ? "error" : "success"}
            onClick={handleToggleStatus}
          >
            {space.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Space Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Space</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{space.title}"? This action cannot be undone and will remove all associated tenant records.
            {tenants.filter(t => t.status === 'active').length > 0 && (
              <Box component="span" fontWeight="bold" sx={{ display: 'block', mt: 1, color: 'error.main' }}>
                Warning: This space has {tenants.filter(t => t.status === 'active').length} active tenant(s).
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSpace}
          >
            Delete Space
          </Button>
        </DialogActions>
      </Dialog>

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

export default SpaceManagement;