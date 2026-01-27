import express from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';

const router = express.Router();

// Validation schemas
const createFeeStructureSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  amount_due: Joi.number().min(0).required(),
  fee_type: Joi.string().valid('TUITION', 'EXAM', 'LIBRARY', 'LAB', 'HOSTEL', 'TRANSPORT', 'OTHER').required(),
  academic_year_id: Joi.string().required(),
  class_id: Joi.string().optional(),
  due_date: Joi.date().required(),
});

const createStudentFeeSchema = Joi.object({
  student_id: Joi.string().required(),
  fee_structure_id: Joi.string().required(),
  amount_due: Joi.number().min(0).required(),
  due_date: Joi.date().required(),
});

// List fees
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query('SELECT * FROM student_fees WHERE tenant_id = ?', [req.tenantId]);
    res.json({ fees: rows });
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

// Get student fee details
router.get('/:student_id', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query(
      `SELECT sf.*, fs.amount_due as structure_amount FROM student_fees sf
       LEFT JOIN fee_structures fs ON sf.fee_structure_id = fs.id
       WHERE sf.student_id = ? AND sf.tenant_id = ?`,
      [req.params.student_id, req.tenantId]
    );
    
    const total_amount_due = rows.reduce((sum, f) => sum + parseFloat(f.amount_due || 0), 0);
    const total_amount_paid = rows.reduce((sum, f) => sum + parseFloat(f.amount_paid || 0), 0);
    
    res.json({
      student_id: req.params.student_id,
      fees: rows,
      total_amount_due,
      total_amount_paid,
      total_pending: total_amount_due - total_amount_paid,
    });
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ error: 'Failed to fetch student fees' });
  }
});

// Get all fee structures
router.get('/structures', async (req, res) => {
  const db = getDatabase();
  try {
    const { academic_year_id, fee_type } = req.query;
    
    let query = `
      SELECT fs.*, 
             ay.year_name as academic_year_name,
             c.name as class_name,
             COUNT(sf.id) as student_count
      FROM fee_structures fs
      LEFT JOIN academic_years ay ON fs.academic_year_id = ay.id
      LEFT JOIN classes c ON fs.class_id = c.id
      LEFT JOIN student_fees sf ON fs.id = sf.fee_structure_id
      WHERE fs.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (academic_year_id) {
      query += ' AND fs.academic_year_id = ?';
      params.push(academic_year_id);
    }
    if (fee_type) {
      query += ' AND fs.fee_type = ?';
      params.push(fee_type);
    }

    query += ' GROUP BY fs.id ORDER BY fs.due_date ASC';

    const [structures] = await db.query(query, params);
    res.json({ structures });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({ error: 'Failed to fetch fee structures' });
  }
});

// Create fee structure
router.post('/structures', validateRequest(createFeeStructureSchema), async (req, res) => {
  const db = getDatabase();
  const { name, description, amount_due, fee_type, academic_year_id, class_id, due_date } = req.validatedBody;
  
  try {
    const structureId = uuidv4();
    await db.query(
      `INSERT INTO fee_structures (id, tenant_id, name, description, amount_due, fee_type, academic_year_id, class_id, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [structureId, req.tenantId, name, description || null, amount_due, fee_type, academic_year_id, class_id || null, due_date]
    );
    
    res.status(201).json({ 
      message: 'Fee structure created successfully', 
      structure_id: structureId 
    });
  } catch (error) {
    console.error('Error creating fee structure:', error);
    res.status(500).json({ error: 'Failed to create fee structure' });
  }
});

// Get student fees
router.get('/students', async (req, res) => {
  const db = getDatabase();
  try {
    const { student_id, status, academic_year_id } = req.query;
    
    let query = `
      SELECT sf.*, 
             fs.name as fee_name, fs.fee_type,
             s.roll_number,
             CONCAT(s.first_name, ' ', s.last_name) as student_name,
             c.name as class_name,
             ay.year_name as academic_year_name
      FROM student_fees sf
      LEFT JOIN fee_structures fs ON sf.fee_structure_id = fs.id
      LEFT JOIN students s ON sf.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN academic_years ay ON sf.academic_year_id = ay.id
      WHERE sf.tenant_id = ?
    `;
    const params = [req.tenantId];

    if (student_id) {
      query += ' AND sf.student_id = ?';
      params.push(student_id);
    }
    if (status) {
      query += ' AND sf.status = ?';
      params.push(status);
    }
    if (academic_year_id) {
      query += ' AND sf.academic_year_id = ?';
      params.push(academic_year_id);
    }

    query += ' ORDER BY sf.due_date ASC';

    const [fees] = await db.query(query, params);
    res.json({ fees });
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ error: 'Failed to fetch student fees' });
  }
});

// Create student fee
router.post('/students', validateRequest(createStudentFeeSchema), async (req, res) => {
  const db = getDatabase();
  const { student_id, fee_structure_id, amount_due, due_date } = req.validatedBody;
  
  try {
    const feeId = uuidv4();
    await db.query(
      `INSERT INTO student_fees (id, tenant_id, student_id, fee_structure_id, amount_due, amount_paid, status, due_date)
       VALUES (?, ?, ?, ?, ?, 0, 'PENDING', ?)`,
      [feeId, req.tenantId, student_id, fee_structure_id, amount_due, due_date]
    );
    
    res.status(201).json({ 
      message: 'Student fee created successfully', 
      fee_id: feeId 
    });
  } catch (error) {
    console.error('Error creating student fee:', error);
    res.status(500).json({ error: 'Failed to create student fee' });
  }
});

// Record fee payment
router.post('/:fee_id/payment', async (req, res) => {
  const db = getDatabase();
  const { amount, payment_method, transaction_id, remarks } = req.body;

  try {
    const [feeRow] = await db.query(
      'SELECT * FROM student_fees WHERE id = ? AND tenant_id = ?',
      [req.params.fee_id, req.tenantId]
    );

    if (!feeRow[0]) {
      return res.status(404).json({ error: 'Fee not found' });
    }

    const fee = feeRow[0];
    const newAmountPaid = parseFloat(fee.amount_paid) + parseFloat(amount);
    const newStatus = newAmountPaid >= fee.amount_due ? 'PAID' : newAmountPaid > 0 ? 'PARTIAL' : 'PENDING';

    await db.query('START TRANSACTION');
    
    try {
      // Update fee
      await db.query(
        'UPDATE student_fees SET amount_paid = ?, status = ?, payment_date = NOW() WHERE id = ?',
        [newAmountPaid, newStatus, req.params.fee_id]
      );

      // Record payment transaction
      const paymentId = uuidv4();
      await db.query(
        `INSERT INTO fee_payments (id, tenant_id, student_fee_id, amount, payment_method, transaction_id, remarks, payment_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [paymentId, req.tenantId, req.params.fee_id, amount, payment_method || null, transaction_id || null, remarks || null]
      );

      await db.query('COMMIT');

      res.json({
        message: 'Payment recorded successfully',
        amount_paid: newAmountPaid,
        status: newStatus,
        balance_due: fee.amount_due - newAmountPaid
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
