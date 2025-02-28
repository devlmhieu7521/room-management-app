const SpaceModel = require('../models/space.model');

class SpaceController {
  static async createSpace(req, res) {
    try {
      // Add host_id from authenticated user
      const spaceData = {
        ...req.body,
        host_id: req.user.id // From JWT token
      };

      const space = await SpaceModel.create(spaceData);

      return res.status(201).json({
        message: 'Space created successfully',
        space
      });
    } catch (error) {
      console.error('Space creation error:', error);
      return res.status(500).json({ message: 'Server error during space creation' });
    }
  }

  // In your space.controller.js
  static async getSpaces(req, res) {
    try {
      const filters = req.query; // Get filters from query parameters
      const spaces = await SpaceModel.findAll(filters);

      return res.status(200).json({
        spaces // This should be an array of space objects
      });
    } catch (error) {
      console.error('Error fetching spaces:', error);
      return res.status(500).json({ message: 'Server error while fetching spaces' });
    }
  }

  static async getSpaceById(req, res) {
    try {
      const { spaceId } = req.params;
      const space = await SpaceModel.findById(spaceId);

      if (!space) {
        return res.status(404).json({ message: 'Space not found' });
      }

      return res.status(200).json({
        space
      });
    } catch (error) {
      console.error('Error fetching space:', error);
      return res.status(500).json({ message: 'Server error while fetching space' });
    }
  }

  static async getHostSpaces(req, res) {
    try {
      const hostId = req.user.id; // From JWT token
      const spaces = await SpaceModel.findByHostId(hostId);

      return res.status(200).json({
        spaces
      });
    } catch (error) {
      console.error('Error fetching host spaces:', error);
      return res.status(500).json({ message: 'Server error while fetching host spaces' });
    }
  }

  static async updateSpace(req, res) {
    try {
      const { spaceId } = req.params;
      const updateData = req.body;

      // First check if space exists and belongs to this host
      const existingSpace = await SpaceModel.findById(spaceId);

      if (!existingSpace) {
        return res.status(404).json({ message: 'Space not found' });
      }

      // Verify ownership
      if (existingSpace.host_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this space' });
      }

      const updatedSpace = await SpaceModel.update(spaceId, updateData);

      return res.status(200).json({
        message: 'Space updated successfully',
        space: updatedSpace
      });
    } catch (error) {
      console.error('Error updating space:', error);
      return res.status(500).json({ message: 'Server error while updating space' });
    }
  }

  static async deleteSpace(req, res) {
    try {
      const { spaceId } = req.params;

      // First check if space exists and belongs to this host
      const existingSpace = await SpaceModel.findById(spaceId);

      if (!existingSpace) {
        return res.status(404).json({ message: 'Space not found' });
      }

      // Verify ownership
      if (existingSpace.host_id !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this space' });
      }

      await SpaceModel.delete(spaceId);

      return res.status(200).json({
        message: 'Space deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting space:', error);
      return res.status(500).json({ message: 'Server error while deleting space' });
    }
  }
}

module.exports = SpaceController;