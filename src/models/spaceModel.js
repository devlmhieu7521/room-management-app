// Space data model with property type enhancements
// This defines the structure of a rental space in the system

const defaultSpace = {
  id: null,                 // Unique identifier (will be generated)
  name: '',                 // Name of the space
  propertyType: 'apartment', // 'apartment' or 'boarding_house'
  address: {
    street: '',             // Street address
    ward: '',               // Ward/neighborhood
    district: '',           // District/area
    city: '',               // City
  },
  // For boarding houses - array of rooms/units within the property
  rooms: [
    // {
    //   roomNumber: '101',
    //   squareMeters: 20,
    //   maxOccupancy: 2,
    //   description: 'Corner room with extra window',
    //   status: 'available', // available, occupied, maintenance
    //   tenant: null, // Will reference tenant ID when occupied
    //   images: [], // Array of room-specific images
    //   electricityPrice: 0, // Room-specific electricity price
    //   waterPrice: 0,       // Room-specific water price
    //   amenities: {         // Room-specific amenities
    //     furniture: false,
    //     tvCable: false,
    //     internet: false,
    //     airConditioner: false,
    //     waterHeater: false,
    //     allowPets: false,
    //     parking: false,
    //     security: false,
    //   },
    //   additionalFees: {    // Room-specific fees
    //     petFee: 0,
    //     parkingFee: 0,
    //   }
    // }
  ],
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