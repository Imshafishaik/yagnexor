import bcrypt from 'bcryptjs';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export async function findUserByEmail(email, tenantId = null) {
  const db = getDatabase();
  try {
    let query = 'SELECT * FROM users WHERE email = ?';
    const params = [email];

    if (tenantId) {
      query += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    const [rows] = await db.query(query, params);
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

export async function findUserById(userId, tenantId = null) {
  const db = getDatabase();
  try {
    let query = 'SELECT * FROM users WHERE id = ?';
    const params = [userId];

    if (tenantId) {
      query += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    const [rows] = await db.query(query, params);
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by id:', error);
    return null;
  }
}

export async function createUser(userData) {
  const db = getDatabase();
  try {
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const query = `
      INSERT INTO users (id, tenant_id, email, password, first_name, last_name, phone, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      userId,
      userData.tenant_id,
      userData.email,
      hashedPassword,
      userData.first_name || '',
      userData.last_name || '',
      userData.phone || null,
      userData.role || 'student',
      userData.is_active !== undefined ? userData.is_active : 1,
    ];

    await db.query(query, params);
    return await findUserById(userId, userData.tenant_id);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function verifyPassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

export async function updateUserPassword(userId, newPassword, tenantId) {
  const db = getDatabase();
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const query = 'UPDATE users SET password = ? WHERE id = ? AND tenant_id = ?';
    await db.query(query, [hashedPassword, userId, tenantId]);

    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

export async function getTenantById(tenantId) {
  const db = getDatabase();
  try {
    const [rows] = await db.query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting tenant:', error);
    return null;
  }
}

export async function getTenantByDomain(domain) {
  const db = getDatabase();
  try {
    const [rows] = await db.query('SELECT * FROM tenants WHERE domain = ?', [domain]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting tenant by domain:', error);
    return null;
  }
}

export async function validateTenantAccess(userId, tenantId) {
  const user = await findUserById(userId, tenantId);
  return user !== null;
}

export async function getTenantUsers(tenantId) {
  const db = getDatabase();
  try {
    const [rows] = await db.query(
      'SELECT id, email, first_name, last_name, phone, role, is_active, created_at FROM users WHERE tenant_id = ?',
      [tenantId]
    );
    return rows;
  } catch (error) {
    console.error('Error getting tenant users:', error);
    return [];
  }
}

export async function deactivateUser(userId, tenantId) {
  const db = getDatabase();
  try {
    await db.query('UPDATE users SET is_active = 0 WHERE id = ? AND tenant_id = ?', [userId, tenantId]);
    return true;
  } catch (error) {
    console.error('Error deactivating user:', error);
    return false;
  }
}

export async function updateUserRole(userId, tenantId, role) {
  const db = getDatabase();
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ? AND tenant_id = ?', [role, userId, tenantId]);
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}
