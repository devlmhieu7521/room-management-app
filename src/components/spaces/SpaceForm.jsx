import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import spaceService from '../../services/spaceService';
import defaultSpace from '../../models/spaceModel';
import '../../styles/space.css';
import '../../styles/boarding-house-styles.css'; // Import the new boarding house styles

/**
 * SpaceForm Component
 * Handles creation and editing of rental spaces (apartments and boarding houses)
 *
 * @param {boolean} editMode - Whether the form is in edit mode
 * @param {string} spaceId - ID of the space to edit (only used in edit mode)
 */
const SpaceForm = ({
  editMode = false,
  spaceId = null,
  initialTab = null,
  initialAction = null  }) => {
  // State for the form data and UI
  const [formData, setFormData] = useState({ ...defaultSpace });
  const [locations, setLocations] = useState({
    cities: [],
    districts: [],
    wards: []
  });
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Room management for boarding houses
  const [rooms, setRooms] = useState([]);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoomIndex, setEditingRoomIndex] = useState(null);
  const [currentRoomTab, setCurrentRoomTab] = useState('general');
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    squareMeters: '',
    maxOccupancy: 1,
    monthlyRent: 0, // Add this field
    description: '',
    floor: 1,
    windowDirection: '',
    condition: 'good',
    images: [],
    electricityPrice: 2800,
    waterPrice: 10000,
    internetFee: 0,
    cableTVFee: 0,
    amenities: {
      furniture: false,
      tvCable: false,
      internet: false,
      airConditioner: false,
      waterHeater: false,
      allowPets: false,
      parking: false,
      security: false,
    },
    additionalFees: {
      petFee: 0,
      parkingFee: 0,
    },
    status: 'available'
  });
  const [uploadingRoomImages, setUploadingRoomImages] = useState(false);

  // References for file inputs
  const fileInputRef = useRef(null);
  const roomFileInputRef = useRef(null);
  const navigate = useNavigate();

  /**
   * Fetch locations and space data (if in edit mode)
   */
  useEffect(() => {

    // Get location data
    const locationData = spaceService.getLocations();
    setLocations({
      cities: locationData.cities,
      districts: formData.address.city ? spaceService.getDistrictsByCity(formData.address.city) : [],
      wards: formData.address.district ? spaceService.getWardsByDistrict(formData.address.district) : []
    });

    // If in edit mode, fetch space data
    if (editMode && spaceId) {
      const fetchSpace = async () => {
        try {
          const spaceData = await spaceService.getSpaceById(spaceId);
          setFormData(spaceData);

          // Set rooms if it's a boarding house
          if (spaceData.propertyType === 'boarding_house' && spaceData.rooms) {
            setRooms(spaceData.rooms);
          }

          // Update districts and wards based on selected city/district
          if (spaceData.address.city) {
            const districts = spaceService.getDistrictsByCity(spaceData.address.city);
            setLocations(prev => ({ ...prev, districts }));

            if (spaceData.address.district) {
              const wards = spaceService.getWardsByDistrict(spaceData.address.district);
              setLocations(prev => ({ ...prev, wards }));
            }
          }

          // Set images from space data
          if (spaceData.images && spaceData.images.length > 0) {
            setImages(spaceData.images);
          }
        } catch (error) {
          console.error('Error fetching space:', error);
        }
      };

      fetchSpace();
    }
  }, [editMode, spaceId, formData.address.city, formData.address.district]);

  useEffect(() => {
    if (editMode && initialTab === 'rooms' && formData.propertyType === 'boarding_house') {
      if (initialAction === 'add') {
        // Show the room form for adding a new room
        setShowRoomForm(true);
        setEditingRoomIndex(null);
        setCurrentRoomTab('general');
        setRoomFormData({
          roomNumber: '',
          squareMeters: '',
          maxOccupancy: 1,
          monthlyRent: 0,
          description: '',
          floor: 1,
          windowDirection: '',
          condition: 'good',
          images: [],
          electricityPrice: formData.electricityPrice || 2800,
          waterPrice: formData.waterPrice || 10000,
          internetFee: 0,
          cableTVFee: 0,
          amenities: {
            furniture: false,
            tvCable: false,
            internet: false,
            airConditioner: false,
            waterHeater: false,
            allowPets: false,
            parking: false,
            security: false,
          },
          additionalFees: {
            petFee: 0,
            parkingFee: 0,
          },
          status: 'available'
        });
      }
    }
  }, [editMode, initialTab, initialAction, formData.propertyType, formData.electricityPrice, formData.waterPrice]);

  /**
   * Handle form input changes
   * @param {Object} e - Event object
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested objects (like address.city)
      const [parent, child] = name.split('.');

      if (type === 'checkbox' && parent === 'amenities') {
        // Handle amenities checkboxes correctly
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: checked
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else if (type === 'checkbox') {
      // Handle regular checkboxes
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      // Handle regular inputs
      const newValue = type === 'number' ? parseFloat(value) || 0 : value;
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };

  /**
   * Handle property type change
   * @param {Object} e - Event object
   */
  const handlePropertyTypeChange = (e) => {
    const propertyType = e.target.value;
    setFormData(prev => ({
      ...prev,
      propertyType
    }));

    // Reset rooms array if switching from boarding house to apartment
    if (propertyType !== 'boarding_house') {
      setRooms([]);
      setShowRoomForm(false);
    }
  };

  /**
   * Handle room form input changes
   * @param {Object} e - Event object
   */
  const handleRoomChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested objects (like amenities.furniture)
      const [parent, child] = name.split('.');

      if (type === 'checkbox' && parent === 'amenities') {
        // Handle amenities checkboxes
        setRoomFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: checked
          }
        }));
      } else {
        // Handle other nested fields
        const newValue = type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value;
        setRoomFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: newValue
          }
        }));
      }
    } else {
      // Handle regular inputs
      const newValue = type === 'number' ? (value === '' ? '' : parseFloat(value) || 0) : value;

      setRoomFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };

  /**
   * Add or update a room
   * @param {Object} e - Event object
   */
  const handleRoomSubmit = (e) => {
    e.preventDefault();

    // Validate room form
    const roomErrors = {};
    if (!roomFormData.roomNumber.trim()) {
      roomErrors.roomNumber = 'Room number is required';
    } else if (
      rooms.some((room, index) =>
        room.roomNumber === roomFormData.roomNumber &&
        index !== editingRoomIndex
      )
    ) {
      roomErrors.roomNumber = 'Room number must be unique';
    }

    if (!roomFormData.squareMeters || parseFloat(roomFormData.squareMeters) <= 0) {
      roomErrors.squareMeters = 'Size must be greater than 0';
    }

    if (!roomFormData.monthlyRent || parseFloat(roomFormData.monthlyRent) <= 0) {
      roomErrors.monthlyRent = 'Monthly rent must be greater than 0';
    }

    if (Object.keys(roomErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...roomErrors }));
      return;
    }

    const roomToAdd = {
      ...roomFormData,
      squareMeters: parseFloat(roomFormData.squareMeters),
      maxOccupancy: parseInt(roomFormData.maxOccupancy),
      electricityPrice: parseFloat(roomFormData.electricityPrice) || 0,
      waterPrice: parseFloat(roomFormData.waterPrice) || 0,
      internetFee: parseFloat(roomFormData.internetFee) || 0,
      cableTVFee: parseFloat(roomFormData.cableTVFee) || 0,
      status: 'available'
    };

    if (editingRoomIndex !== null) {
      // Update existing room
      const updatedRooms = [...rooms];
      updatedRooms[editingRoomIndex] = roomToAdd;
      setRooms(updatedRooms);
    } else {
      // Add new room
      setRooms(prev => [...prev, roomToAdd]);
    }

    // Reset form and state
    setRoomFormData({
      roomNumber: '',
      squareMeters: '',
      maxOccupancy: 1,
      description: '',
      floor: 1,
      windowDirection: '',
      condition: 'good',
      images: [],
      electricityPrice: formData.electricityPrice || 2800,
      waterPrice: formData.waterPrice || 10000,
      internetFee: 0,
      cableTVFee: 0,
      amenities: {
        furniture: false,
        tvCable: false,
        internet: false,
        airConditioner: false,
        waterHeater: false,
        allowPets: false,
        parking: false,
        security: false,
      },
      additionalFees: {
        petFee: 0,
        parkingFee: 0,
      },
      status: 'available'
    });
    setShowRoomForm(false);
    setEditingRoomIndex(null);
    setCurrentRoomTab('general');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.roomNumber;
      delete newErrors.squareMeters;
      return newErrors;
    });
  };

  /**
   * Handle file selection for room image upload
   * @param {Object} e - Event object
   */
  const handleRoomFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingRoomImages(true);

    try {
      const uploadPromises = files.map(file => spaceService.uploadImage(file));
      const uploadedImages = await Promise.all(uploadPromises);

      setRoomFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
    } catch (error) {
      console.error('Error uploading room images:', error);
    } finally {
      setUploadingRoomImages(false);
      // Clear the file input
      if (roomFileInputRef.current) {
        roomFileInputRef.current.value = '';
      }
    }
  };

  /**
   * Remove a room image
   * @param {number} index - Index of the image to remove
   */
  const handleRemoveRoomImage = (index) => {
    setRoomFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  /**
   * Trigger room file input click
   */
  const triggerRoomFileInput = () => {
    if (roomFileInputRef.current) {
      roomFileInputRef.current.click();
    }
  };

  /**
   * Edit an existing room
   * @param {number} index - Index of the room to edit
   */
  const handleEditRoom = (index) => {
    const roomToEdit = rooms[index];
    setRoomFormData({
      roomNumber: roomToEdit.roomNumber,
      squareMeters: roomToEdit.squareMeters,
      monthlyRent: roomToEdit.monthlyRent || 0, // Include monthly rent
      maxOccupancy: roomToEdit.maxOccupancy || 1,
      description: roomToEdit.description || '',
      floor: roomToEdit.floor || 1,
      windowDirection: roomToEdit.windowDirection || '',
      condition: roomToEdit.condition || 'good',
      images: roomToEdit.images || [],
      electricityPrice: roomToEdit.electricityPrice || formData.electricityPrice || 2800,
      waterPrice: roomToEdit.waterPrice || formData.waterPrice || 10000,
      internetFee: roomToEdit.internetFee || 0,
      cableTVFee: roomToEdit.cableTVFee || 0,
      amenities: roomToEdit.amenities || {
        furniture: false,
        tvCable: false,
        internet: false,
        airConditioner: false,
        waterHeater: false,
        allowPets: false,
        parking: false,
        security: false,
      },
      additionalFees: roomToEdit.additionalFees || {
        petFee: 0,
        parkingFee: 0,
      },
      status: roomToEdit.status || 'available'
    });
    setEditingRoomIndex(index);
    setShowRoomForm(true);
    setCurrentRoomTab('general');
  };

  /**
   * Delete a room
   * @param {number} index - Index of the room to delete
   */
  const handleDeleteRoom = (index) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      const updatedRooms = [...rooms];
      updatedRooms.splice(index, 1);
      setRooms(updatedRooms);
    }
  };

  /**
   * Handle city selection change
   * @param {Object} e - Event object
   */
  const handleCityChange = (e) => {
    const city = e.target.value;
    const districts = spaceService.getDistrictsByCity(city);

    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        city,
        district: '',
        ward: ''
      }
    }));

    setLocations(prev => ({
      ...prev,
      districts,
      wards: []
    }));
  };

  /**
   * Handle district selection change
   * @param {Object} e - Event object
   */
  const handleDistrictChange = (e) => {
    const district = e.target.value;
    const wards = spaceService.getWardsByDistrict(district);

    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        district,
        ward: ''
      }
    }));

    setLocations(prev => ({
      ...prev,
      wards
    }));
  };

  /**
   * Handle file selection for image upload
   * @param {Object} e - Event object
   */
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);

    try {
      const uploadPromises = files.map(file => spaceService.uploadImage(file));
      const uploadedImages = await Promise.all(uploadPromises);

      setImages(prev => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploadingImages(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Handle remove image
   * @param {number} index - Index of the image to remove
   */
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Validate form data
   * @returns {boolean} - Whether the form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Validate basic fields for all property types
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.address.street.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.district) {
      newErrors['address.district'] = 'District is required';
    }

    if (!formData.address.ward) {
      newErrors['address.ward'] = 'Ward is required';
    }

    // For boarding houses, don't require rooms during initial creation
    if (formData.propertyType === 'boarding_house' && editMode) {
      // Only validate rooms requirement if we're editing an existing boarding house
      if (rooms.length === 0) {
        newErrors.rooms = 'Add at least one room to your boarding house';
      }
    } else if (formData.propertyType === 'apartment') {
      // For apartments, always validate size and max occupancy
      if (formData.squareMeters <= 0) {
        newErrors.squareMeters = 'Size must be greater than 0';
      }

      if (formData.maxOccupancy <= 0) {
        newErrors.maxOccupancy = 'Maximum occupancy must be at least 1';
      }
    }

    // Require at least one image for all property types
    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * @param {Object} e - Event object
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the first error
      const firstError = document.querySelector('.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      let spaceDataToSave;

      if (formData.propertyType === 'boarding_house') {
        // For boarding houses, we need basic info (rooms can be empty initially)
        spaceDataToSave = {
          name: formData.name,
          propertyType: formData.propertyType,
          address: formData.address,
          images, // Property-level images (building exterior, common areas)
          rooms: rooms || [],  // Room-specific details are stored in the rooms array
          status: formData.status || 'available',
          // Keep property-level electricity and water prices as defaults
          electricityPrice: formData.electricityPrice || 2800,
          waterPrice: formData.waterPrice || 10000
        };
      } else {
        // For apartments, we need all details
        spaceDataToSave = {
          ...formData,
          images,
          rooms: [] // Empty rooms array for apartments
        };
      }

      let redirectUrl = '/spaces';

      if (editMode && spaceId) {
        // Update existing space
        await spaceService.updateSpace(spaceId, spaceDataToSave);
        redirectUrl = `/spaces/detail/${spaceId}`;
      } else {
        // Create new space
        const newSpace = await spaceService.createSpace(spaceDataToSave);
        // For boarding houses, redirect to the detail page for room creation
        if (formData.propertyType === 'boarding_house') {
          redirectUrl = `/spaces/detail/${newSpace.id}`;
        }
      }

      // Redirect to appropriate page
      navigate(redirectUrl);
    } catch (error) {
      console.error('Error saving space:', error);
      setErrors({
        submit: 'There was an error saving the space. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    navigate('/spaces');
  };

  /**
   * Trigger file input click
   */
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Get array of amenities for a room
   * @param {Object} roomAmenities - Room amenities object
   * @returns {Array} - Array of amenity names
   */
  const getAmenitiesArray = (roomAmenities) => {
    if (!roomAmenities) return [];

    const amenitiesMap = {
      furniture: 'Furniture',
      tvCable: 'TV Cable',
      internet: 'Internet',
      airConditioner: 'A/C',
      waterHeater: 'Water Heater',
      allowPets: 'Pets Allowed',
      parking: 'Parking',
      security: 'Security'
    };

    return Object.entries(roomAmenities)
      .filter(([_, value]) => value)
      .map(([key]) => amenitiesMap[key] || key);
  };

  return (
    <div className="space-form-container">
      <div className="space-form">
        <h2>{editMode ? 'Edit Space' : 'Create New Space'}</h2>

        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <div className="form-section">
            <h3 className="form-section-title">Basic Details</h3>
            <div className="form-group full">
              <label htmlFor="name">Space Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter space name"
              />
              {errors.name && <div className="error">{errors.name}</div>}
            </div>

            {/* Property Type Selection */}
            <div className="form-group full">
              <label htmlFor="propertyType">Property Type</label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handlePropertyTypeChange}
              >
                <option value="apartment">Apartment</option>
                <option value="boarding_house">Boarding House</option>
              </select>
              <small>
                {formData.propertyType === 'apartment'
                  ? 'Single unit rental property'
                  : 'Multi-room rental property with individual rooms for rent'}
              </small>
            </div>

            {/* Show apartment specific fields if apartment is selected */}
            {formData.propertyType === 'apartment' && (
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="squareMeters">Size (square meters)</label>
                  <input
                    type="number"
                    id="squareMeters"
                    name="squareMeters"
                    value={formData.squareMeters}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                  {errors.squareMeters && <div className="error">{errors.squareMeters}</div>}
                </div>

                <div className="form-group half">
                  <label htmlFor="maxOccupancy">Maximum Occupancy</label>
                  <input
                    type="number"
                    id="maxOccupancy"
                    name="maxOccupancy"
                    value={formData.maxOccupancy}
                    onChange={handleChange}
                    min="1"
                  />
                  {errors.maxOccupancy && <div className="error">{errors.maxOccupancy}</div>}
                </div>
              </div>
            )}
            {/* For apartments only - Monthly Rent */}
            {formData.propertyType === 'apartment' && (
              <div className="form-row">
                <div className="form-group full">
                  <label htmlFor="monthlyRent">Monthly Rent (VND)</label>
                  <input
                    type="number"
                    id="monthlyRent"
                    name="monthlyRent"
                    value={formData.monthlyRent || 0}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter monthly rent amount"
                  />
                  {errors.monthlyRent && <div className="error">{errors.monthlyRent}</div>}
                  <small>The base monthly rent for this apartment (excluding utilities and additional fees)</small>
                </div>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="form-section">
            <h3 className="form-section-title">Address</h3>

            <div className="form-row">
              <div className="form-group third">
                <label htmlFor="address.city">City</label>
                <select
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleCityChange}
                >
                  <option value="">Select City</option>
                  {locations.cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors['address.city'] && <div className="error">{errors['address.city']}</div>}
              </div>

              <div className="form-group third">
                <label htmlFor="address.district">District</label>
                <select
                  id="address.district"
                  name="address.district"
                  value={formData.address.district}
                  onChange={handleDistrictChange}
                  disabled={!formData.address.city}
                >
                  <option value="">Select District</option>
                  {locations.districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {errors['address.district'] && <div className="error">{errors['address.district']}</div>}
              </div>

              <div className="form-group third">
                <label htmlFor="address.ward">Ward</label>
                <select
                  id="address.ward"
                  name="address.ward"
                  value={formData.address.ward}
                  onChange={handleChange}
                  disabled={!formData.address.district}
                >
                  <option value="">Select Ward</option>
                  {locations.wards.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>
                {errors['address.ward'] && <div className="error">{errors['address.ward']}</div>}
              </div>
            </div>

            <div className="form-group full">
              <label htmlFor="address.street">Street Address</label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                placeholder={formData.propertyType === 'boarding_house' ?
                  "Enter detailed street address with building/lot number" :
                  "Enter street address"}
              />
              {formData.propertyType === 'boarding_house' && (
                <small>For boarding houses, please include building number, street name, and any identifying landmarks</small>
              )}
              {errors['address.street'] && <div className="error">{errors['address.street']}</div>}
            </div>
          </div>

          {/* ======= DIFFERENT SECTIONS BASED ON PROPERTY TYPE ======= */}

          {/* For boarding houses: Room Management section */}
          {formData.propertyType === 'boarding_house' && (
            <div className="boarding-section">
              <div className="boarding-section__header">
                <h3 className="boarding-section__title">Room Management</h3>
                <button
                  type="button"
                  className="add-room-button"
                  onClick={() => {
                    setShowRoomForm(true);
                    setEditingRoomIndex(null);
                    setCurrentRoomTab('general');
                    setRoomFormData({
                      roomNumber: '',
                      squareMeters: '',
                      maxOccupancy: 1,
                      description: '',
                      floor: 1,
                      windowDirection: '',
                      condition: 'good',
                      images: [],
                      electricityPrice: formData.electricityPrice || 2800,
                      waterPrice: formData.waterPrice || 10000,
                      internetFee: 0,
                      cableTVFee: 0,
                      amenities: {
                        furniture: false,
                        tvCable: false,
                        internet: false,
                        airConditioner: false,
                        waterHeater: false,
                        allowPets: false,
                        parking: false,
                        security: false,
                      },
                      additionalFees: {
                        petFee: 0,
                        parkingFee: 0,
                      },
                      status: 'available'
                    });
                  }}
                >
                  <span className="add-room-button__icon">+</span>
                  {rooms.length === 0 ? 'Add Your First Room' : 'Add Another Room'}
                </button>
              </div>

              {errors.rooms && <div className="error">{errors.rooms}</div>}

              {/* Room Grid */}
              {rooms.length > 0 ? (
                <div className="room-grid">
                  {rooms.map((room, index) => (
                    <div
                      key={index}
                      className={`room-card room-card--${room.status || 'available'}`}
                    >
                      <div className="room-card__header">
                        <h4 className="room-card__number">Room {room.roomNumber}</h4>
                        <span className={`status-badge status-badge--${room.status || 'available'}`}>
                          {room.status || 'Available'}
                        </span>
                      </div>
                      <div className="room-card__body">
                        <div className="room-card__image">
                          {room.images && room.images.length > 0 ? (
                            <img src={room.images[0].url} alt={`Room ${room.roomNumber}`} />
                          ) : (
                            <div className="room-card__no-image">No Image Available</div>
                          )}
                        </div>
                        <div className="room-card__details">
                          <div className="room-card__detail">
                            <span className="room-card__detail-label">Size</span>
                            <span className="room-card__detail-value">{room.squareMeters} m²</span>
                          </div>
                          <div className="room-card__detail">
                            <span className="room-card__detail-label">Max Occupancy</span>
                            <span className="room-card__detail-value">{room.maxOccupancy} people</span>
                          </div>
                          <div className="room-card__detail">
                            <span className="room-card__detail-label">Monthly Rent</span>
                            <span className="room-card__detail-value">{room.monthlyRent?.toLocaleString() || 0} VND</span>
                          </div>
                          <div className="room-card__detail">
                            <span className="room-card__detail-label">Electricity</span>
                            <span className="room-card__detail-value">{room.electricityPrice.toLocaleString()} VND/kWh</span>
                          </div>
                          <div className="room-card__detail">
                            <span className="room-card__detail-label">Water</span>
                            <span className="room-card__detail-value">{room.waterPrice.toLocaleString()} VND/m³</span>
                          </div>
                        </div>
                        {room.description && (
                          <div className="room-card__description">
                            <p>{room.description.length > 100
                                ? `${room.description.substring(0, 100)}...`
                                : room.description}</p>
                          </div>
                        )}
                        <div className="room-card__amenities">
                          {getAmenitiesArray(room.amenities).slice(0, 3).map((amenity, i) => (
                            <span key={i} className="room-card__amenity">{amenity}</span>
                          ))}
                          {getAmenitiesArray(room.amenities).length > 3 && (
                            <span className="room-card__amenity">
                              +{getAmenitiesArray(room.amenities).length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="room-card__footer">
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => handleEditRoom(index)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => handleDeleteRoom(index)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-rooms">
                  <div className="no-rooms__icon">🏠</div>
                  <h4 className="no-rooms__title">No Rooms Added Yet</h4>
                  <p className="no-rooms__text">
                    Add at least one room to your boarding house. Each room can have different amenities, utilities, and pricing.
                  </p>
                </div>
              )}

              {/* Room form */}
              {showRoomForm && (
                <div className="room-form-container">
                  <div className="room-form-container__header">
                    <h4 className="room-form-container__title">
                      {editingRoomIndex !== null ? `Edit Room ${roomFormData.roomNumber}` : 'Add New Room'}
                    </h4>
                  </div>

                  {/* Room Form Tabs */}
                  <div className="room-tabs">
                    <div
                      className={`room-tab ${currentRoomTab === 'general' ? 'room-tab--active' : ''}`}
                      onClick={() => setCurrentRoomTab('general')}
                    >
                      General Information
                    </div>
                    <div
                      className={`room-tab ${currentRoomTab === 'utilities' ? 'room-tab--active' : ''}`}
                      onClick={() => setCurrentRoomTab('utilities')}
                    >
                      Utilities & Pricing
                    </div>
                    <div
                      className={`room-tab ${currentRoomTab === 'amenities' ? 'room-tab--active' : ''}`}
                      onClick={() => setCurrentRoomTab('amenities')}
                    >
                      Amenities
                    </div>
                    <div
                      className={`room-tab ${currentRoomTab === 'images' ? 'room-tab--active' : ''}`}
                      onClick={() => setCurrentRoomTab('images')}
                    >
                      Images
                    </div>
                  </div>

                  <form onSubmit={handleRoomSubmit}>
                    {/* General Room Information Tab */}
                    {currentRoomTab === 'general' && (
                      <div className="room-form-tab-content">
                        <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="roomNumber">Room Number/Name*</label>
                            <input
                              type="text"
                              id="roomNumber"
                              name="roomNumber"
                              value={roomFormData.roomNumber}
                              onChange={handleRoomChange}
                              placeholder="e.g. 101, A1, etc."
                            />
                            {errors.roomNumber && <div className="error">{errors.roomNumber}</div>}
                          </div>

                          <div className="form-group half">
                            <label htmlFor="roomSquareMeters">Size (m²)*</label>
                            <input
                              type="number"
                              id="roomSquareMeters"
                              name="squareMeters"
                              value={roomFormData.squareMeters}
                              onChange={handleRoomChange}
                              min="0"
                              step="0.01"
                              placeholder="Room size"
                            />
                            {errors.squareMeters && <div className="error">{errors.squareMeters}</div>}
                          </div>
                        </div>

                        {/* Add monthly rent field */}
                        <div className="form-row">
                          <div className="form-group full">
                            <label htmlFor="roomMonthlyRent">Monthly Rent (VND)*</label>
                            <input
                              type="number"
                              id="roomMonthlyRent"
                              name="monthlyRent"
                              value={roomFormData.monthlyRent || 0}
                              onChange={handleRoomChange}
                              min="0"
                              placeholder="Enter monthly rent amount"
                              required
                            />
                            <small>The base monthly rent for this room (excluding utilities and additional fees)</small>
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="roomMaxOccupancy">Maximum Occupancy*</label>
                            <input
                              type="number"
                              id="roomMaxOccupancy"
                              name="maxOccupancy"
                              value={roomFormData.maxOccupancy}
                              onChange={handleRoomChange}
                              min="1"
                            />
                          </div>

                          <div className="form-group half">
                            <label htmlFor="roomFloor">Floor Number</label>
                            <input
                              type="number"
                              id="roomFloor"
                              name="floor"
                              value={roomFormData.floor || 1}
                              onChange={handleRoomChange}
                              min="1"
                              placeholder="Floor number"
                            />
                          </div>
                        </div>

                        <div className="form-group full">
                          <label htmlFor="roomDescription">Detailed Description</label>
                          <textarea
                            id="roomDescription"
                            name="description"
                            value={roomFormData.description}
                            onChange={handleRoomChange}
                            placeholder="Provide detailed information about this room (condition, features, views, etc.)"
                            rows="4"
                          />
                          <small>Detailed descriptions help potential tenants understand what to expect</small>
                        </div>

                        {/* <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="roomWindowDirection">Window Direction</label>
                            <select
                              id="roomWindowDirection"
                              name="windowDirection"
                              value={roomFormData.windowDirection || ''}
                              onChange={handleRoomChange}
                            >
                              <option value="">Select Direction</option>
                              <option value="north">North</option>
                              <option value="south">South</option>
                              <option value="east">East</option>
                              <option value="west">West</option>
                              <option value="northeast">Northeast</option>
                              <option value="northwest">Northwest</option>
                              <option value="southeast">Southeast</option>
                              <option value="southwest">Southwest</option>
                            </select>
                          </div>

                          <div className="form-group half">
                            <label htmlFor="roomCondition">Room Condition</label>
                            <select
                              id="roomCondition"
                              name="condition"
                              value={roomFormData.condition || 'good'}
                              onChange={handleRoomChange}
                            >
                              <option value="excellent">Excellent</option>
                              <option value="good">Good</option>
                              <option value="fair">Fair</option>
                              <option value="needsWork">Needs Work</option>
                            </select>
                          </div>
                        </div> */}
                      </div>
                    )}

                    {/* Utilities Tab */}
                    {currentRoomTab === 'utilities' && (
                      <div className="room-form-tab-content">
                        <div className="utilities-card">
                          <h5 className="utilities-card__title">Basic Utilities</h5>
                          <div className="form-row">
                            <div className="form-group half">
                              <label htmlFor="roomElectricityPrice">Electricity Price (VND per kWh)*</label>
                              <input
                                type="number"
                                id="roomElectricityPrice"
                                name="electricityPrice"
                                value={roomFormData.electricityPrice}
                                onChange={handleRoomChange}
                                min="0"
                                step="0.01"
                              />
                              <small>Current example rate: 2,800 VND per kWh</small>
                            </div>

                            <div className="form-group half">
                              <label htmlFor="roomWaterPrice">Water Price (VND per cubic meter)*</label>
                              <input
                                type="number"
                                id="roomWaterPrice"
                                name="waterPrice"
                                value={roomFormData.waterPrice}
                                onChange={handleRoomChange}
                                min="0"
                                step="0.01"
                              />
                              <small>Current example rate: 10,000 VND per cubic meter</small>
                            </div>
                          </div>
                        </div>

                        <div className="utilities-card">
                          <h5 className="utilities-card__title">Additional Services</h5>
                          <div className="form-row">
                            <div className="form-group half">
                              <label htmlFor="roomInternetFee">Internet Fee (VND per month)</label>
                              <input
                                type="number"
                                id="roomInternetFee"
                                name="internetFee"
                                value={roomFormData.internetFee || 0}
                                onChange={handleRoomChange}
                                min="0"
                              />
                              <small>Leave at 0 if included in rent or not available</small>
                            </div>

                            <div className="form-group half">
                              <label htmlFor="roomCableTVFee">Cable TV Fee (VND per month)</label>
                              <input
                                type="number"
                                id="roomCableTVFee"
                                name="cableTVFee"
                                value={roomFormData.cableTVFee || 0}
                                onChange={handleRoomChange}
                                min="0"
                              />
                              <small>Leave at 0 if included in rent or not available</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Amenities Tab */}
                    {currentRoomTab === 'amenities' && (
                      <div className="room-form-tab-content">
                        <div className="amenities-grid">
                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.furniture"
                              name="amenities.furniture"
                              checked={roomFormData.amenities.furniture}
                              onChange={handleRoomChange}
                              className="amenity-item__checkbox"
                            />
                            <label htmlFor="roomAmenities.furniture" className="amenity-item__label">Furniture</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.tvCable"
                              name="amenities.tvCable"
                              checked={roomFormData.amenities.tvCable}
                              onChange={handleRoomChange}
                              className="amenity-item__checkbox"
                            />
                            <label htmlFor="roomAmenities.tvCable" className="amenity-item__label">TV Cable</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.internet"
                              name="amenities.internet"
                              checked={roomFormData.amenities.internet}
                              onChange={handleRoomChange}
                              className="amenity-item__checkbox"
                            />
                            <label htmlFor="roomAmenities.internet" className="amenity-item__label">Internet Access</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.airConditioner"
                              name="amenities.airConditioner"
                              checked={roomFormData.amenities.airConditioner}
                              onChange={handleRoomChange}
                              className="amenity-item__checkbox"
                            />
                            <label htmlFor="roomAmenities.airConditioner" className="amenity-item__label">Air Conditioner</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.waterHeater"
                              name="amenities.waterHeater"
                              checked={roomFormData.amenities.waterHeater}
                              onChange={handleRoomChange}
                              className="amenity-item__checkbox"
                            />
                            <label htmlFor="roomAmenities.waterHeater" className="amenity-item__label">Water Heater</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.allowPets"
                              name="amenities.allowPets"
                              checked={roomFormData.amenities.allowPets}
                              onChange={handleRoomChange}
                              className="amenity-item__checkbox"
                            />
                            <label htmlFor="roomAmenities.allowPets" className="amenity-item__label">Allow Pets</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.parking"
                              name="amenities.parking"
                              checked={roomFormData.amenities.parking}
                              onChange={handleRoomChange}
                              className="amenity-item__checkbox"
                            />
                            <label htmlFor="roomAmenities.parking" className="amenity-item__label">Parking</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.security"
                              name="amenities.security"
                              checked={roomFormData.amenities.security}
                              onChange={handleRoomChange}
                              className="amenity-item__checkbox"
                            />
                            <label htmlFor="roomAmenities.security" className="amenity-item__label">Security</label>
                          </div>
                        </div>

                        {/* Additional Fees */}
                        <div className="form-row" style={{ marginTop: '20px' }}>
                          {roomFormData.amenities.allowPets && (
                            <div className="form-group half">
                              <label htmlFor="roomAdditionalFees.petFee">Pet Fee (VND per month)</label>
                              <input
                                type="number"
                                id="roomAdditionalFees.petFee"
                                name="additionalFees.petFee"
                                value={roomFormData.additionalFees.petFee}
                                onChange={handleRoomChange}
                                min="0"
                              />
                            </div>
                          )}

                          {roomFormData.amenities.parking && (
                            <div className="form-group half">
                              <label htmlFor="roomAdditionalFees.parkingFee">Parking Fee (VND per month)</label>
                              <input
                                type="number"
                                id="roomAdditionalFees.parkingFee"
                                name="additionalFees.parkingFee"
                                value={roomFormData.additionalFees.parkingFee}
                                onChange={handleRoomChange}
                                min="0"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Room Images Tab */}
                    {currentRoomTab === 'images' && (
                      <div className="room-form-tab-content">
                        <div
                          className={`image-upload ${uploadingRoomImages ? 'image-upload--active' : ''}`}
                          onClick={triggerRoomFileInput}
                        >
                          <div className="image-upload__icon">📷</div>
                          <h5 className="image-upload__title">Upload Room Images*</h5>
                          <p className="image-upload__text">Click to select files or drag and drop image files here</p>
                          <div className="image-upload__button">
                            {uploadingRoomImages ? 'Uploading...' : 'Select Files'}
                          </div>
                          <input
                            type="file"
                            ref={roomFileInputRef}
                            onChange={handleRoomFileSelect}
                            style={{ display: 'none' }}
                            multiple
                            accept="image/*"
                          />
                        </div>

                        {roomFormData.images.length > 0 && (
                          <div className="image-previews">
                            {roomFormData.images.map((image, index) => (
                              <div key={index} className="image-preview">
                                <img src={image.url} alt={`Room preview ${index + 1}`} />
                                <div
                                  className="image-preview__remove"
                                  onClick={() => handleRemoveRoomImage(index)}
                                >
                                  ×
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <small style={{ display: 'block', marginTop: '10px' }}>
                          Upload at least one image of the room to showcase its features and condition.
                          Include photos of the bed, window view, bathroom, and any special amenities.
                        </small>
                      </div>
                    )}

                    <div className="form-actions">
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => {
                          setShowRoomForm(false);
                          setEditingRoomIndex(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="button button--primary"
                        disabled={uploadingRoomImages}
                      >
                        {editingRoomIndex !== null ? 'Update Room' : 'Add Room'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Default utility pricing for boarding houses */}
          {/* {formData.propertyType === 'boarding_house' && (
            <div className="form-section">
              <h3 className="form-section-title">Default Utility Pricing</h3>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                These rates will be used as defaults for new rooms. You can set room-specific rates when adding or editing individual rooms.
              </p>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="electricityPrice">Default Electricity Price (VND per kWh)</label>
                  <input
                    type="number"
                    id="electricityPrice"
                    name="electricityPrice"
                    value={formData.electricityPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                  <small>Current example rate: 2,800 VND per kWh</small>
                  {errors.electricityPrice && <div className="error">{errors.electricityPrice}</div>}
                </div>

                <div className="form-group half">
                  <label htmlFor="waterPrice">Default Water Price (VND per cubic meter)</label>
                  <input
                    type="number"
                    id="waterPrice"
                    name="waterPrice"
                    value={formData.waterPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                  <small>Current example rate: 10,000 VND per cubic meter</small>
                  {errors.waterPrice && <div className="error">{errors.waterPrice}</div>}
                </div>
              </div>
            </div>
          )} */}

          {/* For apartments: Utilities, Amenities, and Images sections */}
          {formData.propertyType === 'apartment' && (
            <>
              {/* Utilities */}
              <div className="form-section">
                <h3 className="form-section-title">Utility Pricing</h3>
                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="electricityPrice">Electricity Price (VND per kWh)</label>
                    <input
                      type="number"
                      id="electricityPrice"
                      name="electricityPrice"
                      value={formData.electricityPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                    <small>Current example rate: 2,800 VND per kWh</small>
                    {errors.electricityPrice && <div className="error">{errors.electricityPrice}</div>}
                  </div>

                  <div className="form-group half">
                    <label htmlFor="waterPrice">Water Price (VND per cubic meter)</label>
                    <input
                      type="number"
                      id="waterPrice"
                      name="waterPrice"
                      value={formData.waterPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                    <small>Current example rate: 10,000 VND per cubic meter</small>
                    {errors.waterPrice && <div className="error">{errors.waterPrice}</div>}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="form-section">
                <h3 className="form-section-title">Amenities</h3>
                <div className="amenities-grid">
                  <div className="amenity-item">
                    <input
                      type="checkbox"
                      id="amenities.furniture"
                      name="amenities.furniture"
                      checked={formData.amenities.furniture}
                      onChange={handleChange}
                      className="amenity-item__checkbox"
                    />
                    <label htmlFor="amenities.furniture" className="amenity-item__label">Furniture</label>
                  </div>

                  <div className="amenity-item">
                    <input
                      type="checkbox"
                      id="amenities.tvCable"
                      name="amenities.tvCable"
                      checked={formData.amenities.tvCable}
                      onChange={handleChange}
                      className="amenity-item__checkbox"
                    />
                    <label htmlFor="amenities.tvCable" className="amenity-item__label">TV Cable</label>
                  </div>

                  <div className="amenity-item">
                    <input
                      type="checkbox"
                      id="amenities.internet"
                      name="amenities.internet"
                      checked={formData.amenities.internet}
                      onChange={handleChange}
                      className="amenity-item__checkbox"
                    />
                    <label htmlFor="amenities.internet" className="amenity-item__label">Internet Access</label>
                  </div>

                  <div className="amenity-item">
                    <input
                      type="checkbox"
                      id="amenities.airConditioner"
                      name="amenities.airConditioner"
                      checked={formData.amenities.airConditioner}
                      onChange={handleChange}
                      className="amenity-item__checkbox"
                    />
                    <label htmlFor="amenities.airConditioner" className="amenity-item__label">Air Conditioner</label>
                  </div>

                  <div className="amenity-item">
                    <input
                      type="checkbox"
                      id="amenities.waterHeater"
                      name="amenities.waterHeater"
                      checked={formData.amenities.waterHeater}
                      onChange={handleChange}
                      className="amenity-item__checkbox"
                    />
                    <label htmlFor="amenities.waterHeater" className="amenity-item__label">Water Heater</label>
                  </div>

                  <div className="amenity-item">
                    <input
                      type="checkbox"
                      id="amenities.allowPets"
                      name="amenities.allowPets"
                      checked={formData.amenities.allowPets}
                      onChange={handleChange}
                      className="amenity-item__checkbox"
                    />
                    <label htmlFor="amenities.allowPets" className="amenity-item__label">Allow Pets</label>
                  </div>

                  <div className="amenity-item">
                    <input
                      type="checkbox"
                      id="amenities.parking"
                      name="amenities.parking"
                      checked={formData.amenities.parking}
                      onChange={handleChange}
                      className="amenity-item__checkbox"
                    />
                    <label htmlFor="amenities.parking" className="amenity-item__label">Parking</label>
                  </div>

                  <div className="amenity-item">
                    <input
                      type="checkbox"
                      id="amenities.security"
                      name="amenities.security"
                      checked={formData.amenities.security}
                      onChange={handleChange}
                      className="amenity-item__checkbox"
                    />
                    <label htmlFor="amenities.security" className="amenity-item__label">Security</label>
                  </div>
                </div>

                {/* Additional Fees */}
                <div className="form-row" style={{ marginTop: '20px' }}>
                  {formData.amenities.allowPets && (
                    <div className="form-group half">
                      <label htmlFor="additionalFees.petFee">Pet Fee (VND per month)</label>
                      <input
                        type="number"
                        id="additionalFees.petFee"
                        name="additionalFees.petFee"
                        value={formData.additionalFees.petFee}
                        onChange={handleChange}
                        min="0"
                      />
                      {errors['additionalFees.petFee'] && (
                        <div className="error">{errors['additionalFees.petFee']}</div>
                      )}
                    </div>
                  )}

                  {formData.amenities.parking && (
                    <div className="form-group half">
                      <label htmlFor="additionalFees.parkingFee">Parking Fee (VND per month)</label>
                      <input
                        type="number"
                        id="additionalFees.parkingFee"
                        name="additionalFees.parkingFee"
                        value={formData.additionalFees.parkingFee}
                        onChange={handleChange}
                        min="0"
                      />
                      {errors['additionalFees.parkingFee'] && (
                        <div className="error">{errors['additionalFees.parkingFee']}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Image Upload - Always show, but with different instructions */}
          <div className="form-section">
            <h3 className="form-section-title">
              {formData.propertyType === 'apartment'
                ? 'Apartment Images'
                : 'Building Exterior Images'}
            </h3>

            {formData.propertyType === 'boarding_house' && (
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Upload images of the building exterior and common areas only. Room-specific images should be added when creating each room.
              </p>
            )}

            <div
              className={`image-upload ${uploadingImages ? 'image-upload--active' : ''}`}
              onClick={triggerFileInput}
            >
              <div className="image-upload__icon">📁</div>
              <h5 className="image-upload__title">Upload Images</h5>
              <p className="image-upload__text">Click to select files or drag and drop image files here</p>
              <div className="image-upload__button">
                {uploadingImages ? 'Uploading...' : 'Select Files'}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                multiple
                accept="image/*"
              />
            </div>

            {errors.images && <div className="error">{errors.images}</div>}

            {images.length > 0 && (
              <div className="image-previews">
                {images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img src={image.url} alt={`Space preview ${index + 1}`} />
                    <div
                      className="image-preview__remove"
                      onClick={() => handleRemoveImage(index)}
                    >
                      ×
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button--primary"
              disabled={isSubmitting || uploadingImages}
            >
              {isSubmitting
                ? (editMode ? 'Updating...' : 'Creating...')
                : (editMode ? 'Update Space' : 'Create Space')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpaceForm;