import React, { useState } from 'react';

const MeterReadingsList = ({ readings, type, pricePerUnit }) => {
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'monthly'

  if (!readings || readings.length === 0) {
    return (
      <div className="no-readings">
        <p>No {type} readings recorded yet.</p>
      </div>
    );
  }

  // Sort readings by date (newest first)
  const sortedReadings = [...readings].sort((a, b) =>
    new Date(b.readingDate) - new Date(a.readingDate)
  );

  // Format date and time for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate consumption between consecutive readings
  const readingsWithConsumption = sortedReadings.map((reading, index) => {
    const nextReading = sortedReadings[index - 1]; // Previous entry in the array is the next reading chronologically

    let consumption = 0;
    let cost = 0;

    if (nextReading) {
      consumption = nextReading.value - reading.value;
      // Ensure consumption is not negative (which could happen if readings were entered incorrectly)
      consumption = consumption > 0 ? consumption : 0;
      cost = consumption * pricePerUnit;
    }

    return {
      ...reading,
      consumption,
      cost
    };
  });

  // Group readings by month for monthly view
  const getMonthlyData = () => {
    // Create a map to store monthly data
    const monthlyData = new Map();

    // Add each reading to its month
    sortedReadings.forEach((reading, index) => {
      const readingDate = new Date(reading.readingDate);
      const monthKey = `${readingDate.getFullYear()}-${String(readingDate.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          monthName: readingDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
          readings: [],
          firstReading: null,
          lastReading: null
        });
      }

      const monthData = monthlyData.get(monthKey);
      monthData.readings.push(reading);
    });

    // For each month, determine first and last readings
    monthlyData.forEach((monthData) => {
      // Sort readings within this month by date (oldest first)
      const monthReadings = [...monthData.readings].sort(
        (a, b) => new Date(a.readingDate) - new Date(b.readingDate)
      );

      if (monthReadings.length > 0) {
        monthData.firstReading = monthReadings[0];
        monthData.lastReading = monthReadings[monthReadings.length - 1];

        // Calculate consumption and cost for this month
        if (monthData.firstReading && monthData.lastReading) {
          monthData.consumption = monthData.lastReading.value - monthData.firstReading.value;
          monthData.consumption = monthData.consumption > 0 ? monthData.consumption : 0;
          monthData.cost = monthData.consumption * pricePerUnit;
        } else {
          monthData.consumption = 0;
          monthData.cost = 0;
        }
      }
    });

    // Convert the map to an array and sort by month (newest first)
    return Array.from(monthlyData.values()).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  };

  const monthlyData = getMonthlyData();

  return (
    <div className="meter-readings-list">
      <h4>{type === 'electricity' ? 'Electricity' : 'Water'} Reading History</h4>

      <div className="view-mode-toggle">
        <button
          className={`toggle-button ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          All Readings
        </button>
        <button
          className={`toggle-button ${viewMode === 'monthly' ? 'active' : ''}`}
          onClick={() => setViewMode('monthly')}
        >
          Monthly Summary
        </button>
      </div>

      {viewMode === 'all' && (
        <div className="table-container">
          <table className="readings-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Reading</th>
                <th>Consumption</th>
                <th>Cost</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {readingsWithConsumption.map((reading, index) => (
                <tr key={index}>
                  <td>{formatDateTime(reading.readingDate)}</td>
                  <td>
                    {reading.value} {type === 'electricity' ? 'kWh' : 'm³'}
                  </td>
                  <td>
                    {index === readingsWithConsumption.length - 1 ? (
                      '—'
                    ) : (
                      <>{reading.consumption.toFixed(2)} {type === 'electricity' ? 'kWh' : 'm³'}</>
                    )}
                  </td>
                  <td>
                    {index === readingsWithConsumption.length - 1 ? (
                      '—'
                    ) : (
                      <>{reading.cost.toLocaleString()} VND</>
                    )}
                  </td>
                  <td>{reading.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'monthly' && (
        <div className="table-container">
          <table className="readings-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>First Reading</th>
                <th>Last Reading</th>
                <th>Monthly Consumption</th>
                <th>Monthly Cost</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((monthData, index) => (
                <tr key={index}>
                  <td>{monthData.monthName}</td>
                  <td>
                    {monthData.firstReading
                      ? `${monthData.firstReading.value} ${type === 'electricity' ? 'kWh' : 'm³'} (${formatDateTime(monthData.firstReading.readingDate)})`
                      : '—'}
                  </td>
                  <td>
                    {monthData.lastReading
                      ? `${monthData.lastReading.value} ${type === 'electricity' ? 'kWh' : 'm³'} (${formatDateTime(monthData.lastReading.readingDate)})`
                      : '—'}
                  </td>
                  <td>
                    {monthData.consumption
                      ? `${monthData.consumption.toFixed(2)} ${type === 'electricity' ? 'kWh' : 'm³'}`
                      : '—'}
                  </td>
                  <td>
                    {monthData.cost
                      ? `${monthData.cost.toLocaleString()} VND`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="readings-summary">
        <p>
          <strong>Latest Reading:</strong> {sortedReadings[0].value} {type === 'electricity' ? 'kWh' : 'm³'} on {formatDateTime(sortedReadings[0].readingDate)}
        </p>
      </div>
    </div>
  );
};

export default MeterReadingsList;