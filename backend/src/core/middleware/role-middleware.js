import { getDatabase } from '../../config/database.js';

// Role hierarchy and permissions
const ROLE_HIERARCHY = {
  'super_admin': 100,
  'manager': 80,
  'principal': 80,
  'faculty': 60,
  'student': 40,
  'parent': 20
};

// Resource permissions by role
const ROLE_PERMISSIONS = {
  'super_admin': [
    'tenants:create', 'tenants:read', 'tenants:update', 'tenants:delete',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'roles:create', 'roles:read', 'roles:update', 'roles:delete',
    'permissions:create', 'permissions:read', 'permissions:update', 'permissions:delete',
    'departments:create', 'departments:read', 'departments:update', 'departments:delete',
    'courses:create', 'courses:read', 'courses:update', 'courses:delete',
    'classes:create', 'classes:read', 'classes:update', 'classes:delete',
    'students:create', 'students:read', 'students:update', 'students:delete',
    'faculty:create', 'faculty:read', 'faculty:update', 'faculty:delete',
    'attendance:create', 'attendance:read', 'attendance:update',
    'exams:create', 'exams:read', 'exams:update', 'exams:delete',
    'fees:create', 'fees:read', 'fees:update', 'fees:delete',
    'academic_years:create', 'academic_years:read', 'academic_years:update', 'academic_years:delete'
  ],
  'manager': [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'roles:read',
    'departments:create', 'departments:read', 'departments:update', 'departments:delete',
    'courses:create', 'courses:read', 'courses:update', 'courses:delete',
    'classes:create', 'classes:read', 'classes:update', 'classes:delete',
    'students:read', 'students:update',
    'faculty:create', 'faculty:read', 'faculty:update', 'faculty:delete',
    'attendance:read',
    'exams:create', 'exams:read', 'exams:update', 'exams:delete',
    'fees:read', 'fees:update',
    'academic_years:create', 'academic_years:read', 'academic_years:update', 'academic_years:delete'
  ],
  'principal': [
    'users:create', 'users:read', 'users:update',
    'roles:read',
    'courses:read', 'courses:update',
    'classes:create', 'classes:read', 'classes:update', 'classes:delete',
    'students:read', 'students:update',
    'faculty:create', 'faculty:read', 'faculty:update',
    'attendance:read',
    'exams:create', 'exams:read', 'exams:update', 'exams:delete',
    'fees:read',
    'academic_years:read', 'academic_years:update'
  ],
  'faculty': [
    'classes:read',
    'students:create', 'students:read', 'students:update',
    'attendance:create', 'attendance:read', 'attendance:update',
    'exams:read', 'exams:create',
    'course_materials:create', 'course_materials:read', 'course_materials:update', 'course_materials:delete'
  ],
  'student': [
    'classes:read',
    'attendance:read',
    'exams:read',
    'course_materials:read',
    'fees:read'
  ],
  'parent': [
    'students:read',
    'attendance:read',
    'exams:read',
    'fees:read'
  ]
};

// Check if user has permission for a specific action on a resource
export const hasPermission = (userRole, permission) => {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  return userPermissions.includes(permission);
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Check if user role is at least the specified level
export const hasMinimumRole = (userRole, minimumRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= requiredLevel;
};

// Middleware to check specific permission
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;
      
      if (!userRole) {
        return res.status(401).json({ error: 'User role not found' });
      }

      if (!hasPermission(userRole, permission)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Middleware to check minimum role level
export const requireMinimumRole = (minimumRole) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;
      
      if (!userRole) {
        return res.status(401).json({ error: 'User role not found' });
      }

      if (!hasMinimumRole(userRole, minimumRole)) {
        return res.status(403).json({ 
          error: 'Insufficient role level',
          required: minimumRole,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Role check failed' });
    }
  };
};

// Middleware to check if user can access specific tenant resource
export const requireTenantAccess = async (req, res, next) => {
  try {
    const userRole = req.user?.role;
    const userTenantId = req.user?.tenant_id;
    const resourceTenantId = req.tenantId;

    // Super admins can access any tenant
    if (userRole === 'super_admin') {
      return next();
    }

    // Other roles can only access their own tenant
    if (userTenantId !== resourceTenantId) {
      return res.status(403).json({ 
        error: 'Access denied: Cannot access other tenant resources',
        userTenant: userTenantId,
        resourceTenant: resourceTenantId
      });
    }

    next();
  } catch (error) {
    console.error('Tenant access check error:', error);
    res.status(500).json({ error: 'Tenant access check failed' });
  }
};

// Get user permissions for frontend
export const getUserPermissions = async (userId, tenantId) => {
  const db = getDatabase();
  try {
    const [user] = await db.query(
      'SELECT role FROM users WHERE id = ? AND tenant_id = ?',
      [userId, tenantId]
    );

    if (!user[0]) {
      return [];
    }

    return ROLE_PERMISSIONS[user[0].role] || [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

export default {
  hasPermission,
  hasAnyPermission,
  hasMinimumRole,
  requirePermission,
  requireMinimumRole,
  requireTenantAccess,
  getUserPermissions,
  ROLE_PERMISSIONS,
  ROLE_HIERARCHY
};
