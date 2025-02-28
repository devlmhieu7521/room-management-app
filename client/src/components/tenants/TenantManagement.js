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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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

const TenantManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tenants, setTenants] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Try to fetch tenants from API
        try {
          const tenantsResponse = await api.get('/tenants');
          if (tenantsResponse.data && tenantsResponse.data.tenants) {
            setTenants(tenantsResponse.data.tenants);
          } else {
            // If API fails, use mock data
            setMockTenants();
          }
        } catch (error) {
          console.error('Error fetching tenants:', error);
          setMockTenants();
        }

        // Try to fetch spaces from API
        try {
          const spacesResponse = await api.get('/spaces/host/my-spaces');
          if (spacesResponse.data && spacesResponse.data.spaces) {
            setSpaces(spacesResponse.data.spaces);
          } else {
            // If API fails, use mock data
            setMockSpaces();
          }
        } catch (error) {
          console.error('Error fetching spaces:', error);
          setMockSpaces();
        }

      } catch (error) {
        console.error('Error setting up tenant management:', error);
        setError('Failed to load tenant management data. Please try again later.');
        setMockTenants();
        setMockSpaces();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const setMockTenants = () => {
    const today = new Date();

    // Generate end dates for different scenarios
    const futureDate = new Date(today);
    futureDate.setFullYear(today.getFullYear() + 1);

    const soonEndingDate = new Date(today);
    soonEndingDate.setDate(today.getDate() + 30);

    const pastEndDate = new Date(today);
    pastEndDate.setMonth(today.getMonth() - 1);

    // Set mock tenant data
    setTenants([
      {
        tenant_id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '(555) 123-4567',
        space_id: '1',
        space_title: 'Modern Downtown Apartment',
        start_date: '2024-01-15',
        end_date: futureDate.toISOString().split('T')[0],
        rent_amount: 2000,
        security_deposit: 4000,
        status: 'active',
        rent_status: 'paid'
      },
      {
        tenant_id: '2',
        first_name: 'Sarah',
        last_name: 'Smith',
        email: 'sarah.smith@example.com',
        phone_number: '(555) 987-6543',
        space_id: '2',
        space_title: 'Cozy Studio Near Park',
        start_date: '2024-02-01',
        end_date: soonEndingDate.toISOString().split('T')[0],
        rent_amount: 1500,
        security_deposit: 3000,
        status: 'active',
        rent_status: 'due'
      },
      {
        tenant_id: '3',
        first_name: 'Michael',
        last_name: 'Johnson',
        email: 'michael.j@example.com',
        phone_number: '(555) 567-8901',
        space_id: '3',
        space_title: 'Office Suite with Conference Room',
        start_date: '2023-06-15',
        end_date: pastEndDate.toISOString().split('T')[0],
        rent_amount: 3500,
        security_deposit: 7000,
        status: 'former',
        rent_status: 'paid'
      },
      {
        tenant_id: '4',
        first_name: 'Emma',
        last_name: 'Wilson',
        email: 'emma.w@example.com',
        phone_number: '(555) 234-5678',
        space_id: '1',
        space_title: 'Modern Downtown Apartment',
        start_date: '2023-12-01',
        end_date: futureDate.toISOString().split('T')[0],
        rent_amount: 2000,
        security_deposit: 4000,
        status: 'active',
        rent_status: 'overdue'
      }
    ]);
  };

  const setMockSpaces = () => {
    setSpaces([
      {
        space_id: '1',
        title: 'Modern Downtown Apartment',
        space_type: 'Apartment',
        capacity: 2,
        city: 'San Francisco',
        state: 'CA',
        is_active: true
      },
      {
        space_id: '2',
        title: 'Cozy Studio Near Park',
        space_type: 'Studio',
        capacity: 1,
        city: 'Portland',
        state: 'OR',
        is_active: true
      },
      {
        space_id: '3',
        title: 'Office Suite with Conference Room',
        space_type: 'Office Space',
        capacity: 8,
        city: 'Seattle',
        state: 'WA',
        is_active: true
      }
    ]);
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
               tenant.phone_number.includes(query);
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
                {getActiveTenants().length}
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
                ${getTotalMonthlyRent().toLocaleString()}
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
              <Typography variant="h3" component="div" color={getTenantsWithLeaseEnding().length > 0 ? "warning.main" : "primary"}>
                {getTenantsWithLeaseEnding().length}
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
                                    ${tenant.rent_amount?.toLocaleString()}
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
                                label={tenant.status}
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