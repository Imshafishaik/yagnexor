import express from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';

const router = express.Router();

// Validation schemas
const createDepartmentSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  hod_id: Joi.string().optional(),
  campus_id: Joi.string().optional(),
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  hod_id: Joi.string().optional(),
  campus_id: Joi.string().optional(),
});

// Get all departments with related data
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const tenantId = req.tenantId;
    const [departments] = await db.query(`
      SELECT d.*, 
             c.name as campus_name,
             CONCAT(u.first_name, ' ', u.last_name) as hod_name,
             COUNT(f.id) as faculty_count
      FROM departments d
      LEFT JOIN campuses c ON d.campus_id = c.id
      LEFT JOIN users u ON d.hod_id = u.id
      LEFT JOIN faculty f ON d.id = f.department_id AND f.tenant_id = d.tenant_id
      WHERE d.tenant_id = ?
      GROUP BY d.id
      ORDER BY d.name
    `, [tenantId]);
    res.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get department by ID with related data
router.get('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;
    const [departments] = await db.query(`
      SELECT d.*, 
             c.name as campus_name,
             CONCAT(u.first_name, ' ', u.last_name) as hod_name
      FROM departments d
      LEFT JOIN campuses c ON d.campus_id = c.id
      LEFT JOIN users u ON d.hod_id = u.id
      WHERE d.id = ? AND d.tenant_id = ?
    `, [id, tenantId]);

    if (departments.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(departments[0]);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create new department
router.post('/', validateRequest(createDepartmentSchema), async (req, res) => {
  const db = getDatabase();
  const { name, description, hod_id, campus_id } = req.validatedBody;
  
  try {
    const departmentId = uuidv4();
    await db.query(
      `INSERT INTO departments (id, tenant_id, name, description, hod_id, campus_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [departmentId, req.tenantId, name, description || null, hod_id || null, campus_id || null]
    );
    
    res.status(201).json({ 
      message: 'Department created successfully', 
      department_id: departmentId 
    });
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/:id', validateRequest(updateDepartmentSchema), async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  const { name, description, hod_id, campus_id } = req.validatedBody;
  
  try {
    // Check if department exists
    const [existingDepartment] = await db.query(
      'SELECT id FROM departments WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingDepartment.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (hod_id !== undefined) {
      updateFields.push('hod_id = ?');
      updateValues.push(hod_id);
    }
    if (campus_id !== undefined) {
      updateFields.push('campus_id = ?');
      updateValues.push(campus_id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id, req.tenantId);
    
    await db.query(
      `UPDATE departments SET ${updateFields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      updateValues
    );
    
    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Department name already exists' });
    }
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if department exists
    const [existingDepartment] = await db.query(
      'SELECT id FROM departments WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingDepartment.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if department has faculty
    const [facultyCount] = await db.query(
      'SELECT COUNT(*) as count FROM faculty WHERE department_id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (facultyCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with assigned faculty' 
      });
    }

    // Check if department has courses
    const [courseCount] = await db.query(
      'SELECT COUNT(*) as count FROM courses WHERE department_id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (courseCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with associated courses' 
      });
    }

    await db.query(
      'DELETE FROM departments WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// Get faculty in a department
router.get('/:id/faculty', async (req, res) => {
  const db = getDatabase();
  const { id } = req.params;
  
  try {
    // Check if department exists
    const [existingDepartment] = await db.query(
      'SELECT id FROM departments WHERE id = ? AND tenant_id = ?',
      [id, req.tenantId]
    );
    
    if (existingDepartment.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const [faculty] = await db.query(`
      SELECT f.*, 
             u.email,
             CONCAT(f.first_name, ' ', f.last_name) as full_name
      FROM faculty f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.department_id = ? AND f.tenant_id = ?
      ORDER BY f.first_name, f.last_name
    `, [id, req.tenantId]);
    
    res.json({ faculty });
  } catch (error) {
    console.error('Error fetching department faculty:', error);
    res.status(500).json({ error: 'Failed to fetch department faculty' });
  }
});

export default router;
