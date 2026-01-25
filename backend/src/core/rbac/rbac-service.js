import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export async function getUserRole(userId, tenantId) {
  const db = getDatabase();
  try {
    const [rows] = await db.query('SELECT role FROM users WHERE id = ? AND tenant_id = ?', [userId, tenantId]);
    return rows[0]?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

export async function getRolePermissions(roleId, tenantId) {
  const db = getDatabase();
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.resource, p.action, p.description
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = ? AND p.tenant_id = ?`,
      [roleId, tenantId]
    );
    return rows;
  } catch (error) {
    console.error('Error getting role permissions:', error);
    return [];
  }
}

export async function hasPermission(userId, tenantId, resource, action) {
  const db = getDatabase();
  try {
    const [rows] = await db.query(
      `SELECT 1 FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON rp.role_id = r.id
       JOIN users u ON r.id = (SELECT role FROM users WHERE id = ?)
       WHERE p.tenant_id = ? AND p.resource = ? AND p.action = ?
       LIMIT 1`,
      [userId, tenantId, resource, action]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export async function createRole(tenantId, name, description) {
  const db = getDatabase();
  try {
    const roleId = uuidv4();
    const query = 'INSERT INTO roles (id, tenant_id, name, description) VALUES (?, ?, ?, ?)';
    await db.query(query, [roleId, tenantId, name, description]);
    return roleId;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
}

export async function assignPermissionToRole(roleId, permissionId) {
  const db = getDatabase();
  try {
    const rpId = uuidv4();
    const query = 'INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)';
    await db.query(query, [rpId, roleId, permissionId]);
    return true;
  } catch (error) {
    console.error('Error assigning permission:', error);
    throw error;
  }
}

export async function removePermissionFromRole(roleId, permissionId) {
  const db = getDatabase();
  try {
    await db.query('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', [roleId, permissionId]);
    return true;
  } catch (error) {
    console.error('Error removing permission:', error);
    throw error;
  }
}

export async function getOrCreatePermission(tenantId, resource, action, description = '') {
  const db = getDatabase();
  try {
    const [rows] = await db.query(
      'SELECT id FROM permissions WHERE tenant_id = ? AND resource = ? AND action = ?',
      [tenantId, resource, action]
    );

    if (rows[0]) {
      return rows[0].id;
    }

    const permId = uuidv4();
    await db.query(
      'INSERT INTO permissions (id, tenant_id, resource, action, description) VALUES (?, ?, ?, ?, ?)',
      [permId, tenantId, resource, action, description]
    );
    return permId;
  } catch (error) {
    console.error('Error getting or creating permission:', error);
    throw error;
  }
}

export async function getTenantRoles(tenantId) {
  const db = getDatabase();
  try {
    const [rows] = await db.query('SELECT id, name, description FROM roles WHERE tenant_id = ?', [tenantId]);
    return rows;
  } catch (error) {
    console.error('Error getting tenant roles:', error);
    return [];
  }
}

export async function getRoleWithPermissions(roleId, tenantId) {
  const db = getDatabase();
  try {
    const [roleRows] = await db.query('SELECT * FROM roles WHERE id = ? AND tenant_id = ?', [roleId, tenantId]);
    if (!roleRows[0]) return null;

    const permissions = await getRolePermissions(roleId, tenantId);
    return {
      ...roleRows[0],
      permissions,
    };
  } catch (error) {
    console.error('Error getting role with permissions:', error);
    return null;
  }
}
