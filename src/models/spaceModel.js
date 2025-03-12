// Space data model
// This defines the structure of a rental space in the system

const defaultSpace = {
  id: null,                 // Unique identifier (will be generated)
  name: '',                 // Name of the space
  address: {
    street: '',             // Street address
    ward: '',               // Ward/neighborhood
    district: '',           // District/area
    city: '',               // City
  },
  squareMeters: 0,          // Size in square meters
  electricityPrice: 0,      // Price per kWh
  waterPrice: 0,            // Price per cubic meter
  maxOccupancy: 1,          // Maximum number of occupants
  amenities: {
    furniture: false,       // Has furniture
    tvCable: false,         // Has TV cable
    internet: false,        // Has internet access
    airConditioner: false,  // Has air conditioning
    waterHeater: false,     // Has water heater
    allowPets: false,       // Allows pets
    parking: false,         // Has parking
    security: false,        // Has security
  },
  additionalFees: {
    petFee: 0,              // Additional fee for pets
    parkingFee: 0,          // Additional fee for parking
  },
  meterReadings: {
    electricity: [
      // {
      //   readingDate: '2023-01-01T10:00:00', // ISO string with date and time
      //   value: 1000,
      //   notes: 'Initial reading'
      // }
    ],
    water: [
      // {
      //   readingDate: '2023-01-01T10:00:00', // ISO string with date and time
      //   value: 100,
      //   notes: 'Initial reading'
      // }
    ]
  },
  images: [],               // Array of image URLs or file references
  status: 'available',      // available, occupied, maintenance
  createdAt: null,          // Creation timestamp
  updatedAt: null,          // Last update timestamp
  createdBy: null           // Reference to the host/user who created it
};

  export default defaultSpace;