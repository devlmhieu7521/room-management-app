import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import spaceService from '../services/spaceService';
import './Dashboard.css';
import tenantService from '../services/tenantService';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [info, setInfo] = useState({
    spaces: {
      apartments: [],
      boardingHouses: []
    },
    tenants: {
      active: 0,
      pending: 0,
      inactive: 0,
      total: 0
    }
  });
  const [loading, setLoading] = useState(true);

  // Update the useEffect function to fetch tenant stats as well
useEffect(() => {
    // Get current user
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    // Fetch data
    const fetchData = async () => {
      try {
        // Fetch spaces
        const spacesData = await spaceService.getAllSpaces(currentUser?.id);

        // Separate apartments and boarding houses
        const apartments = spacesData.filter(space => space.propertyType === 'apartment');
        const boardingHouses = spacesData.filter(space => space.propertyType === 'boarding_house');

        // Fetch tenants
        const tenantsData = await tenantService.getAllTenants();

        // Count tenants by status
        const activeCount = tenantsData.filter(tenant => tenant.status === 'active').length;
        const pendingCount = tenantsData.filter(tenant => tenant.status === 'pending').length;
        const inactiveCount = tenantsData.filter(tenant => tenant.status === 'inactive').length;

        setInfo({
          spaces: {
            apartments,
            boardingHouses
          },
          tenants: {
            active: activeCount,
            pending: pendingCount,
            inactive: inactiveCount,
            total: tenantsData.length
          }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate room stats for a boarding house
  const getRoomStats = (boardingHouse) => {
    const rooms = boardingHouse.rooms || [];
    const available = rooms.filter(room => room.status === 'available').length;
    const occupied = rooms.filter(room => room.status === 'occupied').length;
    const maintenance = rooms.filter(room => room.status === 'maintenance').length;
    return { available, occupied, maintenance };
  };

  // Calculate total statistics across all properties
  const getOverallStats = () => {
    // Count apartments by status
    const apartmentStats = {
      total: spaces.apartments.length,
      available: spaces.apartments.filter(apt => apt.status === 'available').length,
      occupied: spaces.apartments.filter(apt => apt.status === 'occupied').length,
      maintenance: spaces.apartments.filter(apt => apt.status === 'maintenance').length
    };

    // Count boarding house rooms by status
    const boardingHouseStats = {
      total: spaces.boardingHouses.length,
      rooms: {
        total: 0,
        available: 0,
        occupied: 0,
        maintenance: 0
      }
    };

    // Add up all rooms in all boarding houses
    spaces.boardingHouses.forEach(boardingHouse => {
      const rooms = boardingHouse.rooms || [];
      boardingHouseStats.rooms.total += rooms.length;
      boardingHouseStats.rooms.available += rooms.filter(room => room.status === 'available').length;
      boardingHouseStats.rooms.occupied += rooms.filter(room => room.status === 'occupied').length;
      boardingHouseStats.rooms.maintenance += rooms.filter(room => room.status === 'maintenance').length;
    });

    return {
      apartmentStats,
      boardingHouseStats
    };
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  const stats = getOverallStats();
  const totalProperties = stats.apartmentStats.total + stats.boardingHouseStats.total;
  const totalUnits = stats.apartmentStats.total + stats.boardingHouseStats.rooms.total;

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'Property Manager'}</h1>
        <p>Manage your rental properties and tenants from this dashboard.</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>Total Properties</h3>
            <p className="stat-number">{totalProperties}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <h3>Total Units</h3>
            <p className="stat-number">{totalUnits}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>Available</h3>
            <p className="stat-number">
              {stats.apartmentStats.available + stats.boardingHouseStats.rooms.available}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Occupied</h3>
            <p className="stat-number">
              {stats.apartmentStats.occupied + stats.boardingHouseStats.rooms.occupied}
            </p>
          </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
            <h3>Total Tenants</h3>
            <p className="stat-number">{stats.tenants.total}</p>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
            <h3>Active Tenants</h3>
            <p className="stat-number">{stats.tenants.active}</p>
            </div>
        </div>
      </div>
      <div className="dashboard-actions">
        <div className="action-card">
          <h3>Manage Properties</h3>
          <p>Create, edit, and manage your rental spaces.</p>
          <div className="action-links">
            <Link to="/spaces/apartments" className="btn-secondary">Apartments</Link>
            <Link to="/spaces/boarding-houses" className="btn-secondary">Boarding Houses</Link>
            <Link to="/spaces/apartments/create" className="btn-primary">Add New Property</Link>
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

      {totalProperties === 0 ? (
        <div className="empty-state-card">
          <h3>No Properties Yet</h3>
          <p>Start by creating your first rental property.</p>
          <div className="action-links">
            <Link to="/spaces/apartments/create" className="btn-primary">Create Apartment</Link>
            <Link to="/spaces/boarding-houses/create" className="btn-primary">Create Boarding House</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Recent Apartments Section */}
          {spaces.apartments.length > 0 && (
            <div className="recent-spaces">
              <div className="section-header">
                <h2>Recent Apartments</h2>
                <Link to="/spaces/apartments" className="view-all-link">View All</Link>
              </div>

              <div className="space-cards">
                {spaces.apartments.slice(0, 3).map(apartment => (
                  <div key={apartment.id} className="space-summary-card">
                    <div className="space-card-header">
                      {apartment.images && apartment.images.length > 0 ? (
                        <img src={apartment.images[0].url} alt={apartment.name} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                      <div className={`status-badge ${apartment.status}`}>
                        {apartment.status}
                      </div>
                    </div>
                    <div className="space-card-body">
                      <h3>{apartment.name}</h3>
                      <p>{apartment.address.street}, {apartment.address.district}</p>
                      <div className="space-details">
                        <span>{apartment.squareMeters} m² • Max {apartment.maxOccupancy} people</span>
                      </div>
                    </div>
                    <Link to={`/spaces/apartments/${apartment.id}`} className="card-link">
                      Manage
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Boarding Houses Section */}
          {spaces.boardingHouses.length > 0 && (
            <div className="recent-spaces">
              <div className="section-header">
                <h2>Recent Boarding Houses</h2>
                <Link to="/spaces/boarding-houses" className="view-all-link">View All</Link>
              </div>

              <div className="space-cards">
                {spaces.boardingHouses.slice(0, 3).map(boardingHouse => {
                  const roomStats = getRoomStats(boardingHouse);
                  const totalRooms = (boardingHouse.rooms || []).length;

                  return (
                    <div key={boardingHouse.id} className="space-summary-card">
                      <div className="space-card-header">
                        {boardingHouse.images && boardingHouse.images.length > 0 ? (
                          <img src={boardingHouse.images[0].url} alt={boardingHouse.name} />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </div>
                      <div className="space-card-body">
                        <h3>{boardingHouse.name}</h3>
                        <p>{boardingHouse.address.street}, {boardingHouse.address.district}</p>
                        <div className="space-details">
                          <span>{totalRooms} rooms • {roomStats.available} available</span>
                        </div>

                        {totalRooms > 0 && (
                          <div className="space-card-occupancy-bar">
                            <div
                              className="occupancy-segment available"
                              style={{width: `${(roomStats.available / totalRooms) * 100}%`}}
                            ></div>
                            <div
                              className="occupancy-segment occupied"
                              style={{width: `${(roomStats.occupied / totalRooms) * 100}%`}}
                            ></div>
                            <div
                              className="occupancy-segment maintenance"
                              style={{width: `${(roomStats.maintenance / totalRooms) * 100}%`}}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Link to={`/spaces/boarding-houses/${boardingHouse.id}`} className="card-link">
                        Manage
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;