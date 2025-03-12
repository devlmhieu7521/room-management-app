import React, { useState, useEffect } from 'react';
import MeterReadingForm from './MeterReadingForm';
import MeterReadingsList from './MeterReadingsList';
import meterReadingService from '../../services/meterReadingService';
import '../../styles/meter-readings.css';

const UtilitiesTab = ({ space }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [readings, setReadings] = useState({
    electricity: [],
    water: []
  });
  const [latestReadings, setLatestReadings] = useState({
    electricity: null,
    water: null
  });
  const [monthlyData, setMonthlyData] = useState({
    electricity: [],
    water: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReadings = async () => {
    try {
      setLoading(true);

      // Get all meter readings
      const allReadings = await meterReadingService.getMeterReadings(space.id);

      // Sort readings by date (newest first)
      const sortedElectricityReadings = allReadings.electricity
        ? [...allReadings.electricity].sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate))
        : [];

      const sortedWaterReadings = allReadings.water
        ? [...allReadings.water].sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate))
        : [];

      setReadings({
        electricity: sortedElectricityReadings,
        water: sortedWaterReadings
      });

      // Set latest readings
      setLatestReadings({
        electricity: sortedElectricityReadings[0] || null,
        water: sortedWaterReadings[0] || null
      });

      // Get monthly consumption data
      const electricityMonthly = await meterReadingService.getMonthlyConsumption(space.id, 'electricity');
      const waterMonthly = await meterReadingService.getMonthlyConsumption(space.id, 'water');

      setMonthlyData({
        electricity: electricityMonthly,
        water: waterMonthly
      });

    } catch (error) {
      console.error('Error fetching meter readings:', error);
      setError('Failed to load meter readings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [space.id]);

  const handleReadingAdded = async (type, newReading) => {
    await fetchReadings(); // Refetch all data to ensure everything is in sync
  };

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get current month data
  const getCurrentMonthData = (type) => {
    const currentDate = new Date();
    const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    return monthlyData[type].find(m => m.yearMonth === currentYearMonth) || null;
  };

  if (loading) {
    return <div className="loading">Loading utility data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="utilities-tab">
      {/* Summary Cards */}
      <div className="utility-summary">
        <div className="utility-card">
          <div className="utility-card-header">
            <div className="utility-icon electricity">⚡</div>
            <div>
              <h3>Electricity</h3>
              <div className="utility-reading-value">
                {latestReadings.electricity
                  ? `${latestReadings.electricity.value} kWh`
                  : 'No readings'}
              </div>
              {latestReadings.electricity && (
                <div className="utility-reading-date">
                  Last reading: {formatDateTime(latestReadings.electricity.readingDate)}
                </div>
              )}
            </div>
          </div>

          {getCurrentMonthData('water') && (
            <div className="utility-details">
              <div className="utility-detail-item">
                <span className="utility-detail-label">Current Month:</span>
                <span className="utility-detail-value">
                  {getCurrentMonthData('water').monthName}
                </span>
              </div>
              <div className="utility-detail-item">
                <span className="utility-detail-label">Monthly Consumption:</span>
                <span className="utility-detail-value">
                  {getCurrentMonthData('water').consumption.toFixed(2)} m³
                </span>
              </div>
              <div className="utility-detail-item">
                <span className="utility-detail-label">Rate:</span>
                <span className="utility-detail-value">
                  {space.waterPrice.toLocaleString()} VND/m³
                </span>
              </div>
              <div className="utility-divider"></div>
              <div className="utility-detail-item">
                <span className="utility-detail-label">Monthly Cost:</span>
                <span className="utility-detail-value">
                  {(getCurrentMonthData('water').consumption * space.waterPrice).toLocaleString()} VND
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Utility Tabs */}
      <div className="meter-reading-tabs">
        <button
          className={activeTab === 'summary' ? 'active' : ''}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={activeTab === 'electricity' ? 'active' : ''}
          onClick={() => setActiveTab('electricity')}
        >
          Electricity
        </button>
        <button
          className={activeTab === 'water' ? 'active' : ''}
          onClick={() => setActiveTab('water')}
        >
          Water
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="utility-tab-content">
          <div className="monthly-summaries">
            <h3>Monthly Consumption Summary</h3>
            <div className="table-container">
              <table className="readings-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Electricity Consumption</th>
                    <th>Electricity Cost</th>
                    <th>Water Consumption</th>
                    <th>Water Cost</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.electricity.map((month, index) => {
                    // Find matching water data for the same month
                    const waterMonth = monthlyData.water.find(m => m.yearMonth === month.yearMonth);

                    const electricityCost = month.consumption * space.electricityPrice;
                    const waterCost = waterMonth ? waterMonth.consumption * space.waterPrice : 0;
                    const totalCost = electricityCost + waterCost;

                    return (
                      <tr key={index}>
                        <td>{month.monthName}</td>
                        <td>{month.consumption.toFixed(2)} kWh</td>
                        <td>{electricityCost.toLocaleString()} VND</td>
                        <td>
                          {waterMonth
                            ? `${waterMonth.consumption.toFixed(2)} m³`
                            : '—'}
                        </td>
                        <td>
                          {waterMonth
                            ? `${waterCost.toLocaleString()} VND`
                            : '—'}
                        </td>
                        <td>{totalCost.toLocaleString()} VND</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="utility-actions">
            <button
              className="btn-primary"
              onClick={() => setActiveTab('electricity')}
            >
              Add Electricity Reading
            </button>
            <button
              className="btn-primary"
              style={{ marginLeft: '10px' }}
              onClick={() => setActiveTab('water')}
            >
              Add Water Reading
            </button>
          </div>
        </div>
      )}

      {activeTab === 'electricity' && (
        <div className="utility-tab-content">
          <MeterReadingForm
            spaceId={space.id}
            type="electricity"
            onReadingAdded={(reading) => handleReadingAdded('electricity', reading)}
            previousReading={latestReadings.electricity}
          />

          <MeterReadingsList
            readings={readings.electricity}
            type="electricity"
            pricePerUnit={space.electricityPrice}
          />
        </div>
      )}

      {activeTab === 'water' && (
        <div className="utility-tab-content">
          <MeterReadingForm
            spaceId={space.id}
            type="water"
            onReadingAdded={(reading) => handleReadingAdded('water', reading)}
            previousReading={latestReadings.water}
          />

          <MeterReadingsList
            readings={readings.water}
            type="water"
            pricePerUnit={space.waterPrice}
          />
        </div>
      )}
    </div>
  );
};

export default UtilitiesTab;