export function
  authorize(roles = []) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    try {
      if (allowedRoles.length === 0) return next();
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ success: false, message: "Forbidden: Access denied" });
      }

      next();
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Authorization check failed" });
    }
  };
};
