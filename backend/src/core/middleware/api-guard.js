import { verifyAccessToken } from '../auth/token-manager.js';
import { getRolePermissions } from '../rbac/rbac-service.js';
import { getDatabase } from '../../config/database.js';

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  req.tenantId = decoded.tenant_id;
  req.userId = decoded.id;
  next();
}

export function tenantScopeMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  req.tenantId = req.user.tenant_id;
  next();
}

export function requirePermission(resource, action) {
  return async (req, res, next) => {
    try {
      const db = getDatabase();
      const [rows] = await db.query(
        `SELECT 1 FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN roles r ON rp.role_id = r.id
         WHERE r.name = ? AND p.tenant_id = ? AND p.resource = ? AND p.action = ?`,
        [req.user.role, req.tenantId, resource, action]
      );

      if (rows.length === 0) {
        return res.status(403).json({ error: `Permission denied: ${resource}:${action}` });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
}
