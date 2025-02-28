const TenantModel = require('../models/tenant.model');
const SpaceModel = require('../models/space.model');

class TenantController {
  static async createTenant(req, res) {
    try {
      const tenantData = req.body;

      // Validate required fields
      if (!tenantData.first_name || !tenantData.last_name || !tenantData.email || !tenantData.space_id) {
        return res.status(400).json({ message: 'Missing required tenant information' });
      }

      if (!tenantData.start_date || !tenantData.end_date) {
        return res.status(400).json({ message: 'Lease start and end dates are required' });
      }

      // Verify the space exists and belongs to this host
      const space = await SpaceModel.findById(tenantData.space_id);

      if (!space) {
        return res.status(404).json({ message: 'Space not found' });
      }

      if (space.host_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to add tenants to this space' });
      }

      // Create the tenant
      const tenant = await TenantModel.create(tenantData);

      return res.status(201).json({
        message: 'Tenant created successfully',
        tenant
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      return res.status(500).json({ message: 'Server error during tenant creation' });
    }
  }

  static async getTenants(req, res) {
    try {
      // Get tenants for spaces owned by this host
      const tenants = await TenantModel.findByHostId(req.user.id);

      return res.status(200).json({
        tenants
      });
    } catch (error) {
      console.error('Error fetching tenants:', error);
      return res.status(500).json({ message: 'Server error while fetching tenants' });
    }
  }

  static async getTenantById(req, res) {
    try {
      const { tenantId } = req.params;
      const tenant = await TenantModel.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Verify that this tenant belongs to a space owned by this host
      const space = await SpaceModel.findById(tenant.space_id);

      if (space.host_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view this tenant' });
      }

      return res.status(200).json({
        tenant
      });
    } catch (error) {
      console.error('Error fetching tenant:', error);
      return res.status(500).json({ message: 'Server error while fetching tenant' });
    }
  }

  static async getTenantsBySpace(req, res) {
    try {
      const { spaceId } = req.params;

      // Verify the space exists and belongs to this host
      const space = await SpaceModel.findById(spaceId);

      if (!space) {
        return res.status(404).json({ message: 'Space not found' });
      }

      if (space.host_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view tenants for this space' });
      }

      const tenants = await TenantModel.findBySpaceId(spaceId);

      return res.status(200).json({
        tenants
      });
    } catch (error) {
      console.error('Error fetching space tenants:', error);
      return res.status(500).json({ message: 'Server error while fetching space tenants' });
    }
  }

  static async updateTenant(req, res) {
    try {
      const { tenantId } = req.params;
      const updateData = req.body;

      // Find the tenant
      const tenant = await TenantModel.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Verify that this tenant belongs to a space owned by this host
      const space = await SpaceModel.findById(tenant.space_id);

      if (space.host_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this tenant' });
      }

      // Update the tenant
      const updatedTenant = await TenantModel.update(tenantId, updateData);

      return res.status(200).json({
        message: 'Tenant updated successfully',
        tenant: updatedTenant
      });
    } catch (error) {
      console.error('Error updating tenant:', error);
      return res.status(500).json({ message: 'Server error while updating tenant' });
    }
  }

  static async deleteTenant(req, res) {
    try {
      const { tenantId } = req.params;

      // Find the tenant
      const tenant = await TenantModel.findById(tenantId);

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Verify that this tenant belongs to a space owned by this host
      const space = await SpaceModel.findById(tenant.space_id);

      if (space.host_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this tenant' });
      }

      // Delete the tenant
      await TenantModel.delete(tenantId);

      return res.status(200).json({
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      return res.status(500).json({ message: 'Server error while deleting tenant' });
    }
  }
}

module.exports = TenantController;