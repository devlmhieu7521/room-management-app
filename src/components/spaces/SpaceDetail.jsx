import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spaceService from '../../services/spaceService';
import UtilitiesTab from './UtilitiesTab';
import '../../styles/space-detail.css';
import '../../styles/meter-readings.css';

const SpaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchSpaceDetails = async () => {
      try {
        setLoading(true);
        const spaceData = await spaceService.getSpaceById(id);
        setSpace(spaceData);
      } catch (error) {
        console.error('Error fetching space details:', error);
        setError('Failed to load space details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceDetails();
  }, [id]);



  const handleEditClick = () => {
    navigate(`/spaces/edit/${id}`);
  };

  const handleDeleteClick = () => {
    // This would typically show a confirmation dialog
    if (window.confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
      deleteSpace();
    }
  };

  const deleteSpace = async () => {
    try {
      await spaceService.deleteSpace(id);
      navigate('/spaces');
    } catch (error) {
      console.error('Error deleting space:', error);
      setError('Failed to delete space. Please try again.');
    }
  };

  const formatAddress = (address) => {
    return `${address.street}, ${address.ward}, ${address.district}, ${address.city}`;
  };

  const handleAddRoom = () => {
    navigate(`/spaces/edit/${id}?tab=rooms&action=add`);
  };

  if (loading) {
    return <div className="loading-container">Loading space details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!space) {
    return <div className="error-container">Space not found.</div>;
  }

  // Helper function to get amenity list
  const getAmenities = () => {
    const amenities = [];
    if (space.amenities.furniture) amenities.push('Furniture');
    if (space.amenities.tvCable) amenities.push('TV Cable');
    if (space.amenities.internet) amenities.push('Internet');
    if (space.amenities.airConditioner) amenities.push('Air Conditioner');
    if (space.amenities.waterHeater) amenities.push('Water Heater');
    if (space.amenities.allowPets) amenities.push('Pets Allowed');
    if (space.amenities.parking) amenities.push('Parking');
    if (space.amenities.security) amenities.push('Security');
    return amenities.length > 0 ? amenities : ['None'];
  };

  // Add a new "Rooms" tab for boarding houses
  const getTabs = () => {
    const tabs = [
      { id: 'details', label: 'Details' },
      { id: 'utilities', label: 'Utilities' },
      { id: 'tenants', label: 'Tenants' },
      { id: 'billing', label: 'Billing History' }
    ];

    // Add Rooms tab if it's a boarding house
    if (space.propertyType === 'boarding_house') {
      tabs.splice(1, 0, { id: 'rooms', label: 'Rooms' });
    }

    return tabs;
  };

  return (
    <div className="space-detail-container">
      <div className="space-detail-header">
        <div className="space-basic-info">
          <h1>{space.name}</h1>
          <p className="space-address">{formatAddress(space.address)}</p>
          <div className="property-type-badge">
            {space.propertyType === 'apartment' ? 'Apartment' : 'Boarding House'}
          </div>
          <div className={`space-status-badge ${space.status}`}>
            {space.status}
          </div>
        </div>

        <div className="space-actions">
          <button className="btn-secondary" onClick={handleEditClick}>
            Edit Space
          </button>
          <button className="btn-danger" onClick={handleDeleteClick}>
            Delete Space
          </button>
        </div>
      </div>

      <div className="space-image-gallery">
        {space.images && space.images.length > 0 ? (
          <div className="space-main-image">
            <img src={space.images[0].url} alt={space.name} />
          </div>
        ) : (
          <div className="space-no-image">
            <p>No images available</p>
          </div>
        )}

        {space.images && space.images.length > 1 && (
          <div className="space-thumbnails">
            {space.images.slice(1).map((image, index) => (
              <div key={index} className="space-thumbnail">
                <img src={image.url} alt={`${space.name} ${index + 2}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-detail-tabs">
        {getTabs().map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-detail-content">
        {activeTab === 'details' && (
          <div className="space-details-tab">
            <div className="detail-section">
              <h3>Property Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Property Type</span>
                  <span className="detail-value">
                    {space.propertyType === 'apartment' ? 'Apartment' : 'Boarding House'}
                  </span>
                </div>

                {space.propertyType === 'apartment' && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Size</span>
                      <span className="detail-value">{space.squareMeters} m²</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Maximum Occupancy</span>
                      <span className="detail-value">{space.maxOccupancy} people</span>
                    </div>
                  </>
                )}

                {space.propertyType === 'boarding_house' && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Total Rooms</span>
                      <span className="detail-value">{space.rooms ? space.rooms.length : 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Available Rooms</span>
                      <span className="detail-value">
                        {space.rooms ? space.rooms.filter(room => room.status === 'available').length : 0}
                      </span>
                    </div>
                  </>
                )}

                <div className="detail-item">
                  <span className="detail-label">Electricity Rate</span>
                  <span className="detail-value">{space.electricityPrice.toLocaleString()} VND/kWh</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Water Rate</span>
                  <span className="detail-value">{space.waterPrice.toLocaleString()} VND/m³</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Amenities</h3>
              <div className="amenities-list">
                {getAmenities().map((amenity, index) => (
                  <span key={index} className="amenity-tag">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {(space.amenities.allowPets || space.amenities.parking) && (
              <div className="detail-section">
                <h3>Additional Fees</h3>
                <div className="detail-grid">
                  {space.amenities.allowPets && (
                    <div className="detail-item">
                      <span className="detail-label">Pet Fee</span>
                      <span className="detail-value">
                        {space.additionalFees.petFee.toLocaleString()} VND/month
                      </span>
                    </div>
                  )}
                  {space.amenities.parking && (
                    <div className="detail-item">
                      <span className="detail-label">Parking Fee</span>
                      <span className="detail-value">
                        {space.additionalFees.parkingFee.toLocaleString()} VND/month
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="detail-section">
              <h3>System Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Created At</span>
                  <span className="detail-value">
                    {new Date(space.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Updated</span>
                  <span className="detail-value">
                    {new Date(space.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rooms tab for Boarding Houses */}
        {activeTab === 'rooms' && space.propertyType === 'boarding_house' && (
          <div className="space-rooms-tab">
            <div className="room-list-header">
              <h3>Rooms in this Boarding House</h3>
              <button className="btn-primary" onClick={() => navigate(`/spaces/edit/${id}`)}>
                Manage Rooms
              </button>
            </div>

            {!space.rooms || space.rooms.length === 0 ? (
            <div className="empty-tab-state">
                <h3>No Rooms Added Yet</h3>
                <p>Add rooms to your boarding house to start renting them out.</p>
                <button
                className="btn-primary"
                onClick={handleAddRoom}
                >
                Add Your First Room
                </button>
            </div>
            ) : (
              <div className="room-cards">
                {space.rooms.map((room, index) => (
                  <div key={index} className={`room-card ${room.status}`}>
                    {room.images && room.images.length > 0 && (
                      <div className="room-card-image">
                        <img src={room.images[0].url} alt={`Room ${room.roomNumber}`} />
                      </div>
                    )}
                    <div className="room-card-header">
                      <h3>Room {room.roomNumber}</h3>
                      <div className={`room-status-badge ${room.status}`}>
                        {room.status}
                      </div>
                    </div>
                    <div className="room-card-details">
                      <div className="room-detail">
                        <span className="room-detail-label">Size:</span>
                        <span className="room-detail-value">{room.squareMeters} m²</span>
                      </div>
                      <div className="room-detail">
                        <span className="room-detail-label">Max Occupancy:</span>
                        <span className="room-detail-value">{room.maxOccupancy} people</span>
                      </div>
                      {room.description && (
                        <div className="room-detail description">
                          <span className="room-detail-label">Description:</span>
                          <span className="room-detail-value">{room.description}</span>
                        </div>
                      )}
                    </div>
                    <div className="room-card-actions">
                      {room.status === 'available' ? (
                        <Link to={`/tenants/add?roomId=${room.roomNumber}&spaceId=${space.id}`} className="btn-primary">
                          Assign Tenant
                        </Link>
                      ) : (
                        <Link to="#" className="btn-secondary disabled">
                          View Tenant
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'utilities' && (
          <UtilitiesTab space={space} />
        )}

        {activeTab === 'tenants' && (
          <div className="space-tenants-tab">
            <div className="empty-tab-state">
              <h3>No Tenants Assigned Yet</h3>
              <p>You haven't assigned any tenants to this space.</p>
              <Link to="/tenants/add" className="btn-primary">
                Add Tenant
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-billing-tab">
            <div className="empty-tab-state">
              <h3>No Billing History</h3>
              <p>No invoices have been generated for this space yet.</p>
              <Link to="/invoices/create" className="btn-primary">
                Create Invoice
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceDetail;