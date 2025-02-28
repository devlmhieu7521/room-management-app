const bcrypt = require('bcrypt');
const UserModel = require('../models/user.model');

class UserController {
  static async getUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't send password hash to client
      const { password_hash, ...userWithoutPassword } = user;

      return res.status(200).json({
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({ message: 'Server error while fetching user profile' });
    }
  }

  static async updateUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const { first_name, last_name } = req.body;

      // Update user info
      const updatedUser = await UserModel.update(userId, {
        first_name,
        last_name
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't send password hash to client
      const { password_hash, ...userWithoutPassword } = updatedUser;

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({ message: 'Server error while updating user profile' });
    }
  }

  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      // Validate input
      if (!current_password || !new_password) {
        return res.status(400).json({ message: 'Both current and new password are required' });
      }

      // Get user
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(new_password, salt);

      // Update password
      await UserModel.update(userId, { password_hash });

      return res.status(200).json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ message: 'Server error while changing password' });
    }
  }
}

module.exports = UserController;