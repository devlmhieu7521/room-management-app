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
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const MySpaces = () => {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMySpaces = async () => {
      try {
        setLoading(true);
        const response = await api.get('/spaces/host/my-spaces');
        console.log('API response:', response.data); // Debug log
        setSpaces(response.data.spaces || []);

        // If no spaces are returned, let's add mock data for testing
        if (!response.data.spaces || response.data.spaces.length === 0) {
          setSpaces([
            {
              space_id: '1',
              title: 'Modern Downtown Apartment',
              description: 'Stylish apartment in the heart of downtown with great amenities.',
              space_type: 'Apartment',
              capacity: 2,
              city: 'San Francisco',
              state: 'CA',
              is_active: true,
              tenant_count: 1
            },
            {
              space_id: '2',
              title: 'Cozy Studio Near Park',
              description: 'Comfortable studio apartment with park views and nearby dining.',
              space_type: 'Studio',
              capacity: 1,
              city: 'Portland',
              state: 'OR',
              is_active: true,
              tenant_count: 0
            },
            {
              space_id: '3',
              title: 'Office Suite with Conference Room',
              description: 'Professional office space with a dedicated conference room and reception area.',
              space_type: 'Office',
              capacity: 8,
              city: 'Seattle',
              state: 'WA',
              is_active: true,
              tenant_count: 2
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching my spaces:', error);
        setError('Failed to load spaces. Please try again later.');
        // Add mock data for testing even if there's an error
        setSpaces([
          {
            space_id: '1',
            title: 'Modern Downtown Apartment',
            description: 'Stylish apartment in the heart of downtown with great amenities.',
            space_type: 'Apartment',
            capacity: 2,
            city: 'San Francisco',
            state: 'CA',
            is_active: true,
            tenant_count: 1
          },
          {
            space_id: '2',
            title: 'Cozy Studio Near Park',
            description: 'Comfortable studio apartment with park views and nearby dining.',
            space_type: 'Studio',
            capacity: 1,
            city: 'Portland',
            state: 'OR',
            is_active: true,
            tenant_count: 0
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMySpaces();
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredSpaces = spaces.filter(space => {
    const query = searchQuery.toLowerCase();
    return space.title.toLowerCase().includes(query) ||
           space.description?.toLowerCase().includes(query) ||
           space.space_type.toLowerCase().includes(query) ||
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
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/spaces/${space.space_id}/manage`)}>
                      Manage
                    </Button>
                    <Button size="small" onClick={() => navigate(`/spaces/${space.space_id}/tenants`)}>
                      Tenants
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/spaces/${space.space_id}/edit`)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
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
    </Container>
  );
};

export default MySpaces;