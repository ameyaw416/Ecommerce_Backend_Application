import * as userModel from '../models/userModel.js';

// Helper to build next/prev links (keeps your style)
const buildPageLinks = (req, page, pages) => {
  const url = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
  const setPage = (p) => { url.searchParams.set('page', String(p)); return url.toString(); };

  const links = {};
  if (page > 1) links.prev = setPage(page - 1);
  if (page < pages) links.next = setPage(page + 1);
  return links;
};

// Admin controller to get all users with filtering, pagination, sorting
export const adminGetUsers = async (req, res, next) => {
  try {
    const { page, limit, search, sortBy, sortDir, created_from, created_to } = req.query;

    const result = await userModel.getUsersFiltered({
      page, limit, search, sortBy, sortDir, created_from, created_to,
    });

    const links = buildPageLinks(req, result.pagination.page, result.pagination.pages);

    res.status(200).json({ ...result, links });
  } catch (err) {
    next(err);
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

