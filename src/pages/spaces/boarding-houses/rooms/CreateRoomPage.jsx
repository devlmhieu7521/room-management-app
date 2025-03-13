import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import spaceService from '../../../../services/spaceService';

const CreateRoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boardingHouse, setBoardingHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    squareMeters: '',
    maxOccupancy: 1,
    monthlyRent: 0,
    description: '',
    status: 'available',
    images: []
  });

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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate form
      if (!formData.roomNumber.trim() || !formData.squareMeters || !formData.monthlyRent) {
        setError('Please fill in all required fields');
        return;
      }

      // Check if room number already exists
      const roomExists = boardingHouse.rooms?.some(room =>
        room.roomNumber === formData.roomNumber
      );

      if (roomExists) {
        setError('A room with this number already exists');
        return;
      }

      // Create room data
      const newRoom = {
        ...formData,
        squareMeters: parseFloat(formData.squareMeters),
        maxOccupancy: parseInt(formData.maxOccupancy),
        amenities: {
          furniture: false,
          tvCable: false,
          internet: false,
          airConditioner: false,
          waterHeater: false,
          allowPets: false,
          parking: false,
          security: false,
        },
        additionalFees: {
          petFee: 0,
          parkingFee: 0,
        },
        electricityPrice: boardingHouse.electricityPrice || 2800,
        waterPrice: boardingHouse.waterPrice || 10000,
      };

      // Add room to boarding house
      const updatedBoardingHouse = {
        ...boardingHouse,
        rooms: [...(boardingHouse.rooms || []), newRoom]
      };

      await spaceService.updateSpace(id, updatedBoardingHouse);

      // Navigate back to boarding house detail
      navigate(`/spaces/boarding-houses/${id}`);
    } catch (err) {
      setError('Failed to create room. Please try again.');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="container">
          <div className="error-container">{error}</div>
          <button
            className="btn-primary"
            onClick={() => navigate(`/spaces/boarding-houses/${id}`)}
            style={{ marginTop: '20px' }}
          >
            Back to Boarding House
          </button>
        </div>
      </div>
    );
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

        <div className="form-container">
          <form onSubmit={handleSubmit} className="room-form">
            <div className="form-section">
              <h3 className="form-section-title">Room Information</h3>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="roomNumber">Room Number/Name*</label>
                  <input
                    type="text"
                    id="roomNumber"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 101, A1, etc."
                    required
                  />
                </div>

                <div className="form-group half">
                  <label htmlFor="squareMeters">Size (m²)*</label>
                  <input
                    type="number"
                    id="squareMeters"
                    name="squareMeters"
                    value={formData.squareMeters}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Room size"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="monthlyRent">Monthly Rent (VND)*</label>
                  <input
                    type="number"
                    id="monthlyRent"
                    name="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter monthly rent amount"
                    required
                  />
                </div>

                <div className="form-group half">
                  <label htmlFor="maxOccupancy">Maximum Occupancy</label>
                  <input
                    type="number"
                    id="maxOccupancy"
                    name="maxOccupancy"
                    value={formData.maxOccupancy}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed information about this room"
                  rows="4"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => navigate(`/spaces/boarding-houses/${id}`)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button--primary"
              >
                Create Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomPage;