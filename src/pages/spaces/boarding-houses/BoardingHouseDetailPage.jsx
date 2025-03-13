import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spaceService from '../../../services/spaceService';

const BoardingHouseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boardingHouse, setBoardingHouse] = useState(null);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('roomNumber');

  useEffect(() => {
    const fetchBoardingHouseDetails = async () => {
      try {
        setLoading(true);
        const spaceData = await spaceService.getSpaceById(id);

        if (spaceData.propertyType !== 'boarding_house') {
          throw new Error('Not a boarding house');
        }

        setBoardingHouse(spaceData);

        // Initialize rooms with sorting
        const initialRooms = [...(spaceData.rooms || [])];
        sortRooms(initialRooms, sortBy);
        setFilteredRooms(initialRooms);
      } catch (error) {
        console.error('Error fetching boarding house details:', error);
        setError('Failed to load boarding house details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardingHouseDetails();
  }, [id]);

  useEffect(() => {
    if (!boardingHouse) return;

    // Apply filters and sorting whenever they change
    let rooms = [...(boardingHouse.rooms || [])];

    if (filter !== 'all') {
      rooms = rooms.filter(room => room.status === filter);
    }

    sortRooms(rooms, sortBy);
    setFilteredRooms(rooms);
  }, [filter, sortBy, boardingHouse]);

  const sortRooms = (rooms, criteria) => {
    switch (criteria) {
      case 'roomNumber':
        rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
        break;
      case 'rent-asc':
        rooms.sort((a, b) => (a.monthlyRent || 0) - (b.monthlyRent || 0));
        break;
      case 'rent-desc':
        rooms.sort((a, b) => (b.monthlyRent || 0) - (a.monthlyRent || 0));
        break;
      case 'size-asc':
        rooms.sort((a, b) => (a.squareMeters || 0) - (b.squareMeters || 0));
        break;
      case 'size-desc':
        rooms.sort((a, b) => (b.squareMeters || 0) - (a.squareMeters || 0));
        break;
      default:
        break;
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const formatAddress = (address) => {
    return `${address.street}, ${address.ward}, ${address.district}, ${address.city}`;
  };

  const getRoomStats = () => {
    const rooms = boardingHouse.rooms || [];
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(room => room.status === 'available').length;
    const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
    const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;

    return { totalRooms, availableRooms, occupiedRooms, maintenanceRooms };
  };

  // Helper to get amenity labels for a room
  const getAmenityLabels = (amenities) => {
    if (!amenities) return [];

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
    return <div className="loading-container">Loading boarding house details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!boardingHouse) {
    return <div className="error-container">Boarding house not found.</div>;
  }

  const stats = getRoomStats();

  return (
    <div className="space-detail-container">
      <div className="space-detail-header">
        <div className="space-basic-info">
          <h1>{boardingHouse.name}</h1>
          <p className="space-address">{formatAddress(boardingHouse.address)}</p>
          <div className="property-type-badge">
            Boarding House
          </div>
        </div>

        <div className="space-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate(`/spaces/boarding-houses/edit/${id}`)}
          >
            Edit Boarding House
          </button>
          <Link
            to={`/spaces/boarding-houses/${id}/rooms/create`}
            className="btn-primary"
          >
            Add New Room
          </Link>
        </div>
      </div>

      {/* Boarding House Images */}
      <div className="space-image-gallery">
        {boardingHouse.images && boardingHouse.images.length > 0 ? (
          <div className="space-main-image">
            <img src={boardingHouse.images[0].url} alt={boardingHouse.name} />
          </div>
        ) : (
          <div className="space-no-image">
            <p>No images available</p>
          </div>
        )}

        {boardingHouse.images && boardingHouse.images.length > 1 && (
          <div className="space-thumbnails">
            {boardingHouse.images.slice(1).map((image, index) => (
              <div key={index} className="space-thumbnail">
                <img src={image.url} alt={`${boardingHouse.name} ${index + 2}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boarding House Overview */}
      <div className="boarding-house-info">
        <h2>Boarding House Overview</h2>

        <div className="boarding-house-stats">
          <div className="stat-item">
            <div className="stat-value">{stats.totalRooms}</div>
            <div className="stat-label">Total Rooms</div>
          </div>
          <div className="stat-item" style={{ backgroundColor: "#dcfce7" }}>
            <div className="stat-value" style={{ color: "#16a34a" }}>{stats.availableRooms}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-item" style={{ backgroundColor: "#fef3c7" }}>
            <div className="stat-value" style={{ color: "#d97706" }}>{stats.occupiedRooms}</div>
            <div className="stat-label">Occupied</div>
          </div>
          <div className="stat-item" style={{ backgroundColor: "#fee2e2" }}>
            <div className="stat-value" style={{ color: "#dc2626" }}>{stats.maintenanceRooms}</div>
            <div className="stat-label">Maintenance</div>
          </div>
        </div>
      </div>

      {/* Rooms List */}
      <div className="space-rooms-tab">
        <div className="room-list-header">
          <h2>Rooms in this Boarding House</h2>
          <div>
            <select
              className="sort-dropdown"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="roomNumber">Sort by Room Number</option>
              <option value="rent-asc">Sort by Rent (Low to High)</option>
              <option value="rent-desc">Sort by Rent (High to Low)</option>
              <option value="size-asc">Sort by Size (Small to Large)</option>
              <option value="size-desc">Sort by Size (Large to Small)</option>
            </select>
          </div>
        </div>

        <div className="room-filter">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Rooms ({boardingHouse.rooms?.length || 0})
          </button>
          <button
            className={`filter-button available ${filter === 'available' ? 'active' : ''}`}
            onClick={() => handleFilterChange('available')}
          >
            Available ({stats.availableRooms})
          </button>
          <button
            className={`filter-button occupied ${filter === 'occupied' ? 'active' : ''}`}
            onClick={() => handleFilterChange('occupied')}
          >
            Occupied ({stats.occupiedRooms})
          </button>
          <button
            className={`filter-button maintenance ${filter === 'maintenance' ? 'active' : ''}`}
            onClick={() => handleFilterChange('maintenance')}
          >
            Maintenance ({stats.maintenanceRooms})
          </button>
        </div>

        {boardingHouse.rooms?.length === 0 ? (
          <div className="empty-tab-state">
            <h3>No Rooms Added Yet</h3>
            <p>Add rooms to your boarding house to start renting them out.</p>
            <Link
              to={`/spaces/boarding-houses/${id}/rooms/create`}
              className="btn-primary"
            >
              Add Your First Room
            </Link>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="empty-filter-state">
            <h3>No rooms match the current filter</h3>
            <p>Try changing your filter to see other rooms.</p>
          </div>
        ) : (
          <div className="room-grid">
            {filteredRooms.map((room, index) => (
              <div key={index} className={`room-card ${room.status}`}>
                {room.images && room.images.length > 0 ? (
                  <div className="room-card-image">
                    <img src={room.images[0].url} alt={`Room ${room.roomNumber}`} />
                  </div>
                ) : (
                  <div className="room-card-image">
                    <div className="no-image">No Image</div>
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
                    <span className="room-detail-label">Rent:</span>
                    <span className="room-detail-value">{room.monthlyRent?.toLocaleString() || 0} VND/month</span>
                  </div>
                  <div className="room-detail">
                    <span className="room-detail-label">Max Occupancy:</span>
                    <span className="room-detail-value">{room.maxOccupancy} people</span>
                  </div>

                  {getAmenityLabels(room.amenities).length > 0 && (
                    <div className="room-amenities">
                      {getAmenityLabels(room.amenities).slice(0, 3).map((amenity, i) => (
                        <span key={i} className="room-amenity-tag">{amenity}</span>
                      ))}
                      {getAmenityLabels(room.amenities).length > 3 && (
                        <span className="room-amenity-tag more">
                          +{getAmenityLabels(room.amenities).length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {room.description && (
                    <div className="room-detail description">
                      <span className="room-detail-value">
                        {room.description.length > 120
                          ? `${room.description.substring(0, 120)}...`
                          : room.description}
                      </span>
                    </div>
                  )}
                </div>
                <div className="room-card-actions">
                  <Link
                    to={`/spaces/boarding-houses/${id}/rooms/${room.roomNumber}`}
                    className="btn-secondary"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/spaces/boarding-houses/${id}/rooms/${room.roomNumber}/edit`}
                    className="btn-primary"
                  >
                    Edit Room
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardingHouseDetailPage;