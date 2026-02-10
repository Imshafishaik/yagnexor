import express from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { validateRequest } from '../../core/middleware/guards.js';
import { getDatabase } from '../../config/database.js';

const router = express.Router();

// Validation schemas
const createScheduleSchema = Joi.object({
  class_id: Joi.string().required(),
  subject_id: Joi.string().required(),
  teacher_id: Joi.string().required(),
  day_of_week: Joi.string().valid('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY').optional(),
  schedule_date: Joi.date().optional(),
  start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  room_number: Joi.string().optional(),
  semester: Joi.string().optional(),
  academic_year: Joi.string().optional(),
  notes: Joi.string().optional()
});

const updateScheduleSchema = Joi.object({
  subject_id: Joi.string().optional(),
  teacher_id: Joi.string().optional(),
  day_of_week: Joi.string().valid('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY').optional(),
  schedule_date: Joi.date().optional(),
  start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  room_number: Joi.string().optional(),
  semester: Joi.string().optional(),
  academic_year: Joi.string().optional(),
  is_active: Joi.boolean().optional(),
  notes: Joi.string().optional()
});

// Get all schedules for a tenant
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const tenantId = req.tenantId;
    const { class_id, subject_id, teacher_id, day_of_week, semester, academic_year } = req.query;
    
    let query = `
      SELECT cs.*, 
             c.name as class_name,
             s.name as subject_name,
             s.code as subject_code,
             CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
             u.email as teacher_email
      FROM class_schedules cs
      JOIN classes c ON cs.class_id = c.id
      JOIN subjects s ON cs.subject_id = s.id
      JOIN users u ON cs.teacher_id = u.id
      WHERE cs.tenant_id = ? AND cs.is_active = TRUE
    `;
    
    const params = [tenantId];
    
    if (class_id) {
      query += ' AND cs.class_id = ?';
      params.push(class_id);
    }
    if (subject_id) {
      query += ' AND cs.subject_id = ?';
      params.push(subject_id);
    }
    if (teacher_id) {
      query += ' AND cs.teacher_id = ?';
      params.push(teacher_id);
    }
    if (day_of_week) {
      query += ' AND cs.day_of_week = ?';
      params.push(day_of_week);
    }
    if (semester) {
      query += ' AND cs.semester = ?';
      params.push(semester);
    }
    if (academic_year) {
      query += ' AND cs.academic_year = ?';
      params.push(academic_year);
    }
    
    query += ' ORDER BY cs.day_of_week, cs.start_time';
    
    const [schedules] = await db.query(query, params);
    
    res.json({ schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Get weekly schedule for a specific class
router.get('/class/:class_id/weekly', async (req, res) => {
  const db = getDatabase();
  try {
    const { class_id } = req.params;
    const tenantId = req.tenantId;
    const { semester, academic_year } = req.query;
    
    let query = `
      SELECT cs.*, 
             s.name as subject_name,
             s.code as subject_code,
             CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
             u.email as teacher_email
      FROM class_schedules cs
      JOIN subjects s ON cs.subject_id = s.id
      JOIN users u ON cs.teacher_id = u.id
      WHERE cs.tenant_id = ? AND cs.class_id = ? AND cs.is_active = TRUE
    `;
    
    const params = [tenantId, class_id];
    
    if (semester) {
      query += ' AND cs.semester = ?';
      params.push(semester);
    }
    if (academic_year) {
      query += ' AND cs.academic_year = ?';
      params.push(academic_year);
    }
    
    query += ' ORDER BY cs.day_of_week, cs.start_time';
    
    const [schedules] = await db.query(query, params);
    
    // Group by day of week for better frontend consumption
    const weeklySchedule = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: []
    };
    
    schedules.forEach(schedule => {
      weeklySchedule[schedule.day_of_week].push(schedule);
    });
    
    res.json({ weekly_schedule: weeklySchedule });
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({ error: 'Failed to fetch weekly schedule' });
  }
});

// Get teacher's schedule
router.get('/teacher/:teacher_id', async (req, res) => {
  const db = getDatabase();
  try {
    const { teacher_id } = req.params;
    const tenantId = req.tenantId;
    const { semester, academic_year } = req.query;
    
    let query = `
      SELECT cs.*, 
             c.name as class_name,
             s.name as subject_name,
             s.code as subject_code
      FROM class_schedules cs
      JOIN classes c ON cs.class_id = c.id
      JOIN subjects s ON cs.subject_id = s.id
      WHERE cs.tenant_id = ? AND cs.teacher_id = ? AND cs.is_active = TRUE
    `;
    
    const params = [tenantId, teacher_id];
    
    if (semester) {
      query += ' AND cs.semester = ?';
      params.push(semester);
    }
    if (academic_year) {
      query += ' AND cs.academic_year = ?';
      params.push(academic_year);
    }
    
    query += ' ORDER BY cs.day_of_week, cs.start_time';
    
    const [schedules] = await db.query(query, params);
    
    res.json({ schedules });
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({ error: 'Failed to fetch teacher schedule' });
  }
});

// Create new schedule
router.post('/', validateRequest(createScheduleSchema), async (req, res) => {
  const db = getDatabase();
  try {
    const { class_id, subject_id, teacher_id, day_of_week, schedule_date, start_time, end_time, room_number, semester, academic_year, notes } = req.validatedBody;
    
    // Validate that either day_of_week or schedule_date is provided
    if (!day_of_week && !schedule_date) {
      return res.status(400).json({ error: 'Either day_of_week or schedule_date is required' });
    }
    
    if (day_of_week && schedule_date) {
      return res.status(400).json({ error: 'Cannot specify both day_of_week and schedule_date' });
    }
    
    // Check for time conflicts based on schedule type
    let conflictQuery, conflictParams;
    
    if (day_of_week) {
      // Recurring schedule conflict check
      conflictQuery = `
        SELECT id FROM class_schedules 
        WHERE tenant_id = ? AND class_id = ? AND day_of_week = ? AND is_active = TRUE
        AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
      `;
      conflictParams = [req.tenantId, class_id, day_of_week, start_time, start_time, end_time, end_time];
    } else {
      // Specific date schedule conflict check
      conflictQuery = `
        SELECT id FROM class_schedules 
        WHERE tenant_id = ? AND class_id = ? AND schedule_date = ? AND is_active = TRUE
        AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
      `;
      conflictParams = [req.tenantId, class_id, schedule_date, start_time, start_time, end_time, end_time];
    }
    
    const [conflicts] = await db.query(conflictQuery, conflictParams);
    
    if (conflicts.length > 0) {
      return res.status(400).json({ error: 'Schedule conflicts with existing class time' });
    }
    
    // Check teacher availability based on schedule type
    let teacherConflictQuery, teacherConflictParams;
    
    if (day_of_week) {
      // Recurring schedule teacher conflict check
      teacherConflictQuery = `
        SELECT id FROM class_schedules 
        WHERE tenant_id = ? AND teacher_id = ? AND day_of_week = ? AND is_active = TRUE
        AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
      `;
      teacherConflictParams = [req.tenantId, teacher_id, day_of_week, start_time, start_time, end_time, end_time];
    } else {
      // Specific date schedule teacher conflict check
      teacherConflictQuery = `
        SELECT id FROM class_schedules 
        WHERE tenant_id = ? AND teacher_id = ? AND schedule_date = ? AND is_active = TRUE
        AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
      `;
      teacherConflictParams = [req.tenantId, teacher_id, schedule_date, start_time, start_time, end_time, end_time];
    }
    
    const [teacherConflicts] = await db.query(teacherConflictQuery, teacherConflictParams);
    
    if (teacherConflicts.length > 0) {
      return res.status(400).json({ error: 'Teacher is already scheduled at this time' });
    }
    
    const scheduleId = uuidv4();
    
    await db.query(`
      INSERT INTO class_schedules 
      (id, tenant_id, class_id, subject_id, teacher_id, day_of_week, schedule_date, start_time, end_time, room_number, semester, academic_year, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [scheduleId, req.tenantId, class_id, subject_id, teacher_id, day_of_week, schedule_date, start_time, end_time, room_number, semester, academic_year, notes]);
    
    res.status(201).json({
      message: 'Schedule created successfully',
      schedule_id: scheduleId
    });
    
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// Update schedule
router.put('/:id', validateRequest(updateScheduleSchema), async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    const updates = req.validatedBody;
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updates).forEach(key => {
      updateFields.push(`${key} = ?`);
      updateValues.push(updates[key]);
    });
    
    updateValues.push(id, req.tenantId);
    
    await db.query(`
      UPDATE class_schedules 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, updateValues);
    
    res.json({ message: 'Schedule updated successfully' });
    
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Delete schedule (soft delete - set is_active = FALSE)
router.delete('/:id', async (req, res) => {
  const db = getDatabase();
  try {
    const { id } = req.params;
    
    await db.query(`
      UPDATE class_schedules 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `, [id, req.tenantId]);
    
    res.json({ message: 'Schedule deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

// Get schedule exceptions for a date range
router.get('/exceptions', async (req, res) => {
  const db = getDatabase();
  try {
    const { start_date, end_date, class_id } = req.query;
    const tenantId = req.tenantId;
    
    let query = `
      SELECT se.*, cs.day_of_week, cs.start_time, cs.end_time,
             c.name as class_name, s.name as subject_name,
             CONCAT(u.first_name, ' ', u.last_name) as teacher_name
      FROM schedule_exceptions se
      JOIN class_schedules cs ON se.schedule_id = cs.id
      JOIN classes c ON cs.class_id = c.id
      JOIN subjects s ON cs.subject_id = s.id
      JOIN users u ON cs.teacher_id = u.id
      WHERE se.tenant_id = ?
    `;
    
    const params = [tenantId];
    
    if (start_date) {
      query += ' AND se.exception_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND se.exception_date <= ?';
      params.push(end_date);
    }
    if (class_id) {
      query += ' AND cs.class_id = ?';
      params.push(class_id);
    }
    
    query += ' ORDER BY se.exception_date';
    
    const [exceptions] = await db.query(query, params);
    
    res.json({ exceptions });
  } catch (error) {
    console.error('Error fetching schedule exceptions:', error);
    res.status(500).json({ error: 'Failed to fetch schedule exceptions' });
  }
});

export default router;
