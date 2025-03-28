const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Not authorized. Required roles: ${roles.join(', ')}`);
    }

    next();
  };
};

module.exports = { roleCheck };