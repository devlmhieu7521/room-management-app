import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spaceService from '../../../services/spaceService';
import '../../../styles/space.css';
import '../../../styles/boarding-house-styles.css';

const CreateRoomForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boardingHouse, setBoardingHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // File upload ref
  const fileInputRef = useRef(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Room form state
  const [formData, setFormData] = useState({
    roomNumber: '',
    squareMeters: '',
    maxOccupancy: 1,
    monthlyRent: 0,
    description: '',
    floor: 1,
    windowDirection: '',
    condition: 'good',
    images: [],
    status: 'available',
    electricityPrice: 0,
    waterPrice: 0,
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
    }
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBoardingHouse = async () => {
      try {
        setLoading(true);
        const data = await spaceService.getSpaceById(id);

        if (data.propertyType !== 'boarding_house') {
          throw new Error('Not a boarding house');
        }

        setBoardingHouse(data);

        // Initialize default electricity and water prices from boarding house
        setFormData(prev => ({
          ...prev,
          electricityPrice: data.electricityPrice || 2800,
          waterPrice: data.waterPrice || 10000
        }));
      } catch (error) {
        console.error('Error fetching boarding house:', error);
        setError('Failed to load boarding house. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardingHouse();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested objects (like amenities.furniture)
      const [parent, child] = name.split('.');

      if (type === 'checkbox' && parent === 'amenities') {
        // Handle amenities checkboxes
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: checked
          }
        }));
      } else {
        // Handle other nested fields
        const newValue = type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value;
        setFormData(prev => ({
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

      setFormData(prev => ({
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

      setFormData(prev => ({
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
    setFormData(prev => ({
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

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    } else if (boardingHouse?.rooms?.some(room => room.roomNumber === formData.roomNumber)) {
      newErrors.roomNumber = 'Room number must be unique';
    }

    if (!formData.squareMeters || parseFloat(formData.squareMeters) <= 0) {
      newErrors.squareMeters = 'Size must be greater than 0';
    }

    if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) {
      newErrors.monthlyRent = 'Monthly rent must be greater than 0';
    }

    if (!formData.maxOccupancy || parseInt(formData.maxOccupancy) <= 0) {
      newErrors.maxOccupancy = 'Maximum occupancy must be at least 1';
    }

    // Require at least one image
    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      // Prepare room data with all fields properly parsed
      const roomData = {
        ...formData,
        squareMeters: parseFloat(formData.squareMeters),
        maxOccupancy: parseInt(formData.maxOccupancy),
        monthlyRent: parseFloat(formData.monthlyRent),
        electricityPrice: parseFloat(formData.electricityPrice),
        waterPrice: parseFloat(formData.waterPrice),
        internetFee: parseFloat(formData.internetFee),
        cableTVFee: parseFloat(formData.cableTVFee),
        additionalFees: {
          petFee: parseFloat(formData.additionalFees.petFee),
          parkingFee: parseFloat(formData.additionalFees.parkingFee)
        },
        status: 'available' // Default to available
      };

      // Add room to boarding house
      const updatedRooms = [...(boardingHouse.rooms || []), roomData];
      const updatedBoardingHouse = {
        ...boardingHouse,
        rooms: updatedRooms
      };

      await spaceService.updateSpace(id, updatedBoardingHouse);

      // Navigate back to boarding house detail
      navigate(`/spaces/boarding-houses/${id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setErrors({
        submit: 'Failed to create room. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/spaces/boarding-houses/${id}`);
  };

  if (loading) {
    return <div className="loading-container">Loading boarding house details...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="error-container">{error}</div>
          <button
            className="btn-primary"
            onClick={() => navigate(`/spaces/boarding-houses/${id}`)}
            style={{ marginTop: '20px' }}
          >
            Back to Boarding House
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-form-container">
      <div className="space-form">
        <h2>Add New Room to {boardingHouse.name}</h2>

        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}

        {/* Form Tabs */}
        <div className="room-tabs">
          <div
            className={`room-tab ${activeTab === 'general' ? 'room-tab--active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General Information
          </div>
          <div
            className={`room-tab ${activeTab === 'utilities' ? 'room-tab--active' : ''}`}
            onClick={() => setActiveTab('utilities')}
          >
            Utilities & Pricing
          </div>
          <div
            className={`room-tab ${activeTab === 'amenities' ? 'room-tab--active' : ''}`}
            onClick={() => setActiveTab('amenities')}
          >
            Amenities
          </div>
          <div
            className={`room-tab ${activeTab === 'images' ? 'room-tab--active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            Images
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* General Information Tab */}
          {activeTab === 'general' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="roomNumber">Room Number/Name*</label>
                  <input
                    type="text"
                    id="roomNumber"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 101, A1, etc."
                    required
                  />
                  {errors.roomNumber && <div className="error">{errors.roomNumber}</div>}
                </div>

                <div className="form-group half">
                  <label htmlFor="squareMeters">Size (m²)*</label>
                  <input
                    type="number"
                    id="squareMeters"
                    name="squareMeters"
                    value={formData.squareMeters}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Room size"
                    required
                  />
                  {errors.squareMeters && <div className="error">{errors.squareMeters}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="monthlyRent">Monthly Rent (VND)*</label>
                  <input
                    type="number"
                    id="monthlyRent"
                    name="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter monthly rent amount"
                    required
                  />
                  <small>The base monthly rent for this room (excluding utilities and additional fees)</small>
                  {errors.monthlyRent && <div className="error">{errors.monthlyRent}</div>}
                </div>

                <div className="form-group half">
                  <label htmlFor="maxOccupancy">Maximum Occupancy*</label>
                  <input
                    type="number"
                    id="maxOccupancy"
                    name="maxOccupancy"
                    value={formData.maxOccupancy}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  {errors.maxOccupancy && <div className="error">{errors.maxOccupancy}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="floor">Floor Number</label>
                  <input
                    type="number"
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    min="1"
                  />
                </div>

                <div className="form-group half">
                  <label htmlFor="windowDirection">Window Direction</label>
                  <select
                    id="windowDirection"
                    name="windowDirection"
                    value={formData.windowDirection}
                    onChange={handleChange}
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
              </div>

              <div className="form-group full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed information about this room (condition, features, views, etc.)"
                  rows="4"
                />
                <small>Detailed descriptions help potential tenants understand what to expect</small>
              </div>

              <div className="form-group full">
                <label htmlFor="condition">Room Condition</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needsWork">Needs Work</option>
                </select>
              </div>
            </div>
          )}

          {/* Utilities & Pricing Tab */}
          {activeTab === 'utilities' && (
            <div className="form-section">
              <h3 className="form-section-title">Basic Utilities</h3>
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="electricityPrice">Electricity Price (VND per kWh)*</label>
                  <input
                    type="number"
                    id="electricityPrice"
                    name="electricityPrice"
                    value={formData.electricityPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                  <small>Default property rate: {boardingHouse.electricityPrice?.toLocaleString() || 2800} VND per kWh</small>
                </div>

                <div className="form-group half">
                  <label htmlFor="waterPrice">Water Price (VND per cubic meter)*</label>
                  <input
                    type="number"
                    id="waterPrice"
                    name="waterPrice"
                    value={formData.waterPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                  <small>Default property rate: {boardingHouse.waterPrice?.toLocaleString() || 10000} VND per cubic meter</small>
                </div>
              </div>

              <h3 className="form-section-title">Additional Services</h3>
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="internetFee">Internet Fee (VND per month)</label>
                  <input
                    type="number"
                    id="internetFee"
                    name="internetFee"
                    value={formData.internetFee}
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
                    value={formData.cableTVFee}
                    onChange={handleChange}
                    min="0"
                  />
                  <small>Leave at 0 if included in rent or not available</small>
                </div>
              </div>
            </div>
          )}

          {/* Amenities Tab */}
          {activeTab === 'amenities' && (
            <div className="form-section">
              <h3 className="form-section-title">Room Amenities</h3>
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
              <div style={{ marginTop: '20px' }}>
                <h3 className="form-section-title">Additional Fees</h3>
                <div className="form-row">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="form-section">
              <h3 className="form-section-title">Room Images</h3>
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

              {formData.images.length > 0 && (
                <div className="image-previews">
                  {formData.images.map((image, index) => (
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
              {isSubmitting ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomForm;