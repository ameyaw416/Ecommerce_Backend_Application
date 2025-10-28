import * as userModel from '../models/userModel.js';

// Admin controller to get all users
export const adminGetUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users (admin):', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin controller to update user role
export const adminUpdateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const allowed = ['user', 'admin'];
  if (!role || typeof role !== 'string' || !allowed.includes(role)) {
    return res.status(400).json({ error: `role is required and must be one of: ${allowed.join(', ')}` });
  }

  try {
    //pass the admin who is changing the role
    const changerId = req.user?.id || null;
    const updated = await userModel.updateUserRole(id, role, changerId);

    if (!updated) return res.status(404).json({ error: 'User not found or invalid role' });

    res.status(200).json({ message: 'User role updated', user: updated });
  } catch (err) {
    console.error('Error updating user role (admin):', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin controller to get user role change history
export const adminGetUserRoleHistory = async (req, res) => {
  const { id } = req.params; // user id
  try {
    const history = await userModel.getUserRoleHistory(id);
    res.status(200).json(history);
  } catch (err) {
    console.error('Error fetching user role history (admin):', err?.stack || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
