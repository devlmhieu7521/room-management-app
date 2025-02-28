import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  CircularProgress,
  Alert,
  Fab
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MySpaces = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMySpaces = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(
          'http://localhost:4000/api/spaces/host/my-spaces',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setSpaces(response.data.spaces || []);
      } catch (error) {
        console.error('Error fetching my spaces:', error);
        setError(error.response?.data?.message || 'Failed to load your spaces. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMySpaces();
  }, [navigate]);

  const handleDeleteSpace = async (spaceId) => {
    if (window.confirm('Are you sure you want to delete this space?')) {
      try {
        const token = localStorage.getItem('token');

        await axios.delete(
          `http://localhost:4000/api/spaces/${spaceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // Remove the deleted space from the list
        setSpaces(spaces.filter(space => space.space_id !== spaceId));
      } catch (error) {
        console.error('Error deleting space:', error);
        alert(error.response?.data?.message || 'Failed to delete space');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {spaces.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" gutterBottom>
            You haven't added any spaces yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Create your first space to start managing bookings
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
      ) : (
        <Grid container spacing={4}>
          {spaces.map((space) => (
            <Grid item key={space.space_id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="div"
                  sx={{ height: 140, backgroundColor: '#eeeeee' }}
                  image="https://via.placeholder.com/300x140"
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {space.title}
                  </Typography>
                  <Typography>
                    {space.description?.substring(0, 100)}
                    {space.description?.length > 100 ? '...' : ''}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {`${space.city}, ${space.state}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`Capacity: ${space.capacity} people`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`Type: ${space.space_type}`}
                    </Typography>
                  </Box>
                </CardContent>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button size="small" variant="outlined" onClick={() => navigate(`/spaces/edit/${space.space_id}`)}>
                    Edit
                  </Button>
                  <Button size="small" variant="contained" onClick={() => navigate(`/spaces/${space.space_id}`)}>
                    View Details
                  </Button>
                  <Button size="small" color="error" onClick={() => handleDeleteSpace(space.space_id)}>
                    Delete
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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