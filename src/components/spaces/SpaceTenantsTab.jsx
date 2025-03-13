import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import TenantAssignmentModal from './TenantAssignmentModal';
import '../../styles/SpaceTenantsTab.css';

const SpaceTenantsTab = ({ space, isRoom = false, roomId = null, boardingHouseId = null }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTenants = async () => {
    try {
      setLoading(true);

      // For apartments, fetch by space_id
      // For rooms, fetch by boarding_house_id and room_id
      let spaceTenants = [];

      if (isRoom) {
        // Get all tenants and filter for this room
        const allTenants = await tenantService.getAllTenants();
        spaceTenants = allTenants.filter(tenant =>
          tenant.space_type === 'room' &&
          tenant.boarding_house_id === boardingHouseId &&
          tenant.room_id === roomId &&
          tenant.status === 'active'
        );
      } else {
        // Get all tenants and filter for this apartment
        const allTenants = await tenantService.getAllTenants();
        spaceTenants = allTenants.filter(tenant =>
          tenant.space_type === 'apartment' &&
          tenant.space_id === space.id &&
          tenant.status === 'active'
        );
      }

      setTenants(spaceTenants);
      setError(null);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to load tenant information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [space.id, isRoom, roomId, boardingHouseId]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleTenantAssigned = () => {
    // Refresh the tenant list after assignment
    fetchTenants();
  };

  if (loading) {
    return <div className="loading">Loading tenant information...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // If no tenants found, show the empty state
  if (tenants.length === 0) {
    return (
      <div className="empty-tab-state">
        <h3>No Tenants Assigned</h3>
        <p>This {isRoom ? 'room' : 'apartment'} doesn't have any tenants assigned yet.</p>
        <button
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Assign Tenant
        </button>

        {/* Tenant Assignment Modal */}
        <TenantAssignmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          spaceId={isRoom ? null : space.id}
          roomId={isRoom ? roomId : null}
          boardingHouseId={isRoom ? boardingHouseId : null}
          onAssignTenant={handleTenantAssigned}
        />
      </div>
    );
  }

  return (
    <div className="space-tenants-tab">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Assign Additional Tenant
        </button>

        {/* Tenant Assignment Modal */}
        <TenantAssignmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          spaceId={isRoom ? null : space.id}
          roomId={isRoom ? roomId : null}
          boardingHouseId={isRoom ? boardingHouseId : null}
          onAssignTenant={handleTenantAssigned}
        />
      </div>

      {tenants.map(tenant => (
        <div key={tenant.id} className="tenant-card">
          <div className="tenant-card-header">
            <div className="tenant-avatar">
              {tenant.first_name[0]}{tenant.last_name[0]}
            </div>
            <div className="tenant-name-container">
              <h3>{tenant.first_name} {tenant.last_name}</h3>
              <span className={`status-badge ${tenant.status}`}>
                {tenant.status}
              </span>
            </div>
          </div>

          <div className="tenant-card-body">
            <div className="tenant-contact-details">
              <div className="contact-group">
                <div className="contact-label">Email:</div>
                <div className="contact-value">{tenant.email}</div>
              </div>
              <div className="contact-group">
                <div className="contact-label">Phone:</div>
                <div className="contact-value">{tenant.phone_number}</div>
              </div>
            </div>

            <div className="tenant-lease-details">
              <div className="lease-group">
                <div className="lease-label">Lease Period:</div>
                <div className="lease-value">
                  {formatDate(tenant.start_date)} - {formatDate(tenant.end_date)}
                </div>
              </div>
              <div className="lease-group">
                <div className="lease-label">Monthly Rent:</div>
                <div className="lease-value">{tenant.rent_amount.toLocaleString()} VND</div>
              </div>
              <div className="lease-group">
                <div className="lease-label">Security Deposit:</div>
                <div className="lease-value">{tenant.security_deposit.toLocaleString()} VND</div>
              </div>
            </div>

            {tenant.notes && (
              <div className="tenant-notes">
                <div className="notes-label">Notes:</div>
                <div className="notes-content">{tenant.notes}</div>
              </div>
            )}
          </div>

          <div className="tenant-card-footer">
            <Link to={`/tenants/${tenant.id}`} className="btn-secondary">
              View Tenant Details
            </Link>
            <Link to={`/tenants/edit/${tenant.id}`} className="btn-primary">
              Edit Tenant
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SpaceTenantsTab;