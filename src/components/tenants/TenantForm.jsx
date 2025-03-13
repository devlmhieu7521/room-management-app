import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import '../../styles/TenantForm.css';

const TenantForm = ({ editMode = false, initialTenantId = null, preselectedSpace = null }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [availableSpaces, setAvailableSpaces] = useState({ apartments: [], rooms: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [spaceType, setSpaceType] = useState('none');

  // Initialize form data with empty values
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    space_id: '',
    space_type: '',
    room_id: '',
    boarding_house_id: '',
    start_date: '',
    end_date: '',
    rent_amount: 0,
    security_deposit: 0,
    emergency_contact: {
      name: '',
      relationship: '',
      phone_number: ''
    },
    identification: {
      type: 'national_id',
      number: '',
      issue_date: '',
      expiry_date: ''
    },
    notes: '',
    status: 'active'
  });

  // Load available spaces, tenant data if in edit mode, and preselected space if provided
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available spaces
        const spaces = await tenantService.getAvailableSpaces();
        setAvailableSpaces(spaces);

        // If in edit mode, fetch tenant data
        if (editMode && initialTenantId) {
          const tenant = await tenantService.getTenantById(initialTenantId);
          setFormData(tenant);

          // Set the space type based on tenant data
          if (tenant.space_id) {
            setSpaceType(tenant.space_type);
          }
        }
        // If a preselected space is provided
        else if (preselectedSpace) {
          if (preselectedSpace.spaceId) {
            // Preselected apartment
            setSpaceType('apartment');
            const apartment = spaces.apartments.find(apt => apt.id === preselectedSpace.spaceId);
            if (apartment) {
              setFormData(prev => ({
                ...prev,
                space_id: apartment.id,
                space_type: 'apartment',
                space_name: apartment.name,
                rent_amount: apartment.monthlyRent || 0
              }));
              // Automatically go to housing tab
              setActiveTab('housing');
            }
          } else if (preselectedSpace.roomId && preselectedSpace.boardingHouseId) {
            // Preselected room in boarding house
            setSpaceType('room');
            const room = spaces.rooms.find(r =>
              r.id === preselectedSpace.roomId &&
              r.boardingHouseId === preselectedSpace.boardingHouseId
            );
            if (room) {
              setFormData(prev => ({
                ...prev,
                space_id: room.id,
                space_type: 'room',
                room_id: room.id,
                boarding_house_id: room.boardingHouseId,
                boarding_house_name: room.boardingHouseName,
                rent_amount: room.monthlyRent || 0
              }));
              // Automatically go to housing tab
              setActiveTab('housing');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [editMode, initialTenantId, preselectedSpace]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested objects (emergency_contact and identification)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');

      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle space type change
  const handleSpaceTypeChange = (e) => {
    const type = e.target.value;
    setSpaceType(type);

    // Reset space-related fields
    setFormData(prev => ({
      ...prev,
      space_id: '',
      space_type: type === 'none' ? '' : type,
      room_id: '',
      boarding_house_id: ''
    }));
  };

  // Handle apartment selection
  const handleApartmentChange = (e) => {
    const apartmentId = e.target.value;
    const selectedApartment = availableSpaces.apartments.find(apt => apt.id === apartmentId);

    setFormData(prev => ({
      ...prev,
      space_id: apartmentId,
      space_type: 'apartment',
      space_name: selectedApartment ? selectedApartment.name : '',
      rent_amount: selectedApartment ? selectedApartment.monthlyRent : 0
    }));
  };

  // Handle room selection
  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    const selectedRoom = availableSpaces.rooms.find(room => room.id === roomId);

    if (selectedRoom) {
      setFormData(prev => ({
        ...prev,
        space_id: selectedRoom.id,
        space_type: 'room',
        room_id: selectedRoom.id,
        boarding_house_id: selectedRoom.boardingHouseId,
        boarding_house_name: selectedRoom.boardingHouseName,
        rent_amount: selectedRoom.monthlyRent
      }));
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';

    // If a space is selected, validate related fields
    if (spaceType !== 'none') {
      if (spaceType === 'apartment' && !formData.space_id) {
        newErrors.space_id = 'Please select an apartment';
      }

      if (spaceType === 'room' && !formData.room_id) {
        newErrors.room_id = 'Please select a room';
      }

      if (!formData.start_date) newErrors.start_date = 'Start date is required';
      if (!formData.end_date) newErrors.end_date = 'End date is required';

      // Ensure end date is after start date
      if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);

        if (end <= start) {
          newErrors.end_date = 'End date must be after start date';
        }
      }

      if (formData.rent_amount <= 0) newErrors.rent_amount = 'Rent amount must be greater than 0';
    }

    // Identification validation
    if (!formData.identification.number.trim()) {
      newErrors['identification.number'] = 'ID number is required';
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
      if (editMode) {
        await tenantService.updateTenant(initialTenantId, formData);
      } else {
        await tenantService.createTenant(formData);
      }

      // Redirect to tenants list
      navigate('/tenants');
    } catch (error) {
      console.error('Error saving tenant:', error);
      setErrors({
        submit: 'Failed to save tenant. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate('/tenants');
  };

  return (
    <div className="tenant-form-container">
      <div className="tenant-form">
        <h2>{editMode ? 'Edit Tenant' : 'Add New Tenant'}</h2>

        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}

        {/* Form Tabs */}
        <div className="tenant-form-tabs">
          <div
            className={`tenant-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Information
          </div>
          <div
            className={`tenant-tab ${activeTab === 'housing' ? 'active' : ''}`}
            onClick={() => setActiveTab('housing')}
          >
            Housing Assignment
          </div>
          <div
            className={`tenant-tab ${activeTab === 'emergency' ? 'active' : ''}`}
            onClick={() => setActiveTab('emergency')}
          >
            Emergency Contact
          </div>
          <div
            className={`tenant-tab ${activeTab === 'identification' ? 'active' : ''}`}
            onClick={() => setActiveTab('identification')}
          >
            Identification
          </div>
          <div
            className={`tenant-tab ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Notes & Status
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="first_name">First Name*</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && <div className="error">{errors.first_name}</div>}
                </div>

                <div className="form-group half">
                  <label htmlFor="last_name">Last Name*</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && <div className="error">{errors.last_name}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="email">Email Address*</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                  {errors.email && <div className="error">{errors.email}</div>}
                </div>

                <div className="form-group half">
                  <label htmlFor="phone_number">Phone Number*</label>
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                  {errors.phone_number && <div className="error">{errors.phone_number}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Housing Assignment Tab */}
          {activeTab === 'housing' && (
            <div className="form-section">
              <div className="form-group full">
                <label htmlFor="space_type">Housing Assignment Type</label>
                <select
                  id="space_type"
                  name="space_type_selector"
                  value={spaceType}
                  onChange={handleSpaceTypeChange}
                >
                  <option value="none">No Housing Assignment</option>
                  <option value="apartment">Apartment</option>
                  <option value="room">Room in Boarding House</option>
                </select>
                <small>Select the type of housing to assign to this tenant</small>
              </div>

              {spaceType === 'apartment' && (
                <div className="form-group full">
                  <label htmlFor="space_id">Select Apartment*</label>
                  <select
                    id="space_id"
                    name="space_id"
                    value={formData.space_id}
                    onChange={handleApartmentChange}
                  >
                    <option value="">-- Select an apartment --</option>
                    {availableSpaces.apartments.map(apt => (
                      <option key={apt.id} value={apt.id}>
                        {apt.name} ({apt.address}) - {apt.size}m² - {apt.monthlyRent.toLocaleString()} VND/month
                      </option>
                    ))}
                  </select>
                  {errors.space_id && <div className="error">{errors.space_id}</div>}
                  {availableSpaces.apartments.length === 0 && (
                    <small className="warning">No available apartments found. <a href="/spaces/apartments/create">Create a new apartment</a></small>
                  )}
                </div>
              )}

              {spaceType === 'room' && (
                <div className="form-group full">
                  <label htmlFor="room_id">Select Room*</label>
                  <select
                    id="room_id"
                    name="room_id"
                    value={formData.room_id}
                    onChange={handleRoomChange}
                  >
                    <option value="">-- Select a room --</option>
                    {availableSpaces.rooms.map(room => (
                      <option key={`${room.boardingHouseId}-${room.id}`} value={room.id}>
                        {room.boardingHouseName} - Room {room.id} ({room.size}m²) - {room.monthlyRent.toLocaleString()} VND/month
                      </option>
                    ))}
                  </select>
                  {errors.room_id && <div className="error">{errors.room_id}</div>}
                  {availableSpaces.rooms.length === 0 && (
                    <small className="warning">No available rooms found. <a href="/spaces/boarding-houses">Create or manage boarding houses</a></small>
                  )}
                </div>
              )}

              {spaceType !== 'none' && (
                <>
                  <div className="form-row">
                    <div className="form-group half">
                      <label htmlFor="start_date">Lease Start Date*</label>
                      <input
                        type="date"
                        id="start_date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                      />
                      {errors.start_date && <div className="error">{errors.start_date}</div>}
                    </div>

                    <div className="form-group half">
                      <label htmlFor="end_date">Lease End Date*</label>
                      <input
                        type="date"
                        id="end_date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                      />
                      {errors.end_date && <div className="error">{errors.end_date}</div>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label htmlFor="rent_amount">Monthly Rent (VND)*</label>
                      <input
                        type="number"
                        id="rent_amount"
                        name="rent_amount"
                        value={formData.rent_amount}
                        onChange={handleChange}
                        min="0"
                      />
                      {errors.rent_amount && <div className="error">{errors.rent_amount}</div>}
                    </div>

                    <div className="form-group half">
                      <label htmlFor="security_deposit">Security Deposit (VND)</label>
                      <input
                        type="number"
                        id="security_deposit"
                        name="security_deposit"
                        value={formData.security_deposit}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Emergency Contact Tab */}
          {activeTab === 'emergency' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group full">
                  <label htmlFor="emergency_contact.name">Emergency Contact Name</label>
                  <input
                    type="text"
                    id="emergency_contact.name"
                    name="emergency_contact.name"
                    value={formData.emergency_contact.name}
                    onChange={handleChange}
                    placeholder="Enter emergency contact name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="emergency_contact.relationship">Relationship</label>
                  <input
                    type="text"
                    id="emergency_contact.relationship"
                    name="emergency_contact.relationship"
                    value={formData.emergency_contact.relationship}
                    onChange={handleChange}
                    placeholder="E.g. Spouse, Parent, Sibling"
                  />
                </div>

                <div className="form-group half">
                  <label htmlFor="emergency_contact.phone_number">Phone Number</label>
                  <input
                    type="text"
                    id="emergency_contact.phone_number"
                    name="emergency_contact.phone_number"
                    value={formData.emergency_contact.phone_number}
                    onChange={handleChange}
                    placeholder="Enter emergency contact phone"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Identification Tab */}
          {activeTab === 'identification' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="identification.type">ID Type</label>
                  <select
                    id="identification.type"
                    name="identification.type"
                    value={formData.identification.type}
                    onChange={handleChange}
                  >
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="driver_license">Driver's License</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label htmlFor="identification.number">ID Number*</label>
                  <input
                    type="text"
                    id="identification.number"
                    name="identification.number"
                    value={formData.identification.number}
                    onChange={handleChange}
                    placeholder="Enter ID number"
                  />
                  {errors['identification.number'] && (
                    <div className="error">{errors['identification.number']}</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="identification.issue_date">Issue Date</label>
                  <input
                    type="date"
                    id="identification.issue_date"
                    name="identification.issue_date"
                    value={formData.identification.issue_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group half">
                  <label htmlFor="identification.expiry_date">Expiry Date</label>
                  <input
                    type="date"
                    id="identification.expiry_date"
                    name="identification.expiry_date"
                    value={formData.identification.expiry_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes & Status Tab */}
          {activeTab === 'notes' && (
            <div className="form-section">
              <div className="form-group full">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional notes about this tenant"
                  rows="4"
                />
              </div>

              <div className="form-group full">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
                <small>
                  Active: Tenant is currently occupying the space<br />
                  Pending: Tenant has been assigned but not moved in yet<br />
                  Inactive: Former tenant, no longer occupying any space
                </small>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (editMode ? 'Updating...' : 'Creating...')
                : (editMode ? 'Update Tenant' : 'Create Tenant')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantForm;