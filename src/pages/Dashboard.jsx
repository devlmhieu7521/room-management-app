import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import spaceService from '../services/spaceService';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    // Fetch spaces
    const fetchSpaces = async () => {
      try {
        const spacesData = await spaceService.getAllSpaces(currentUser?.id);
        setSpaces(spacesData);
      } catch (error) {
        console.error('Error fetching spaces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'Property Manager'}</h1>
        <p>Manage your rental properties and tenants from this dashboard.</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <h3>Total Spaces</h3>
            <p className="stat-number">{spaces.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>Available</h3>
            <p className="stat-number">
              {spaces.filter(space => space.status === 'available').length}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Occupied</h3>
            <p className="stat-number">
              {spaces.filter(space => space.status === 'occupied').length}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <h3>Maintenance</h3>
            <p className="stat-number">
              {spaces.filter(space => space.status === 'maintenance').length}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h3>Manage Spaces</h3>
          <p>Create, edit, and manage your rental spaces.</p>
          <div className="action-links">
            <Link to="/spaces" className="btn-secondary">View All Spaces</Link>
            <Link to="/spaces/create" className="btn-primary">Add New Space</Link>
          </div>
        </div>

        <div className="action-card">
          <h3>Tenant Management</h3>
          <p>Manage tenant profiles and assignments.</p>
          <div className="action-links">
            <Link to="/tenants" className="btn-secondary">View All Tenants</Link>
            <Link to="/tenants/add" className="btn-primary">Add New Tenant</Link>
          </div>
        </div>

        <div className="action-card">
          <h3>Billing & Invoices</h3>
          <p>Generate and manage monthly invoices.</p>
          <div className="action-links">
            <Link to="/invoices" className="btn-secondary">View All Invoices</Link>
            <Link to="/invoices/create" className="btn-primary">Create New Invoice</Link>
          </div>
        </div>
      </div>

      {spaces.length === 0 ? (
        <div className="empty-state-card">
          <h3>No Spaces Yet</h3>
          <p>Start by creating your first rental space.</p>
          <Link to="/spaces/create" className="btn-primary">Create Space</Link>
        </div>
      ) : (
        <div className="recent-spaces">
          <div className="section-header">
            <h2>Recent Spaces</h2>
            <Link to="/spaces" className="view-all-link">View All</Link>
          </div>

          <div className="space-cards">
            {spaces.slice(0, 3).map(space => (
              <div key={space.id} className="space-summary-card">
                <div className="space-card-header">
                  {space.images && space.images.length > 0 ? (
                    <img src={space.images[0].url} alt={space.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <div className={`status-badge ${space.status}`}>
                    {space.status}
                  </div>
                </div>
                <div className="space-card-body">
                  <h3>{space.name}</h3>
                  <p>{space.address.street}, {space.address.district}</p>
                  <div className="space-details">
                    <span>{space.squareMeters} m² • Max {space.maxOccupancy} people</span>
                  </div>
                </div>
                <Link to={`/spaces/detail/${space.id}`} className="card-link">
                Manage
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;