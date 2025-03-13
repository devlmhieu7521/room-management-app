/**
 * TenantAssignmentModal Component
 *
 * This modal is used in the tenant detail view to assign a space (apartment or room) to a tenant.
 * It shows available spaces, allows selecting a space type (apartment or room), and
 * setting lease details before assigning the tenant to the selected space.
 *
 * Note: This is different from TenantSelectionModal, which is used in space details to
 * assign tenants to a specific space.
 */

import React, { useState, useEffect } from 'react';
import tenantService from '../../services/tenantService';
import '../../styles/modal.css';
import '../../styles/tenant.css';

const TenantAssignmentModal = ({ isOpen, onClose, tenantId, onAssignSpace }) => {
  const [view, setView] = useState('list'); // 'list' or 'assign'
  const [availableSpaces, setAvailableSpaces] = useState({ apartments: [], rooms: [] });
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [spaceType, setSpaceType] = useState('apartment'); // 'apartment' or 'room'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0], // Today's date
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 1 year from now
    rent_amount: 0,
    security_deposit: 0
  });

  // Fetch available spaces when modal opens
  useEffect(() => {
    const fetchAvailableSpaces = async () => {
      try {
        setLoading(true);
        const spaces = await tenantService.getAvailableSpaces();
        setAvailableSpaces(spaces);
        setError(null);
      } catch (err) {
        console.error("Error fetching available spaces:", err);
        setError("Failed to load available spaces");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchAvailableSpaces();
    }
  }, [isOpen]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle space type selection
  const handleSpaceTypeChange = (type) => {
    setSpaceType(type);
    setSelectedSpace(null); // Reset selection when changing space type
  };

  // Handle apartment selection
  const handleApartmentSelect = (apartment) => {
    setSelectedSpace(apartment);
    setFormData(prev => ({
      ...prev,
      rent_amount: apartment.monthlyRent || 0
    }));
  };

  // Handle room selection
  const handleRoomSelect = (room) => {
    setSelectedSpace(room);
    setFormData(prev => ({
      ...prev,
      rent_amount: room.monthlyRent || 0
    }));
  };

  // Handle assignment confirmation
  const handleAssignSpace = async () => {
    if (!selectedSpace || !tenantId) return;

    try {
      // Prepare update data based on space type
      const updateData = {
        start_date: formData.start_date,
        end_date: formData.end_date,
        rent_amount: parseFloat(formData.rent_amount),
        security_deposit: parseFloat(formData.security_deposit),
        status: 'active'
      };

      if (spaceType === 'apartment') {
        updateData.space_type = 'apartment';
        updateData.space_id = selectedSpace.id;
        updateData.space_name = selectedSpace.name;
      } else {
        updateData.space_type = 'room';
        updateData.room_id = selectedSpace.id;
        updateData.boarding_house_id = selectedSpace.boardingHouseId;
        updateData.boarding_house_name = selectedSpace.boardingHouseName;
      }

      // Update the tenant with the space assignment
      await tenantService.updateTenant(tenantId, updateData);

      // Notify parent component and close modal
      if (onAssignSpace) {
        onAssignSpace();
      }
      onClose();
    } catch (err) {
      console.error("Error assigning space to tenant:", err);
      setError("Failed to assign space to tenant. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Assign Housing to Tenant</h3>
          <button className="close-button" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem' }}>
            ×
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading available spaces...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            {/* Space Type Selection */}
            <div className="space-type-tabs" style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <div
                className={`space-type-tab ${spaceType === 'apartment' ? 'active' : ''}`}
                onClick={() => handleSpaceTypeChange('apartment')}
                style={{
                  padding: '10px 20px',
                  cursor: 'pointer',
                  borderBottom: spaceType === 'apartment' ? '2px solid #4a6fdc' : '2px solid transparent',
                  color: spaceType === 'apartment' ? '#4a6fdc' : '#6b7280'
                }}
              >
                Apartments ({availableSpaces.apartments.length})
              </div>
              <div
                className={`space-type-tab ${spaceType === 'room' ? 'active' : ''}`}
                onClick={() => handleSpaceTypeChange('room')}
                style={{
                  padding: '10px 20px',
                  cursor: 'pointer',
                  borderBottom: spaceType === 'room' ? '2px solid #4a6fdc' : '2px solid transparent',
                  color: spaceType === 'room' ? '#4a6fdc' : '#6b7280'
                }}
              >
                Rooms ({availableSpaces.rooms.length})
              </div>
            </div>

            {/* Apartments List */}
            {spaceType === 'apartment' && (
              <>
                {availableSpaces.apartments.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <p>No available apartments found.</p>
                    <a href="/spaces/apartments/create" className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Create New Apartment</a>
                  </div>
                ) : (
                  <div className="space-list">
                    <p>Select an apartment to assign to this tenant:</p>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
                      {availableSpaces.apartments.map(apartment => (
                        <div
                          key={apartment.id}
                          className={`space-item ${selectedSpace?.id === apartment.id ? 'selected' : ''}`}
                          style={{
                            padding: '15px',
                            border: `1px solid ${selectedSpace?.id === apartment.id ? '#4a6fdc' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            marginBottom: '15px',
                            cursor: 'pointer',
                            backgroundColor: selectedSpace?.id === apartment.id ? 'rgba(74, 111, 220, 0.1)' : 'white',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => handleApartmentSelect(apartment)}
                        >
                          <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '5px' }}>{apartment.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.9rem', color: '#4b5563' }}>
                            <span>📍 {apartment.address}</span>
                            <span>📏 {apartment.size} m²</span>
                            <span>👥 Max Occupancy: {apartment.maxOccupancy}</span>
                            <span>💰 {apartment.monthlyRent?.toLocaleString() || 0} VND/month</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Rooms List */}
            {spaceType === 'room' && (
              <>
                {availableSpaces.rooms.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <p>No available rooms found.</p>
                    <a href="/spaces/boarding-houses" className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Manage Boarding Houses</a>
                  </div>
                ) : (
                  <div className="space-list">
                    <p>Select a room to assign to this tenant:</p>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
                      {availableSpaces.rooms.map(room => (
                        <div
                          key={`${room.boardingHouseId}-${room.id}`}
                          className={`space-item ${selectedSpace?.id === room.id ? 'selected' : ''}`}
                          style={{
                            padding: '15px',
                            border: `1px solid ${selectedSpace?.id === room.id ? '#4a6fdc' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            marginBottom: '15px',
                            cursor: 'pointer',
                            backgroundColor: selectedSpace?.id === room.id ? 'rgba(74, 111, 220, 0.1)' : 'white',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => handleRoomSelect(room)}
                        >
                          <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '5px' }}>
                            {room.boardingHouseName} - Room {room.id}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.9rem', color: '#4b5563' }}>
                            <span>📍 {room.address}</span>
                            <span>📏 {room.size} m²</span>
                            <span>👥 Max Occupancy: {room.maxOccupancy}</span>
                            <span>💰 {room.monthlyRent?.toLocaleString() || 0} VND/month</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Lease Details Section (shown when a space is selected) */}
            {selectedSpace && (
              <div className="lease-details" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Lease Details</h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Lease Start Date*</label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Lease End Date*</label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Monthly Rent (VND)*</label>
                    <input
                      type="number"
                      name="rent_amount"
                      value={formData.rent_amount}
                      onChange={handleChange}
                      min="0"
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Security Deposit (VND)</label>
                    <input
                      type="number"
                      name="security_deposit"
                      value={formData.security_deposit}
                      onChange={handleChange}
                      min="0"
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAssignSpace}
                disabled={!selectedSpace}
              >
                Assign Space
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TenantAssignmentModal;