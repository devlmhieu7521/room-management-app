import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert
} from '@mui/material';
import api from '../../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setLoading(true);
        // Use the api utility instead of axios directly
        const response = await api.get('/spaces');
        console.log('API response:', response.data); // Debug log
        setSpaces(response.data.spaces || []);
      } catch (error) {
        console.error('Error fetching spaces:', error);
        setError('Failed to load spaces. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

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
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Available Spaces
      </Typography>

      {spaces.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" gutterBottom>
            No spaces available yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Check back later or create your own space
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/spaces/create')}
          >
            Create a Space
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
                <Box sx={{ p: 2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate(`/spaces/${space.space_id}`)}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;