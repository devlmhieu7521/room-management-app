import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Tab,
  Tabs
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as LeaseIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import api from '../../utils/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tenant-tabpanel-${index}`}
      aria-labelledby={`tenant-tab-${index}`}
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

const TenantDetails = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchTenantDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tenants/${tenantId}`);

        if (response.data && response.data.tenant) {
          setTenant(response.data.tenant);
        } else {
          // If API doesn't return data, use mock data
          setMockTenant();
        }
      } catch (error) {
        console.error('Error fetching tenant details:', error);
        setError('Failed to load tenant details. Please try again later.');
        // Provide mock data for development
        setMockTenant();
      } finally {
        setLoading(false);
      }
    };

    fetchTenantDetails();
  }, [tenantId]);

  const setMockTenant = () => {
    // Mock tenant data for development
    const today = new Date();
    const oneYearFromNow = new Date(today);
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    setTenant({
      tenant_id: tenantId,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone_number: '(555) 123-4567',
      space_id: '1',
      space_title: 'Apartment 4B',
      space_address: '123 Main Street, San Francisco, CA 94105',
      start_date: '2024-01-15',
      end_date: oneYearFromNow.toISOString().split('T')[0],
      rent_amount: 2000,
      security_deposit: 4000,
      status: 'active',
      notes: 'Tenant works as a software engineer. Has one cat named Whiskers. Prefers communication via email.',
      created_at: '2024-01-10T00:00:00Z'
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusChange = async () => {
    if (!tenant) return;

    try {
      const newStatus = tenant.status === 'active' ? 'former' : 'active';

      await api.put(`/tenants/${tenantId}`, {
        status: newStatus
      });

      // Update local state
      setTenant({
        ...tenant,
        status: newStatus
      });

      setNotification({
        open: true,
        message: `Tenant status changed to ${newStatus}`,
        severity: 'success'
      });

      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating tenant status:', error);
      setNotification({
        open: true,
        message: 'Failed to update tenant status',
        severity: 'error'
      });
    }
  };

  const handleDeleteTenant = async () => {
    try {
      await api.delete(`/tenants/${tenantId}`);

      setNotification({
        open: true,
        message: 'Tenant removed successfully',
        severity: 'success'
      });

      // Redirect to tenants list after a delay
      setTimeout(() => {
        navigate('/tenants');
      }, 2000);
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setNotification({
        open: true,
        message: 'Failed to remove tenant',
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

  if (!tenant) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <Alert severity="info">Tenant not found</Alert>
      </Box>
    );
  }

  // Calculate dates and lease status
  const today = new Date();
  const endDate = new Date(tenant.end_date);
  const startDate = new Date(tenant.start_date);

  const daysUntilEnd = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
  const isEndingSoon = tenant.status === 'active' && daysUntilEnd <= 60 && daysUntilEnd > 0;
  const isOverdue = tenant.status === 'active' && daysUntilEnd < 0;
  const leaseLength = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)); // Approximate months

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" onClick={() => navigate('/tenants')}>
          Back to Tenants
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Tenant header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {tenant.first_name} {tenant.last_name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={tenant.status || 'active'}
                    color={tenant.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />

                  {isEndingSoon && (
                    <Chip
                      label={`Lease ending in ${daysUntilEnd} days`}
                      color="warning"
                      size="small"
                    />
                  )}

                  {isOverdue && (
                    <Chip
                      label={`Lease ended ${-daysUntilEnd} days ago`}
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color={tenant.status === 'active' ? "error" : "success"}
                  onClick={() => setStatusDialogOpen(true)}
                >
                  {tenant.status === 'active' ? 'Mark as Former' : 'Mark as Active'}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/tenants/${tenantId}/edit`)}
                >
                  Edit Tenant
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Tabs navigation */}
        <Grid item xs={12}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<PersonIcon />} label="Overview" />
              <Tab icon={<LeaseIcon />} label="Lease Details" />
              <Tab icon={<MoneyIcon />} label="Payments" />
            </Tabs>

            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Tenant Information
                  </Typography>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Full Name"
                          secondary={`${tenant.first_name} ${tenant.last_name}`}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Email Address"
                          secondary={tenant.email}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Phone Number"
                          secondary={tenant.phone_number || 'Not provided'}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <HomeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Space"
                          secondary={`${tenant.space_title}${tenant.space_address ? ` - ${tenant.space_address}` : ''}`}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <TimeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Tenant Since"
                          secondary={new Date(tenant.created_at).toLocaleDateString()}
                        />
                      </ListItem>
                    </List>
                  </Card>

                  {tenant.notes && (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Notes
                      </Typography>
                      <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <NotesIcon color="action" sx={{ mt: 0.5 }} />
                            <Typography variant="body1">
                              {tenant.notes}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Lease Summary
                  </Typography>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Status
                          </Typography>
                          <Typography variant="h6">
                            {tenant.status === 'active' ? 'Active' : 'Former'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Monthly Rent
                          </Typography>
                          <Typography variant="h6">
                            ${tenant.rent_amount?.toLocaleString() || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Start Date
                          </Typography>
                          <Typography variant="h6">
                            {new Date(tenant.start_date).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            End Date
                          </Typography>
                          <Typography variant="h6" color={isEndingSoon ? "warning.main" : isOverdue ? "error.main" : "text.primary"}>
                            {new Date(tenant.end_date).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      </Grid>

                      {isEndingSoon && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Lease ending in {daysUntilEnd} days
                        </Alert>
                      )}

                      {isOverdue && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          Lease expired {-daysUntilEnd} days ago
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/tenants/${tenantId}/edit`)}
                    >
                      Edit Tenant Details
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<LeaseIcon />}
                      onClick={() => setTabValue(1)}
                    >
                      Manage Lease
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<MoneyIcon />}
                      onClick={() => setTabValue(2)}
                    >
                      Record Payment
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Remove Tenant
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Lease Details Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Lease Information
                  </Typography>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <HomeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Property"
                          secondary={tenant.space_title}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <CalendarIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Lease Term"
                          secondary={`${new Date(tenant.start_date).toLocaleDateString()} to ${new Date(tenant.end_date).toLocaleDateString()} (${leaseLength} months)`}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <MoneyIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Monthly Rent"
                          secondary={`$${tenant.rent_amount?.toLocaleString() || 0}`}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <MoneyIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Security Deposit"
                          secondary={`$${tenant.security_deposit?.toLocaleString() || 0}`}
                        />
                      </ListItem>
                    </List>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Lease Actions
                  </Typography>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      {tenant.status === 'active' ? (
                        <>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mb: 2 }}
                            onClick={() => navigate(`/tenants/${tenantId}/renew`)}
                            disabled
                          >
                            Renew Lease
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={() => setStatusDialogOpen(true)}
                          >
                            Mark as Former Tenant
                          </Button>
                          <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                            * Lease renewal functionality will be available in a future update
                          </Typography>
                        </>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => setStatusDialogOpen(true)}
                        >
                          Reactivate Tenant
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Payments Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Payment Summary
                  </Typography>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Monthly Revenue
                          </Typography>
                          <Typography variant="h5">
                            ${tenant.rent_amount?.toLocaleString() || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Security Deposit
                          </Typography>
                          <Typography variant="h5">
                            ${tenant.security_deposit?.toLocaleString() || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total Expected
                          </Typography>
                          <Typography variant="h5">
                            ${((tenant.rent_amount || 0) * leaseLength).toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Payments Received
                          </Typography>
                          <Typography variant="h5">
                            $0
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Recent Transactions
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Transaction history will be available in future updates.
                  </Alert>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<MoneyIcon />}
                    sx={{ mt: 2 }}
                    disabled
                  >
                    Record New Payment
                  </Button>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      >
        <DialogTitle>
          {tenant.status === 'active' ? 'Mark as Former Tenant' : 'Reactivate Tenant'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tenant.status === 'active'
              ? 'This will mark the tenant as former and indicate they are no longer actively renting this space. Current lease information will be preserved for record-keeping purposes.'
              : 'This will reactivate the tenant and mark them as currently renting this space. The existing lease information will remain unchanged.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={tenant.status === 'active' ? "error" : "success"}
            onClick={handleStatusChange}
          >
            {tenant.status === 'active' ? 'Mark as Former' : 'Reactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Tenant Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove Tenant</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently remove {tenant.first_name} {tenant.last_name} from your records? This action cannot be undone, and all tenant information will be deleted.
            {tenant.status === 'active' && (
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold', color: 'error.main' }}>
                Warning: This tenant has an active lease ending {new Date(tenant.end_date).toLocaleDateString()}.
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteTenant}
          >
            Remove Tenant
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

export default TenantDetails;