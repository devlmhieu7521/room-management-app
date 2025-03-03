const SpaceModel = require('../models/space.model');
const TenantModel = require('../models/tenant.model');
const db = require('../config/database');
class SpaceController {
  // Get all spaces (with optional filtering)
  static async getSpaces(req, res) {
    try {
      const filters = req.query; // Get filters from query parameters
      const spaces = await SpaceModel.findAll(filters);

      return res.status(200).json({
        success: true,
        count: spaces.length,
        spaces
      });
    } catch (error) {
      console.error('Error fetching spaces:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching spaces',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get a single space by ID
  static async getSpaceById(req, res) {
    try {
      const { spaceId } = req.params;
      const space = await SpaceModel.findById(spaceId);

      if (!space) {
        return res.status(404).json({
          success: false,
          message: 'Space not found'
        });
      }

      return res.status(200).json({
        success: true,
        space
      });
    } catch (error) {
      console.error('Error fetching space:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching space',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create a new space
  static async createSpace(req, res) {
    try {
      // Add host_id from authenticated user
      const spaceData = {
        ...req.body,
        host_id: req.user.id // From JWT token
      };

      // Validate required fields
      const requiredFields = ['title', 'space_type', 'capacity', 'street_address', 'city', 'state', 'zip_code', 'country'];
      for (const field of requiredFields) {
        if (!spaceData[field]) {
          return res.status(400).json({
            success: false,
            message: `Missing required field: ${field}`
          });
        }
      }

      const space = await SpaceModel.create(spaceData);

      return res.status(201).json({
        success: true,
        message: 'Space created successfully',
        space
      });
    } catch (error) {
      console.error('Space creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during space creation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get all spaces for the current host
  static async getHostSpaces(req, res) {
    try {
      const hostId = req.user.id;
      const spaces = await SpaceModel.findByHostId(hostId);

      // Debug the spaces returned from the model
      console.log('Raw spaces data from model:', JSON.stringify(spaces[0], null, 2));

      // Make sure the tenant_count is explicitly included in each space
      const spacesWithTenantCount = spaces.map(space => {
        // If tenant_count is missing, set it to 0
        return {
          ...space,
          tenant_count: space.tenant_count !== undefined ? space.tenant_count : 0
        };
      });

      return res.status(200).json({
        success: true,
        count: spacesWithTenantCount.length,
        spaces: spacesWithTenantCount
      });
    } catch (error) {
      console.error('Error fetching host spaces:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching host spaces'
      });
    }
  }

  // Update a space
  static async updateSpace(req, res) {
    try {
      const { spaceId } = req.params;
      const updateData = req.body;

      // First check if space exists and belongs to this host
      const existingSpace = await SpaceModel.findById(spaceId);

      if (!existingSpace) {
        return res.status(404).json({
          success: false,
          message: 'Space not found'
        });
      }

      // Verify ownership
      if (existingSpace.host_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this space'
        });
      }

      // Process boolean fields if they come as strings
      if (updateData.is_active !== undefined) {
        updateData.is_active = updateData.is_active === true || updateData.is_active === 'true';
      }

      const updatedSpace = await SpaceModel.update(spaceId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Space updated successfully',
        space: updatedSpace
      });
    } catch (error) {
      console.error('Error updating space:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while updating space',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Delete a space
  static async deleteSpace(req, res) {
    const client = await db.connect(); // Use transaction for atomicity

    try {
      await client.query('BEGIN');

      const { spaceId } = req.params;

      // First check if space exists and belongs to this host
      const existingSpace = await SpaceModel.findById(spaceId);

      if (!existingSpace) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Space not found'
        });
      }

      // Verify ownership
      if (existingSpace.host_id !== req.user.id) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this space'
        });
      }

      // Check for active non-deleted tenants before deletion
      const tenantsQuery = `
        SELECT * FROM tenants
        WHERE space_id = $1
        AND status = 'active'
        AND is_deleted = FALSE
      `;
      const tenantsResult = await client.query(tenantsQuery, [spaceId]);
      const activeTenantsCount = tenantsResult.rows.length;

      if (activeTenantsCount > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Cannot delete space with ${activeTenantsCount} active tenant(s). Please move or terminate tenants first.`
        });
      }

      // First, mark all associated tenants as deleted
      const deleteTenantQuery = `
        UPDATE tenants
        SET
          status = 'deleted',
          is_deleted = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE space_id = $1
        RETURNING *
      `;
      await client.query(deleteTenantQuery, [spaceId]);

      // Then soft delete the space
      const deleteSpaceQuery = `
        UPDATE spaces
        SET
          is_deleted = TRUE,
          is_active = FALSE,
          updated_at = CURRENT_TIMESTAMP
        WHERE space_id = $1
        RETURNING *
      `;
      await client.query(deleteSpaceQuery, [spaceId]);

      // Commit the transaction
      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: 'Space and associated tenants have been soft deleted successfully'
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await client.query('ROLLBACK');
      console.error('Error deleting space:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while deleting space',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      client.release();
    }
  }
  // Get space metrics for dashboard
  static async getSpaceMetrics(req, res) {
    try {
      const hostId = req.user.id; // From JWT token
      console.log('Fetching metrics for host ID:', hostId);

      const metrics = await SpaceModel.getMetrics(hostId);
      console.log('Metrics found:', metrics);

      return res.status(200).json({
        success: true,
        metrics
      });
    } catch (error) {
      console.error('Error fetching space metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching space metrics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = SpaceController;