const TenantModel = require('../models/tenant.model');
const SpaceModel = require('../models/space.model');

class TenantController {
  static async createTenant(req, res) {
    try {
      const tenantData = req.body;

      // Validate required fields
      if (!tenantData.first_name || !tenantData.last_name || !tenantData.email || !tenantData.space_id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required tenant information'
        });
      }

      if (!tenantData.start_date || !tenantData.end_date) {
        return res.status(400).json({
          success: false,
          message: 'Lease start and end dates are required'
        });
      }

      // Verify the space exists and belongs to this host
      const space = await SpaceModel.findById(tenantData.space_id);

      if (!space) {
        return res.status(404).json({
          success: false,
          message: 'Space not found'
        });
      }

      if (space.host_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to add tenants to this space'
        });
      }

      // Create the tenant with is_deleted set to false by default
      const tenant = await TenantModel.create({
        ...tenantData,
        is_deleted: false
      });

      return res.status(201).json({
        success: true,
        message: 'Tenant created successfully',
        tenant
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during tenant creation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getTenants(req, res) {
    try {
      // Get non-deleted tenants for spaces owned by this host
      const tenants = await TenantModel.findByHostId(req.user.id);

      return res.status(200).json({
        success: true,
        count: tenants.length,
        tenants
      });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching tenants',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getTenantById(req, res) {
    try {
      const { tenantId } = req.params;
      const tenant = await TenantModel.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      // Verify that this tenant belongs to a space owned by this host
      const space = await SpaceModel.findById(tenant.space_id);

      if (!space || space.host_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this tenant'
        });
      }

      return res.status(200).json({
        success: true,
        tenant
      });
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching tenant',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getTenantsBySpace(req, res) {
    try {
      const { spaceId } = req.params;

      // Verify the space exists and belongs to this host
      const space = await SpaceModel.findById(spaceId);

      if (!space) {
        return res.status(404).json({
          success: false,
          message: 'Space not found'
        });
      }

      if (space.host_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view tenants for this space'
        });
      }

      // Fetch only non-deleted tenants for the space
      const tenants = await TenantModel.findBySpaceId(spaceId);

      return res.status(200).json({
        success: true,
        count: tenants.length,
        tenants
      });
    } catch (error) {
      console.error('Error fetching space tenants:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching space tenants',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async getTenantMetrics(req, res) {
    try {
      const hostId = req.user.id;
      const metrics = await TenantModel.getTenantMetrics(hostId);

      return res.status(200).json({
        success: true,
        metrics
      });
    } catch (error) {
      console.error('Error fetching tenant metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching tenant metrics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async updateTenant(req, res) {
    try {
      const { tenantId } = req.params;
      const updateData = req.body;

      console.log(`Updating tenant ${tenantId} with data:`, updateData);

      // Find the tenant
      const tenant = await TenantModel.findById(tenantId);

      if (!tenant) {
        console.log(`Tenant not found with ID: ${tenantId}`);
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      // Verify that this tenant belongs to a space owned by this host
      const space = await SpaceModel.findById(tenant.space_id);

      if (!space || space.host_id !== req.user.id) {
        console.log(`Authorization failed for tenant ${tenantId}. Host ID: ${req.user.id}, Space owner: ${space?.host_id}`);
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this tenant'
        });
      }

      // Process numeric values to ensure they're stored as numbers
      if (updateData.rent_amount) {
        updateData.rent_amount = parseFloat(updateData.rent_amount);
      }

      if (updateData.security_deposit) {
        updateData.security_deposit = parseFloat(updateData.security_deposit);
      }

      // Update the tenant
      const updatedTenant = await TenantModel.update(tenantId, updateData);

      if (!updatedTenant) {
        console.log(`Update failed for tenant ${tenantId}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to update tenant'
        });
      }

      console.log(`Tenant ${tenantId} updated successfully`);
      return res.status(200).json({
        success: true,
        message: 'Tenant updated successfully',
        tenant: updatedTenant
      });
    } catch (error) {
      console.error('Error updating tenant:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while updating tenant',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  static async deleteTenant(req, res) {
    try {
      const { tenantId } = req.params;

      // Find the tenant
      const tenant = await TenantModel.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      // Verify that this tenant belongs to a space owned by this host
      const space = await SpaceModel.findById(tenant.space_id);

      if (!space || space.host_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this tenant'
        });
      }

      // Soft delete the tenant
      await TenantModel.delete(tenantId);

      return res.status(200).json({
        success: true,
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while deleting tenant',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = TenantController;