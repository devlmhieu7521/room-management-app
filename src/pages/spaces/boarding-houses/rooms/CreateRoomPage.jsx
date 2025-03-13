import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import RoomForm from '../../../../components/spaces/rooms/RoomForm';
import '../../../../styles/space.css';
import '../../../../styles/boarding-house-styles.css';
import '../../../../styles/modal.css';

const CreateRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Check if the user is logged in
  const isAuthenticated = localStorage.getItem('authToken');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="container">
          <h1>Add New Room</h1>
          <p>Create a new room in your boarding house property.</p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb">
          <Link to="/spaces/boarding-houses">Boarding Houses</Link> &gt;
          <Link to={`/spaces/boarding-houses/${id}`}> Boarding House</Link> &gt;
          <span> Add New Room</span>
        </div>

        <RoomForm boardingHouseId={id} />
      </div>
    </div>
  );
};

export default CreateRoomPage;