import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import apiService from '../../utils/api';

const HostDashboard = () => {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    total_spaces: 0,
    active_spaces: 0,
    total_tenants: 0,
    monthly_revenue: 0
  });

  useEffect(() => {
    const fetchHostData = async () => {
      try {
        setLoading(true);
        console.log('Fetching host dashboard data...');

        // First, get spaces list
        let spacesList = [];
        try {
          console.log('Fetching spaces...');
          const spacesResponse = await apiService.spaces.getMySpaces();
          console.log (spacesResponse)
          console.log('Spaces response:', spacesResponse.data);

          if (spacesResponse.data && spacesResponse.data.spaces) {
            spacesList = spacesResponse.data.spaces;
            setSpaces(spacesList);
          }
        } catch (error) {
          console.error('Error fetching spaces:', error);
        }

        // Then get metrics
        try {
          console.log('Fetching metrics...');
          const metricsResponse = await apiService.spaces.getMetrics();
          console.log('Metrics response:', metricsResponse.data);

          if (metricsResponse.data && metricsResponse.data.metrics) {
            console.log('Setting metrics from API:', metricsResponse.data.metrics);
            setMetrics(metricsResponse.data.metrics);
          } else {
            // If API response doesn't have metrics, calculate from spaces
            console.log('Calculating metrics from spaces:', spacesList.length);
            calculateMetricsFromSpaces(spacesList);
          }
        } catch (error) {
          console.error('Error fetching metrics:', error);
          // If metrics API fails, calculate from spaces
          console.log('Falling back to space-based metrics calculation');
          calculateMetricsFromSpaces(spacesList);
        }
      } catch (error) {
        console.error('Error fetching host data:', error);
        setError('Failed to load your host dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHostData();
  }, []);

  // Helper function to calculate metrics from spaces
  const calculateMetricsFromSpaces = (spaces) => {
    console.log('Calculating metrics from', spaces.length, 'spaces');

    const calculatedMetrics = {
      total_spaces: spaces.length,
      active_spaces: spaces.filter(space => space.is_active).length,
      total_tenants: spaces.reduce((sum, space) => sum + (space.tenant_count || 0), 0),
      monthly_revenue: spaces.reduce((sum, space) => {
        // Calculate revenue based on active tenants if available
        return sum + (space.monthly_revenue || 0);
      }, 0)
    };

    console.log('Calculated metrics:', calculatedMetrics);
    setMetrics(calculatedMetrics);
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Page title with action button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Host Dashboard
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/spaces/create')}
            >
              Add New Space
            </Button>
          </Box>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Spaces
            </Typography>
            <Typography component="p" variant="h4">
              {metrics.total_spaces}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              {metrics.active_spaces} active
            </Typography>
            <div>
              <Button
                color="primary"
                size="small"
                onClick={() => navigate('/my-spaces')}
              >
                View all spaces
              </Button>
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Tenants
            </Typography>
            <Typography component="p" variant="h4">
              {metrics.total_tenants}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              across all properties
            </Typography>
            <div>
              <Button
                color="primary"
                size="small"
                onClick={() => navigate('/tenants')}
              >
                Manage tenants
              </Button>
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Monthly Revenue
            </Typography>
            <Typography component="p" variant="h4">
              ${metrics.monthly_revenue?.toLocaleString() || 0}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              for the current month
            </Typography>
            <div>
              <Button
                color="primary"
                size="small"
                onClick={() => navigate('/finances')}
              >
                View finances
              </Button>
            </div>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Quick Actions
            </Typography>
            <Button
              color="primary"
              size="small"
              sx={{ mb: 1 }}
              onClick={() => navigate('/spaces/create')}
            >
              Add New Space
            </Button>
            <Button
              color="primary"
              size="small"
              sx={{ mb: 1 }}
              onClick={() => navigate('/tenants/add')}
            >
              Add New Tenant
            </Button>
            <Button
              color="primary"
              size="small"
              onClick={() => navigate('/payments/create')}
            >
              Record Payment
            </Button>
          </Paper>
        </Grid>

        {/* Recent Spaces */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Your Spaces
            </Typography>

            {spaces.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" gutterBottom>
                  You haven't added any spaces yet
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/spaces/create')}
                  sx={{ mt: 1 }}
                >
                  Add Your First Space
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {spaces.slice(0, 3).map((space) => (
                  <Grid item key={space.space_id} xs={12} md={4}>
                    <Card>
                      <CardMedia
                        component="div"
                        sx={{ height: 140, backgroundColor: '#eeeeee' }}
                        image="https://via.placeholder.com/300x140"
                      />
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {space.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {`${space.city}, ${space.state}`}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Status:</strong> {space.is_active ? 'Active' : 'Inactive'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Capacity:</strong> {space.capacity}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => navigate(`/spaces/${space.space_id}/manage`)}>
                          Manage
                        </Button>
                        <Button size="small" onClick={() => navigate(`/spaces/${space.space_id}/tenants`)}>
                          Tenants
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}

                {spaces.length > 3 && (
                  <Grid item xs={12} sx={{ textAlign: 'right' }}>
                    <Button
                      color="primary"
                      onClick={() => navigate('/my-spaces')}
                    >
                      View all {spaces.length} spaces
                    </Button>
                  </Grid>
                )}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="New tenant added"
                  secondary="John Doe was added to Apartment 4B • 2 days ago"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Payment received"
                  secondary="$1,200 received from Sarah Smith • 3 days ago"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Lease expiring soon"
                  secondary="Michael Johnson's lease expires in 14 days"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Maintenance request"
                  secondary="New request submitted for Studio 7C • 5 days ago"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Tasks & Reminders
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Collect rent"
                  secondary="Due in 3 days for 5 properties"
                />
                <Button size="small" variant="outlined">
                  View
                </Button>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Renew lease agreements"
                  secondary="2 leases expiring this month"
                />
                <Button size="small" variant="outlined">
                  Renew
                </Button>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Schedule property inspections"
                  secondary="Quarterly inspections due for 3 properties"
                />
                <Button size="small" variant="outlined">
                  Schedule
                </Button>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Respond to tenant requests"
                  secondary="4 pending maintenance requests"
                />
                <Button size="small" variant="outlined">
                  Respond
                </Button>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HostDashboard;