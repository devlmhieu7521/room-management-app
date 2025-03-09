import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  TextField,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';

// Base API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

/**
 * Vietnamese Location Selector component that uses database for location data
 * This component provides cascading dropdowns for province, district, and ward selection
 */
const VietnameseLocationSelector = ({
  value = {},
  onChange,
  errors = {},
  disabled = false
}) => {
  // State for location data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Error states
  const [provinceError, setProvinceError] = useState('');
  const [districtError, setDistrictError] = useState('');
  const [wardError, setWardError] = useState('');

  // Selected values - store by ID rather than object reference
  const [selectedProvinceCode, setSelectedProvinceCode] = useState(value.province?.code || '');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState(value.district?.code || '');
  const [selectedWardCode, setSelectedWardCode] = useState(value.ward?.code || '');

  // Memoize API calls to prevent refetching on each render
  const fetchProvinces = useCallback(async () => {
    if (provinces.length > 0) return; // Skip if already loaded

    setLoadingProvinces(true);
    setProvinceError('');

    try {
      const response = await axios.get(`${API_URL}/locations/provinces`);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setProvinces(response.data.data);
      } else {
        setProvinceError('Failed to load provinces data');
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      setProvinceError('Error loading provinces. Please try again.');
    } finally {
      setLoadingProvinces(false);
    }
  }, [provinces.length]);

  const fetchDistricts = useCallback(async (provinceCode) => {
    if (!provinceCode) return;

    setLoadingDistricts(true);
    setDistrictError('');

    try {
      const response = await axios.get(`${API_URL}/locations/provinces/${provinceCode}/districts`);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setDistricts(response.data.data);
      } else {
        setDistrictError('Failed to load districts data');
      }
    } catch (error) {
      console.error(`Error fetching districts:`, error);
      setDistrictError('Error loading districts. Please try again.');
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const fetchWards = useCallback(async (districtCode) => {
    if (!districtCode) return;

    setLoadingWards(true);
    setWardError('');

    try {
      const response = await axios.get(`${API_URL}/locations/districts/${districtCode}/wards`);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setWards(response.data.data);
      } else {
        setWardError('Failed to load wards data');
      }
    } catch (error) {
      console.error(`Error fetching wards:`, error);
      setWardError('Error loading wards. Please try again.');
    } finally {
      setLoadingWards(false);
    }
  }, []);

  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  // Fetch districts when province changes
  useEffect(() => {
    setDistricts([]);
    setSelectedDistrictCode('');
    setWards([]);
    setSelectedWardCode('');

    if (selectedProvinceCode) {
      fetchDistricts(selectedProvinceCode);
    }
  }, [selectedProvinceCode, fetchDistricts]);

  // Fetch wards when district changes
  useEffect(() => {
    setWards([]);
    setSelectedWardCode('');

    if (selectedDistrictCode) {
      fetchWards(selectedDistrictCode);
    }
  }, [selectedDistrictCode, fetchWards]);

  // Notify parent when selections change
  useEffect(() => {
    const selectedProvince = provinces.find(p => p.code === selectedProvinceCode);
    const selectedDistrict = districts.find(d => d.code === selectedDistrictCode);
    const selectedWard = wards.find(w => w.code === selectedWardCode);

    onChange({
      province: selectedProvince || null,
      district: selectedDistrict || null,
      ward: selectedWard || null
    });
  }, [selectedProvinceCode, selectedDistrictCode, selectedWardCode, provinces, districts, wards, onChange]);

  // Handle province change
  const handleProvinceChange = (event) => {
    setSelectedProvinceCode(event.target.value);
  };

  // Handle district change
  const handleDistrictChange = (event) => {
    setSelectedDistrictCode(event.target.value);
  };

  // Handle ward change
  const handleWardChange = (event) => {
    setSelectedWardCode(event.target.value);
  };

  return (
    <Grid container spacing={2}>
      {/* Province/City Dropdown */}
      <Grid item xs={12} sm={4}>
        <TextField
          required
          fullWidth
          select
          label="Province/City"
          value={selectedProvinceCode}
          onChange={handleProvinceChange}
          error={!!errors.province || !!provinceError}
          helperText={errors.province || provinceError}
          disabled={disabled || loadingProvinces}
          InputProps={{
            endAdornment: loadingProvinces ? <CircularProgress size={20} /> : null
          }}
        >
          <MenuItem value="">
            <em>Select Province/City</em>
          </MenuItem>
          {provinces.map((province) => (
            <MenuItem key={province.code} value={province.code}>
              {province.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* District Dropdown */}
      <Grid item xs={12} sm={4}>
        <TextField
          required
          fullWidth
          select
          label="District"
          value={selectedDistrictCode}
          onChange={handleDistrictChange}
          error={!!errors.district || !!districtError}
          helperText={errors.district || districtError}
          disabled={disabled || !selectedProvinceCode || loadingDistricts}
          InputProps={{
            endAdornment: loadingDistricts ? <CircularProgress size={20} /> : null
          }}
        >
          <MenuItem value="">
            <em>Select District</em>
          </MenuItem>
          {districts.map((district) => (
            <MenuItem key={district.code} value={district.code}>
              {district.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* Ward Dropdown */}
      <Grid item xs={12} sm={4}>
        <TextField
          required
          fullWidth
          select
          label="Ward"
          value={selectedWardCode}
          onChange={handleWardChange}
          error={!!errors.ward || !!wardError}
          helperText={errors.ward || wardError}
          disabled={disabled || !selectedDistrictCode || loadingWards}
          InputProps={{
            endAdornment: loadingWards ? <CircularProgress size={20} /> : null
          }}
        >
          <MenuItem value="">
            <em>Select Ward</em>
          </MenuItem>
          {wards.map((ward) => (
            <MenuItem key={ward.code} value={ward.code}>
              {ward.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* Display error if API fails completely */}
      {(provinceError || districtError || wardError) && (
        <Grid item xs={12}>
          <Alert severity="error">
            There was an issue loading location data. You may need to enter location manually.
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

export default VietnameseLocationSelector;