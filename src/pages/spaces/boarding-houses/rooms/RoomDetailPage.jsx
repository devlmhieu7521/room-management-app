import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spaceService from '../../../../services/spaceService';
import UtilitiesTab from '../../../../components/spaces/UtilitiesTab';

const RoomDetailPage = () => {
  const { id, roomId } = useParams();
  const navigate = useNavigate();
  const [boardingHouse, setBoardingHouse] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchBoardingHouseAndRoom = async () => {
      try {
        setLoading(true);
        const boardingHouseData = await spaceService.getSpaceById(id);

        if (boardingHouseData.propertyType !== 'boarding_house') {
          throw new Error('Not a boarding house');
        }

        setBoardingHouse(boardingHouseData);

        // Find the specific room
        const roomData = boardingHouseData.rooms?.find(r => r.roomNumber === roomId);

        if (!roomData) {
          throw new Error('Room not found');
        }

        setRoom(roomData);
      } catch (error) {
        console.error('Error fetching boarding house or room:', error);
        setError('Failed to load room details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardingHouseAndRoom();
  }, [id, roomId]);

  const handleEditRoom = () => {
    navigate(`/spaces/boarding-houses/${id}/rooms/${roomId}/edit`);
  };

  const handleBackToBoardingHouse = () => {
    navigate(`/spaces/boarding-houses/${id}`);
  };

  // Helper to get amenity labels
  const getAmenityLabels = (amenities) => {
    if (!amenities) return [];

    const labels = [];
    if (amenities.furniture) labels.push('Furniture');
    if (amenities.tvCable) labels.push('TV Cable');
    if (amenities.internet) labels.push('Internet');
    if (amenities.airConditioner) labels.push('Air Conditioner');
    if (amenities.waterHeater) labels.push('Water Heater');
    if (amenities.allowPets) labels.push('Pet Friendly');
    if (amenities.parking) labels.push('Parking');
    if (amenities.security) labels.push('Security');
    return labels;
  };

  if (loading) {
    return <div className="loading-container">Loading room details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!boardingHouse || !room) {
    return <div className="error-container">Room not found.</div>;
  }

  return (
    <div className="space-detail-container">
      <div className="breadcrumb">
        <Link to="/spaces/boarding-houses">Boarding Houses</Link> &gt;
        <Link to={`/spaces/boarding-houses/${id}`}> {boardingHouse.name}</Link> &gt;
        <span> Room {roomId}</span>
      </div>

      <div className="space-detail-header">
        <div className="space-basic-info">
          <h1>Room {room.roomNumber}</h1>
          <p className="space-address">
            {boardingHouse.name}, {boardingHouse.address.street}
          </p>
          <div className={`room-status-badge ${room.status}`}>
            {room.status}
          </div>
        </div>

        <div className="space-actions">
          <button className="btn-secondary" onClick={handleBackToBoardingHouse}>
            Back to Boarding House
          </button>
          <button className="btn-primary" onClick={handleEditRoom}>
            Edit Room
          </button>
        </div>
      </div>

      {/* Room Images */}
      <div className="space-image-gallery">
        {room.images && room.images.length > 0 ? (
          <div className="space-main-image">
            <img src={room.images[0].url} alt={`Room ${room.roomNumber}`} />
          </div>
        ) : (
          <div className="space-no-image">
            <p>No images available</p>
          </div>
        )}

        {room.images && room.images.length > 1 && (
          <div className="space-thumbnails">
            {room.images.slice(1).map((image, index) => (
              <div key={index} className="space-thumbnail">
                <img src={image.url} alt={`Room ${room.roomNumber} ${index + 2}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="space-detail-tabs">
        <button
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`tab-button ${activeTab === 'utilities' ? 'active' : ''}`}
          onClick={() => setActiveTab('utilities')}
        >
          Utilities
        </button>
        <button
          className={`tab-button ${activeTab === 'tenants' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenants')}
        >
          Tenants
        </button>
        <button
          className={`tab-button ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-detail-content">
        {activeTab === 'details' && (
          <div className="room-details-tab">
            <div className="detail-section">
              <h3>Room Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Room Number</span>
                  <span className="detail-value">{room.roomNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{room.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Size</span>
                  <span className="detail-value">{room.squareMeters} m²</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Monthly Rent</span>
                  <span className="detail-value">{room.monthlyRent?.toLocaleString() || 0} VND</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Maximum Occupancy</span>
                  <span className="detail-value">{room.maxOccupancy} people</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Floor</span>
                  <span className="detail-value">{room.floor || '1'}</span>
                </div>
              </div>
            </div>

            {room.description && (
              <div className="detail-section">
                <h3>Description</h3>
                <p className="room-description">{room.description}</p>
              </div>
            )}

            <div className="detail-section">
              <h3>Utilities</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Electricity Rate</span>
                  <span className="detail-value">{room.electricityPrice?.toLocaleString() || boardingHouse.electricityPrice?.toLocaleString()} VND/kWh</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Water Rate</span>
                  <span className="detail-value">{room.waterPrice?.toLocaleString() || boardingHouse.waterPrice?.toLocaleString()} VND/m³</span>
                </div>
                {room.internetFee > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Internet Fee</span>
                    <span className="detail-value">{room.internetFee?.toLocaleString()} VND/month</span>
                  </div>
                )}
                {room.cableTVFee > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Cable TV Fee</span>
                    <span className="detail-value">{room.cableTVFee?.toLocaleString()} VND/month</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3>Amenities</h3>
              <div className="amenities-list">
                {getAmenityLabels(room.amenities).length > 0 ?
                  getAmenityLabels(room.amenities).map((amenity, index) => (
                    <span key={index} className="amenity-tag">
                      {amenity}
                    </span>
                  )) :
                  <span className="no-amenities">No amenities listed</span>
                }
              </div>
            </div>

            {(room.amenities?.allowPets || room.amenities?.parking) && (
              <div className="detail-section">
                <h3>Additional Fees</h3>
                <div className="detail-grid">
                  {room.amenities?.allowPets && room.additionalFees?.petFee > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Pet Fee</span>
                      <span className="detail-value">
                        {room.additionalFees.petFee.toLocaleString()} VND/month
                      </span>
                    </div>
                  )}
                  {room.amenities?.parking && room.additionalFees?.parkingFee > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Parking Fee</span>
                      <span className="detail-value">
                        {room.additionalFees.parkingFee.toLocaleString()} VND/month
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'utilities' && (
          <div className="room-utilities-tab">
            {/* We'll reuse the UtilitiesTab component but adapt it for room-specific data */}
            <div className="empty-tab-state">
              <h3>Utility Management Coming Soon</h3>
              <p>The ability to track room-specific utility consumption is coming in the next update.</p>
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="room-tenants-tab">
            {room.status === 'available' ? (
              <div className="empty-tab-state">
                <h3>No Tenant Assigned</h3>
                <p>This room is currently available for rent.</p>
                <Link to="/tenants/add" className="btn-primary">
                  Assign Tenant
                </Link>
              </div>
            ) : room.status === 'maintenance' ? (
              <div className="empty-tab-state">
                <h3>Room Under Maintenance</h3>
                <p>This room is currently under maintenance and not available for tenants.</p>
              </div>
            ) : (
              <div className="empty-tab-state">
                <h3>Tenant Management Coming Soon</h3>
                <p>The ability to manage tenant details for this room is coming in the next update.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="room-billing-tab">
            <div className="empty-tab-state">
              <h3>No Billing History</h3>
              <p>No invoices have been generated for this room yet.</p>
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

export default RoomDetailPage;