// Enhanced tenant data model with tenant relationship support
// This defines the structure of a tenant in the system

const defaultTenant = {
    id: null,                    // Unique identifier (will be generated)
    first_name: '',              // First name
    last_name: '',               // Last name
    email: '',                   // Email address
    phone_number: '',            // Phone number
    space_id: null,              // Reference to the space (apartment or room) ID
    space_type: '',              // 'apartment' or 'room'
    room_id: null,               // Only for boarding house rooms (null for apartments)
    boarding_house_id: null,     // Only for boarding house rooms (null for apartments)
    start_date: null,            // Lease start date (ISO string)
    end_date: null,              // Lease end date (ISO string)
    rent_amount: 0,              // Monthly rent amount (might be different from space's default)
    security_deposit: 0,         // Security deposit amount

    // NEW tenant relationship fields
    tenant_type: 'main',         // 'main' (primary tenant) or 'normal' (secondary tenant)
    main_tenant_id: null,        // Reference to the main tenant ID (null for main tenants)
    related_tenants: [],         // Array of related tenant IDs (empty for normal tenants)
    relationship_type: null,     // Relationship to main tenant (e.g., 'spouse', 'roommate', 'child', etc.)

    emergency_contact: {         // Emergency contact information
      name: '',
      relationship: '',
      phone_number: ''
    },
    identification: {            // Identification documents
      type: '',                  // 'national_id', 'passport', 'driver_license', etc.
      number: '',                // ID number
      issue_date: null,          // Issue date
      expiry_date: null          // Expiry date
    },
    notes: '',                   // Additional notes about the tenant
    status: 'active',            // 'active', 'inactive', 'pending'
    documents: [],               // Array of document references (e.g., lease agreement, ID scans)
    created_at: null,            // Creation timestamp
    updated_at: null             // Last update timestamp
  };

export default defaultTenant;