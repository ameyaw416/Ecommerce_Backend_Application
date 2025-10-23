// backend/middlewares/verifyAdmin.js
export default function verifyAdmin(req, res, next) {
  try {
    // verifyAuth should already have attached req.user with a role
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    next();
  } catch (err) {
    console.error('verifyAdmin error ->', err && err.stack ? err.stack : err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
