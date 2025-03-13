import React, { useState } from 'react';
import spaceService from '../../services/spaceService';

const MeterReadingForm = ({ spaceId, roomId, type, onReadingAdded, previousReading }) => {
  const [formData, setFormData] = useState({
    value: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    if (!formData.value || isNaN(formData.value) || parseFloat(formData.value) < 0) {
      setError('Please enter a valid reading value (must be a positive number)');
      return false;
    }

    // If there's a previous reading, make sure the new reading is higher
    if (previousReading && parseFloat(formData.value) <= previousReading.value) {
      setError(`New reading must be higher than the previous reading (${previousReading.value})`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);

    try {
      console.log(`Adding ${type} meter reading for spaceId: ${spaceId}, roomId: ${roomId}`);

      // Parse the value to ensure it's a number
      const newReading = {
        value: parseFloat(formData.value),
        notes: formData.notes,
        readingDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Check if this is a room reading or a regular space reading
      if (roomId) {
        await addRoomMeterReading(spaceId, roomId, type, newReading);
      } else {
        await addSpaceMeterReading(spaceId, type, newReading);
      }

      // Clear the form
      setFormData({
        value: '',
        notes: ''
      });

      setSuccess(true);

      // Notify parent component
      if (onReadingAdded) {
        onReadingAdded(newReading);
      }
    } catch (error) {
      console.error('Error adding meter reading:', error);
      setError('Failed to add meter reading. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a meter reading to a room within a boarding house
  const addRoomMeterReading = async (boardingHouseId, roomId, type, reading) => {
    try {
      // Get the boarding house
      const boardingHouse = await spaceService.getSpaceById(boardingHouseId);

      if (!boardingHouse || !boardingHouse.rooms) {
        throw new Error('Boarding house not found or has no rooms');
      }

      // Find the room
      const roomIndex = boardingHouse.rooms.findIndex(r => r.roomNumber === roomId);

      if (roomIndex === -1) {
        throw new Error(`Room ${roomId} not found`);
      }

      // Get the room
      const room = boardingHouse.rooms[roomIndex];

      // Initialize meterReadings if they don't exist
      if (!room.meterReadings) {
        room.meterReadings = {
          electricity: [],
          water: []
        };
      }

      // Add the new reading
      const updatedReadings = [...(room.meterReadings[type] || []), reading];

      // Update the room with the new readings
      const updatedRoom = {
        ...room,
        meterReadings: {
          ...room.meterReadings,
          [type]: updatedReadings
        }
      };

      // Update the room in the boarding house
      const updatedRooms = [...boardingHouse.rooms];
      updatedRooms[roomIndex] = updatedRoom;

      // Update the boarding house
      const updatedBoardingHouse = {
        ...boardingHouse,
        rooms: updatedRooms
      };

      // Save the boarding house
      await spaceService.updateSpace(boardingHouseId, updatedBoardingHouse);

      console.log(`${type} reading added successfully to room ${roomId}`);
      return reading;
    } catch (error) {
      console.error(`Error adding room ${type} reading:`, error);
      throw error;
    }
  };

  // Add a meter reading to a regular space
  const addSpaceMeterReading = async (spaceId, type, reading) => {
    try {
      // Get the space
      const space = await spaceService.getSpaceById(spaceId);

      if (!space) {
        throw new Error('Space not found');
      }

      // Initialize meterReadings if they don't exist
      if (!space.meterReadings) {
        space.meterReadings = {
          electricity: [],
          water: []
        };
      }

      // Add the new reading
      const updatedReadings = [...(space.meterReadings[type] || []), reading];

      // Update the space with the new readings
      const updatedSpace = {
        ...space,
        meterReadings: {
          ...space.meterReadings,
          [type]: updatedReadings
        }
      };

      // Save the space
      await spaceService.updateSpace(spaceId, updatedSpace);

      console.log(`${type} reading added successfully to space ${spaceId}`);
      return reading;
    } catch (error) {
      console.error(`Error adding space ${type} reading:`, error);
      throw error;
    }
  };

  // Format the date for display in the previous reading message
  const formatReadingDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="meter-reading-form">
      <h4>Add New {type === 'electricity' ? 'Electricity' : 'Water'} Reading</h4>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Reading added successfully!</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor={`${type}-reading`}>
            Reading Value {type === 'electricity' ? '(kWh)' : '(m³)'}
          </label>
          <input
            type="number"
            id={`${type}-reading`}
            name="value"
            value={formData.value}
            onChange={handleChange}
            placeholder={`Enter ${type} reading`}
            step="0.01"
            min={previousReading ? previousReading.value : 0}
            required
          />
          {previousReading && (
            <small className="form-hint">
              Previous reading: {previousReading.value} on {formatReadingDate(previousReading.readingDate)}
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor={`${type}-reading-notes`}>Notes (Optional)</label>
          <textarea
            id={`${type}-reading-notes`}
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional notes about this reading"
            rows="2"
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Reading'}
        </button>
      </form>
    </div>
  );
};

export default MeterReadingForm;