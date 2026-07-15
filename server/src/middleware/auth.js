const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен не надано' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;
    req.adminRole = decoded.role || 'admin';
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Невірний токен' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.adminRole)) {
      return res.status(403).json({ error: 'Недостатньо прав' });
    }
    next();
  };
}

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
