// backend/src/middleware/roles.js

/**
 * Role-based access control middleware
 * @param {string[]} allowedRoles - list of permitted roles
 */
export default function Roles(allowedRoles = []) {
  return (req, res, next) => {
    try {
      // Ensure authentication occurred first
      if (!req.user || !req.user.role) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Check if user's role is in the allowed list
      const userRole = req.user.role.toLowerCase();
      const hasAccess = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

      if (!hasAccess) {
        return res.status(403).json({
          error: `Access denied. Role '${userRole}' not authorized for this resource.`,
        });
      }

      next();
    } catch (err) {
      console.error("Roles middleware error:", err.message);
      return res.status(500).json({ error: "Role validation failed" });
    }
  };
}
