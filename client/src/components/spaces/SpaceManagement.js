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
  Snackbar,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip
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
  ToggleOff as ToggleOffIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import apiService from '../../utils/api';

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

  // Tab state
  const [value, setValue] = useState(0);

  // Data states
  const [space, setSpace] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addTenantDialogOpen, setAddTenantDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // For simulating rental history based on tenant data
  const [rentalHistory, setRentalHistory] = useState([]);

  // Fetch space and tenant data
  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      // Check if we should force a refresh based on navigation state
      const forceRefresh = location.state && location.state.refreshData;

      // If we have space data in the location state and don't need to refresh, use it
      if (location.state && location.state.spaceData && !showRefreshing && !forceRefresh) {
        setSpace(location.state.spaceData);
        console.log('Using space data from navigation state');
      } else {
        // Otherwise fetch from API
        try {
          console.log('Fetching space from API...');
          const response = await apiService.spaces.getById(spaceId);
          console.log('Space API response:', response.data);

          if (response.data && response.data.space) {
            setSpace(response.data.space);
            console.log('Space data loaded from API');
          } else {
            setError('Could not load space details');
          }
        } catch (error) {
          console.error('Error fetching space details:', error);
          setError('Failed to load space details. Please try again later.');
        }
      }

      // Fetch tenants for this space
      try {
        const tenantResponse = await apiService.tenants.getBySpace(spaceId);
        if (tenantResponse.data && tenantResponse.data.tenants) {
          setTenants(tenantResponse.data.tenants);
          console.log('Tenant data loaded:', tenantResponse.data.tenants.length);

          // Generate sample rental history based on tenants
          generateRentalHistory(tenantResponse.data.tenants);
        } else {
          // If no tenants found, set empty array
          setTenants([]);
          setRentalHistory([]);
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
        // Set empty array if there's an error
        setTenants([]);
        setRentalHistory([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);

      // Clear the navigation state after using it to prevent stale data on future navigations
      if (location.state) {
        window.history.replaceState({}, document.title);
      }
    }
  };

  // Generate rental history from tenant data
  const generateRentalHistory = (tenantsList) => {
    if (!tenantsList || tenantsList.length === 0) {
      setRentalHistory([]);
      return;
    }

    // Create rental history entries based on tenant data
    const history = [];
    const today = new Date();

    // Add rent payments for last few months
    tenantsList.forEach(tenant => {
      if (tenant.is_deleted) return;

      // Add payment records for the last 3 months
      for (let i = 0; i < 3; i++) {
        const paymentDate = new Date();
        paymentDate.setMonth(today.getMonth() - i);
        paymentDate.setDate(1); // Payment on the 1st

        history.push({
          tenant_id: tenant.tenant_id,
          tenant_name: `${tenant.first_name} ${tenant.last_name}`,
          type: 'payment',
          amount: tenant.rent_amount || 0,
          date: paymentDate,
          status: 'completed'
        });
      }

      // Add lease start entry
      const startDate = new Date(tenant.start_date);
      history.push({
        tenant_id: tenant.tenant_id,
        tenant_name: `${tenant.first_name} ${tenant.last_name}`,
        type: 'lease_start',
        date: startDate,
        details: `Lease started with ${tenant.rent_amount ? '$' + tenant.rent_amount : '$0'} monthly rent`
      });
    });

    // Sort by date, most recent first
    history.sort((a, b) => b.date - a.date);

    setRentalHistory(history);
  };

  useEffect(() => {
    fetchData();
  }, [spaceId, location.state]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = !space.is_active;

      // Update space status via API
      const response = await apiService.spaces.update(spaceId, { is_active: newStatus });

      if (response.data && response.data.space) {
        // Update local state
        setSpace({
          ...space,
          is_active: newStatus
        });

        setNotification({
          open: true,
          message: `Space ${newStatus ? 'activated' : 'deactivated'} successfully`,
          severity: 'success'
        });
      } else {
        throw new Error('Failed to update space status');
      }

      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating space status:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to update space status',
        severity: 'error'
      });
    }
  };

  const handleDeleteSpace = async () => {
    try {
      // Check if space has active tenants
      const activeTenantsCount = tenants.filter(tenant => !tenant.is_deleted).length;

      if (activeTenantsCount > 0) {
        setNotification({
          open: true,
          message: `Cannot delete space with ${activeTenantsCount} active tenant(s). Please remove tenants first.`,
          severity: 'error'
        });
        setDeleteDialogOpen(false);
        return;
      }

      // Delete space via API
      await apiService.spaces.delete(spaceId);

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
        message: error.message || 'Failed to delete space',
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

  // Filter tenants based on search query
  const filteredTenants = tenants.filter(tenant => {
    if (searchQuery.trim() === '') return true;

    const query = searchQuery.toLowerCase();
    const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();

    return fullName.includes(query) ||
           (tenant.email && tenant.email.toLowerCase().includes(query)) ||
           (tenant.phone_number && tenant.phone_number.toLowerCase().includes(query));
  });

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
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
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

  // We only show non-deleted tenants, so the tenant count is simply the length
  const tenantCount = tenants.filter(t => !t.is_deleted).length;

  // Calculate occupancy rate
  const occupancyRate = space.capacity > 0 ? Math.round((tenantCount / space.capacity) * 100) : 0;

  // Calculate monthly revenue
  const monthlyRevenue = tenants
    .filter(t => !t.is_deleted)
    .reduce((sum, tenant) => sum + (tenant.rent_amount || 0), 0);

  // Calculate utility costs (mock data for demo)
  const utilityCosts = monthlyRevenue * 0.15; // 15% of revenue for demo

  // Calculate net income
  const netIncome = monthlyRevenue - utilityCosts;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outlined" onClick={() => navigate('/my-spaces')}>
          Back to My Spaces
        </Button>

        <Tooltip title="Refresh data">
          <IconButton
            onClick={handleRefresh}
            color="primary"
            disabled={refreshing}
          >
            {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
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
              <Tab icon={<PeopleIcon />} label={`Tenants (${tenantCount})`} />
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

                  {tenantCount > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Recent Activity
                      </Typography>
                      <Card variant="outlined">
                        <List sx={{ width: '100%' }}>
                          {rentalHistory.slice(0, 5).map((event, index) => (
                            <React.Fragment key={index}>
                              <ListItem alignItems="flex-start">
                                <ListItemIcon>
                                  {event.type === 'payment' ? <MoneyIcon color="primary" /> : <EventIcon color="secondary" />}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    event.type === 'payment'
                                      ? `Rent payment of $${event.amount}`
                                      : event.details
                                  }
                                  secondary={
                                    <>
                                      {event.tenant_name} • {event.date.toLocaleDateString()}
                                      {event.type === 'payment' && event.status && (
                                        <Chip
                                          size="small"
                                          label={event.status}
                                          color={event.status === 'completed' ? 'success' : 'warning'}
                                          sx={{ ml: 1 }}
                                        />
                                      )}
                                    </>
                                  }
                                />
                              </ListItem>
                              {index < rentalHistory.slice(0, 5).length - 1 && (
                                <Divider variant="inset" component="li" />
                              )}
                            </React.Fragment>
                          ))}
                        </List>
                      </Card>
                    </>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Quick Statistics
                  </Typography>
                  <Card sx={{ mb: 3 }}>
                    <List sx={{ width: '100%' }}>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Tenants"
                          secondary={tenantCount || 0}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <EventIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Occupancy Rate"
                          secondary={`${occupancyRate}%`}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <MoneyIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Monthly Revenue"
                          secondary={`$${monthlyRevenue.toLocaleString()}`}
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
                  Tenants ({tenantCount}/{space.capacity})
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PersonAddIcon />}
                  onClick={() => navigate(`/tenants/add`, { state: { defaultSpaceId: spaceId } })}
                >
                  Add Tenant
                </Button>
              </Box>

              {/* Search box */}
              {tenants.length > 0 && (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

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
                    {filteredTenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          {searchQuery ? (
                            <Typography variant="body1" sx={{ py: 3 }}>
                              No tenants match your search criteria. Try a different search or <Button onClick={() => setSearchQuery('')}>clear the search</Button>
                            </Typography>
                          ) : (
                            <Box sx={{ py: 3 }}>
                              <Typography variant="body1" gutterBottom>
                                No tenants found. Add your first tenant to get started.
                              </Typography>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PersonAddIcon />}
                                onClick={() => navigate(`/tenants/add`, { state: { defaultSpaceId: spaceId } })}
                                sx={{ mt: 1 }}
                              >
                                Add Tenant
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTenants.map((tenant) => {
                        if (tenant.is_deleted) return null;

                        // Calculate if lease is ending soon
                        const today = new Date();
                        const endDate = new Date(tenant.end_date);
                        const daysUntilEnd = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
                        const isEndingSoon = daysUntilEnd <= 30 && daysUntilEnd > 0;
                        const isOverdue = daysUntilEnd < 0;

                        return (
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
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2">
                                  {new Date(tenant.start_date).toLocaleDateString()} to {new Date(tenant.end_date).toLocaleDateString()}
                                </Typography>
                                {isEndingSoon && (
                                  <Typography variant="caption" color="warning.main">
                                    Ending in {daysUntilEnd} days
                                  </Typography>
                                )}
                                {isOverdue && (
                                  <Typography variant="caption" color="error.main">
                                    Ended {-daysUntilEnd} days ago
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>${tenant.rent_amount?.toLocaleString() || 0}</TableCell>
                            <TableCell>
                              <Chip
                                label={isOverdue ? 'Lease Expired' : 'Active'}
                                color={isOverdue ? 'error' : 'success'}
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
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Finances Tab */}
            <TabPanel value={value} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Financial Overview
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                      <Card sx={{ height: '100%' }} variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            Monthly Revenue
                          </Typography>
                          <Typography variant="h4" color="primary" gutterBottom>
                            ${monthlyRevenue.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            From {tenantCount} active tenant{tenantCount !== 1 ? 's' : ''}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Card sx={{ height: '100%' }} variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            Expenses
                          </Typography>
                          <Typography variant="h4" color="error" gutterBottom>
                            ${utilityCosts.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Estimated utilities & maintenance
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Card sx={{ height: '100%' }} variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            Net Income
                          </Typography>
                          <Typography variant="h4" color={netIncome >= 0 ? "success.main" : "error"} gutterBottom>
                            ${netIncome.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Monthly profit
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" gutterBottom>
                    Recent Transactions
                  </Typography>

                  {rentalHistory.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Tenant</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rentalHistory.filter(event => event.type === 'payment').slice(0, 10).map((transaction, index) => (
                            <TableRow key={index}>
                              <TableCell>{transaction.date.toLocaleDateString()}</TableCell>
                              <TableCell>{transaction.tenant_name}</TableCell>
                              <TableCell>Monthly Rent</TableCell>
                              <TableCell align="right">${transaction.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={transaction.status}
                                  color={transaction.status === 'completed' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">
                      No transaction history available. Add tenants to start tracking financial activity.
                    </Alert>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Financial Actions
                  </Typography>

                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Record Transactions
                      </Typography>
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 1 }}
                        startIcon={<MoneyIcon />}
                        onClick={() => navigate('/payments/record', { state: { spaceId: spaceId }})}
                        disabled
                      >
                        Record Payment
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 1 }}
                        disabled
                      >
                        Record Expense
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        These features will be available in future updates
                      </Typography>
                    </CardContent>
                  </Card>

                  <Typography variant="h6" gutterBottom>
                    Financial Reports
                  </Typography>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button variant="outlined" disabled>Monthly Report</Button>
                        <Button variant="outlined" disabled>Annual Summary</Button>
                        <Button variant="outlined" disabled>Tax Statement</Button>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          Financial reporting will be available in future updates
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Settings Tab */}
            <TabPanel value={value} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Space Settings
                  </Typography>

                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Space Visibility
                      </Typography>
                      <Typography variant="body2" paragraph>
                        When a space is active, it is visible in your dashboard and can accept new tenants.
                        Deactivating a space will hide it from new tenant assignments but will not affect existing tenants.
                      </Typography>
                      <Button
                        variant="outlined"
                        color={space.is_active ? "error" : "success"}
                        startIcon={space.is_active ? <ToggleOffIcon /> : <ToggleOnIcon />}
                        onClick={() => setStatusDialogOpen(true)}
                      >
                        {space.is_active ? 'Deactivate Space' : 'Activate Space'}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Maintenance Schedule
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Configure routine maintenance schedules and service provider information.
                      </Typography>
                      <Button
                        variant="outlined"
                        disabled
                      >
                        Set Up Maintenance Schedule
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        This feature will be available in a future update
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Space Deletion
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Permanently delete this space and all associated data. This action cannot be undone.
                      </Typography>
                      <Typography variant="body2" color="error" paragraph>
                        Note: You cannot delete a space that has active tenants.
                      </Typography>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={tenantCount > 0}
                      >
                        Delete Space
                      </Button>
                      {tenantCount > 0 && (
                        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                          Remove all tenants before deleting this space
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>

                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/spaces/${spaceId}/edit`, { state: { spaceData: space } })}
                        >
                          Edit Space Details
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<PeopleIcon />}
                          onClick={() => setValue(1)} // Switch to tenants tab
                        >
                          Manage Tenants
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<MoneyIcon />}
                          onClick={() => setValue(2)} // Switch to finances tab
                        >
                          Financial Overview
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>

                  <Typography variant="h6" gutterBottom>
                    Space Information
                  </Typography>

                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Space ID
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {spaceId}
                      </Typography>

                      <Typography variant="subtitle2" color="text.secondary">
                        Created On
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {new Date(space.created_at).toLocaleDateString()}
                      </Typography>

                      <Typography variant="subtitle2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {new Date(space.updated_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
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
              ? 'Deactivating this space will hide it from listings and prevent new bookings. Existing tenants will not be affected.'
              : 'Activating this space will make it visible in listings and allow new bookings.'}
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
            Are you sure you want to delete "{space.title}"? This action cannot be undone and will remove all associated records.
            {tenantCount > 0 && (
              <Box component="span" fontWeight="bold" sx={{ display: 'block', mt: 1, color: 'error.main' }}>
                Warning: This space has {tenantCount} active tenant(s). You must remove all tenants before deleting this space.
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
            disabled={tenantCount > 0}
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