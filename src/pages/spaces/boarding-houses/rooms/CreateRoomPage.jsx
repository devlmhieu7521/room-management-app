import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spaceService from '../../../../services/spaceService';
import RoomForm from '../../../../components/spaces/rooms/RoomForm';

const CreateRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boardingHouse, setBoardingHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoardingHouse = async () => {
      try {
        setLoading(true);
        const data = await spaceService.getSpaceById(id);

        if (data.propertyType !== 'boarding_house') {
          throw new Error('Not a boarding house');
        }

        setBoardingHouse(data);
      } catch (error) {
        console.error('Error fetching boarding house:', error);
        setError('Failed to load boarding house. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardingHouse();
  }, [id]);

  const handleRoomCreated = () => {
    // Navigate back to the boarding house detail page
    navigate(`/spaces/boarding-houses/${id}`);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!boardingHouse) {
    return <div className="error-container">Boarding house not found.</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="container">
          <h1>Add New Room</h1>
          <p>Create a new room in {boardingHouse.name}</p>
        </div>
      </div>

      <div className="container">
        <div className="breadcrumb" style={{ marginBottom: '20px' }}>
          <Link to="/spaces/boarding-houses">Boarding Houses</Link> &gt;
          <Link to={`/spaces/boarding-houses/${id}`}> {boardingHouse.name}</Link> &gt;
          <span> Add New Room</span>
        </div>

        {/* This would be implemented as a separate component */}
        <div className="form-container">
          <RoomForm
            boardingHouseId={id}
            defaultElectricityPrice={boardingHouse.electricityPrice}
            defaultWaterPrice={boardingHouse.waterPrice}
            onRoomCreated={handleRoomCreated}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateRoomPage;