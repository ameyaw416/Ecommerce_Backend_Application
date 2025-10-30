// backend/middlewares/verifyAuth.js
import jwt from 'jsonwebtoken';

export default function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({ message: 'Malformed token' });

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.userId, email: payload.email, role: payload.role || 'user'}; // attach user info to request
    next();
  } catch (err) {
   console.error('verifyAuth - jwt verify error:', err && err.message ? err.message : err);
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (err && err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
