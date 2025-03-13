import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import spaceService from '../../services/spaceService';
import TenantRelationshipsTab from '../../components/tenants/TenantRelationshipsTab';
import '../../styles/TenantDetail.css';

const TenantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [spaceDetails, setSpaceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTenantDetails = async () => {
      try {
        setLoading(true);

        // Fetch tenant data
        const tenantData = await tenantService.getTenantById(id);
        setTenant(tenantData);

        // Fetch space details if tenant is assigned to a space
        if (tenantData.space_id) {
          if (tenantData.space_type === 'apartment') {
            const apartment = await spaceService.getSpaceById(tenantData.space_id);
            setSpaceDetails({
              type: 'apartment',
              data: apartment
            });
          } else if (tenantData.space_type === 'room' && tenantData.boarding_house_id) {
            const boardingHouse = await spaceService.getSpaceById(tenantData.boarding_house_id);
            const room = boardingHouse.rooms.find(r => r.roomNumber === tenantData.room_id);
            setSpaceDetails({
              type: 'room',
              data: room,
              boardingHouse: boardingHouse
            });
          }
        }
      } catch (error) {
        console.error('Error fetching tenant details:', error);
        setError('Failed to load tenant details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantDetails();
  }, [id]);

  // Handle edit button click
  const handleEditClick = () => {
    navigate(`/tenants/edit/${id}`);
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      await tenantService.deleteTenant(id);
      navigate('/tenants');
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setError('Failed to delete tenant. Please try again.');
    } finally {
      setConfirmDelete(false);
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setConfirmDelete(false);
  };

  // Handle end tenancy button click
  const handleEndTenancyClick = () => {
    setConfirmEnd(true);
  };

  // Handle end tenancy confirmation
  const handleEndTenancyConfirm = async () => {
    try {
      // Update tenant status to inactive and remove space assignment
      const updatedTenant = {
        ...tenant,
        status: 'inactive',
        space_id: null,
        space_type: null,
        room_id: null,
        boarding_house_id: null
      };

      await tenantService.updateTenant(id, updatedTenant);

      // Refresh the page to show the updated status
      window.location.reload();
    } catch (error) {
      console.error('Error ending tenancy:', error);
      setError('Failed to end tenancy. Please try again.');
    } finally {
      setConfirmEnd(false);
    }
  };

  // Handle end tenancy cancellation
  const handleEndTenancyCancel = () => {
    setConfirmEnd(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if the user is logged in
  const isAuthenticated = localStorage.getItem('authToken');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return <div className="loading-container">Loading tenant details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!tenant) {
    return <div className="error-container">Tenant not found.</div>;
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/tenants">Tenants</Link> &gt;
          <span> {tenant.first_name} {tenant.last_name}</span>
        </div>

        <div className="tenant-detail-container">
          <div className="tenant-detail-header">
            <div className="tenant-basic-info">
              <div className="tenant-avatar-large">
                {tenant.first_name[0]}{tenant.last_name[0]}
              </div>
              <div className="tenant-header-content">
                <h1>{tenant.first_name} {tenant.last_name}</h1>
                <div className="status-badge-container">
                  <span className={`status-badge ${tenant.status}`}>
                    {tenant.status}
                  </span>
                  <span className={`tenant-type-badge ${tenant.tenant_type}`}>
                    {tenant.tenant_type === 'main' ? 'Main' : 'Secondary'}
                  </span>
                </div>
                <div className="tenant-contact-info">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <span className="contact-value">{tenant.email}</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📱</span>
                    <span className="contact-value">{tenant.phone_number}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tenant-actions">
              <button
                className="btn-secondary"
                onClick={handleEditClick}
              >
                Edit Tenant
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteClick}
              >
                Delete Tenant
              </button>
            </div>
          </div>

          {/* Tenant Detail Tabs */}
          <div className="tenant-detail-tabs">
            <button
              className={`tenant-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tenant-tab ${activeTab === 'housing' ? 'active' : ''}`}
              onClick={() => setActiveTab('housing')}
            >
              Housing
            </button>
            <button
              className={`tenant-tab ${activeTab === 'relationships' ? 'active' : ''}`}
              onClick={() => setActiveTab('relationships')}
            >
              Relationships
            </button>
            <button
              className={`tenant-tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </button>
          </div>

          <div className="tenant-detail-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="tenant-overview-tab">
                <div className="tenant-detail-section">
                  <h2>Personal Information</h2>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">First Name</span>
                      <span className="detail-value">{tenant.first_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Name</span>
                      <span className="detail-value">{tenant.last_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{tenant.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{tenant.phone_number}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Tenant Type</span>
                      <span className="detail-value">{tenant.tenant_type === 'main' ? 'Main Tenant (Primary)' : 'Normal Tenant (Secondary)'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className="detail-value">{tenant.status}</span>
                    </div>
                  </div>
                </div>

                <div className="tenant-detail-section">
                  <h2>Identification</h2>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">ID Type</span>
                      <span className="detail-value">
                        {tenant.identification.type === 'national_id' ? 'National ID' :
                         tenant.identification.type === 'passport' ? 'Passport' :
                         tenant.identification.type === 'driver_license' ? 'Driver\'s License' :
                         tenant.identification.type || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">ID Number</span>
                      <span className="detail-value">{tenant.identification.number || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Issue Date</span>
                      <span className="detail-value">{formatDate(tenant.identification.issue_date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Expiry Date</span>
                      <span className="detail-value">{formatDate(tenant.identification.expiry_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="tenant-detail-section">
                  <h2>Emergency Contact</h2>

                  {tenant.emergency_contact && tenant.emergency_contact.name ? (
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Name</span>
                        <span className="detail-value">{tenant.emergency_contact.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Relationship</span>
                        <span className="detail-value">{tenant.emergency_contact.relationship || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone Number</span>
                        <span className="detail-value">{tenant.emergency_contact.phone_number || 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="no-data">No emergency contact information provided.</p>
                  )}
                </div>

                {tenant.notes && (
                  <div className="tenant-detail-section">
                    <h2>Notes</h2>
                    <div className="notes-content">
                      {tenant.notes}
                    </div>
                  </div>
                )}

                <div className="tenant-detail-section">
                  <h2>System Information</h2>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Created At</span>
                      <span className="detail-value">{formatDate(tenant.created_at)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Updated</span>
                      <span className="detail-value">{formatDate(tenant.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Housing Tab */}
            {activeTab === 'housing' && (
              <div className="tenant-housing-tab">
                <div className="tenant-detail-section">
                  <h2>Housing Assignment</h2>

                  {tenant.space_id ? (
                    <div className="housing-details">
                      <div className="housing-info">
                        <div className="housing-type">
                          {tenant.space_type === 'apartment' ? 'Apartment' : 'Room in Boarding House'}
                        </div>
                        <div className="housing-name">
                          {tenant.space_type === 'apartment'
                            ? tenant.space_name
                            : `${tenant.boarding_house_name}, Room ${tenant.room_id}`}
                        </div>
                        {spaceDetails && (
                          <div className="housing-meta">
                            {spaceDetails.type === 'apartment' ? (
                              <>Size: {spaceDetails.data.squareMeters} m² • Max Occupancy: {spaceDetails.data.maxOccupancy}</>
                            ) : (
                              <>Size: {spaceDetails.data.squareMeters} m² • Max Occupancy: {spaceDetails.data.maxOccupancy}</>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="lease-info">
                        <div className="lease-item">
                          <span className="lease-label">Lease Start:</span>
                          <span className="lease-value">{formatDate(tenant.start_date)}</span>
                        </div>
                        <div className="lease-item">
                          <span className="lease-label">Lease End:</span>
                          <span className="lease-value">{formatDate(tenant.end_date)}</span>
                        </div>
                        <div className="lease-item">
                          <span className="lease-label">Monthly Rent:</span>
                          <span className="lease-value">{tenant.rent_amount.toLocaleString()} VND</span>
                        </div>
                        <div className="lease-item">
                          <span className="lease-label">Security Deposit:</span>
                          <span className="lease-value">{tenant.security_deposit.toLocaleString()} VND</span>
                        </div>
                      </div>

                      <div className="housing-actions">
                        <button
                          className="btn-outline"
                          onClick={() => navigate(tenant.space_type === 'apartment'
                            ? `/spaces/apartments/${tenant.space_id}`
                            : `/spaces/boarding-houses/${tenant.boarding_house_id}/rooms/${tenant.room_id}`)}
                        >
                          View Space Details
                        </button>
                        <button
                          className="btn-danger"
                          onClick={handleEndTenancyClick}
                        >
                          End Tenancy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="no-housing">
                      <p>This tenant is not assigned to any housing.</p>
                      <button
                        className="btn-primary"
                        onClick={() => navigate(`/tenants/edit/${id}?tab=housing`)}
                      >
                        Assign Housing
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Relationships Tab */}
            {activeTab === 'relationships' && (
              <TenantRelationshipsTab tenant={tenant} />
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="tenant-documents-tab">
                <div className="empty-state">
                  <h3>No Documents Available</h3>
                  <p>This feature will be available in a future update.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete confirmation modal */}
        {confirmDelete && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this tenant? This will also remove them from any assigned space.</p>
              {tenant.tenant_type === 'main' && tenant.related_tenants && tenant.related_tenants.length > 0 && (
                <div className="warning-message">
                  <p>Warning: This tenant has {tenant.related_tenants.length} related tenant(s).
                  Upon deletion, these tenants will be converted to main tenants.</p>
                </div>
              )}
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={handleDeleteCancel}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* End tenancy confirmation modal */}
        {confirmEnd && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3>End Tenancy</h3>
              <p>Are you sure you want to end this tenancy? This will mark the tenant as inactive and make the space available for reassignment.</p>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={handleEndTenancyCancel}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={handleEndTenancyConfirm}
                >
                  End Tenancy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDetailPage;