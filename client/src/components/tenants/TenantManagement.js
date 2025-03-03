import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import apiService from '../../utils/api';

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

const TenantManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    total_tenants: 0,
    active_tenants: 0,
    total_monthly_rent: 0,
    leases_ending_soon: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch tenants data
        try {
          const tenantsResponse = await apiService.tenants.getAll();
          if (tenantsResponse.data && tenantsResponse.data.tenants) {
            setTenants(tenantsResponse.data.tenants);
          }
        } catch (error) {
          console.error('Error fetching tenants:', error);
          setError('Failed to load tenant data. Please try again.');
        }

        // Fetch tenant metrics
        try {
          const metricsResponse = await apiService.tenants.getMetrics();
          if (metricsResponse.data && metricsResponse.data.metrics) {
            setMetrics(metricsResponse.data.metrics);
          } else {
            // If metrics aren't available, calculate from tenants
            calculateMetricsFromTenants(tenants);
          }
        } catch (error) {
          console.error('Error fetching tenant metrics:', error);
          // If metrics API fails, calculate from tenants
          calculateMetricsFromTenants(tenants);
        }

        // Fetch spaces data
        try {
          const spacesResponse = await apiService.spaces.getMySpaces();
          if (spacesResponse.data && spacesResponse.data.spaces) {
            setSpaces(spacesResponse.data.spaces);
          }
        } catch (error) {
          console.error('Error fetching spaces:', error);
        }

      } catch (error) {
        console.error('Error setting up tenant management:', error);
        setError('Failed to load tenant management data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics from tenants array if API doesn't provide them
  const calculateMetricsFromTenants = (tenantsList) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const activeTenants = tenantsList.filter(t => t.status === 'active');
    const leasesEndingSoon = activeTenants.filter(tenant => {
      const endDate = new Date(tenant.end_date);
      return endDate <= thirtyDaysFromNow && endDate >= today;
    });

    setMetrics({
      total_tenants: tenantsList.length,
      active_tenants: activeTenants.length,
      total_monthly_rent: activeTenants.reduce((sum, tenant) => sum + (tenant.rent_amount || 0), 0),
      leases_ending_soon: leasesEndingSoon.length
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  // Helper functions for tenant analysis
  const getActiveTenants = () => tenants.filter(t => t.status === 'active');
  const getFormerTenants = () => tenants.filter(t => t.status !== 'active');
  const getTenantsWithLeaseEnding = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return getActiveTenants().filter(tenant => {
      const endDate = new Date(tenant.end_date);
      return endDate <= thirtyDaysFromNow && endDate >= today;
    });
  };
  const getTenantsWithOverdueRent = () =>
    getActiveTenants().filter(t => t.rent_status === 'overdue');

  const getTotalMonthlyRent = () =>
    getActiveTenants().reduce((sum, tenant) => sum + (tenant.rent_amount || 0), 0);

  // Filter tenants based on active tab and search query
  const getFilteredTenants = () => {
    let filtered = [];

    // First filter by tab
    switch(tabValue) {
      case 0: // All Tenants
        filtered = tenants;
        break;
      case 1: // Active Tenants
        filtered = getActiveTenants();
        break;
      case 2: // Leases Ending Soon
        filtered = getTenantsWithLeaseEnding();
        break;
      case 3: // Rent Issues
        filtered = getTenantsWithOverdueRent();
        break;
      default:
        filtered = tenants;
    }

    // Then filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tenant => {
        const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
        return fullName.includes(query) ||
               tenant.email.toLowerCase().includes(query) ||
               tenant.space_title.toLowerCase().includes(query) ||
               (tenant.phone_number && tenant.phone_number.includes(query));
      });
    }

    return filtered;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tenant Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/tenants/add')}
        >
          Add New Tenant
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Tenants
              </Typography>
              <Typography variant="h3" component="div" color="primary">
                {metrics.active_tenants}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                across {spaces.length} properties
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Revenue
              </Typography>
              <Typography variant="h3" component="div" color="primary">
                ${metrics.total_monthly_rent?.toLocaleString() || getTotalMonthlyRent().toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                from active leases
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Leases Ending Soon
              </Typography>
              <Typography variant="h3" component="div" color={metrics.leases_ending_soon > 0 ? "warning.main" : "primary"}>
                {metrics.leases_ending_soon || getTenantsWithLeaseEnding().length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                in the next 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overdue Payments
              </Typography>
              <Typography variant="h3" component="div" color={getTenantsWithOverdueRent().length > 0 ? "error.main" : "primary"}>
                {getTenantsWithOverdueRent().length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                need attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Tenant List Section */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab icon={<PeopleIcon />} label={`All Tenants (${tenants.length})`} />
                <Tab icon={<PeopleIcon />} label={`Active (${getActiveTenants().length})`} />
                <Tab icon={<EventIcon />} label={`Leases Ending (${getTenantsWithLeaseEnding().length})`} />
                <Tab icon={<WarningIcon />} label={`Rent Issues (${getTenantsWithOverdueRent().length})`} />
              </Tabs>
            </Box>

            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder="Search tenants by name, email, phone or property..."
                value={searchQuery}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tenant</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Property</TableCell>
                      <TableCell>Lease Period</TableCell>
                      <TableCell>Monthly Rent</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredTenants().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box sx={{ py: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              No tenants found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {searchQuery ? 'Try adjusting your search terms' : 'Add your first tenant to get started'}
                            </Typography>
                            {!searchQuery && (
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PersonAddIcon />}
                                onClick={() => navigate('/tenants/add')}
                              >
                                Add New Tenant
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredTenants().map((tenant) => {
                        // Calculate if lease is ending soon
                        const today = new Date();
                        const endDate = new Date(tenant.end_date);
                        const daysUntilEnd = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
                        const isEndingSoon = tenant.status === 'active' && daysUntilEnd <= 30 && daysUntilEnd > 0;
                        const isOverdue = tenant.status === 'active' && daysUntilEnd < 0;

                        return (
                          <TableRow key={tenant.tenant_id}>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {tenant.first_name} {tenant.last_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <MailIcon fontSize="small" color="action" />
                                <Typography variant="body2">{tenant.email}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {tenant.phone_number}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {tenant.space_title}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AssignmentIcon fontSize="small" color={isEndingSoon ? "warning" : isOverdue ? "error" : "action"} />
                                <Box>
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
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MoneyIcon fontSize="small" color={tenant.rent_status === 'overdue' ? "error" : "action"} />
                                <Box>
                                  <Typography variant="body2">
                                    ${tenant.rent_amount?.toLocaleString() || 0}
                                  </Typography>
                                  {tenant.rent_status === 'overdue' && (
                                    <Typography variant="caption" color="error.main">
                                      Payment overdue
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
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
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TenantManagement;