// Middleware to check if user has the required role
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ message: 'Unauthorized: No role found' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        message: `Forbidden: This action requires ${allowedRoles.join(' or ')} role` 
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
