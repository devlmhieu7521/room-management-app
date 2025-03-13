// In UtilitiesTab.jsx, modify the component to handle room utilities:

import React, { useState, useEffect } from 'react';
import MeterReadingForm from './MeterReadingForm';
import MeterReadingsList from './MeterReadingsList';
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

  // Load meter readings directly from the space object
  const fetchReadings = () => {
    try {
      setLoading(true);

      console.log("Space object received:", space);

      // If meterReadings is undefined or null, initialize as empty
      const meterReadings = space.meterReadings || { electricity: [], water: [] };

      // Sort readings by date (newest first) if they exist
      const sortElectricityReadings = meterReadings.electricity
        ? [...meterReadings.electricity].sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate))
        : [];

      const sortWaterReadings = meterReadings.water
        ? [...meterReadings.water].sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate))
        : [];

      setReadings({
        electricity: sortElectricityReadings,
        water: sortWaterReadings
      });

      // Set latest readings (if any)
      setLatestReadings({
        electricity: sortElectricityReadings[0] || null,
        water: sortWaterReadings[0] || null
      });

      // Calculate monthly consumption data if we have enough readings
      calculateMonthlyData(sortElectricityReadings, sortWaterReadings);

      setError(null);
    } catch (err) {
      console.error("Error processing meter readings:", err);
      setError("Failed to process meter readings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate monthly data from the readings
  const calculateMonthlyData = (electricityReadings, waterReadings) => {
    try {
      // Only process if we have at least 2 readings
      if (electricityReadings.length >= 2) {
        // Group readings by month and calculate consumption
        const electricityMonthly = processMonthlyData(electricityReadings);
        const waterMonthly = processMonthlyData(waterReadings);

        setMonthlyData({
          electricity: electricityMonthly,
          water: waterMonthly
        });
      } else {
        setMonthlyData({
          electricity: [],
          water: []
        });
      }
    } catch (err) {
      console.error("Error calculating monthly data:", err);
    }
  };

  // Process readings to calculate monthly consumption
  const processMonthlyData = (readings) => {
    if (!readings || readings.length < 2) return [];

    // Sort readings by date (oldest first)
    const sortedReadings = [...readings].sort((a, b) =>
      new Date(a.readingDate) - new Date(b.readingDate)
    );

    // Group readings by month
    const monthlyGroups = {};

    sortedReadings.forEach(reading => {
      const date = new Date(reading.readingDate);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyGroups[yearMonth]) {
        monthlyGroups[yearMonth] = {
          yearMonth,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          readings: []
        };
      }

      monthlyGroups[yearMonth].readings.push(reading);
    });

    // Calculate monthly consumption
    const monthlyData = Object.values(monthlyGroups).map(group => {
      // Sort readings within this month by date
      const monthReadings = [...group.readings].sort((a, b) =>
        new Date(a.readingDate) - new Date(b.readingDate)
      );

      const firstReading = monthReadings[0];
      const lastReading = monthReadings[monthReadings.length - 1];
      const consumption = lastReading.value - firstReading.value;

      return {
        yearMonth: group.yearMonth,
        year: group.year,
        month: group.month,
        monthName: new Date(group.year, group.month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
        firstReading,
        lastReading,
        consumption: consumption > 0 ? consumption : 0
      };
    });

    // Sort by date (newest first)
    return monthlyData.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  };

  useEffect(() => {
    // Load readings when the component mounts or space changes
    fetchReadings();
  }, [space]);

  const handleReadingAdded = async (type, newReading) => {
    // When a new reading is added, add it to the appropriate array
    const updatedReadings = {
      ...readings,
      [type]: [newReading, ...readings[type]]
    };

    setReadings(updatedReadings);

    // Update latest readings
    setLatestReadings(prev => ({
      ...prev,
      [type]: newReading
    }));

    // Recalculate monthly data
    calculateMonthlyData(
      type === 'electricity' ? updatedReadings.electricity : readings.electricity,
      type === 'water' ? updatedReadings.water : readings.water
    );
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

          {getCurrentMonthData('electricity') && (
            <div className="utility-details">
              <div className="utility-detail-item">
                <span className="utility-detail-label">Current Month:</span>
                <span className="utility-detail-value">
                  {getCurrentMonthData('electricity').monthName}
                </span>
              </div>
              <div className="utility-detail-item">
                <span className="utility-detail-label">Monthly Consumption:</span>
                <span className="utility-detail-value">
                  {getCurrentMonthData('electricity').consumption.toFixed(2)} kWh
                </span>
              </div>
              <div className="utility-detail-item">
                <span className="utility-detail-label">Rate:</span>
                <span className="utility-detail-value">
                  {space.electricityPrice.toLocaleString()} VND/kWh
                </span>
              </div>
              <div className="utility-divider"></div>
              <div className="utility-detail-item">
                <span className="utility-detail-label">Monthly Cost:</span>
                <span className="utility-detail-value">
                  {(getCurrentMonthData('electricity').consumption * space.electricityPrice).toLocaleString()} VND
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="utility-card">
          <div className="utility-card-header">
            <div className="utility-icon water">💧</div>
            <div>
              <h3>Water</h3>
              <div className="utility-reading-value">
                {latestReadings.water
                  ? `${latestReadings.water.value} m³`
                  : 'No readings'}
              </div>
              {latestReadings.water && (
                <div className="utility-reading-date">
                  Last reading: {formatDateTime(latestReadings.water.readingDate)}
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
            {monthlyData.electricity.length > 0 || monthlyData.water.length > 0 ? (
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
                    {monthlyData.electricity.length > 0 ? (
                      monthlyData.electricity.map((month, index) => {
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
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" style={{textAlign: 'center'}}>
                          No monthly consumption data available yet. Add at least two readings to see consumption.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-message">
                <p>No monthly consumption data available yet. Add at least two readings to see consumption.</p>
              </div>
            )}
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
            roomId={space.roomId}
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
            roomId={space.roomId}
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