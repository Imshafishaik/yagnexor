import express from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';
import { requirePermission, requireMinimumRole } from '../../core/middleware/role-middleware.js';

const router = express.Router();

// Validation schemas
const createTenantSchema = Joi.object({
  name: Joi.string().min(2).required(),
  domain: Joi.string().min(2).lowercase().required(),
  admin_email: Joi.string().email().required(),
  admin_password: Joi.string().min(8).required(),
  admin_first_name: Joi.string().required(),
  admin_last_name: Joi.string().required(),
});

const updateTenantSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  domain: Joi.string().min(2).lowercase().optional(),
  is_active: Joi.boolean().optional(),
});

// Get all tenants (Super Admin only)
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    // Only allow super_admin to access all tenants
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const [tenants] = await db.query(`
      SELECT t.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT s.id) as student_count,
             COUNT(DISTINCT f.id) as faculty_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN students s ON t.id = s.tenant_id
      LEFT JOIN faculty f ON t.id = f.tenant_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    res.json({ tenants });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Get tenant by ID (Super Admin only)
router.get('/:id', requireMinimumRole('super_admin'), async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    const [tenants] = await db.query(`
      SELECT t.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT s.id) as student_count,
             COUNT(DISTINCT f.id) as faculty_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN students s ON t.id = s.tenant_id
      LEFT JOIN faculty f ON t.id = f.tenant_id
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);

    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenants[0]);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// Create new tenant with admin user (Super Admin only)
router.post('/', validateRequest(createTenantSchema), async (req, res) => {
  const db = getDatabase();
  const { name, domain, admin_email, admin_password, admin_first_name, admin_last_name } = req.validatedBody;

  try {
    // Only allow super_admin to create tenants
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    // Check if domain already exists
    const [existingDomain] = await db.query('SELECT id FROM tenants WHERE domain = ?', [domain]);
    if (existingDomain.length > 0) {
      return res.status(400).json({ error: 'Domain already exists' });
    }

    // Create tenant
    const tenantId = uuidv4();
    await db.query('INSERT INTO tenants (id, name, domain) VALUES (?, ?, ?)', [tenantId, name, domain]);

    // Create admin user for the tenant
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    
    await db.query(
      `INSERT INTO users (id, tenant_id, email, password, first_name, last_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 'manager', 1)`,
      [adminId, tenantId, admin_email, hashedPassword, admin_first_name, admin_last_name]
    );

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: {
        id: tenantId,
        name,
        domain,
        admin: {
          id: adminId,
          email: admin_email,
          first_name: admin_first_name,
          last_name: admin_last_name,
          role: 'manager'
        }
      }
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Update tenant (Super Admin only)
router.put('/:id', validateRequest(updateTenantSchema), async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, domain, is_active } = req.validatedBody;

  try {
    // Only allow super_admin to update tenants
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    // Check if tenant exists
    const [existingTenant] = await db.query('SELECT id FROM tenants WHERE id = ?', [id]);
    if (existingTenant.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check domain uniqueness if updating domain
    if (domain) {
      const [existingDomain] = await db.query('SELECT id FROM tenants WHERE domain = ? AND id != ?', [domain, id]);
      if (existingDomain.length > 0) {
        return res.status(400).json({ error: 'Domain already exists' });
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (domain) {
      updateFields.push('domain = ?');
      updateValues.push(domain);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);
    await db.query(`UPDATE tenants SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    res.json({ message: 'Tenant updated successfully' });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Delete tenant (Super Admin only) - Soft delete by deactivating
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    // Only allow super_admin to delete tenants
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    // Check if tenant exists
    const [existingTenant] = await db.query('SELECT id, is_active FROM tenants WHERE id = ?', [id]);
    if (existingTenant.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Check if tenant has active users
    const [activeUsers] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND is_active = 1',
      [id]
    );

    if (activeUsers[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete tenant with active users. Deactivate users first.' 
      });
    }

    // Soft delete by deactivating
    await db.query('UPDATE tenants SET is_active = 0 WHERE id = ?', [id]);

    res.json({ message: 'Tenant deactivated successfully' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

// Get tenant statistics (Super Admin only)
router.get('/:id/stats', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  try {
    // Only allow super_admin to access tenant stats
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as students,
        COUNT(DISTINCT CASE WHEN u.role = 'faculty' THEN u.id END) as faculty,
        COUNT(DISTINCT CASE WHEN u.role IN ('manager', 'principal') THEN u.id END) as administrators,
        COUNT(DISTINCT c.id) as classes,
        COUNT(DISTINCT co.id) as courses,
        COUNT(DISTINCT s.id) as subjects
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN classes c ON t.id = c.tenant_id
      LEFT JOIN courses co ON t.id = co.tenant_id
      LEFT JOIN subjects s ON t.id = s.tenant_id
      WHERE t.id = ?
    `, [id]);

    res.json(stats[0] || {});
  } catch (error) {
    console.error('Error fetching tenant stats:', error);
    res.status(500).json({ error: 'Failed to fetch tenant statistics' });
  }
});

export default router;
