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
  const fileInputRef = useRef(null);
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

    if (formData.squareMeters <= 0) {
      newErrors.squareMeters = 'Size must be greater than 0';
    }

    if (formData.electricityPrice < 0) {
      newErrors.electricityPrice = 'Electricity price cannot be negative';
    }

    if (formData.waterPrice < 0) {
      newErrors.waterPrice = 'Water price cannot be negative';
    }

    if (formData.maxOccupancy <= 0) {
      newErrors.maxOccupancy = 'Maximum occupancy must be at least 1';
    }

    // Validate pet fee if pets are allowed
    if (formData.amenities.allowPets && formData.additionalFees.petFee < 0) {
      newErrors['additionalFees.petFee'] = 'Pet fee cannot be negative';
    }

    // Validate parking fee if parking is available
    if (formData.amenities.parking && formData.additionalFees.parkingFee < 0) {
      newErrors['additionalFees.parkingFee'] = 'Parking fee cannot be negative';
    }

    // Require at least one image
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
      // Prepare data with images
      const spaceDataToSave = {
        ...formData,
        images
      };

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
                placeholder="Enter street address"
              />
              {errors['address.street'] && <div className="error">{errors['address.street']}</div>}
            </div>
          </div>

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