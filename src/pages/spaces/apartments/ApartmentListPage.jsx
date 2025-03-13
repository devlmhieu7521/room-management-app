import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SpaceListSwitcher from '../../../components/spaces/SpaceListSwitcher';
import spaceService from '../../../services/spaceService';
import authService from '../../../services/authService';

const ApartmentListPage = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        setLoading(true);
        const allSpaces = await spaceService.getAllSpaces(currentUser?.id);

        // Filter out only apartments
        const apartmentSpaces = allSpaces.filter(space => space.propertyType === 'apartment');
        setApartments(apartmentSpaces);
      } catch (error) {
        console.error('Error fetching apartments:', error);
        setError('Failed to load apartments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApartments();
  }, [currentUser?.id]);

  const handleDeleteClick = (spaceId) => {
    setConfirmDelete(spaceId);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;

    try {
      await spaceService.deleteSpace(confirmDelete);
      // Remove the deleted space from the list
      setApartments(apartments.filter(apartment => apartment.id !== confirmDelete));
    } catch (error) {
      console.error('Error deleting apartment:', error);
      setError('Failed to delete apartment. Please try again.');
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="container">
          <h1>Manage Your Apartments</h1>
          <p>View, create, edit, and manage your rental spaces.</p>
        </div>
      </div>

      <div className="container">
        {/* Space Type Switcher */}
        <SpaceListSwitcher activeType="apartments" />

        {loading ? (
          <div className="loading">Loading apartments...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="space-list-container">
            {apartments.length === 0 ? (
              <div className="empty-state">
                <p>You haven't created any apartments yet.</p>
                <Link to="/spaces/create" state={{ propertyType: 'apartment' }} className="btn">
                  Create Your First Apartment
                </Link>
              </div>
            ) : (
              <div className="space-grid">
                {apartments.map((apartment) => (
                  <div key={apartment.id} className="space-card">
                    <div className="space-card-header">
                      {apartment.images && apartment.images.length > 0 ? (
                        <img src={apartment.images[0].url} alt={apartment.name} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                      <div className={`space-card-status ${apartment.status}`}>
                        {apartment.status}
                      </div>
                      <div className="property-type-tag">
                        Apartment
                      </div>
                    </div>
                    <div className="space-card-body">
                      <h3 className="space-card-title">{apartment.name}</h3>
                      <p className="space-card-address">{formatAddress(apartment.address)}</p>

                      <div className="space-card-details">
                        <div className="space-card-detail-item">
                          <span className="space-card-detail-icon">📏</span>
                          <span className="space-card-detail-text">
                            {apartment.squareMeters} m²
                          </span>
                        </div>
                        <div className="space-card-detail-item">
                          <span className="space-card-detail-icon">👥</span>
                          <span className="space-card-detail-text">
                            Max {apartment.maxOccupancy} {apartment.maxOccupancy > 1 ? 'people' : 'person'}
                          </span>
                        </div>
                        <div className="space-card-detail-item">
                          <span className="space-card-detail-icon">⚡</span>
                          <span className="space-card-detail-text">
                            {apartment.electricityPrice.toLocaleString()} VND/kWh
                          </span>
                        </div>
                        <div className="space-card-detail-item">
                          <span className="space-card-detail-icon">💧</span>
                          <span className="space-card-detail-text">
                            {apartment.waterPrice.toLocaleString()} VND/m³
                          </span>
                        </div>
                      </div>

                      {getAmenityLabels(apartment.amenities).length > 0 && (
                        <div className="space-card-amenities">
                          {getAmenityLabels(apartment.amenities).map((label, index) => (
                            <span key={index} className="space-card-amenity">
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-card-footer">
                      <Link
                        to={`/spaces/detail/${apartment.id}`}
                        className="space-card-action view"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/spaces/edit/${apartment.id}`}
                        className="space-card-action edit"
                      >
                        Edit
                      </Link>
                      <button
                        className="space-card-action delete"
                        onClick={() => handleDeleteClick(apartment.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete confirmation modal */}
        {confirmDelete && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this apartment? This action cannot be undone.</p>
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

export default ApartmentListPage;