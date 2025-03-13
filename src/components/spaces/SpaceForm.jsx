import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import spaceService from '../../services/spaceService';
import defaultSpace from '../../models/spaceModel';
import '../../styles/space.css';

const SpaceForm = ({ editMode = false, spaceId = null }) => {
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
  const [roomFormData, setRoomFormData] = useState({
    roomNumber: '',
    squareMeters: '',
    maxOccupancy: 1,
    description: '',
    images: [],
    electricityPrice: 0,
    waterPrice: 0,
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
    }
  });
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoomIndex, setEditingRoomIndex] = useState(null);
  const [uploadingRoomImages, setUploadingRoomImages] = useState(false);
  const [currentRoomTab, setCurrentRoomTab] = useState('general');

  const fileInputRef = useRef(null);
  const roomFileInputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch locations and space data (if in edit mode)
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

  // Handle form input changes
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

  // Handle property type change
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

  // Handle room form input changes
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

  // Add or update a room
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
      images: [],
      electricityPrice: 0,
      waterPrice: 0,
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
      }
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

  // Handle file selection for room image upload
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

  // Remove a room image
  const handleRemoveRoomImage = (index) => {
    setRoomFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Trigger room file input click
  const triggerRoomFileInput = () => {
    if (roomFileInputRef.current) {
      roomFileInputRef.current.click();
    }
  };

  // Edit an existing room
  const handleEditRoom = (index) => {
    const roomToEdit = rooms[index];
    setRoomFormData({
      roomNumber: roomToEdit.roomNumber,
      squareMeters: roomToEdit.squareMeters,
      maxOccupancy: roomToEdit.maxOccupancy,
      description: roomToEdit.description || '',
      images: roomToEdit.images || [],
      electricityPrice: roomToEdit.electricityPrice || 0,
      waterPrice: roomToEdit.waterPrice || 0,
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
      }
    });
    setEditingRoomIndex(index);
    setShowRoomForm(true);
  };

  // Delete a room
  const handleDeleteRoom = (index) => {
    const updatedRooms = [...rooms];
    updatedRooms.splice(index, 1);
    setRooms(updatedRooms);
  };

  // Handle city selection change
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

  // Handle district selection change
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

  // Handle file selection for image upload
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

  // Handle remove image
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form data
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

    // For boarding houses, require at least one room
    if (formData.propertyType === 'boarding_house') {
      if (rooms.length === 0) {
        newErrors.rooms = 'Add at least one room to your boarding house';
      }
    } else {
      // For apartments, validate size and max occupancy
      if (formData.squareMeters <= 0) {
        newErrors.squareMeters = 'Size must be greater than 0';
      }

      if (formData.maxOccupancy <= 0) {
        newErrors.maxOccupancy = 'Maximum occupancy must be at least 1';
      }

      // Validate utility pricing for apartments
      if (formData.electricityPrice < 0) {
        newErrors.electricityPrice = 'Electricity price cannot be negative';
      }

      if (formData.waterPrice < 0) {
        newErrors.waterPrice = 'Water price cannot be negative';
      }

      // Validate pet fee if pets are allowed
      if (formData.amenities.allowPets && formData.additionalFees.petFee < 0) {
        newErrors['additionalFees.petFee'] = 'Pet fee cannot be negative';
      }

      // Validate parking fee if parking is available
      if (formData.amenities.parking && formData.additionalFees.parkingFee < 0) {
        newErrors['additionalFees.parkingFee'] = 'Parking fee cannot be negative';
      }
    }

    // Require at least one image for all property types
    if (images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
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
        // For boarding houses, we only need basic info and rooms
        spaceDataToSave = {
          name: formData.name,
          propertyType: formData.propertyType,
          address: formData.address,
          images, // Property-level images (building exterior, common areas)
          rooms,  // Room-specific details are stored in the rooms array
          status: formData.status || 'available'
        };
      } else {
        // For apartments, we need all details
        spaceDataToSave = {
          ...formData,
          images,
          rooms: [] // Empty rooms array for apartments
        };
      }

      if (editMode && spaceId) {
        // Update existing space
        await spaceService.updateSpace(spaceId, spaceDataToSave);
      } else {
        // Create new space
        await spaceService.createSpace(spaceDataToSave);
      }

      // Redirect to spaces list
      navigate('/spaces');
    } catch (error) {
      console.error('Error saving space:', error);
      setErrors({
        submit: 'There was an error saving the space. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate('/spaces');
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
              <>
                <div className="form-row">
                  <div className="form-group half">

                    <div className="room-form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setShowRoomForm(false);
                          setEditingRoomIndex(null);
                          setRoomFormData({
                            roomNumber: '',
                            squareMeters: '',
                            maxOccupancy: 1,
                            description: '',
                            images: [],
                            electricityPrice: 0,
                            waterPrice: 0,
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
                            }
                          });
                          setCurrentRoomTab('general');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={uploadingRoomImages}
                      >
                        {editingRoomIndex !== null ? 'Update Room' : 'Add Room'}
                      </button>
                    </div>
                </div><label htmlFor="squareMeters">Size (square meters)</label>
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
              </>
            )}
          </div>

          {/* Room Management for Boarding Houses */}
          {formData.propertyType === 'boarding_house' && (
            <div className="form-section">
              <h3 className="form-section-title">Room Management</h3>

              {errors.rooms && <div className="error">{errors.rooms}</div>}

              {/* Room list */}
              {rooms.length > 0 ? (
                <div className="room-list">
                  <table className="rooms-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Room Number</th>
                        <th>Size</th>
                        <th>Max Occupancy</th>
                        <th>Amenities</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room, index) => (
                        <tr key={index}>
                          <td>
                            {room.images && room.images.length > 0 ? (
                              <div className="room-thumbnail">
                                <img src={room.images[0].url} alt={`Room ${room.roomNumber}`} />
                              </div>
                            ) : (
                              <div className="room-thumbnail empty">No image</div>
                            )}
                          </td>
                          <td>{room.roomNumber}</td>
                          <td>{room.squareMeters} m²</td>
                          <td>{room.maxOccupancy}</td>
                          <td>
                            <div className="room-amenities-list">
                              {room.amenities ? (
                                <>
                                  {room.amenities.furniture && <span className="room-amenity-tag">Furniture</span>}
                                  {room.amenities.airConditioner && <span className="room-amenity-tag">A/C</span>}
                                  {room.amenities.internet && <span className="room-amenity-tag">Internet</span>}
                                  {Object.values(room.amenities).filter(Boolean).length > 3 &&
                                    <span className="room-amenity-tag more">+{Object.values(room.amenities).filter(Boolean).length - 3} more</span>
                                  }
                                </>
                              ) : (
                                '—'
                              )}
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-sm edit"
                              onClick={() => handleEditRoom(index)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-sm delete"
                              onClick={() => handleDeleteRoom(index)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-rooms-message">
                  No rooms added yet. Add rooms to your boarding house.
                </div>
              )}

              {/* Room form */}
              {showRoomForm ? (
                <div className="room-form">
                  <h4>{editingRoomIndex !== null ? 'Edit Room' : 'Add Room'}</h4>

                  {/* Room Form Tabs */}
                  <div className="room-form-tabs">
                    <button
                      type="button"
                      className={`room-form-tab ${currentRoomTab === 'general' ? 'active' : ''}`}
                      onClick={() => setCurrentRoomTab('general')}
                    >
                      General
                    </button>
                    <button
                      type="button"
                      className={`room-form-tab ${currentRoomTab === 'utilities' ? 'active' : ''}`}
                      onClick={() => setCurrentRoomTab('utilities')}
                    >
                      Utilities
                    </button>
                    <button
                      type="button"
                      className={`room-form-tab ${currentRoomTab === 'amenities' ? 'active' : ''}`}
                      onClick={() => setCurrentRoomTab('amenities')}
                    >
                      Amenities
                    </button>
                    <button
                      type="button"
                      className={`room-form-tab ${currentRoomTab === 'images' ? 'active' : ''}`}
                      onClick={() => setCurrentRoomTab('images')}
                    >
                      Images
                    </button>
                  </div>

                  <form onSubmit={handleRoomSubmit}>
                    {/* General Room Information Tab */}
                    {currentRoomTab === 'general' && (
                      <div className="room-form-tab-content">
                        <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="roomNumber">Room Number</label>
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
                            <label htmlFor="roomSquareMeters">Size (m²)</label>
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

                        <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="roomMaxOccupancy">Maximum Occupancy</label>
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
                            <label htmlFor="roomDescription">Description (Optional)</label>
                            <input
                              type="text"
                              id="roomDescription"
                              name="description"
                              value={roomFormData.description}
                              onChange={handleRoomChange}
                              placeholder="Optional room description"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Utilities Tab */}
                    {currentRoomTab === 'utilities' && (
                      <div className="room-form-tab-content">
                        <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="roomElectricityPrice">Electricity Price (VND per kWh)</label>
                            <input
                              type="number"
                              id="roomElectricityPrice"
                              name="electricityPrice"
                              value={roomFormData.electricityPrice}
                              onChange={handleRoomChange}
                              min="0"
                              step="0.01"
                            />
                            <small>Room-specific electricity rate</small>
                          </div>

                          <div className="form-group half">
                            <label htmlFor="roomWaterPrice">Water Price (VND per cubic meter)</label>
                            <input
                              type="number"
                              id="roomWaterPrice"
                              name="waterPrice"
                              value={roomFormData.waterPrice}
                              onChange={handleRoomChange}
                              min="0"
                              step="0.01"
                            />
                            <small>Room-specific water rate</small>
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
                            />
                            <label htmlFor="roomAmenities.furniture">Furniture</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.tvCable"
                              name="amenities.tvCable"
                              checked={roomFormData.amenities.tvCable}
                              onChange={handleRoomChange}
                            />
                            <label htmlFor="roomAmenities.tvCable">TV Cable</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.internet"
                              name="amenities.internet"
                              checked={roomFormData.amenities.internet}
                              onChange={handleRoomChange}
                            />
                            <label htmlFor="roomAmenities.internet">Internet Access</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.airConditioner"
                              name="amenities.airConditioner"
                              checked={roomFormData.amenities.airConditioner}
                              onChange={handleRoomChange}
                            />
                            <label htmlFor="roomAmenities.airConditioner">Air Conditioner</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.waterHeater"
                              name="amenities.waterHeater"
                              checked={roomFormData.amenities.waterHeater}
                              onChange={handleRoomChange}
                            />
                            <label htmlFor="roomAmenities.waterHeater">Water Heater</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.allowPets"
                              name="amenities.allowPets"
                              checked={roomFormData.amenities.allowPets}
                              onChange={handleRoomChange}
                            />
                            <label htmlFor="roomAmenities.allowPets">Allow Pets</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.parking"
                              name="amenities.parking"
                              checked={roomFormData.amenities.parking}
                              onChange={handleRoomChange}
                            />
                            <label htmlFor="roomAmenities.parking">Parking</label>
                          </div>

                          <div className="amenity-item">
                            <input
                              type="checkbox"
                              id="roomAmenities.security"
                              name="amenities.security"
                              checked={roomFormData.amenities.security}
                              onChange={handleRoomChange}
                            />
                            <label htmlFor="roomAmenities.security">Security</label>
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
                          className={`image-upload-container room-image-upload ${uploadingRoomImages ? 'active' : ''}`}
                          onClick={triggerRoomFileInput}
                        >
                          <div className="upload-icon">📷</div>
                          <div className="upload-text">
                            <h4>Upload Room Images</h4>
                            <p>Click to select files or drag and drop image files here</p>
                            <div className="upload-button">
                              {uploadingRoomImages ? 'Uploading...' : 'Select Files'}
                            </div>
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
                          <div className="image-preview-container room-image-previews">
                            {roomFormData.images.map((image, index) => (
                              <div key={index} className="image-preview-item">
                                <img src={image.url} alt={`Room preview ${index + 1}`} />
                                <div
                                  className="remove-button"
                                  onClick={() => handleRemoveRoomImage(index)}
                                >
                                  ×
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="room-form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setShowRoomForm(false);
                          setEditingRoomIndex(null);
                          setRoomFormData({
                            roomNumber: '',
                            squareMeters: '',
                            maxOccupancy: 1,
                            description: '',
                            images: [],
                            electricityPrice: 0,
                            waterPrice: 0,
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
                            }
                          });
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={uploadingRoomImages}
                      >
                        {editingRoomIndex !== null ? 'Update Room' : 'Add Room'}
                      </button>
                    </div>
                    <input
                      min="0"
                      step="0.01"
                      placeholder="Room size"
                    />
                    {errors.squareMeters && <div className="error">{errors.squareMeters}</div>}
                    <div className="form-row">
                      <div className="form-group half">
                        <label htmlFor="roomMaxOccupancy">Maximum Occupancy</label>
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
                        <label htmlFor="roomDescription">Description (Optional)</label>
                        <input
                          type="text"
                          id="roomDescription"
                          name="description"
                          value={roomFormData.description}
                          onChange={handleRoomChange}
                          placeholder="Optional room description"
                        />
                      </div>
                    </div>
                  </form>
                </div>
                ): null}
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
                placeholder="Enter street address"
              />
              {errors['address.street'] && <div className="error">{errors['address.street']}</div>}
            </div>
          </div>

          {/* Utilities - only for apartments */}
          {formData.propertyType === 'apartment' && (
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
          )}

          {/* Amenities - only for apartments */}
          {formData.propertyType === 'apartment' && (
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
                  />
                  <label htmlFor="amenities.furniture">Furniture</label>
                </div>

                <div className="amenity-item">
                  <input
                    type="checkbox"
                    id="amenities.tvCable"
                    name="amenities.tvCable"
                    checked={formData.amenities.tvCable}
                    onChange={handleChange}
                  />
                  <label htmlFor="amenities.tvCable">TV Cable</label>
                </div>

                <div className="amenity-item">
                  <input
                    type="checkbox"
                    id="amenities.internet"
                    name="amenities.internet"
                    checked={formData.amenities.internet}
                    onChange={handleChange}
                  />
                  <label htmlFor="amenities.internet">Internet Access</label>
                </div>

                <div className="amenity-item">
                  <input
                    type="checkbox"
                    id="amenities.airConditioner"
                    name="amenities.airConditioner"
                    checked={formData.amenities.airConditioner}
                    onChange={handleChange}
                  />
                  <label htmlFor="amenities.airConditioner">Air Conditioner</label>
                </div>

                <div className="amenity-item">
                  <input
                    type="checkbox"
                    id="amenities.waterHeater"
                    name="amenities.waterHeater"
                    checked={formData.amenities.waterHeater}
                    onChange={handleChange}
                  />
                  <label htmlFor="amenities.waterHeater">Water Heater</label>
                </div>

                <div className="amenity-item">
                  <input
                    type="checkbox"
                    id="amenities.allowPets"
                    name="amenities.allowPets"
                    checked={formData.amenities.allowPets}
                    onChange={handleChange}
                  />
                  <label htmlFor="amenities.allowPets">Allow Pets</label>
                </div>

                <div className="amenity-item">
                  <input
                    type="checkbox"
                    id="amenities.parking"
                    name="amenities.parking"
                    checked={formData.amenities.parking}
                    onChange={handleChange}
                  />
                  <label htmlFor="amenities.parking">Parking</label>
                </div>

                <div className="amenity-item">
                  <input
                    type="checkbox"
                    id="amenities.security"
                    name="amenities.security"
                    checked={formData.amenities.security}
                    onChange={handleChange}
                  />
                  <label htmlFor="amenities.security">Security</label>
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
          )}

          {/* Image Upload */}
          <div className="form-section">
            <h3 className="form-section-title">Images</h3>

            <div
              className={`image-upload-container ${uploadingImages ? 'active' : ''}`}
              onClick={triggerFileInput}
            >
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <h4>Upload Images</h4>
                <p>Click to select files or drag and drop image files here</p>
                <div className="upload-button">
                  {uploadingImages ? 'Uploading...' : 'Select Files'}
                </div>
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
              <div className="image-preview-container">
                {images.map((image, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={image.url} alt={`Space preview ${index + 1}`} />
                    <div
                      className="remove-button"
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
              className="cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
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