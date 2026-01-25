import { Router } from 'express';
import { getDatabase } from '../../config/database.js';
import { createUser, getTenantUsers, deactivateUser, updateUserRole } from '../../core/auth/auth-service.js';
import { requireRole } from '../../core/middleware/api-guard.js';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';

const router = Router();

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  role: Joi.string().required(),
});

// List users
router.get('/', requireRole('super_admin', 'tenant_admin'), async (req, res) => {
  try {
    const users = await getTenantUsers(req.tenantId);
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
router.post('/', requireRole('super_admin', 'tenant_admin'), validateRequest(createUserSchema), async (req, res) => {
  try {
    const user = await createUser({
      tenant_id: req.tenantId,
      ...req.validatedBody,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get user by ID
router.get('/:user_id', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND tenant_id = ?', [req.params.user_id, req.tenantId]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user role
router.put('/:user_id/role', requireRole('super_admin', 'tenant_admin'), async (req, res) => {
  const { role } = req.body;
  try {
    await updateUserRole(req.params.user_id, req.tenantId, role);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Deactivate user
router.delete('/:user_id', requireRole('super_admin', 'tenant_admin'), async (req, res) => {
  try {
    await deactivateUser(req.params.user_id, req.tenantId);
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

export default router;
