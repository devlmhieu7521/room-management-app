import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  AssignmentLate as OverdueIcon,
  Assignment as LeaseIcon
} from '@mui/icons-material';
import apiService from '../../utils/api';

const TenantsList = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        // Using apiService.tenants.getAll instead of api.get
        const response = await apiService.tenants.getAll();
        console.log('Tenants API response:', response);

        if (response.data && response.data.tenants) {
          setTenants(response.data.tenants);
          console.log('Tenant data loaded:', response.data.tenants);
        } else {
          console.log('No tenants found in response:', response.data);
          setTenants([]);
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setError('Failed to load tenants: ' + (error.message || 'Unknown error'));
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleChangeTab = (event, newValue) => {
    setTab(newValue);
  };

  const handleMenuOpen = (event, tenant) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTenant(tenant);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTenant) return;

    try {
      // Use apiService.tenants.delete instead of api.delete
      await apiService.tenants.delete(selectedTenant.tenant_id);

      // Remove tenant from state
      setTenants(tenants.filter(tenant => tenant.tenant_id !== selectedTenant.tenant_id));

      setNotification({
        open: true,
        message: 'Tenant removed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setNotification({
        open: true,
        message: 'Failed to remove tenant: ' + (error.message || 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  const filteredTenants = tenants.filter(tenant => {

    // Then filter by search query
    if (!searchQuery) return true;

    // Safe concatenation of first and last name
    const fullName = `${tenant.first_name || ''} ${tenant.last_name || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) ||
           (tenant.email && tenant.email.toLowerCase().includes(query)) ||
           (tenant.space_title && tenant.space_title.toLowerCase().includes(query)) ||
           (tenant.phone_number && tenant.phone_number.includes(query));
  });

  // Sort tenants - active first, then by lease end date (soonest first)
  const sortedTenants = [...filteredTenants].sort((a, b) => {

    // Then sort by lease end date
    return new Date(a.end_date || 0) - new Date(b.end_date || 0);
  });

  // Get count of tenants with leases ending soon (within 60 days)
  const today = new Date();
  const sixtyDaysFromNow = new Date(today);
  sixtyDaysFromNow.setDate(today.getDate() + 60);

  const endingSoonCount = tenants.filter(tenant =>
    tenant.end_date && // Make sure end_date exists
    new Date(tenant.end_date) <= sixtyDaysFromNow &&
    new Date(tenant.end_date) >= today
  ).length;

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
          startIcon={<AddIcon />}
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

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label={`All Tenants (${tenants.length})`} />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search tenants by name, email, phone or space..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {endingSoonCount > 0 && tab !== 2 && (
          <Box sx={{ mb: 3 }}>
            <Alert
              severity="warning"
              icon={<OverdueIcon />}
              action={
                <Button color="inherit" size="small">
                  View All
                </Button>
              }
            >
              {endingSoonCount} {endingSoonCount === 1 ? 'tenant' : 'tenants'} with {endingSoonCount === 1 ? 'lease' : 'leases'} ending in the next 60 days
            </Alert>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Space</TableCell>
                <TableCell>Lease Period</TableCell>
                <TableCell>Rent</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTenants.length === 0 ? (
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
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/tenants/add')}
                        >
                          Add New Tenant
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTenants.map((tenant) => {
                  // Check if required dates exist to prevent errors
                  const hasValidDates = tenant.start_date && tenant.end_date;

                  // Calculate if lease is ending soon
                  let daysUntilEnd = 0;
                  let isEndingSoon = false;
                  let isOverdue = false;

                  if (hasValidDates) {
                    const endDate = new Date(tenant.end_date);
                    daysUntilEnd = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
                    isEndingSoon = tenant.is_deleted === false && daysUntilEnd <= 60 && daysUntilEnd > 0;
                    isOverdue = tenant.is_deleted === false && daysUntilEnd < 0;
                  }

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
                        {tenant.phone_number && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {tenant.phone_number}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tenant.space_title || 'Unknown space'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {hasValidDates ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LeaseIcon fontSize="small" color={isEndingSoon ? "warning" : isOverdue ? "error" : "action"} />
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
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No lease dates specified
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>${tenant.rent_amount?.toLocaleString() || 0}/month</TableCell>

                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(event) => handleMenuOpen(event, tenant)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Tenant Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate(`/tenants/${selectedTenant?.tenant_id}`);
        }}>
          <ListItemIcon>
            <LeaseIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate(`/tenants/${selectedTenant?.tenant_id}/edit`);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Tenant</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Remove Tenant</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove Tenant</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {selectedTenant?.first_name} {selectedTenant?.last_name} from {selectedTenant?.space_title || 'this space'}?
            {selectedTenant?.is_deleted === false && selectedTenant?.end_date && (
              <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                Warning: This tenant has an active lease ending {new Date(selectedTenant.end_date).toLocaleDateString()}.
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
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

export default TenantsList;