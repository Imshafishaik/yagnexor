import { Router } from 'express';
import { getDatabase } from '../../config/database.js';
import { getTenantRoles, createRole, getRoleWithPermissions } from '../../core/rbac/rbac-service.js';
import { requireRole } from '../../core/middleware/api-guard.js';

const router = Router();

// List roles
router.get('/', async (req, res) => {
  try {
    const roles = await getTenantRoles(req.tenantId);
    res.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Create role
router.post('/', requireRole('super_admin', 'tenant_admin'), async (req, res) => {
  const { name, description } = req.body;
  try {
    const roleId = await createRole(req.tenantId, name, description);
    res.status(201).json({ message: 'Role created successfully', role_id: roleId });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Get role details
router.get('/:role_id', async (req, res) => {
  try {
    const role = await getRoleWithPermissions(req.params.role_id, req.tenantId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

export default router;
