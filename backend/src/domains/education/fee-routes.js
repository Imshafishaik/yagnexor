import { Router } from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

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

// Record fee payment
router.post('/:fee_id/payment', async (req, res) => {
  const db = getDatabase();
  const { amount } = req.body;

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

    await db.query('UPDATE student_fees SET amount_paid = ?, status = ? WHERE id = ?', [newAmountPaid, newStatus, req.params.fee_id]);

    res.json({
      message: 'Payment recorded',
      amount_paid: newAmountPaid,
      status: newStatus,
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
