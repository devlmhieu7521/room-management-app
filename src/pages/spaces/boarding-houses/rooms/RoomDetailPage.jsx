import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spaceService from '../../../../services/spaceService';
import meterReadingService from '../../../../services/meterReadingService';
import SpaceTenantsTab from '../../../components/spaces/SpaceTenantsTab';
import UtilitiesTab from '../../../../components/spaces/UtilitiesTab';
import '../../../../styles/space-detail.css';
import '../../../../styles/meter-readings.css';

const RoomDetailPage = () => {
  const { id, roomId } = useParams();
  const navigate = useNavigate();
  const [boardingHouse, setBoardingHouse] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [roomUtilities, setRoomUtilities] = useState(null);

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

        // Make sure room has a meterReadings object
        if (!roomData.meterReadings) {
          roomData.meterReadings = {
            electricity: [],
            water: []
          };
        }

        // Create a standalone utilities object for the room
        // Using direct data from the room rather than a complex ID approach
        const roomUtilitiesObj = {
          id: id, // Use the boarding house ID directly
          roomId: roomId, // Add roomId as a separate property
          name: `Room ${roomId}`,
          electricityPrice: roomData.electricityPrice || boardingHouseData.electricityPrice,
          waterPrice: roomData.waterPrice || boardingHouseData.waterPrice,
          // Include the room's meter readings directly
          meterReadings: roomData.meterReadings
        };

        setRoom(roomData);
        setRoomUtilities(roomUtilitiesObj);
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

  const handleDeleteRoom = () => {
    if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      deleteRoom();
    }
  };

  const deleteRoom = async () => {
    try {
      // Remove the room from the boarding house
      const updatedRooms = boardingHouse.rooms.filter(r => r.roomNumber !== roomId);
      const updatedBoardingHouse = {
        ...boardingHouse,
        rooms: updatedRooms
      };

      await spaceService.updateSpace(id, updatedBoardingHouse);
      navigate(`/spaces/boarding-houses/${id}`);
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Failed to delete room. Please try again.');
    }
  };

  const handleAssignTenant = () => {
    navigate(`/tenants/add?roomId=${roomId}&boardingHouseId=${id}`);
  };

  const handleRoomStatusChange = async (newStatus) => {
    try {
      // Update the room status
      const updatedRoom = { ...room, status: newStatus };
      const updatedRooms = boardingHouse.rooms.map(r =>
        r.roomNumber === roomId ? updatedRoom : r
      );

      const updatedBoardingHouse = {
        ...boardingHouse,
        rooms: updatedRooms
      };

      await spaceService.updateSpace(id, updatedBoardingHouse);
      setRoom(updatedRoom);
    } catch (error) {
      console.error('Error updating room status:', error);
      setError('Failed to update room status. Please try again.');
    }
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

  const calculateTotalRent = () => {
    let total = room.monthlyRent || 0;

    // Add additional fees if applicable
    if (room.amenities?.allowPets && room.additionalFees?.petFee) {
      total += room.additionalFees.petFee;
    }

    if (room.amenities?.parking && room.additionalFees?.parkingFee) {
      total += room.additionalFees.parkingFee;
    }

    // Add internet and cable TV fees if they exist
    if (room.internetFee) total += room.internetFee;
    if (room.cableTVFee) total += room.cableTVFee;

    return total;
  };

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
            {boardingHouse.name}, {boardingHouse.address.street}, {boardingHouse.address.district}
          </p>
          <div className="property-type-badge">
            Boarding House Room
          </div>
          <div className={`space-status-badge ${room.status}`}>
            {room.status}
          </div>
        </div>

        <div className="space-actions">
          <button className="btn-secondary" onClick={() => navigate(`/spaces/boarding-houses/${id}`)}>
            Back to Boarding House
          </button>
          <button className="btn-secondary" onClick={handleEditRoom}>
            Edit Room
          </button>
          <button className="btn-danger" onClick={handleDeleteRoom}>
            Delete Room
          </button>
        </div>
      </div>

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
          Billing History
        </button>
        <button
          className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Status
        </button>
      </div>

      <div className="space-detail-content">
        {activeTab === 'details' && (
          <div className="space-details-tab">
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
                {room.floor && (
                  <div className="detail-item">
                    <span className="detail-label">Floor</span>
                    <span className="detail-value">{room.floor}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Electricity Rate</span>
                  <span className="detail-value">{room.electricityPrice?.toLocaleString() || boardingHouse.electricityPrice?.toLocaleString()} VND/kWh</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Water Rate</span>
                  <span className="detail-value">{room.waterPrice?.toLocaleString() || boardingHouse.waterPrice?.toLocaleString()} VND/m³</span>
                </div>
              </div>
            </div>

            {room.internetFee > 0 || room.cableTVFee > 0 && (
              <div className="detail-section">
                <h3>Additional Services</h3>
                <div className="detail-grid">
                  {room.internetFee > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Internet Fee</span>
                      <span className="detail-value">{room.internetFee.toLocaleString()} VND/month</span>
                    </div>
                  )}
                  {room.cableTVFee > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Cable TV Fee</span>
                      <span className="detail-value">{room.cableTVFee.toLocaleString()} VND/month</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            <div className="detail-section">
              <h3>Financial Summary</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Base Rent</span>
                  <span className="detail-value">{room.monthlyRent?.toLocaleString() || 0} VND</span>
                </div>
                {room.internetFee > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Internet Fee</span>
                    <span className="detail-value">{room.internetFee.toLocaleString()} VND</span>
                  </div>
                )}
                {room.cableTVFee > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Cable TV Fee</span>
                    <span className="detail-value">{room.cableTVFee.toLocaleString()} VND</span>
                  </div>
                )}
                {room.amenities?.allowPets && room.additionalFees?.petFee > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Pet Fee</span>
                    <span className="detail-value">{room.additionalFees.petFee.toLocaleString()} VND</span>
                  </div>
                )}
                {room.amenities?.parking && room.additionalFees?.parkingFee > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Parking Fee</span>
                    <span className="detail-value">{room.additionalFees.parkingFee.toLocaleString()} VND</span>
                  </div>
                )}
                <div className="detail-item" style={{ fontWeight: 'bold' }}>
                  <span className="detail-label">Total Monthly Fixed Charges</span>
                  <span className="detail-value">{calculateTotalRent().toLocaleString()} VND</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Note</span>
                  <span className="detail-value">Electricity and water are charged based on actual consumption</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'utilities' && roomUtilities && (
          <UtilitiesTab space={roomUtilities} />
        )}

        {activeTab === 'tenants' && (
          <SpaceTenantsTab
            space={boardingHouse}
            isRoom={true}
            roomId={roomId}
            boardingHouseId={id}
          />
        )}

        {activeTab === 'billing' && (
          <div className="space-billing-tab">
            <div className="empty-tab-state">
              <h3>No Billing History</h3>
              <p>No invoices have been generated for this room yet.</p>
              <Link to="/invoices/create" className="btn-primary">
                Create Invoice
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="status-tab">
            <div className="detail-section">
              <h3>Room Status Management</h3>
              <p>Update the status of the room to reflect its current state.</p>

              <div className="current-status" style={{ marginBottom: '20px' }}>
                <h4>Current Status: <span className={`status-text ${room.status}`}>{room.status}</span></h4>
              </div>

              <div className="status-options">
                {room.status !== 'available' && (
                  <button
                    className="btn-success"
                    onClick={() => handleRoomStatusChange('available')}
                    style={{ marginRight: '10px' }}
                  >
                    Set as Available
                  </button>
                )}

                {room.status !== 'occupied' && (
                  <button
                    className="btn-warning"
                    onClick={() => handleRoomStatusChange('occupied')}
                    style={{ marginRight: '10px' }}
                  >
                    Set as Occupied
                  </button>
                )}

                {room.status !== 'maintenance' && (
                  <button
                    className="btn-danger"
                    onClick={() => handleRoomStatusChange('maintenance')}
                  >
                    Set as Maintenance
                  </button>
                )}
              </div>

              <div style={{ marginTop: '20px' }}>
                <h4>Status Descriptions:</h4>
                <ul style={{ marginLeft: '20px' }}>
                  <li><strong>Available</strong> - Room is ready for new tenants</li>
                  <li><strong>Occupied</strong> - Room is currently rented out</li>
                  <li><strong>Maintenance</strong> - Room is under repair or renovation</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDetailPage;