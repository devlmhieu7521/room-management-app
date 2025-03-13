import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SpaceListSwitcher from '../../components/spaces/SpaceListSwitcher';
import spaceService from '../../services/spaceService';
import authService from '../../services/authService';

const BoardingHouseListPage = () => {
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const fetchBoardingHouses = async () => {
      try {
        setLoading(true);
        const allSpaces = await spaceService.getAllSpaces(currentUser?.id);

        // Filter out only boarding houses
        const boardingHouseSpaces = allSpaces.filter(space => space.propertyType === 'boarding_house');
        setBoardingHouses(boardingHouseSpaces);
      } catch (error) {
        console.error('Error fetching boarding houses:', error);
        setError('Failed to load boarding houses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardingHouses();
  }, [currentUser?.id]);

  const handleDeleteClick = (spaceId) => {
    setConfirmDelete(spaceId);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;

    try {
      await spaceService.deleteSpace(confirmDelete);
      // Remove the deleted space from the list
      setBoardingHouses(boardingHouses.filter(boardingHouse => boardingHouse.id !== confirmDelete));
    } catch (error) {
      console.error('Error deleting boarding house:', error);
      setError('Failed to delete boarding house. Please try again.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmDelete(null);
  };

  const formatAddress = (address) => {
    return `${address.street}, ${address.ward}, ${address.district}, ${address.city}`;
  };

  // Get room occupancy stats for a boarding house
  const getRoomStats = (boardingHouse) => {
    const rooms = boardingHouse.rooms || [];
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(room => room.status === 'available').length;
    const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
    const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;

    return { totalRooms, availableRooms, occupiedRooms, maintenanceRooms };
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="container">
          <h1>Manage Your Boarding Houses</h1>
          <p>View, create, edit, and manage your multi-room rental properties.</p>
        </div>
      </div>

      <div className="container">
        {/* Space Type Switcher */}
        <SpaceListSwitcher activeType="boarding-houses" />

        {loading ? (
          <div className="loading">Loading boarding houses...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="space-list-container">
            {boardingHouses.length === 0 ? (
              <div className="empty-state">
                <p>You haven't created any boarding houses yet.</p>
                <Link to="/spaces/boarding-houses/create" className="btn">
                  Create Your First Boarding House
                </Link>
              </div>
            ) : (
              <div className="space-grid">
                {boardingHouses.map((boardingHouse) => {
                  const { totalRooms, availableRooms, occupiedRooms, maintenanceRooms } = getRoomStats(boardingHouse);
                  return (
                    <div key={boardingHouse.id} className="space-card">
                      <div className="space-card-header">
                        {boardingHouse.images && boardingHouse.images.length > 0 ? (
                          <img src={boardingHouse.images[0].url} alt={boardingHouse.name} />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                        <div className={`space-card-status ${boardingHouse.status}`}>
                          {boardingHouse.status}
                        </div>
                        <div className="property-type-tag">
                          Boarding House
                        </div>
                      </div>
                      <div className="space-card-body">
                        <h3 className="space-card-title">{boardingHouse.name}</h3>
                        <p className="space-card-address">{formatAddress(boardingHouse.address)}</p>

                        <div className="space-card-details">
                          <div className="space-card-detail-item">
                            <span className="space-card-detail-icon">🏠</span>
                            <span className="space-card-detail-text">
                              {totalRooms} total rooms
                            </span>
                          </div>
                          <div className="space-card-detail-item">
                            <span className="space-card-detail-icon">🟢</span>
                            <span className="space-card-detail-text">
                              {availableRooms} available
                            </span>
                          </div>
                          <div className="space-card-detail-item">
                            <span className="space-card-detail-icon">👥</span>
                            <span className="space-card-detail-text">
                              {occupiedRooms} occupied
                            </span>
                          </div>
                          <div className="space-card-detail-item">
                            <span className="space-card-detail-icon">🔧</span>
                            <span className="space-card-detail-text">
                              {maintenanceRooms} maintenance
                            </span>
                          </div>
                        </div>

                        <div className="space-card-occupancy-bar">
                          <div
                            className="occupancy-segment available"
                            style={{
                              width: `${totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0}%`,
                              display: availableRooms > 0 ? 'block' : 'none'
                            }}
                            title={`${availableRooms} Available Rooms`}
                          ></div>
                          <div
                            className="occupancy-segment occupied"
                            style={{
                              width: `${totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0}%`,
                              display: occupiedRooms > 0 ? 'block' : 'none'
                            }}
                            title={`${occupiedRooms} Occupied Rooms`}
                          ></div>
                          <div
                            className="occupancy-segment maintenance"
                            style={{
                              width: `${totalRooms > 0 ? (maintenanceRooms / totalRooms) * 100 : 0}%`,
                              display: maintenanceRooms > 0 ? 'block' : 'none'
                            }}
                            title={`${maintenanceRooms} Rooms in Maintenance`}
                          ></div>
                        </div>
                      </div>

                      <div className="space-card-footer">
                        <Link
                          to={`/spaces/boarding-houses/${boardingHouse.id}`}
                          className="space-card-action view"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/spaces/boarding-houses/edit/${boardingHouse.id}`}
                          className="space-card-action edit"
                        >
                          Edit
                        </Link>
                        <button
                          className="space-card-action delete"
                          onClick={() => handleDeleteClick(boardingHouse.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Delete confirmation modal */}
        {confirmDelete && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this boarding house? All rooms and related data will be deleted. This action cannot be undone.</p>
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

export default BoardingHouseListPage;