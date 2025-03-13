import React, { useState, useEffect } from 'react';
import tenantService from '../../services/tenantService';
import TenantForm from '../tenants/TenantForm';
import '../../styles/modal.css';
import '../../styles/tenant.css';

const TenantAssignmentModal = ({ isOpen, onClose, spaceId, roomId, boardingHouseId, onAssignTenant }) => {
  const [view, setView] = useState('list'); // 'list' or 'create'
  const [availableTenants, setAvailableTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleAssignTenant = async () => {
    if (!selectedTenant) return;

    try {
      // Prepare space assignment data
      const updateData = {
        status: 'active',
        start_date: new Date().toISOString().split('T')[0], // Today's date
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 1 year from now
      };

      if (roomId && boardingHouseId) {
        // Assigning to a room in a boarding house
        updateData.space_type = 'room';
        updateData.room_id = roomId;
        updateData.boarding_house_id = boardingHouseId;
        updateData.space_id = roomId; // Using room ID as space ID for rooms
      } else if (spaceId) {
        // Assigning to an apartment
        updateData.space_type = 'apartment';
        updateData.space_id = spaceId;
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
              <button
                className="btn-primary"
                onClick={() => setView('create')}
              >
                Create New Tenant
              </button>
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

                <div className="tenant-list" style={{ marginBottom: '20px' }}>
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

export default TenantAssignmentModal;