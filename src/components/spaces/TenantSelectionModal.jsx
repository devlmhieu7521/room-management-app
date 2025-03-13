/**
 * TenantSelectionModal Component
 *
 * This modal is used in the space detail view to assign a tenant to a specific space.
 * It shows available tenants, allows selecting a tenant, and setting lease details
 * before assigning the selected tenant to the space.
 *
 * Note: This is different from TenantAssignmentModal, which is used in tenant details
 * to assign a space to a specific tenant.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import TenantForm from '../tenants/TenantForm';
import '../../styles/modal.css';
import '../../styles/tenant.css';

const TenantSelectionModal = ({ isOpen, onClose, spaceId, roomId, boardingHouseId, onAssignTenant }) => {
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [availableTenants, setAvailableTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0], // Today's date
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 1 year from now
    rent_amount: 0,
    security_deposit: 0
  });

  useEffect(() => {
    const fetchAvailableTenants = async () => {
      try {
        setLoading(true);
        // Get all tenants
        const allTenants = await tenantService.getAllTenants();

        // Filter for tenants that don't have a space assignment or are inactive
        const unassignedTenants = allTenants.filter(tenant =>
          !tenant.space_id || tenant.status === 'inactive'
        );

        setAvailableTenants(unassignedTenants);
        setError(null);
      } catch (err) {
        console.error("Error fetching available tenants:", err);
        setError("Failed to load available tenants");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchAvailableTenants();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAssignTenant = async () => {
    if (!selectedTenant) return;

    try {
      // Prepare space assignment data for the tenant
      const updateData = {
        status: 'active',
        start_date: formData.start_date,
        end_date: formData.end_date,
        rent_amount: parseFloat(formData.rent_amount),
        security_deposit: parseFloat(formData.security_deposit)
      };

      if (roomId && boardingHouseId) {
        // Assigning to a room in a boarding house
        updateData.space_type = 'room';
        updateData.room_id = roomId;
        updateData.boarding_house_id = boardingHouseId;

        // Get the boarding house name
        try {
          const boardingHouse = await tenantService.getBoardingHouseName(boardingHouseId);
          updateData.boarding_house_name = boardingHouse.name;
        } catch (err) {
          console.warn("Could not fetch boarding house name:", err);
          updateData.boarding_house_name = "Boarding House";
        }
      } else if (spaceId) {
        // Assigning to an apartment
        updateData.space_type = 'apartment';
        updateData.space_id = spaceId;

        // Get the apartment name
        try {
          const apartment = await tenantService.getSpaceName(spaceId);
          updateData.space_name = apartment.name;
        } catch (err) {
          console.warn("Could not fetch apartment name:", err);
          updateData.space_name = "Apartment";
        }
      }

      // Update the tenant with space assignment
      await tenantService.updateTenant(selectedTenant.id, updateData);

      // Notify parent component
      if (onAssignTenant) {
        onAssignTenant(selectedTenant.id);
      }

      // Close the modal
      onClose();
    } catch (err) {
      console.error("Error assigning tenant:", err);
      setError("Failed to assign tenant");
    }
  };

  const handleTenantCreated = (newTenantId) => {
    // After creating a new tenant, close the modal and refresh the parent component
    if (onAssignTenant) {
      onAssignTenant(newTenantId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }}>
        {view === 'list' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Assign Tenant</h3>
              <div>
                <button
                  className="btn-primary"
                  onClick={() => setView('create')}
                >
                  Create New Tenant
                </button>
                <button
                  className="close-button"
                  onClick={onClose}
                  style={{ border: 'none', background: 'none', fontSize: '1.5rem', marginLeft: '10px' }}
                >
                  ×
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading available tenants...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : availableTenants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>No available tenants found. Create a new tenant to assign to this space.</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <p>Select a tenant to assign to this space:</p>
                </div>

                <div className="tenant-list" style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
                  {availableTenants.map(tenant => (
                    <div
                      key={tenant.id}
                      className={`tenant-item ${selectedTenant?.id === tenant.id ? 'selected' : ''}`}
                      style={{
                        padding: '10px',
                        border: `1px solid ${selectedTenant?.id === tenant.id ? '#4a6fdc' : '#e5e7eb'}`,
                        borderRadius: '4px',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        backgroundColor: selectedTenant?.id === tenant.id ? 'rgba(74, 111, 220, 0.1)' : 'white'
                      }}
                      onClick={() => setSelectedTenant(tenant)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="tenant-avatar">
                          {tenant.first_name[0]}{tenant.last_name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: '500' }}>{tenant.first_name} {tenant.last_name}</div>
                          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{tenant.email} • {tenant.phone_number}</div>
                          <div>
                            <span className={`status-badge ${tenant.status}`} style={{ marginTop: '5px' }}>
                              {tenant.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTenant && (
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
              </>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAssignTenant}
                disabled={!selectedTenant || loading}
              >
                Assign Tenant
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Create New Tenant</h3>
            <div style={{ marginTop: '10px', marginBottom: '20px' }}>
              <button
                className="btn-secondary"
                onClick={() => setView('list')}
                style={{ padding: '5px 10px' }}
              >
                Back to Tenant List
              </button>
            </div>

            <div style={{ maxHeight: 'calc(80vh - 150px)', overflow: 'auto' }}>
              <TenantForm
                inModal={true}
                preselectedSpace={{
                  spaceId: spaceId || null,
                  roomId: roomId || null,
                  boardingHouseId: boardingHouseId || null
                }}
                onTenantCreated={handleTenantCreated}
                onCancel={() => setView('list')}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TenantSelectionModal;