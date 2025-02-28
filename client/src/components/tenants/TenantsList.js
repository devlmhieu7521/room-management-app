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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../utils/api';

const TenantsList = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        // This endpoint doesn't exist yet - you'll need to implement it
        const response = await api.get('/tenants');
        setTenants(response.data.tenants || []);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setError('Failed to load tenants. Please try again later.');
        // For development, let's add some mock data
        setTenants([
          {
            tenant_id: '1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone_number: '(555) 123-4567',
            space_title: 'Apartment 4B',
            start_date: '2024-01-15',
            end_date: '2025-01-14',
            status: 'active'
          },
          {
            tenant_id: '2',
            first_name: 'Sarah',
            last_name: 'Smith',
            email: 'sarah.smith@example.com',
            phone_number: '(555) 987-6543',
            space_title: 'Office Suite 7',
            start_date: '2024-03-01',
            end_date: '2024-12-31',
            status: 'active'
          },
          {
            tenant_id: '3',
            first_name: 'Michael',
            last_name: 'Johnson',
            email: 'michael.j@example.com',
            phone_number: '(555) 567-8901',
            space_title: 'Studio 7C',
            start_date: '2023-06-15',
            end_date: '2024-03-14',
            status: 'former'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredTenants = tenants.filter(tenant => {
    const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) ||
           tenant.email.toLowerCase().includes(query) ||
           tenant.space_title.toLowerCase().includes(query);
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

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search tenants by name, email or space..."
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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Space</TableCell>
                <TableCell>Lease Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No tenants found. Add your first tenant to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
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
                    <TableCell>{tenant.space_title}</TableCell>
                    <TableCell>
                      {new Date(tenant.start_date).toLocaleDateString()} to {new Date(tenant.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.status}
                        color={tenant.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/tenants/${tenant.tenant_id}/edit`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          // Implement delete confirmation dialog
                          if (window.confirm("Are you sure you want to remove this tenant?")) {
                            // Implement tenant deletion
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default TenantsList;