import spaceService from './spaceService';

const meterReadingService = {
  // Add a new meter reading
  addMeterReading: async (spaceId, type, readingData) => {
    try {
      // Check if this is a room ID (composite ID format: "boardingHouseId-room-roomNumber")
      if (spaceId.includes('-room-')) {
        const [boardingHouseId, _, roomNumber] = spaceId.split('-room-');
        return await addRoomMeterReading(boardingHouseId, roomNumber, type, readingData);
      } else {
        // Original logic for regular spaces
        const space = await spaceService.getSpaceById(spaceId);

        if (!space) {
          throw new Error('Space not found');
        }

        // Initialize meter readings array if it doesn't exist
        if (!space.meterReadings) {
          space.meterReadings = {
            electricity: [],
            water: []
          };
        }

        // Validate reading type
        if (type !== 'electricity' && type !== 'water') {
          throw new Error('Invalid meter reading type');
        }

        // Create the new reading with a timestamp
        const newReading = {
          ...readingData,
          // Ensure we have a complete ISO string date with time
          readingDate: readingData.readingDate || new Date().toISOString(),
          createdAt: new Date().toISOString()
        };

        // Add the reading to the appropriate array
        const updatedReadings = [...(space.meterReadings[type] || []), newReading];

        // Sort readings by date (newest first)
        updatedReadings.sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));

        // Update the space with the new readings
        const updatedSpace = {
          ...space,
          meterReadings: {
            ...space.meterReadings,
            [type]: updatedReadings
          }
        };

        // Save the updated space
        await spaceService.updateSpace(spaceId, updatedSpace);

        return newReading;
      }
    } catch (error) {
      console.error(`Error adding ${type} reading:`, error);
      throw error;
    }
  },

  // Get all meter readings for a space
  getMeterReadings: async (spaceId, type = null) => {
    try {
      // Check if this is a room ID (composite ID format: "boardingHouseId-room-roomNumber")
      if (spaceId.includes('-room-')) {
        const [boardingHouseId, _, roomNumber] = spaceId.split('-room-');
        return await getRoomMeterReadings(boardingHouseId, roomNumber, type);
      } else {
        // Original logic for regular spaces
        const space = await spaceService.getSpaceById(spaceId);

        if (!space || !space.meterReadings) {
          return type ? [] : { electricity: [], water: [] };
        }

        if (type) {
          return space.meterReadings[type] || [];
        } else {
          return space.meterReadings;
        }
      }
    } catch (error) {
      console.error('Error fetching meter readings:', error);
      throw error;
    }
  },

  // Get the most recent meter reading
  getLatestReading: async (spaceId, type) => {
    try {
      const readings = await meterReadingService.getMeterReadings(spaceId, type);

      if (!readings || readings.length === 0) {
        return null;
      }

      // Sort readings by date (newest first)
      const sortedReadings = [...readings].sort((a, b) =>
        new Date(b.readingDate) - new Date(a.readingDate)
      );

      // Return the first one (newest)
      return sortedReadings[0];
    } catch (error) {
      console.error(`Error getting latest ${type} reading:`, error);
      throw error;
    }
  },

  // Calculate consumption between readings
  calculateConsumption: async (spaceId, type, startDate, endDate) => {
    try {
      const readings = await meterReadingService.getMeterReadings(spaceId, type);

      if (!readings || readings.length < 2) {
        return { startReading: null, endReading: null, consumption: 0 };
      }

      // Sort readings by date (oldest first)
      const sortedReadings = [...readings].sort((a, b) =>
        new Date(a.readingDate) - new Date(b.readingDate)
      );

      // Filter readings by date range if provided
      let filteredReadings = sortedReadings;
      if (startDate) {
        filteredReadings = filteredReadings.filter(r =>
          new Date(r.readingDate) >= new Date(startDate)
        );
      }

      if (endDate) {
        filteredReadings = filteredReadings.filter(r =>
          new Date(r.readingDate) <= new Date(endDate)
        );
      }

      if (filteredReadings.length < 2) {
        return { startReading: null, endReading: null, consumption: 0 };
      }

      // Get the oldest and newest readings in the range
      const startReading = filteredReadings[0];
      const endReading = filteredReadings[filteredReadings.length - 1];

      // Calculate consumption
      const consumption = endReading.value - startReading.value;

      return {
        startReading,
        endReading,
        consumption: consumption > 0 ? consumption : 0
      };
    } catch (error) {
      console.error(`Error calculating ${type} consumption:`, error);
      throw error;
    }
  },

  // Get monthly consumption data
  getMonthlyConsumption: async (spaceId, type, year = null, month = null) => {
    try {
      const readings = await meterReadingService.getMeterReadings(spaceId, type);

      if (!readings || readings.length < 2) {
        return [];
      }

      // Sort readings by date (oldest first)
      const sortedReadings = [...readings].sort((a, b) =>
        new Date(a.readingDate) - new Date(b.readingDate)
      );

      // Group readings by month
      const monthlyGroups = {};

      sortedReadings.forEach(reading => {
        const date = new Date(reading.readingDate);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Filter by year/month if specified
        if (year && date.getFullYear() !== year) return;
        if (month && date.getMonth() + 1 !== month) return;

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
    } catch (error) {
      console.error(`Error calculating monthly ${type} consumption:`, error);
      throw error;
    }
  }
};

// Helper function to get room meter readings
async function getRoomMeterReadings(boardingHouseId, roomNumber, type = null) {
  try {
    const boardingHouse = await spaceService.getSpaceById(boardingHouseId);

    if (!boardingHouse || !boardingHouse.rooms) {
      return type ? [] : { electricity: [], water: [] };
    }

    // Find the specific room
    const room = boardingHouse.rooms.find(r => r.roomNumber === roomNumber);

    if (!room) {
      throw new Error(`Room ${roomNumber} not found in boarding house ${boardingHouseId}`);
    }

    // Initialize meter readings if they don't exist
    if (!room.meterReadings) {
      room.meterReadings = { electricity: [], water: [] };
    }

    if (type) {
      return room.meterReadings[type] || [];
    } else {
      return room.meterReadings;
    }
  } catch (error) {
    console.error('Error fetching room meter readings:', error);
    throw error;
  }
}

// Helper function to add meter reading to a room
async function addRoomMeterReading(boardingHouseId, roomNumber, type, readingData) {
  try {
    const boardingHouse = await spaceService.getSpaceById(boardingHouseId);

    if (!boardingHouse || !boardingHouse.rooms) {
      throw new Error(`Boarding house ${boardingHouseId} not found`);
    }

    // Find the room index
    const roomIndex = boardingHouse.rooms.findIndex(r => r.roomNumber === roomNumber);

    if (roomIndex === -1) {
      throw new Error(`Room ${roomNumber} not found in boarding house ${boardingHouseId}`);
    }

    // Get the room
    const room = boardingHouse.rooms[roomIndex];

    // Initialize meter readings if they don't exist
    if (!room.meterReadings) {
      room.meterReadings = {
        electricity: [],
        water: []
      };
    }

    // Validate reading type
    if (type !== 'electricity' && type !== 'water') {
      throw new Error('Invalid meter reading type');
    }

    // Create the new reading with a timestamp
    const newReading = {
      ...readingData,
      // Ensure we have a complete ISO string date with time
      readingDate: readingData.readingDate || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Add the reading to the appropriate array
    const updatedReadings = [...(room.meterReadings[type] || []), newReading];

    // Sort readings by date (newest first)
    updatedReadings.sort((a, b) => new Date(b.readingDate) - new Date(a.readingDate));

    // Update the room with the new readings
    const updatedRoom = {
      ...room,
      meterReadings: {
        ...room.meterReadings,
        [type]: updatedReadings
      }
    };

    // Replace the room in the rooms array
    const updatedRooms = [...boardingHouse.rooms];
    updatedRooms[roomIndex] = updatedRoom;

    // Update the boarding house with the updated rooms array
    const updatedBoardingHouse = {
      ...boardingHouse,
      rooms: updatedRooms
    };

    // Save the updated boarding house
    await spaceService.updateSpace(boardingHouseId, updatedBoardingHouse);

    return newReading;
  } catch (error) {
    console.error(`Error adding ${type} reading to room:`, error);
    throw error;
  }
}

export default meterReadingService;