const SpaceModel = require('../models/space.model');

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
      const hostId = req.user.id; // From JWT token
      const spaces = await SpaceModel.findByHostId(hostId);

      return res.status(200).json({
        success: true,
        count: spaces.length,
        spaces
      });
    } catch (error) {
      console.error('Error fetching host spaces:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching host spaces',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    try {
      const { spaceId } = req.params;

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
          message: 'Not authorized to delete this space'
        });
      }

      await SpaceModel.delete(spaceId);

      return res.status(200).json({
        success: true,
        message: 'Space deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting space:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while deleting space',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get space metrics for dashboard
  static async getSpaceMetrics(req, res) {
    try {
      const hostId = req.user.id; // From JWT token
      const metrics = await SpaceModel.getMetrics(hostId);

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