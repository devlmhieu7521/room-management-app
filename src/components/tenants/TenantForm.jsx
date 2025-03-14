import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import '../../styles/TenantForm.css';

const TenantForm = ({
  editMode = false,
  initialTenantId = null,
  preselectedSpace = null,
  inModal = false,
  onTenantCreated = null,
  onCancel = null,
  mainTenantId = null
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [availableSpaces, setAvailableSpaces] = useState({ apartments: [], rooms: [] });
  const [mainTenants, setMainTenants] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [spaceType, setSpaceType] = useState('none');
  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [relatedTenants, setRelatedTenants] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

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
    tenant_type: 'main',
    main_tenant_id: null,
    related_tenants: [],
    relationship_type: null,
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
        // Get relationship types
        const relationshipTypeOptions = tenantService.getRelationshipTypes();
        setRelationshipTypes(relationshipTypeOptions);

        // Fetch available spaces
        const spaces = await tenantService.getAvailableSpaces();
        setAvailableSpaces(spaces);

        // Fetch main tenants for selection
        const mainTenantsData = await tenantService.getAllMainTenants();
        setMainTenants(mainTenantsData);

        // If in edit mode, fetch tenant data
        if (editMode && initialTenantId) {
          const tenant = await tenantService.getTenantById(initialTenantId);
          setFormData(tenant);

          // Set the space type based on tenant data
          if (tenant.space_id) {
            setSpaceType(tenant.space_type);
          }

          // If this is a main tenant, fetch related tenants
          if (tenant.tenant_type === 'main' && tenant.related_tenants && tenant.related_tenants.length > 0) {
            const relatedTenantsData = await Promise.all(
              tenant.related_tenants.map(id => tenantService.getTenantById(id))
            );
            setRelatedTenants(relatedTenantsData);
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
        // If a main tenant ID is provided (adding a related tenant)
        else if (mainTenantId) {
          const mainTenant = await tenantService.getTenantById(mainTenantId);
          setFormData(prev => ({
            ...prev,
            tenant_type: 'normal',
            main_tenant_id: mainTenantId,
            relationship_type: prev.relationship_type || 'roommate' // Default to roommate
          }));

          // Add the main tenant to our list in case they aren't loaded yet
          if (mainTenant && !mainTenantsData.some(t => t.id === mainTenantId)) {
            setMainTenants([...mainTenantsData, mainTenant]);
          }

          // If the main tenant has housing, automatically inherit it
          if (mainTenant.space_id) {
            setSpaceType(mainTenant.space_type);
            setFormData(prev => ({
              ...prev,
              space_id: mainTenant.space_id,
              space_type: mainTenant.space_type,
              space_name: mainTenant.space_name,
              rent_amount: mainTenant.rent_amount || 0,
              security_deposit: mainTenant.security_deposit || 0,
              start_date: mainTenant.start_date || '',
              end_date: mainTenant.end_date || ''
            }));

            if (mainTenant.space_type === 'room') {
              setFormData(prev => ({
                ...prev,
                room_id: mainTenant.room_id,
                boarding_house_id: mainTenant.boarding_house_id,
                boarding_house_name: mainTenant.boarding_house_name
              }));
            }
          }

          // Go to relationships tab first
          setActiveTab('relationships');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrors({ submit: 'Failed to load required data. Please try again.' });
      }
    };

    fetchData();
  }, [editMode, initialTenantId, preselectedSpace, mainTenantId]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

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
      // Special handling for tenant_type changes
      if (name === 'tenant_type') {
        // If changing to 'main', clear main_tenant_id and relationship_type
        if (value === 'main') {
          setFormData(prev => ({
            ...prev,
            tenant_type: value,
            main_tenant_id: null,
            relationship_type: null
          }));
        } else {
          // Just update the tenant_type otherwise
          setFormData(prev => ({
            ...prev,
            tenant_type: value
          }));
        }
      } else if (type === 'checkbox') {
        // Handle checkbox inputs
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      } else {
        // Handle regular inputs (text, number, select, etc.)
        const newValue = type === 'number' && value !== '' ? parseFloat(value) : value;
        setFormData(prev => ({
          ...prev,
          [name]: newValue
        }));
      }
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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
      boarding_house_id: '',
      boarding_house_name: ''
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
        rent_amount: selectedRoom.monthlyRent || 0
      }));
    }
  };

  // Handle main tenant selection (for related tenants)
  const handleMainTenantChange = async (e) => {
    const mainTenantId = e.target.value;

    if (!mainTenantId) {
      setFormData(prev => ({
        ...prev,
        main_tenant_id: null
      }));
      return;
    }

    try {
      // Get the selected main tenant
      const mainTenant = await tenantService.getTenantById(mainTenantId);

      setFormData(prev => ({
        ...prev,
        main_tenant_id: mainTenantId
      }));

      // If the user hasn't set housing yet, automatically inherit from the main tenant
      if (spaceType === 'none' && mainTenant.space_id) {
        setSpaceType(mainTenant.space_type);
        setFormData(prev => ({
          ...prev,
          space_id: mainTenant.space_id,
          space_type: mainTenant.space_type,
          space_name: mainTenant.space_name,
          rent_amount: mainTenant.rent_amount || 0,
          security_deposit: mainTenant.security_deposit || 0,
          start_date: mainTenant.start_date || '',
          end_date: mainTenant.end_date || ''
        }));

        if (mainTenant.space_type === 'room') {
          setFormData(prev => ({
            ...prev,
            room_id: mainTenant.room_id,
            boarding_house_id: mainTenant.boarding_house_id,
            boarding_house_name: mainTenant.boarding_house_name
          }));
        }

        // Set success message
        setSuccessMessage('Housing details automatically inherited from main tenant');

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error getting main tenant details:', error);
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    }

    // If tenant type is normal, validate related fields
    if (formData.tenant_type === 'normal') {
      if (!formData.main_tenant_id) {
        newErrors.main_tenant_id = 'Please select a main tenant';
      }
      if (!formData.relationship_type) {
        newErrors.relationship_type = 'Please select a relationship type';
      }
    }

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
      // Find the first error and switch to its tab
      if (errors.first_name || errors.last_name || errors.email || errors.phone_number) {
        setActiveTab('personal');
      } else if (errors.main_tenant_id || errors.relationship_type) {
        setActiveTab('relationships');
      } else if (errors.space_id || errors.room_id || errors.start_date || errors.end_date || errors.rent_amount) {
        setActiveTab('housing');
      } else if (errors['identification.number']) {
        setActiveTab('identification');
      }

      // Scroll to the first error
      const firstError = document.querySelector('.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      let tenantId;

      if (editMode) {
        await tenantService.updateTenant(initialTenantId, formData);
        tenantId = initialTenantId;
      } else {
        const newTenant = await tenantService.createTenant(formData);
        tenantId = newTenant.id;
      }

      // If in modal mode, call the callback
      if (inModal && onTenantCreated) {
        onTenantCreated(tenantId);
      } else {
        // Otherwise redirect to tenants list or tenant detail page
        navigate(editMode ? `/tenants/${tenantId}` : '/tenants');
      }
    } catch (error) {
      console.error('Error saving tenant:', error);
      setErrors({
        submit: 'Failed to save tenant. Please try again.'
      });
      window.scrollTo(0, 0); // Scroll to top to show the error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    if (inModal && onCancel) {
      onCancel();
    } else {
      navigate(editMode && initialTenantId ? `/tenants/${initialTenantId}` : '/tenants');
    }
  };

  // Set default dates if none provided
  useEffect(() => {
    if (spaceType !== 'none' && !formData.start_date) {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        start_date: today,
        end_date: nextYear
      }));
    }
  }, [spaceType, formData.start_date]);

  // Get main tenant name by ID
  const getMainTenantName = (id) => {
    const tenant = mainTenants.find(t => t.id === id);
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unknown';
  };

  // Simplified form for modal view
  if (inModal) {
    return (
      <div className="tenant-form-container" style={{ marginBottom: 0 }}>
        <div className="tenant-form" style={{ boxShadow: 'none', padding: 0 }}>
          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="form-section">
              <h4 style={{ marginTop: 0 }}>Personal Information</h4>
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

              {/* Tenant Type Selection - Even in modal we show this */}
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="tenant_type">Tenant Type*</label>
                  <select
                    id="tenant_type"
                    name="tenant_type"
                    value={formData.tenant_type}
                    onChange={handleChange}
                    disabled={!!mainTenantId} // Disable if coming from "Add Related Tenant"
                  >
                    <option value="main">Main Tenant (Primary)</option>
                    <option value="normal">Normal Tenant (Secondary)</option>
                  </select>
                  <small>Main: Primary tenant responsible for the lease. Normal: Secondary tenant related to a main tenant.</small>
                </div>

                {formData.tenant_type === 'normal' && (
                  <div className="form-group half">
                    <label htmlFor="main_tenant_id">Main Tenant*</label>
                    <select
                      id="main_tenant_id"
                      name="main_tenant_id"
                      value={formData.main_tenant_id || ''}
                      onChange={handleMainTenantChange}
                      disabled={!!mainTenantId} // Disable if coming from "Add Related Tenant"
                    >
                      <option value="">-- Select Main Tenant --</option>
                      {mainTenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.first_name} {tenant.last_name}
                        </option>
                      ))}
                    </select>
                    {errors.main_tenant_id && <div className="error">{errors.main_tenant_id}</div>}
                  </div>
                )}
              </div>

              {formData.tenant_type === 'normal' && (
                <div className="form-row">
                  <div className="form-group full">
                    <label htmlFor="relationship_type">Relationship to Main Tenant*</label>
                    <select
                      id="relationship_type"
                      name="relationship_type"
                      value={formData.relationship_type || ''}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Relationship --</option>
                      {relationshipTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.relationship_type && <div className="error">{errors.relationship_type}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Housing Assignment */}
            <div className="form-section">
              <h4>Housing Assignment</h4>
              {successMessage && (
                <div className="success-message">{successMessage}</div>
              )}
              {/* Housing details are pre-filled from preselectedSpace */}
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
            </div>

            {/* Identification (Required) */}
            <div className="form-section">
              <h4>Identification</h4>
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
            </div>

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
                  ? 'Saving...'
                  : 'Save Tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Full form for regular page view
  return (
    <div className="tenant-form-container">
      <div className="tenant-form">
        <h2>{editMode ? 'Edit Tenant' : 'Add New Tenant'}</h2>

        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}

        {successMessage && (
          <div className="success-message">{successMessage}</div>
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
            className={`tenant-tab ${activeTab === 'relationships' ? 'active' : ''}`}
            onClick={() => setActiveTab('relationships')}
          >
            Tenant Type & Relationships
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

          {/* Tenant Type & Relationships Tab */}
          {activeTab === 'relationships' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group full">
                  <label htmlFor="tenant_type">Tenant Type*</label>
                  <select
                    id="tenant_type"
                    name="tenant_type"
                    value={formData.tenant_type}
                    onChange={handleChange}
                    disabled={!!mainTenantId} // Disable if coming from "Add Related Tenant"
                  >
                    <option value="main">Main Tenant (Primary)</option>
                    <option value="normal">Normal Tenant (Secondary)</option>
                  </select>
                  <small>
                    Main tenants are primary responsible persons for the lease agreement.
                    Normal tenants are secondary tenants associated with a main tenant (e.g., spouse, roommate, dependent).
                  </small>
                </div>
              </div>

              {formData.tenant_type === 'normal' && (
                <>
                  <div className="form-row">
                    <div className="form-group full">
                      <label htmlFor="main_tenant_id">Main Tenant*</label>
                      <select
                        id="main_tenant_id"
                        name="main_tenant_id"
                        value={formData.main_tenant_id || ''}
                        onChange={handleMainTenantChange}
                        disabled={!!mainTenantId} // Disable if coming from "Add Related Tenant"
                      >
                        <option value="">-- Select Main Tenant --</option>
                        {mainTenants.map(tenant => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.first_name} {tenant.last_name}
                          </option>
                        ))}
                      </select>
                      {errors.main_tenant_id && <div className="error">{errors.main_tenant_id}</div>}
                      {formData.main_tenant_id && (
                        <small>
                          This tenant will be associated with {getMainTenantName(formData.main_tenant_id)}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full">
                      <label htmlFor="relationship_type">Relationship to Main Tenant*</label>
                      <select
                        id="relationship_type"
                        name="relationship_type"
                        value={formData.relationship_type || ''}
                        onChange={handleChange}
                      >
                        <option value="">-- Select Relationship --</option>
                        {relationshipTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.relationship_type && <div className="error">{errors.relationship_type}</div>}
                    </div>
                  </div>

                  {formData.main_tenant_id && (
                    <div className="relationship-info-box">
                      <div className="relationship-title">
                        <strong>Relationship Information</strong>
                      </div>
                      <div className="relationship-content">
                        <p>
                          This tenant will be recorded as the {formData.relationship_type ?
                            relationshipTypes.find(t => t.value === formData.relationship_type)?.label.toLowerCase() || 'related tenant'
                            : 'related tenant'} of {getMainTenantName(formData.main_tenant_id)}.
                        </p>
                        <p>
                          <strong>Note:</strong> Normal tenants may share the same housing as their main tenant
                          or be assigned to different housing.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {formData.tenant_type === 'main' && editMode && relatedTenants.length > 0 && (
                <div className="related-tenants-summary">
                  <h4>Related Tenants</h4>
                  <p>This main tenant has {relatedTenants.length} related tenant(s):</p>
                  <ul className="related-tenants-list">
                    {relatedTenants.map(tenant => (
                      <li key={tenant.id}>
                        {tenant.first_name} {tenant.last_name} - {
                          relationshipTypes.find(t => t.value === tenant.relationship_type)?.label || 'Unknown relationship'
                        }
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
