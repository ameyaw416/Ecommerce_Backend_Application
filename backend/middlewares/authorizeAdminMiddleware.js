// authorizeAdmin.js
export default function authorizeAdmin(req, res, next) {
  try {
    // verifyAuth must have attached role to req.user (e.g. { id, email, role })
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }
    next();
  } catch (err) {
    console.error('authorizeAdmin error ->', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
