import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spaceService from '../../../../services/spaceService';

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
        </div>
      </div>

      {/* Room Details */}
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
        </div>
      </div>

      {room.description && (
        <div className="detail-section">
          <h3>Description</h3>
          <p className="room-description">{room.description}</p>
        </div>
      )}

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
    </div>
  );
};

export default RoomDetailPage;