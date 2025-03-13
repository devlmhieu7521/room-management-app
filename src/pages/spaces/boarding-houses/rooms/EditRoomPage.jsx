import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import RoomForm from '../../../../components/spaces/rooms/RoomForm';
import spaceService from '../../../../services/spaceService';
import '../../../../styles/space.css';
import '../../../../styles/boarding-house-styles.css';

const EditRoomPage = () => {
  const { id, roomId } = useParams();
  const navigate = useNavigate();
  const [boardingHouse, setBoardingHouse] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Check if the user is logged in
  const isAuthenticated = localStorage.getItem('authToken');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return <div className="loading-container">Loading room details...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="error-container">{error}</div>
          <Link to={`/spaces/boarding-houses/${id}`} className="button button--primary" style={{ marginTop: '20px' }}>
            Back to Boarding House
          </Link>
        </div>
      </div>
    );
  }

  if (!boardingHouse || !room) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="error-container">Room not found</div>
          <Link to={`/spaces/boarding-houses/${id}`} className="button button--primary" style={{ marginTop: '20px' }}>
            Back to Boarding House
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="container">
          <h1>Edit Room {roomId}</h1>
          <p>Update room details in {boardingHouse.name}</p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb">
          <Link to="/spaces/boarding-houses">Boarding Houses</Link> &gt;
          <Link to={`/spaces/boarding-houses/${id}`}> {boardingHouse.name}</Link> &gt;
          <Link to={`/spaces/boarding-houses/${id}/rooms/${roomId}`}> Room {roomId}</Link> &gt;
          <span> Edit</span>
        </div>

        <RoomForm
          boardingHouseId={id}
          existingRoom={room}
          defaultElectricityPrice={boardingHouse.electricityPrice || 2800}
          defaultWaterPrice={boardingHouse.waterPrice || 10000}
          onRoomUpdated={() => {
            navigate(`/spaces/boarding-houses/${id}/rooms/${roomId}`);
          }}
        />
      </div>
    </div>
  );
};

export default EditRoomPage;