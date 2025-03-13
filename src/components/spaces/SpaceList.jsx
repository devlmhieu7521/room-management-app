import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import spaceService from '../../services/spaceService';
import authService from '../../services/authService';
import '../../styles/space.css';

const SpaceList = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const spacesData = await spaceService.getAllSpaces(currentUser?.id);
        setSpaces(spacesData);
      } catch (error) {
        console.error('Error fetching spaces:', error);
        setError('Failed to load spaces. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, [currentUser?.id]);

  const handleDeleteClick = (spaceId) => {
    setConfirmDelete(spaceId);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;

    try {
      await spaceService.deleteSpace(confirmDelete);
      // Remove the deleted space from the list
      setSpaces(spaces.filter(space => space.id !== confirmDelete));
    } catch (error) {
      console.error('Error deleting space:', error);
      setError('Failed to delete space. Please try again.');
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

  // Helper to get amenity labels
  const getAmenityLabels = (amenities) => {
    const labels = [];
    if (amenities.furniture) labels.push('Furniture');
    if (amenities.tvCable) labels.push('TV Cable');
    if (amenities.internet) labels.push('Internet');
    if (amenities.airConditioner) labels.push('A/C');
    if (amenities.waterHeater) labels.push('Water Heater');
    if (amenities.allowPets) labels.push('Pet Friendly');
    if (amenities.parking) labels.push('Parking');
    if (amenities.security) labels.push('Security');
    return labels;
  };

  if (loading) {
    return <div className="loading">Loading spaces...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="space-list-container">
      <div className="list-header">
        <h2>Your Spaces</h2>
        <Link to="/spaces/create" className="btn">
          Add New Space
        </Link>
      </div>

      {spaces.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any spaces yet.</p>
          <Link to="/spaces/create" className="btn">
            Create Your First Space
          </Link>
        </div>
      ) : (
        <div className="space-grid">
          {spaces.map((space) => (
            <div key={space.id} className="space-card">
              <div className="space-card-header">
                {space.images && space.images.length > 0 ? (
                  <img src={space.images[0].url} alt={space.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <div className={`space-card-status ${space.status}`}>
                  {space.status}
                </div>
                <div className="property-type-tag">
                  {space.propertyType === 'boarding_house' ? 'Boarding House' : 'Apartment'}
                </div>
              </div>
              <div className="space-card-body">
                <h3 className="space-card-title">{space.name}</h3>
                <p className="space-card-address">{formatAddress(space.address)}</p>

                <div className="space-card-details">
                  {space.propertyType === 'boarding_house' ? (
                    <>
                      <div className="space-card-detail-item">
                        <span className="space-card-detail-icon">🏠</span>
                        <span className="space-card-detail-text">
                          {space.rooms?.length || 0} rooms
                        </span>
                      </div>
                      <div className="space-card-detail-item">
                        <span className="space-card-detail-icon">🔑</span>
                        <span className="space-card-detail-text">
                          {space.rooms?.filter(room => room.status === 'available').length || 0} available
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-card-detail-item">
                        <span className="space-card-detail-icon">📏</span>
                        <span className="space-card-detail-text">
                          {space.squareMeters} m²
                        </span>
                      </div>
                      <div className="space-card-detail-item">
                        <span className="space-card-detail-icon">👥</span>
                        <span className="space-card-detail-text">
                          Max {space.maxOccupancy} {space.maxOccupancy > 1 ? 'people' : 'person'}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="space-card-detail-item">
                    <span className="space-card-detail-icon">⚡</span>
                    <span className="space-card-detail-text">
                      {space.electricityPrice.toLocaleString()} VND/kWh
                    </span>
                  </div>
                  <div className="space-card-detail-item">
                    <span className="space-card-detail-icon">💧</span>
                    <span className="space-card-detail-text">
                      {space.waterPrice.toLocaleString()} VND/m³
                    </span>
                  </div>
                </div>

                {getAmenityLabels(space.amenities).length > 0 && (
                  <div className="space-card-amenities">
                    {getAmenityLabels(space.amenities).map((label, index) => (
                      <span key={index} className="space-card-amenity">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-card-footer">
                <Link
                  to={`/spaces/detail/${space.id}`}
                  className="space-card-action view"
                >
                  View Details
                </Link>
                <Link
                  to={`/spaces/edit/${space.id}`}
                  className="space-card-action edit"
                >
                  Edit
                </Link>
                <button
                  className="space-card-action delete"
                  onClick={() => handleDeleteClick(space.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this space? This action cannot be undone.</p>
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
  );
};

export default SpaceList;