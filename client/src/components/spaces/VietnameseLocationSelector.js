import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Typography
} from '@mui/material';
import axios from 'axios';

// Base API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

/**
 * Simplified Vietnamese Location Selector without update loops
 */
const VietnameseLocationSelector = ({
  value = {},
  onChange,
  errors = {},
  disabled = false
}) => {
  // Simple state for location data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Error messages
  const [apiError, setApiError] = useState('');

  // UI control
  const [showDebug, setShowDebug] = useState(true);

  // Internal state for dropdown selections
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');

  // Refs to track previous values and prevent loops
  const initialized = useRef(false);
  const fetchedProvinces = useRef(false);
  const lastProvinceFetch = useRef(null);
  const lastDistrictFetch = useRef(null);
  const lastWardFetch = useRef(null);

  // Initialize form values on first render only
  useEffect(() => {
    if (!initialized.current) {
      console.log('Initializing from props:', value);
      initialized.current = true;

      if (value.province?.code) {
        setProvinceCode(value.province.code);
      }

      if (value.district?.code) {
        setDistrictCode(value.district.code);
      }

      if (value.ward?.code) {
        setWardCode(value.ward.code);
      }
    }
  }, [value]);

  // Fetch provinces (once only)
  useEffect(() => {
    const getProvinces = async () => {
      // Prevent duplicate fetches
      if (fetchedProvinces.current || loadingProvinces) return;

      setLoadingProvinces(true);
      setApiError('');

      try {
        console.log('Fetching provinces...');
        const response = await axios.get(`${API_URL}/locations/provinces`);

        if (response.data?.success && Array.isArray(response.data.data)) {
          const provincesList = response.data.data;
          console.log(`Loaded ${provincesList.length} provinces`);
          setProvinces(provincesList);
          fetchedProvinces.current = true;

          // If we have province name but no code, try to match
          if (value.province?.name && !provinceCode) {
            const match = provincesList.find(p =>
              p.name.toLowerCase() === value.province.name.toLowerCase());

            if (match) {
              console.log('Matched province by name:', match.name);
              setProvinceCode(match.code);
            }
          }
        } else {
          setApiError('Failed to load provinces');
        }
      } catch (error) {
        console.error('Province fetch error:', error);
        setApiError('Error loading provinces');
      } finally {
        setLoadingProvinces(false);
      }
    };

    getProvinces();
  }, [value.province, provinceCode]);

  // Fetch districts when province changes
  useEffect(() => {
    const getDistricts = async () => {
      // Skip if no province selected or already loading
      if (!provinceCode || loadingDistricts) return;

      // Skip if we already fetched for this province code
      if (lastProvinceFetch.current === provinceCode && districts.length > 0) return;

      setLoadingDistricts(true);
      setDistricts([]);
      setDistrictCode('');
      setWards([]);
      setWardCode('');

      try {
        console.log(`Fetching districts for province ${provinceCode}...`);
        const response = await axios.get(`${API_URL}/locations/provinces/${provinceCode}/districts`);

        if (response.data?.success && Array.isArray(response.data.data)) {
          const districtsList = response.data.data;
          console.log(`Loaded ${districtsList.length} districts`);
          setDistricts(districtsList);
          lastProvinceFetch.current = provinceCode;

          // If we have district name but no code, try to match
          if (value.district?.name && !districtCode) {
            const match = districtsList.find(d =>
              d.name.toLowerCase() === value.district.name.toLowerCase());

            if (match) {
              console.log('Matched district by name:', match.name);
              setDistrictCode(match.code);
            }
          }
        } else {
          setApiError('Failed to load districts');
        }
      } catch (error) {
        console.error('District fetch error:', error);
        setApiError('Error loading districts');
      } finally {
        setLoadingDistricts(false);
      }
    };

    getDistricts();
  }, [provinceCode, value.district, districtCode, districts.length, loadingDistricts]);

  // Fetch wards when district changes
  useEffect(() => {
    const getWards = async () => {
      // Skip if no district selected or already loading
      if (!districtCode || loadingWards) return;

      // Skip if we already fetched for this district code
      if (lastDistrictFetch.current === districtCode && wards.length > 0) return;

      setLoadingWards(true);
      setWards([]);
      setWardCode('');

      try {
        console.log(`Fetching wards for district ${districtCode}...`);
        const response = await axios.get(`${API_URL}/locations/districts/${districtCode}/wards`);

        if (response.data?.success && Array.isArray(response.data.data)) {
          const wardsList = response.data.data;
          console.log(`Loaded ${wardsList.length} wards`);
          setWards(wardsList);
          lastDistrictFetch.current = districtCode;

          // If we have ward name but no code, try to match
          if (value.ward?.name && !wardCode) {
            const match = wardsList.find(w =>
              w.name.toLowerCase() === value.ward.name.toLowerCase());

            if (match) {
              console.log('Matched ward by name:', match.name);
              setWardCode(match.code);
            }
          }
        } else {
          setApiError('Failed to load wards');
        }
      } catch (error) {
        console.error('Ward fetch error:', error);
        setApiError('Error loading wards');
      } finally {
        setLoadingWards(false);
      }
    };

    getWards();
  }, [districtCode, value.ward, wardCode, wards.length, loadingWards]);

  // Update parent only when dropdown values change (with debounce)
  useEffect(() => {
    // Skip if component is not fully initialized
    if (!initialized.current) return;

    const selectedProvince = provinces.find(p => p.code === provinceCode);
    const selectedDistrict = districts.find(d => d.code === districtCode);
    const selectedWard = wards.find(w => w.code === wardCode);

    // Skip if we don't have a province
    if (!selectedProvince) return;

    // Prepare the location value
    const locationValue = {
      province: selectedProvince,
      district: selectedDistrict || null,
      ward: selectedWard || null
    };

    // Debounce to prevent rapid updates
    const timer = setTimeout(() => {
      console.log('Updating parent with:', locationValue);
      onChange(locationValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [provinceCode, districtCode, wardCode, provinces, districts, wards, onChange]);

  // Clean user-triggered dropdown change handlers
  const handleProvinceChange = (e) => {
    const newCode = e.target.value;
    console.log('User selected province:', newCode);
    setProvinceCode(newCode);
    setDistrictCode('');
    setWardCode('');
  };

  const handleDistrictChange = (e) => {
    const newCode = e.target.value;
    console.log('User selected district:', newCode);
    setDistrictCode(newCode);
    setWardCode('');
  };

  const handleWardChange = (e) => {
    const newCode = e.target.value;
    console.log('User selected ward:', newCode);
    setWardCode(newCode);
  };

  return (
    <Grid container spacing={2}>
      {/* Debug information */}
      {showDebug && (
        <Grid item xs={12}>
          <Box sx={{ p: 1, backgroundColor: '#f5f5f5', borderRadius: 1, mb: 2, fontSize: '0.75rem' }}>
            <Typography variant="caption" display="block"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setShowDebug(!showDebug)}>
              Debug: Current Value (click to hide)
            </Typography>
            <Box component="pre" sx={{ m: 0 }}>
              {JSON.stringify({
                province: provinces.find(p => p.code === provinceCode)?.name || value.province?.name || null,
                district: districts.find(d => d.code === districtCode)?.name || value.district?.name || null,
                ward: wards.find(w => w.code === wardCode)?.name || value.ward?.name || null,
                provinceCode: provinceCode || null,
                districtCode: districtCode || null,
                wardCode: wardCode || null
              }, null, 2)}
            </Box>
          </Box>
        </Grid>
      )}

      {/* Province/City Dropdown */}
      <Grid item xs={12} sm={4}>
        <TextField
          required
          fullWidth
          select
          label="Province/City"
          value={provinceCode}
          onChange={handleProvinceChange}
          error={!!errors.province}
          helperText={errors.province}
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
          value={districtCode}
          onChange={handleDistrictChange}
          error={!!errors.district}
          helperText={errors.district}
          disabled={disabled || !provinceCode || loadingDistricts}
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
          value={wardCode}
          onChange={handleWardChange}
          error={!!errors.ward}
          helperText={errors.ward}
          disabled={disabled || !districtCode || loadingWards}
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

      {/* API error alert */}
      {apiError && (
        <Grid item xs={12}>
          <Alert severity="error">
            {apiError}. You may need to enter location manually.
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

export default VietnameseLocationSelector;