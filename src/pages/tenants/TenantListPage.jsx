import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import './TenantList.css';

const TenantListPage = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const data = await tenantService.getAllTenants();
        setTenants(data);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        setError('Failed to load tenants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const handleDeleteClick = (tenantId) => {
    setConfirmDelete(tenantId);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;

    try {
      await tenantService.deleteTenant(confirmDelete);
      setTenants(tenants.filter(tenant => tenant.id !== confirmDelete));
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setError('Failed to delete tenant. Please try again.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Apply filters to tenants
  const filteredTenants = tenants.filter(tenant => {
    // Filter by status
    if (filterStatus !== 'all' && tenant.status !== filterStatus) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
      const email = tenant.email.toLowerCase();
      const phone = tenant.phone_number.toLowerCase();
      const search = searchTerm.toLowerCase();

      return (
        fullName.includes(search) ||
        email.includes(search) ||
        phone.includes(search)
      );
    }

    return true;
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading tenants...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="container">
          <h1>Manage Tenants</h1>
          <p>View, create, edit, and manage your tenants.</p>
        </div>
      </div>

      <div className="container">
        <div className="tenant-list-container">
          <div className="tenant-list-header">
            <div className="tenant-actions">
              <Link to="/tenants/add" className="btn-primary">
                Add New Tenant
              </Link>
            </div>
            <div className="tenant-filters">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search by name, email, or phone"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <select
                className="status-filter"
                value={filterStatus}
                onChange={handleFilterChange}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {tenants.length === 0 ? (
            <div className="empty-state">
              <p>You haven't added any tenants yet.</p>
              <Link to="/tenants/add" className="btn-primary">
                Add Your First Tenant
              </Link>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="empty-state">
              <p>No tenants match your search or filter criteria.</p>
              <button
                className="btn-secondary"
                onClick={() => {
                  setFilterStatus('all');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="tenant-table-container">
              <table className="tenant-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact Info</th>
                    <th>Property</th>
                    <th>Lease Dates</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className={`tenant-row ${tenant.status}`}>
                      <td className="tenant-name">
                        <div className="tenant-avatar">
                          {tenant.first_name[0]}{tenant.last_name[0]}
                        </div>
                        <div className="tenant-name-text">
                          <span className="full-name">{tenant.first_name} {tenant.last_name}</span>
                          <span className="id-number">{tenant.identification?.type}: {tenant.identification?.number}</span>
                        </div>
                      </td>
                      <td className="tenant-contact">
                        <div className="email">{tenant.email}</div>
                        <div className="phone">{tenant.phone_number}</div>
                      </td>
                      <td className="tenant-property">
                        {tenant.space_id ? (
                          <>
                            <div className="property-name">
                              {tenant.space_type === 'apartment'
                                ? tenant.space_name
                                : `${tenant.boarding_house_name}, Room ${tenant.room_id}`}
                            </div>
                            <div className="property-type">
                              {tenant.space_type === 'apartment' ? 'Apartment' : 'Room'}
                            </div>
                          </>
                        ) : (
                          <span className="unassigned">Unassigned</span>
                        )}
                      </td>
                      <td className="tenant-dates">
                        <div>Start: {formatDate(tenant.start_date)}</div>
                        <div>End: {formatDate(tenant.end_date)}</div>
                      </td>
                      <td className="tenant-status">
                        <span className={`status-badge ${tenant.status}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="tenant-actions">
                        <Link
                          to={`/tenants/${tenant.id}`}
                          className="btn-action view"
                          title="View Details"
                        >
                          View
                        </Link>
                        <Link
                          to={`/tenants/edit/${tenant.id}`}
                          className="btn-action edit"
                          title="Edit Tenant"
                        >
                          Edit
                        </Link>
                        <button
                          className="btn-action delete"
                          onClick={() => handleDeleteClick(tenant.id)}
                          title="Delete Tenant"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete confirmation modal */}
        {confirmDelete && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this tenant? This will also remove them from any assigned space.</p>
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
      </div>
    </div>
  );
};

export default TenantListPage;