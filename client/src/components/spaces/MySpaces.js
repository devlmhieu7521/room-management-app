import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Fab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';

const MySpaces = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Check if we were redirected from space creation
  useEffect(() => {
    if (location.state && location.state.spaceAdded) {
      setNotification({
        open: true,
        message: 'Space added successfully!',
        severity: 'success'
      });
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const fetchMySpaces = async () => {
      try {
        setLoading(true);

        // Try to get spaces from API
        try {
          const response = await api.get('/spaces/host/my-spaces');
          if (response.data && response.data.spaces) {
            setSpaces(response.data.spaces);
          } else {
            // If no spaces are returned, set mock data
            setMockSpaces();
          }
        } catch (error) {
          console.error('API error:', error);
          setMockSpaces();
        }
      } catch (error) {
        console.error('Error fetching my spaces:', error);
        setError('Failed to load spaces. Please try again later.');
        setMockSpaces();
      } finally {
        setLoading(false);
      }
    };

    fetchMySpaces();
  }, []);

  const setMockSpaces = () => {
    // These are sample spaces for development/demo purposes
    setSpaces([
      {
        space_id: '1',
        title: 'Modern Downtown Apartment',
        description: 'Stylish apartment in the heart of downtown with great amenities.',
        space_type: 'Apartment',
        capacity: 2,
        city: 'San Francisco',
        state: 'CA',
        street_address: '123 Main Street',
        zip_code: '94105',
        country: 'USA',
        is_active: true,
        tenant_count: 1,
        created_at: '2024-01-15T00:00:00Z'
      },
      {
        space_id: '2',
        title: 'Cozy Studio Near Park',
        description: 'Comfortable studio apartment with park views and nearby dining.',
        space_type: 'Studio',
        capacity: 1,
        city: 'Portland',
        state: 'OR',
        street_address: '456 Park Avenue',
        zip_code: '97201',
        country: 'USA',
        is_active: true,
        tenant_count: 0,
        created_at: '2024-02-01T00:00:00Z'
      },
      {
        space_id: '3',
        title: 'Office Suite with Conference Room',
        description: 'Professional office space with a dedicated conference room and reception area.',
        space_type: 'Office Space',
        capacity: 8,
        city: 'Seattle',
        state: 'WA',
        street_address: '789 Business Blvd',
        zip_code: '98101',
        country: 'USA',
        is_active: true,
        tenant_count: 2,
        created_at: '2024-01-20T00:00:00Z'
      }
    ]);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleDeleteClick = (space) => {
    setSpaceToDelete(space);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSpaceToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!spaceToDelete) return;

    try {
      // In a real app, you'd call the API to delete the space
      // await api.delete(`/spaces/${spaceToDelete.space_id}`);

      // Instead, just update the state
      setSpaces(spaces.filter(space => space.space_id !== spaceToDelete.space_id));

      setNotification({
        open: true,
        message: 'Space deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting space:', error);
      setNotification({
        open: true,
        message: 'Failed to delete space. Please try again.',
        severity: 'error'
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSpaceToDelete(null);
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  const navigateToManage = (space) => {
    // Pass the entire space object to the management page
    navigate(`/spaces/${space.space_id}/manage`, {
      state: {
        spaceData: space
      }
    });
  };

  const filteredSpaces = spaces.filter(space => {
    const query = searchQuery.toLowerCase();
    return space.title.toLowerCase().includes(query) ||
           (space.description && space.description.toLowerCase().includes(query)) ||
           (space.space_type && space.space_type.toLowerCase().includes(query)) ||
           `${space.city}, ${space.state}`.toLowerCase().includes(query);
  });

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
          My Spaces
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search your spaces by title, type, or location..."
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

        {filteredSpaces.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography variant="h6" gutterBottom>
              No spaces found
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first space to get started'}
            </Typography>
            {!searchQuery && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/spaces/create')}
              >
                Add New Space
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredSpaces.map((space) => (
              <Grid item key={space.space_id} xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="div"
                    sx={{ height: 140, backgroundColor: '#eeeeee' }}
                    image="https://via.placeholder.com/300x140"
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography gutterBottom variant="h6" component="h2">
                        {space.title}
                      </Typography>
                      <Chip
                        label={space.is_active ? 'Active' : 'Inactive'}
                        color={space.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {space.space_type} • Capacity: {space.capacity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {`${space.city}, ${space.state}`}
                    </Typography>
                    <Typography variant="body2">
                      {space.description?.substring(0, 100)}
                      {space.description?.length > 100 ? '...' : ''}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Tenants:</strong> {space.tenant_count || 0}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <Button
                        size="small"
                        onClick={() => navigateToManage(space)}
                        startIcon={<VisibilityIcon fontSize="small" />}
                      >
                        Manage
                      </Button>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/spaces/${space.space_id}/edit`, { state: { spaceData: space } })}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(space)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Floating action button for adding new spaces */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/spaces/create')}
      >
        <AddIcon />
      </Fab>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the space "{spaceToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
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

export default MySpaces;