import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import spaceService from '../../../services/spaceService';
import defaultSpace from '../../../models/spaceModel';
import '../../../styles/space.css';
import '../../../styles/boarding-house-styles.css';

/**
 * BoardingHouseForm Component
 * Handles creation and editing of boarding house rental spaces
 *
 * @param {boolean} editMode - Whether the form is in edit mode
 * @param {string} boardingHouseId - ID of the boarding house to edit (only used in edit mode)
 */
const BoardingHouseForm = ({ editMode = false, boardingHouseId = null }) => {
  // Initialize form data with default structure
  const initialFormData = {
    ...defaultSpace,
    propertyType: 'boarding_house' // Force boarding house type
  };

  // State for the form data and UI
  const [formData, setFormData] = useState(initialFormData);
  const [locations, setLocations] = useState({
    cities: [],
    districts: [],
    wards: []
  });
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reference for file input
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  /**
   * Fetch locations and boarding house data (if in edit mode)
   */
  useEffect(() => {
    // Get location data
    const locationData = spaceService.getLocations();
    setLocations({
      cities: locationData.cities,
      districts: formData.address.city ? spaceService.getDistrictsByCity(formData.address.city) : [],
      wards: formData.address.district ? spaceService.getWardsByDistrict(formData.address.district) : []
    });

    // If in edit mode, fetch boarding house data
    if (editMode && boardingHouseId) {
      const fetchBoardingHouse = async () => {
        try {
          const boardingHouseData = await spaceService.getSpaceById(boardingHouseId);

          // Ensure it's a boarding house
          if (boardingHouseData.propertyType !== 'boarding_house') {
            throw new Error('Not a boarding house');
          }

          setFormData(boardingHouseData);

          // Update districts and wards based on selected city/district
          if (boardingHouseData.address.city) {
            const districts = spaceService.getDistrictsByCity(boardingHouseData.address.city);
            setLocations(prev => ({ ...prev, districts }));

            if (boardingHouseData.address.district) {
              const wards = spaceService.getWardsByDistrict(boardingHouseData.address.district);
              setLocations(prev => ({ ...prev, wards }));
            }
          }

          // Set images from boarding house data
          if (boardingHouseData.images && boardingHouseData.images.length > 0) {
            setImages(boardingHouseData.images);
          }
        } catch (error) {
          console.error('Error fetching boarding house:', error);
        }
      };

      fetchBoardingHouse();
    }
  }, [editMode, boardingHouseId, formData.address.city, formData.address.district]);

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

    // Validate basic fields
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

    // Require at least one image for the boarding house
    if (images.length === 0) {
      newErrors.images = 'At least one image of the building exterior is required';
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
      // Prepare boarding house data for saving
      const boardingHouseDataToSave = {
        ...formData,
        propertyType: 'boarding_house', // Ensure it's a boarding house
        images,
        // Keep the rooms array if already present (in edit mode), otherwise initialize to empty array
        rooms: formData.rooms || [],
        electricityPrice: formData.electricityPrice || 2800, // Default electricity price
        waterPrice: formData.waterPrice || 10000 // Default water price
      };

      let redirectUrl = '/spaces/boarding-houses';

      if (editMode && boardingHouseId) {
        // Update existing boarding house
        await spaceService.updateSpace(boardingHouseId, boardingHouseDataToSave);
        redirectUrl = `/spaces/boarding-houses/${boardingHouseId}`;
      } else {
        // Create new boarding house
        const newBoardingHouse = await spaceService.createSpace(boardingHouseDataToSave);
        redirectUrl = `/spaces/boarding-houses/${newBoardingHouse.id}`;
      }

      // Redirect to appropriate page
      navigate(redirectUrl);
    } catch (error) {
      console.error('Error saving boarding house:', error);
      setErrors({
        submit: 'There was an error saving the boarding house. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    navigate('/spaces/boarding-houses');
  };

  /**
   * Trigger file input click
   */
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-form-container">
      <div className="space-form">
        <h2>{editMode ? 'Edit Boarding House' : 'Create New Boarding House'}</h2>

        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <div className="form-section">
            <h3 className="form-section-title">Basic Details</h3>
            <div className="form-group full">
              <label htmlFor="name">Boarding House Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter boarding house name"
              />
              {errors.name && <div className="error">{errors.name}</div>}
            </div>
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
                placeholder="Enter detailed street address with building/lot number"
              />
              <small>For boarding houses, please include building number, street name, and any identifying landmarks</small>
              {errors['address.street'] && <div className="error">{errors['address.street']}</div>}
            </div>
          </div>

          {/* Default Utility Pricing */}
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
                  value={formData.electricityPrice || 2800}
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
                  value={formData.waterPrice || 10000}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
                <small>Current example rate: 10,000 VND per cubic meter</small>
                {errors.waterPrice && <div className="error">{errors.waterPrice}</div>}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-section">
            <h3 className="form-section-title">Building Exterior Images</h3>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Upload images of the building exterior and common areas only. Room-specific images should be added when creating each room.
            </p>

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
                    <img src={image.url} alt={`Building preview ${index + 1}`} />
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
                : (editMode ? 'Update Boarding House' : 'Create Boarding House')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardingHouseForm;