import express from 'express';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import emailService from '../../core/services/email-service.js';

const router = express.Router();

// List students
router.get('/', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.tenant_id = ?
    `, [req.tenantId]);
    res.json({ students: rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create student
router.post('/', async (req, res) => {
  const db = getDatabase();
  const { user_id, class_id, academic_year_id, enrollment_number, date_of_birth, gender, phone, address } = req.body;

  try {
    const studentId = uuidv4();
    
    // Auto-generate enrollment number if not provided
    let finalEnrollmentNumber = enrollment_number;
    if (!finalEnrollmentNumber || finalEnrollmentNumber.trim() === '') {
      const currentYear = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalEnrollmentNumber = `ENR${currentYear}${randomNum}`;
      
      // Ensure uniqueness
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const [existing] = await db.query(
          'SELECT id FROM students WHERE enrollment_number = ? AND tenant_id = ?',
          [finalEnrollmentNumber, req.tenantId]
        );
        if (existing.length === 0) {
          isUnique = true;
        } else {
          // Generate new number if collision
          const newRandomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          finalEnrollmentNumber = `ENR${currentYear}${newRandomNum}`;
          attempts++;
        }
      }
      
      if (!isUnique) {
        return res.status(500).json({ error: 'Failed to generate unique enrollment number' });
      }
    }
    
    await db.query(
      `INSERT INTO students (id, tenant_id, user_id, class_id, academic_year_id, enrollment_number, date_of_birth, gender, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentId, req.tenantId, user_id, class_id, academic_year_id, finalEnrollmentNumber, date_of_birth, gender, phone, address]
    );

    // Get user details for email
    const [userDetails] = await db.query(
      'SELECT email, first_name, last_name FROM users WHERE id = ? AND tenant_id = ?',
      [user_id, req.tenantId]
    );

    // Get tenant domain for email
    const [tenantInfo] = await db.query(
      'SELECT domain, name FROM tenants WHERE id = ?',
      [req.tenantId]
    );
    const tenantDomain = tenantInfo[0]?.domain || 'your-institution-domain.com';
    const tenantName = tenantInfo[0]?.name || 'Your Institution';

    // Send registration email if user has email
    if (userDetails.length > 0 && userDetails[0].email) {
      try {
        const registrationUrl = `http://localhost:5173/login`;
        
        const emailSubject = 'Welcome to YAGNEXOR - Your Student Account is Ready';
        const emailHtml = `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px;">Welcome to YAGNEXOR</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Educational Management System</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Your Student Account is Ready!</h2>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">Login Information</h3>
                <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                  <strong>Institution:</strong> ${tenantName}
                </p>
                <p style="color: #666; line-height: 1.6; margin-bottom: 10px;">
                  <strong>Institution Domain:</strong> ${tenantDomain}
                </p>
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  When logging in, use this domain along with your email and password.
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Dear <strong>${userDetails[0].first_name} ${userDetails[0].last_name}</strong>,
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                You have been successfully added as a student in <strong>${tenantName}</strong>. Your account is now ready to use.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Your Account Details:</h3>
                <ul style="color: #666; line-height: 1.6;">
                  <li><strong>Enrollment Number:</strong> ${finalEnrollmentNumber}</li>
                  <li><strong>Email:</strong> ${userDetails[0].email}</li>
                  <li><strong>Status:</strong> Active</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${registrationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold;
                          display: inline-block;">
                  Login to Your Account
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                If you have any questions or need assistance, please contact your administrator.
              </p>
            </div>
          </div>
        `;

        await emailService.sendEmail({
          to: userDetails[0].email,
          subject: emailSubject,
          html: emailHtml
        });
        
        console.log('Student registration email sent to:', userDetails[0].email);
      } catch (emailError) {
        console.error('Error sending student registration email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({ message: 'Student created', student_id: studentId, enrollment_number: finalEnrollmentNumber });
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Enrollment number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create student' });
    }
  }
});

// Get student by ID
router.get('/:student_id', async (req, res) => {
  const db = getDatabase();
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) as full_name
      FROM students s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.tenant_id = ?
    `, [req.params.student_id, req.tenantId]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Update student
router.put('/:student_id', async (req, res) => {
  const db = getDatabase();
  const { user_id, class_id, academic_year_id, enrollment_number, date_of_birth, gender, phone, address } = req.body;
  
  try {
    // Check if student exists
    const [existingStudent] = await db.query(
      'SELECT id FROM students WHERE id = ? AND tenant_id = ?',
      [req.params.student_id, req.tenantId]
    );
    
    if (existingStudent.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update student
    await db.query(
      `UPDATE students 
       SET user_id = ?, class_id = ?, academic_year_id = ?, enrollment_number = ?, 
           date_of_birth = ?, gender = ?, phone = ?, address = ?
       WHERE id = ? AND tenant_id = ?`,
      [user_id, class_id, academic_year_id, enrollment_number, date_of_birth, gender, phone, address, req.params.student_id, req.tenantId]
    );
    
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:student_id', async (req, res) => {
  const db = getDatabase();
  const { student_id } = req.params;

  try {
    // Check if student exists
    const [existingStudent] = await db.query(
      'SELECT id FROM students WHERE id = ? AND tenant_id = ?',
      [student_id, req.tenantId]
    );
    
    if (existingStudent.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete student
    await db.query('DELETE FROM students WHERE id = ? AND tenant_id = ?', [student_id, req.tenantId]);
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

export default router;
