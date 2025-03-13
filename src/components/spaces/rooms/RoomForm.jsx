import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import spaceService from '../../../services/spaceService';

const RoomForm = ({
  boardingHouseId,
  defaultElectricityPrice = 2800,
  defaultWaterPrice = 10000,
  existingRoom = null,
  onRoomCreated = null,
  onRoomUpdated = null
}) => {
  const isEditMode = !!existingRoom;
  const navigate = useNavigate();

  const initialRoomState = existingRoom || {
    roomNumber: '',
    squareMeters: '',
    maxOccupancy: 1,
    monthlyRent: 0,
    description: '',
    floor: 1,
    windowDirection: '',
    condition: 'good',
    images: [],
    electricityPrice: defaultElectricityPrice,
    waterPrice: defaultWaterPrice,
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
  };

  const [roomData, setRoomData] = useState(initialRoomState);
  const [currentTab, setCurrentTab] = useState('general');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested objects (like amenities.furniture)
      const [parent, child] = name.split('.');

      if (type === 'checkbox' && parent === 'amenities') {
        // Handle amenities checkboxes
        setRoomData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: checked
          }
        }));
      } else {
        // Handle other nested fields
        const newValue = type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value;
        setRoomData(prev => ({
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

      setRoomData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);

    try {
      const uploadPromises = files.map(file => spaceService.uploadImage(file));
      const uploadedImages = await Promise.all(uploadPromises);

      setRoomData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
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

  const handleRemoveImage = (index) => {
    setRoomData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!roomData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    }

    if (!roomData.squareMeters || parseFloat(roomData.squareMeters) <= 0) {
      newErrors.squareMeters = 'Size must be greater than 0';
    }

    if (!roomData.monthlyRent || parseFloat(roomData.monthlyRent) <= 0) {
      newErrors.monthlyRent = 'Monthly rent must be greater than 0';
    }

    if (!roomData.maxOccupancy || parseInt(roomData.maxOccupancy) <= 0) {
      newErrors.maxOccupancy = 'Maximum occupancy must be at least 1';
    }

    // At least one image is required
    if (roomData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const boardingHouse = await spaceService.getSpaceById(boardingHouseId);

      if (isEditMode) {
        // Update existing room
        const updatedRooms = boardingHouse.rooms.map(room =>
          room.roomNumber === existingRoom.roomNumber ? roomData : room
        );

        await spaceService.updateSpace(boardingHouseId, {
          ...boardingHouse,
          rooms: updatedRooms
        });

        if (onRoomUpdated) {
          onRoomUpdated(roomData);
        }
      } else {
        // Check if room number already exists
        const roomExists = boardingHouse.rooms?.some(room =>
          room.roomNumber === roomData.roomNumber
        );

        if (roomExists) {
          setErrors({ roomNumber: 'A room with this number already exists' });
          setIsSubmitting(false);
          return;
        }

        // Add new room
        const updatedBoardingHouse = {
          ...boardingHouse,
          rooms: [...(boardingHouse.rooms || []), roomData]
        };

        await spaceService.updateSpace(boardingHouseId, updatedBoardingHouse);

        if (onRoomCreated) {
          onRoomCreated(roomData);
        }
      }

      // Navigate back to boarding house detail
      navigate(`/spaces/boarding-houses/${boardingHouseId}`);
    } catch (error) {
      console.error('Error saving room:', error);
      setErrors({ submit: 'Failed to save room. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/spaces/boarding-houses/${boardingHouseId}`);
  };

  return (
    <div className="room-form-container">
      <div className="room-tabs">
        <div
          className={`room-tab ${currentTab === 'general' ? 'room-tab--active' : ''}`}
          onClick={() => setCurrentTab('general')}
        >
          General Information
        </div>
        <div
          className={`room-tab ${currentTab === 'utilities' ? 'room-tab--active' : ''}`}
          onClick={() => setCurrentTab('utilities')}
        >
          Utilities & Pricing
        </div>
        <div
          className={`room-tab ${currentTab === 'amenities' ? 'room-tab--active' : ''}`}
          onClick={() => setCurrentTab('amenities')}
        >
          Amenities
        </div>
        <div
          className={`room-tab ${currentTab === 'images' ? 'room-tab--active' : ''}`}
          onClick={() => setCurrentTab('images')}
        >
          Images
        </div>
      </div>

      {errors.submit && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* General Room Information Tab */}
        {currentTab === 'general' && (
          <div className="room-form-tab-content">
            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="roomNumber">Room Number/Name*</label>
                <input
                  type="text"
                  id="roomNumber"
                  name="roomNumber"
                  value={roomData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. 101, A1, etc."
                  disabled={isEditMode} // Can't change room number in edit mode
                />
                {errors.roomNumber && <div className="error">{errors.roomNumber}</div>}
              </div>

              <div className="form-group half">
                <label htmlFor="squareMeters">Size (m²)*</label>
                <input
                  type="number"
                  id="squareMeters"
                  name="squareMeters"
                  value={roomData.squareMeters}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Room size"
                />
                {errors.squareMeters && <div className="error">{errors.squareMeters}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full">
                <label htmlFor="monthlyRent">Monthly Rent (VND)*</label>
                <input
                  type="number"
                  id="monthlyRent"
                  name="monthlyRent"
                  value={roomData.monthlyRent || 0}
                  onChange={handleChange}
                  min="0"
                  placeholder="Enter monthly rent amount"
                  required
                />
                <small>The base monthly rent for this room (excluding utilities and additional fees)</small>
                {errors.monthlyRent && <div className="error">{errors.monthlyRent}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="maxOccupancy">Maximum Occupancy*</label>
                <input
                  type="number"
                  id="maxOccupancy"
                  name="maxOccupancy"
                  value={roomData.maxOccupancy}
                  onChange={handleChange}
                  min="1"
                />
                {errors.maxOccupancy && <div className="error">{errors.maxOccupancy}</div>}
              </div>

              <div className="form-group half">
                <label htmlFor="floor">Floor Number</label>
                <input
                  type="number"
                  id="floor"
                  name="floor"
                  value={roomData.floor || 1}
                  onChange={handleChange}
                  min="1"
                  placeholder="Floor number"
                />
              </div>
            </div>

            <div className="form-group full">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={roomData.description}
                onChange={handleChange}
                placeholder="Provide detailed information about this room (condition, features, views, etc.)"
                rows="4"
              />
              <small>Detailed descriptions help potential tenants understand what to expect</small>
            </div>

            {isEditMode && (
              <div className="form-row">
                <div className="form-group full">
                  <label htmlFor="status">Room Status</label>
                  <select
                    id="status"
                    name="status"
                    value={roomData.status}
                    onChange={handleChange}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Utilities Tab */}
        {currentTab === 'utilities' && (
          <div className="room-form-tab-content">
            <div className="utilities-card">
              <h5 className="utilities-card__title">Basic Utilities</h5>
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="electricityPrice">Electricity Price (VND per kWh)*</label>
                  <input
                    type="number"
                    id="electricityPrice"
                    name="electricityPrice"
                    value={roomData.electricityPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                  <small>Default property rate: {defaultElectricityPrice.toLocaleString()} VND per kWh</small>
                </div>

                <div className="form-group half">
                  <label htmlFor="waterPrice">Water Price (VND per cubic meter)*</label>
                  <input
                    type="number"
                    id="waterPrice"
                    name="waterPrice"
                    value={roomData.waterPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                  <small>Default property rate: {defaultWaterPrice.toLocaleString()} VND per cubic meter</small>
                </div>
              </div>
            </div>

            <div className="utilities-card">
              <h5 className="utilities-card__title">Additional Services</h5>
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="internetFee">Internet Fee (VND per month)</label>
                  <input
                    type="number"
                    id="internetFee"
                    name="internetFee"
                    value={roomData.internetFee || 0}
                    onChange={handleChange}
                    min="0"
                  />
                  <small>Leave at 0 if included in rent or not available</small>
                </div>

                <div className="form-group half">
                  <label htmlFor="cableTVFee">Cable TV Fee (VND per month)</label>
                  <input
                    type="number"
                    id="cableTVFee"
                    name="cableTVFee"
                    value={roomData.cableTVFee || 0}
                    onChange={handleChange}
                    min="0"
                  />
                  <small>Leave at 0 if included in rent or not available</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amenities Tab */}
        {currentTab === 'amenities' && (
          <div className="room-form-tab-content">
            <div className="amenities-grid">
              <div className="amenity-item">
                <input
                  type="checkbox"
                  id="amenities.furniture"
                  name="amenities.furniture"
                  checked={roomData.amenities.furniture}
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
                  checked={roomData.amenities.tvCable}
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
                  checked={roomData.amenities.internet}
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
                  checked={roomData.amenities.airConditioner}
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
                  checked={roomData.amenities.waterHeater}
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
                  checked={roomData.amenities.allowPets}
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
                  checked={roomData.amenities.parking}
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
                  checked={roomData.amenities.security}
                  onChange={handleChange}
                  className="amenity-item__checkbox"
                />
                <label htmlFor="amenities.security" className="amenity-item__label">Security</label>
              </div>
            </div>

            {/* Additional Fees */}
            <div className="form-row" style={{ marginTop: '20px' }}>
              {roomData.amenities.allowPets && (
                <div className="form-group half">
                  <label htmlFor="additionalFees.petFee">Pet Fee (VND per month)</label>
                  <input
                    type="number"
                    id="additionalFees.petFee"
                    name="additionalFees.petFee"
                    value={roomData.additionalFees.petFee}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              )}

              {roomData.amenities.parking && (
                <div className="form-group half">
                  <label htmlFor="additionalFees.parkingFee">Parking Fee (VND per month)</label>
                  <input
                    type="number"
                    id="additionalFees.parkingFee"
                    name="additionalFees.parkingFee"
                    value={roomData.additionalFees.parkingFee}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Room Images Tab */}
        {currentTab === 'images' && (
          <div className="room-form-tab-content">
            <div
              className={`image-upload ${uploadingImages ? 'image-upload--active' : ''}`}
              onClick={triggerFileInput}
            >
              <div className="image-upload__icon">📷</div>
              <h5 className="image-upload__title">Upload Room Images*</h5>
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

            {roomData.images.length > 0 && (
              <div className="image-previews">
                {roomData.images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img src={image.url} alt={`Room preview ${index + 1}`} />
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
              ? (isEditMode ? 'Updating...' : 'Creating...')
              : (isEditMode ? 'Update Room' : 'Create Room')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomForm;