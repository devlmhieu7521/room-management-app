import React, { useState } from 'react';
import meterReadingService from '../../services/meterReadingService';

const MeterReadingForm = ({ spaceId, type, onReadingAdded, previousReading }) => {
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
      // Parse the value to ensure it's a number
      const readingData = {
        ...formData,
        value: parseFloat(formData.value),
        // Automatically use current time
        readingDate: new Date().toISOString()
      };

      const result = await meterReadingService.addMeterReading(spaceId, type, readingData);

      // Clear the form
      setFormData({
        value: '',
        notes: ''
      });

      setSuccess(true);

      // Notify parent component
      if (onReadingAdded) {
        onReadingAdded(result);
      }
    } catch (error) {
      console.error('Error adding meter reading:', error);
      setError('Failed to add meter reading. Please try again.');
    } finally {
      setIsSubmitting(false);
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