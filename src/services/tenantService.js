// Enhanced Tenant Service
// Handles all tenant-related API operations with support for tenant relationships and housing inheritance

import defaultTenant from '../models/tenantModel';
import spaceService from './spaceService';
import authService from './authService';

const TENANTS_STORAGE_KEY = 'rental_tenants';

const tenantService = {
  // Create a new tenant
  createTenant: async (tenantData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Get current tenants from storage
        const tenantsJson = localStorage.getItem(TENANTS_STORAGE_KEY);
        const tenants = tenantsJson ? JSON.parse(tenantsJson) : [];

        // Generate ID and timestamps
        const newTenant = {
          ...defaultTenant,
          ...tenantData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // If this is a normal tenant linked to a main tenant
        if (newTenant.tenant_type === 'normal' && newTenant.main_tenant_id) {
          // Find the main tenant
          const mainTenantIndex = tenants.findIndex(t => t.id === newTenant.main_tenant_id);

          if (mainTenantIndex !== -1) {
            const mainTenant = tenants[mainTenantIndex];

            // Add this tenant to the main tenant's related_tenants array
            const updatedMainTenant = {
              ...mainTenant,
              related_tenants: [...(mainTenant.related_tenants || []), newTenant.id],
              updated_at: new Date().toISOString()
            };

            tenants[mainTenantIndex] = updatedMainTenant;

            // NEW: Inherit housing information from main tenant
            if (mainTenant.space_id) {
              newTenant.space_id = mainTenant.space_id;
              newTenant.space_type = mainTenant.space_type;
              newTenant.space_name = mainTenant.space_name;
              newTenant.rent_amount = mainTenant.rent_amount;
              newTenant.security_deposit = mainTenant.security_deposit;
              newTenant.start_date = mainTenant.start_date;
              newTenant.end_date = mainTenant.end_date;

              // For room assignments, inherit room and boarding house details
              if (mainTenant.space_type === 'room') {
                newTenant.room_id = mainTenant.room_id;
                newTenant.boarding_house_id = mainTenant.boarding_house_id;
                newTenant.boarding_house_name = mainTenant.boarding_house_name;
              }
            }
          }
        }

        // Add new tenant
        tenants.push(newTenant);
        localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));

        // If the tenant is assigned to a space, update the space status
        if (newTenant.space_id) {
          await tenantService.assignTenantToSpace(newTenant);
        }

        // Simulate delay for API call
        setTimeout(() => {
          resolve(newTenant);
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get all tenants
  getAllTenants: () => {
    return new Promise((resolve, reject) => {
      try {
        const tenantsJson = localStorage.getItem(TENANTS_STORAGE_KEY);
        const tenants = tenantsJson ? JSON.parse(tenantsJson) : [];

        // Simulate delay
        setTimeout(() => {
          resolve(tenants);
        }, 300);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get a single tenant by ID
  getTenantById: (tenantId) => {
    return new Promise((resolve, reject) => {
      try {
        const tenantsJson = localStorage.getItem(TENANTS_STORAGE_KEY);
        const tenants = tenantsJson ? JSON.parse(tenantsJson) : [];

        const tenant = tenants.find(t => t.id === tenantId);

        if (tenant) {
          setTimeout(() => {
            resolve(tenant);
          }, 300);
        } else {
          reject(new Error('Tenant not found'));
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get related tenants for a main tenant
  getRelatedTenants: async (mainTenantId) => {
    try {
      const tenantsJson = localStorage.getItem(TENANTS_STORAGE_KEY);
      const tenants = tenantsJson ? JSON.parse(tenantsJson) : [];

      // Find all tenants that have this tenant as their main_tenant_id
      const relatedTenants = tenants.filter(t => t.main_tenant_id === mainTenantId);

      return relatedTenants;
    } catch (error) {
      console.error('Error getting related tenants:', error);
      throw error;
    }
  },

  // Get main tenant for a normal tenant
  getMainTenant: async (normalTenantId) => {
    try {
      const tenant = await tenantService.getTenantById(normalTenantId);

      if (tenant.tenant_type === 'main' || !tenant.main_tenant_id) {
        return null; // This is already a main tenant or no main tenant ID set
      }

      return await tenantService.getTenantById(tenant.main_tenant_id);
    } catch (error) {
      console.error('Error getting main tenant:', error);
      throw error;
    }
  },

  // Update an existing tenant
  updateTenant: (tenantId, updatedData) => {
    return new Promise(async (resolve, reject) => {
      try {
        const tenantsJson = localStorage.getItem(TENANTS_STORAGE_KEY);
        const tenants = tenantsJson ? JSON.parse(tenantsJson) : [];

        const index = tenants.findIndex(t => t.id === tenantId);

        if (index !== -1) {
          const oldTenant = tenants[index];
          const oldMainTenantId = oldTenant.main_tenant_id;
          const oldTenantType = oldTenant.tenant_type;
          const oldSpaceId = oldTenant.space_id;

          // Update tenant data
          const updatedTenant = {
            ...oldTenant,
            ...updatedData,
            updated_at: new Date().toISOString()
          };

          // Handle tenant relationship changes
          if (updatedTenant.tenant_type === 'normal' &&
              updatedTenant.main_tenant_id &&
              (updatedTenant.main_tenant_id !== oldMainTenantId || oldTenantType !== 'normal')) {

            // Remove this tenant from the old main tenant's related_tenants array
            if (oldMainTenantId) {
              const oldMainTenantIndex = tenants.findIndex(t => t.id === oldMainTenantId);
              if (oldMainTenantIndex !== -1) {
                const oldMainTenant = tenants[oldMainTenantIndex];
                const updatedRelatedTenants = (oldMainTenant.related_tenants || []).filter(id => id !== tenantId);

                tenants[oldMainTenantIndex] = {
                  ...oldMainTenant,
                  related_tenants: updatedRelatedTenants,
                  updated_at: new Date().toISOString()
                };
              }
            }

            // Add this tenant to the new main tenant's related_tenants array
            const newMainTenantIndex = tenants.findIndex(t => t.id === updatedTenant.main_tenant_id);
            if (newMainTenantIndex !== -1) {
              const newMainTenant = tenants[newMainTenantIndex];
              const updatedRelatedTenants = [...(newMainTenant.related_tenants || []), tenantId];

              tenants[newMainTenantIndex] = {
                ...newMainTenant,
                related_tenants: updatedRelatedTenants,
                updated_at: new Date().toISOString()
              };

              // NEW: Inherit housing information from the new main tenant
              if (newMainTenant.space_id) {
                updatedTenant.space_id = newMainTenant.space_id;
                updatedTenant.space_type = newMainTenant.space_type;
                updatedTenant.space_name = newMainTenant.space_name;
                updatedTenant.rent_amount = newMainTenant.rent_amount;
                updatedTenant.security_deposit = newMainTenant.security_deposit;
                updatedTenant.start_date = newMainTenant.start_date;
                updatedTenant.end_date = newMainTenant.end_date;

                // For room assignments, inherit room and boarding house details
                if (newMainTenant.space_type === 'room') {
                  updatedTenant.room_id = newMainTenant.room_id;
                  updatedTenant.boarding_house_id = newMainTenant.boarding_house_id;
                  updatedTenant.boarding_house_name = newMainTenant.boarding_house_name;
                } else {
                  // Clear room info if main tenant is in an apartment
                  updatedTenant.room_id = null;
                  updatedTenant.boarding_house_id = null;
                  updatedTenant.boarding_house_name = null;
                }
              } else {
                // Clear housing info if main tenant has no housing
                updatedTenant.space_id = null;
                updatedTenant.space_type = '';
                updatedTenant.space_name = '';
                updatedTenant.room_id = null;
                updatedTenant.boarding_house_id = null;
                updatedTenant.boarding_house_name = null;
              }
            }
          }

          // Handle tenant type changes from normal to main
          if (oldTenantType === 'normal' && updatedTenant.tenant_type === 'main') {
            // Remove main_tenant_id reference
            updatedTenant.main_tenant_id = null;

            // Remove this tenant from the old main tenant's related_tenants array
            if (oldMainTenantId) {
              const oldMainTenantIndex = tenants.findIndex(t => t.id === oldMainTenantId);
              if (oldMainTenantIndex !== -1) {
                const oldMainTenant = tenants[oldMainTenantIndex];
                const updatedRelatedTenants = (oldMainTenant.related_tenants || []).filter(id => id !== tenantId);

                tenants[oldMainTenantIndex] = {
                  ...oldMainTenant,
                  related_tenants: updatedRelatedTenants,
                  updated_at: new Date().toISOString()
                };
              }
            }
          }

          // Handle tenant type changes from main to normal
          if (oldTenantType === 'main' && updatedTenant.tenant_type === 'normal' && updatedTenant.main_tenant_id) {
            // Move any related tenants to the new main tenant
            if (oldTenant.related_tenants && oldTenant.related_tenants.length > 0) {
              const newMainTenantIndex = tenants.findIndex(t => t.id === updatedTenant.main_tenant_id);
              if (newMainTenantIndex !== -1) {
                const newMainTenant = tenants[newMainTenantIndex];
                const updatedRelatedTenants = [
                  ...(newMainTenant.related_tenants || []),
                  ...oldTenant.related_tenants
                ];

                tenants[newMainTenantIndex] = {
                  ...newMainTenant,
                  related_tenants: updatedRelatedTenants,
                  updated_at: new Date().toISOString()
                };

                // Update the main_tenant_id reference for all transferred related tenants
                oldTenant.related_tenants.forEach(relatedTenantId => {
                  const relatedTenantIndex = tenants.findIndex(t => t.id === relatedTenantId);
                  if (relatedTenantIndex !== -1) {
                    tenants[relatedTenantIndex] = {
                      ...tenants[relatedTenantIndex],
                      main_tenant_id: updatedTenant.main_tenant_id,
                      updated_at: new Date().toISOString()
                    };
                  }
                });
              }
            }

            // Clear the related_tenants array
            updatedTenant.related_tenants = [];

            // Add this tenant to the new main tenant's related_tenants array
            const newMainTenantIndex = tenants.findIndex(t => t.id === updatedTenant.main_tenant_id);
            if (newMainTenantIndex !== -1) {
              const newMainTenant = tenants[newMainTenantIndex];
              const updatedRelatedTenants = [...(newMainTenant.related_tenants || []), tenantId];

              tenants[newMainTenantIndex] = {
                ...newMainTenant,
                related_tenants: updatedRelatedTenants,
                updated_at: new Date().toISOString()
              };

              // Inherit housing information from the new main tenant
              if (newMainTenant.space_id) {
                updatedTenant.space_id = newMainTenant.space_id;
                updatedTenant.space_type = newMainTenant.space_type;
                updatedTenant.space_name = newMainTenant.space_name;
                updatedTenant.rent_amount = newMainTenant.rent_amount;
                updatedTenant.security_deposit = newMainTenant.security_deposit;
                updatedTenant.start_date = newMainTenant.start_date;
                updatedTenant.end_date = newMainTenant.end_date;

                if (newMainTenant.space_type === 'room') {
                  updatedTenant.room_id = newMainTenant.room_id;
                  updatedTenant.boarding_house_id = newMainTenant.boarding_house_id;
                  updatedTenant.boarding_house_name = newMainTenant.boarding_house_name;
                }
              }
            }
          }

          // NEW: Handle main tenant with housing changes
          // If this is a main tenant with related tenants and housing has changed,
          // update all related tenants to have the same housing details
          if (updatedTenant.tenant_type === 'main' &&
              updatedTenant.related_tenants &&
              updatedTenant.related_tenants.length > 0 &&
              (updatedTenant.space_id !== oldSpaceId ||
               updatedData.space_id ||
               updatedData.start_date ||
               updatedData.end_date ||
               updatedData.rent_amount)) {

            // Update all related tenants with the same housing information
            for (const relatedTenantId of updatedTenant.related_tenants) {
              const relatedTenantIndex = tenants.findIndex(t => t.id === relatedTenantId);

              if (relatedTenantIndex !== -1) {
                // Get current related tenant
                const relatedTenant = tenants[relatedTenantIndex];

                // Update housing information to match main tenant
                const updatedRelatedTenant = {
                  ...relatedTenant,
                  space_id: updatedTenant.space_id,
                  space_type: updatedTenant.space_type,
                  space_name: updatedTenant.space_name,
                  rent_amount: updatedTenant.rent_amount,
                  security_deposit: updatedTenant.security_deposit,
                  start_date: updatedTenant.start_date,
                  end_date: updatedTenant.end_date,
                  updated_at: new Date().toISOString()
                };

                // For room assignments, update room and boarding house details
                if (updatedTenant.space_type === 'room') {
                  updatedRelatedTenant.room_id = updatedTenant.room_id;
                  updatedRelatedTenant.boarding_house_id = updatedTenant.boarding_house_id;
                  updatedRelatedTenant.boarding_house_name = updatedTenant.boarding_house_name;
                } else {
                  // Clear room info if main tenant is in an apartment
                  updatedRelatedTenant.room_id = null;
                  updatedRelatedTenant.boarding_house_id = null;
                  updatedRelatedTenant.boarding_house_name = null;
                }

                // Update the related tenant in the array
                tenants[relatedTenantIndex] = updatedRelatedTenant;
              }
            }
          }

          tenants[index] = updatedTenant;
          localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));

          // Handle space reassignment if needed
          if (oldTenant.space_id !== updatedTenant.space_id) {
            // Unassign from old space
            if (oldTenant.space_id) {
              await tenantService.unassignTenantFromSpace(oldTenant);
            }

            // Assign to new space
            if (updatedTenant.space_id) {
              await tenantService.assignTenantToSpace(updatedTenant);
            }
          }

          setTimeout(() => {
            resolve(updatedTenant);
          }, 500);
        } else {
          reject(new Error('Tenant not found'));
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // Delete a tenant
  deleteTenant: (tenantId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const tenantsJson = localStorage.getItem(TENANTS_STORAGE_KEY);
        const tenants = tenantsJson ? JSON.parse(tenantsJson) : [];

        const tenantToDelete = tenants.find(t => t.id === tenantId);

        if (!tenantToDelete) {
          reject(new Error('Tenant not found'));
          return;
        }

        // If this is a main tenant with related tenants, handle them
        if (tenantToDelete.tenant_type === 'main' && tenantToDelete.related_tenants && tenantToDelete.related_tenants.length > 0) {
          // For each related tenant, either delete them or update their main_tenant_id to null
          for (const relatedTenantId of tenantToDelete.related_tenants) {
            const relatedTenantIndex = tenants.findIndex(t => t.id === relatedTenantId);
            if (relatedTenantIndex !== -1) {
              // Update related tenant to remove main_tenant_id reference
              tenants[relatedTenantIndex] = {
                ...tenants[relatedTenantIndex],
                main_tenant_id: null,
                relationship_type: null,
                tenant_type: 'main',  // Promote to main tenant
                updated_at: new Date().toISOString()
              };
            }
          }
        }

        // If this is a normal tenant, remove it from its main tenant's related_tenants array
        if (tenantToDelete.tenant_type === 'normal' && tenantToDelete.main_tenant_id) {
          const mainTenantIndex = tenants.findIndex(t => t.id === tenantToDelete.main_tenant_id);
          if (mainTenantIndex !== -1) {
            const mainTenant = tenants[mainTenantIndex];
            const updatedRelatedTenants = (mainTenant.related_tenants || []).filter(id => id !== tenantId);

            tenants[mainTenantIndex] = {
              ...mainTenant,
              related_tenants: updatedRelatedTenants,
              updated_at: new Date().toISOString()
            };
          }
        }

        // Unassign tenant from space if needed
        if (tenantToDelete.space_id) {
          await tenantService.unassignTenantFromSpace(tenantToDelete);
        }

        const filteredTenants = tenants.filter(t => t.id !== tenantId);

        localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(filteredTenants));

        setTimeout(() => {
          resolve(true);
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get tenants for a specific space
  getTenantsBySpaceId: (spaceId) => {
    return new Promise((resolve, reject) => {
      try {
        const tenantsJson = localStorage.getItem(TENANTS_STORAGE_KEY);
        const tenants = tenantsJson ? JSON.parse(tenantsJson) : [];

        const filteredTenants = tenants.filter(tenant => tenant.space_id === spaceId);

        setTimeout(() => {
          resolve(filteredTenants);
        }, 300);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get all main tenants (for selection in dropdown)
  getAllMainTenants: () => {
    return new Promise((resolve, reject) => {
      try {
        const tenantsJson = localStorage.getItem(TENANTS_STORAGE_KEY);
        const tenants = tenantsJson ? JSON.parse(tenantsJson) : [];

        const mainTenants = tenants.filter(tenant => tenant.tenant_type === 'main');

        setTimeout(() => {
          resolve(mainTenants);
        }, 300);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Assign tenant to a space and update space status
  assignTenantToSpace: async (tenant) => {
    try {
      if (tenant.space_type === 'apartment') {
        // For apartments
        const apartment = await spaceService.getSpaceById(tenant.space_id);

        // Set apartment status to occupied
        const updatedApartment = {
          ...apartment,
          status: 'occupied',
          tenant: {
            id: tenant.id,
            name: `${tenant.first_name} ${tenant.last_name}`,
            email: tenant.email,
            phone: tenant.phone_number,
            moveInDate: tenant.start_date
          }
        };

        await spaceService.updateSpace(tenant.space_id, updatedApartment);
      } else if (tenant.space_type === 'room') {
        // For boarding house rooms
        const boardingHouse = await spaceService.getSpaceById(tenant.boarding_house_id);

        // Find the room and update its status
        const updatedRooms = boardingHouse.rooms.map(room => {
          if (room.roomNumber === tenant.room_id) {
            return {
              ...room,
              status: 'occupied',
              tenant: {
                id: tenant.id,
                name: `${tenant.first_name} ${tenant.last_name}`,
                email: tenant.email,
                phone: tenant.phone_number,
                moveInDate: tenant.start_date
              }
            };
          }
          return room;
        });

        const updatedBoardingHouse = {
          ...boardingHouse,
          rooms: updatedRooms
        };

        await spaceService.updateSpace(tenant.boarding_house_id, updatedBoardingHouse);
      }

      return true;
    } catch (error) {
      console.error('Error assigning tenant to space:', error);
      throw error;
    }
  },

  // Unassign tenant from a space and update space status
  unassignTenantFromSpace: async (tenant) => {
    try {
      if (tenant.space_type === 'apartment') {
        // For apartments
        const apartment = await spaceService.getSpaceById(tenant.space_id);

        // Set apartment status to available
        const updatedApartment = {
          ...apartment,
          status: 'available',
          tenant: null
        };

        await spaceService.updateSpace(tenant.space_id, updatedApartment);
      } else if (tenant.space_type === 'room') {
        // For boarding house rooms
        const boardingHouse = await spaceService.getSpaceById(tenant.boarding_house_id);

        // Find the room and update its status
        const updatedRooms = boardingHouse.rooms.map(room => {
          if (room.roomNumber === tenant.room_id) {
            return {
              ...room,
              status: 'available',
              tenant: null
            };
          }
          return room;
        });

        const updatedBoardingHouse = {
          ...boardingHouse,
          rooms: updatedRooms
        };

        await spaceService.updateSpace(tenant.boarding_house_id, updatedBoardingHouse);
      }

      return true;
    } catch (error) {
      console.error('Error unassigning tenant from space:', error);
      throw error;
    }
  },

  // Helper to get all available spaces for tenant assignment
  getAvailableSpaces: async () => {
    try {
      const currentUser = authService.getCurrentUser();
      const allSpaces = await spaceService.getAllSpaces(currentUser?.id);

      // Available apartments
      const availableApartments = allSpaces
        .filter(space => space.propertyType === 'apartment' && space.status === 'available')
        .map(apartment => ({
          id: apartment.id,
          name: apartment.name,
          type: 'apartment',
          address: `${apartment.address.street}, ${apartment.address.district}, ${apartment.address.city}`,
          monthlyRent: apartment.monthlyRent || 0,
          size: apartment.squareMeters,
          maxOccupancy: apartment.maxOccupancy
        }));

      // Available rooms in boarding houses
      const availableRooms = [];

      allSpaces
        .filter(space => space.propertyType === 'boarding_house')
        .forEach(boardingHouse => {
          if (boardingHouse.rooms && boardingHouse.rooms.length > 0) {
            const rooms = boardingHouse.rooms
              .filter(room => room.status === 'available')
              .map(room => ({
                id: room.roomNumber, // Use room number as ID
                name: `Room ${room.roomNumber}`,
                type: 'room',
                boardingHouseId: boardingHouse.id,
                boardingHouseName: boardingHouse.name,
                address: `${boardingHouse.name}, ${boardingHouse.address.street}, ${boardingHouse.address.district}, ${boardingHouse.address.city}`,
                monthlyRent: room.monthlyRent || 0,
                size: room.squareMeters,
                maxOccupancy: room.maxOccupancy
              }));

            availableRooms.push(...rooms);
          }
        });

      return {
        apartments: availableApartments,
        rooms: availableRooms
      };
    } catch (error) {
      console.error('Error getting available spaces:', error);
      throw error;
    }
  },

  // Common relationship types (for dropdown options)
  getRelationshipTypes: () => {
    return [
      { value: 'spouse', label: 'Spouse' },
      { value: 'partner', label: 'Partner' },
      { value: 'roommate', label: 'Roommate' },
      { value: 'family_member', label: 'Family Member' },
      { value: 'child', label: 'Child' },
      { value: 'parent', label: 'Parent' },
      { value: 'sibling', label: 'Sibling' },
      { value: 'friend', label: 'Friend' },
      { value: 'other', label: 'Other' }
    ];
  }
};

export default tenantService;