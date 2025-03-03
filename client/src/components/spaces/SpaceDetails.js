import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Divider,
  Chip,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../utils/api';

const SpaceDetails = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSpaceDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/spaces/${spaceId}`);
        setSpace(response.data.space);
      } catch (error) {
        console.error('Error fetching space details:', error);
        setError('Failed to load space details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceDetails();
  }, [spaceId]);

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

  if (!space) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <Alert severity="info">Space not found</Alert>
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Button
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: 300,
                backgroundColor: '#eeeeee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Space Image Placeholder
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h1" gutterBottom>
              {space.title}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={space.space_type} color="primary" size="small" />
              <Chip label={`Capacity: ${space.capacity}`} size="small" />
            </Box>

            <Typography variant="body1" paragraph>
              {space.description || 'No description provided.'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {`${space.street_address}, ${space.city}, ${space.state} ${space.zip_code}`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {space.country}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default SpaceDetails;