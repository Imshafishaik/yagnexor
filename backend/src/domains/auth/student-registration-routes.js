import express from 'express';
import Joi from 'joi';
import { validateRequest } from '../../core/middleware/guards.js';
import { requireMinimumRole } from '../../core/middleware/role-middleware.js';
import { authMiddleware, tenantScopeMiddleware } from '../../core/middleware/api-guard.js';
import { getDatabase } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import emailService from '../../core/services/email-service.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Validation schema for student invitation
const studentInvitationSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required()
});

// Validation schema for completing registration
const completeRegistrationSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

// Send student registration invitation
router.post('/register-student-invitation', authMiddleware, tenantScopeMiddleware, requireMinimumRole('manager'), validateRequest(studentInvitationSchema), async (req, res) => {
  const db = getDatabase();
  const { first_name, last_name, email } = req.validatedBody;

  try {
    // Get tenant domain for email
    const [tenantInfo] = await db.query(
      'SELECT domain, name FROM tenants WHERE id = ?',
      [req.tenantId]
    );
    const tenantDomain = tenantInfo[0]?.domain || 'your-institution-domain.com';
    const tenantName = tenantInfo[0]?.name || 'Your Institution';

    // Check if user with this email already exists
    const [existingUsers] = await db.query(
      'SELECT id, email FROM users WHERE email = ? AND tenant_id = ?',
      [email, req.tenantId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        error: 'A user with this email address already exists' 
      });
    }

    // Generate a temporary registration token (valid for 7 days)
    const registrationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Store registration invitation
    await db.query(
      `INSERT INTO student_registrations (id, tenant_id, first_name, last_name, email, registration_token, expires_at, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [uuidv4(), req.tenantId, first_name, last_name, email, registrationToken, expiresAt]
    );

    // Create registration URL
    const registrationUrl = `http://localhost:5173/student-register?token=${registrationToken}`;

    // Send email
    const emailSubject = 'Welcome to YAGNEXOR - Complete Your Student Registration';
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to YAGNEXOR</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Educational Management System</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Complete Your Student Registration</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Login Information</h3>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 10px;">
              <strong>Institution:</strong> <span style="color: #1f2937; font-weight: 600;">${tenantName}</span>
            </p>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 10px;">
              <strong>Institution Domain:</strong> <span style="color: #1f2937; font-weight: 600;">${tenantDomain}</span>
            </p>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              When logging in, use this domain along with your email and password.
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Dear <strong>${first_name} ${last_name}</strong>,
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            You have been invited to join <strong>${tenantName}</strong> as a student. Please click the button below to complete your registration and set up your account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;
                      display: inline-block;">
              Complete Registration
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
            ${registrationUrl}
          </p>
          
          <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This invitation will expire in 7 days. If you need help, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    await emailService.sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml
    });

    res.json({
      message: 'Student registration invitation sent successfully',
      email: email,
      registration_url: registrationUrl
    });

  } catch (error) {
    console.error('Error sending student invitation:', error);
    res.status(500).json({ error: 'Failed to send student invitation' });
  }
});

// Verify registration token
router.get('/verify-student-token/:token', async (req, res) => {
  const db = getDatabase();
  const { token } = req.params;

  try {
    const [registrations] = await db.query(
      `SELECT * FROM student_registrations 
       WHERE registration_token = ? AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );

    if (registrations.length === 0) {
      return res.json({ valid: false, message: 'Invalid or expired registration token' });
    }

    const registration = registrations[0];

    // Check if user already exists (double check)
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ?',
      [registration.email, registration.tenant_id]
    );

    if (existingUsers.length > 0) {
      return res.json({ valid: false, message: 'User already exists with this email' });
    }

    res.json({
      valid: true,
      invitation: {
        first_name: registration.first_name,
        last_name: registration.last_name,
        email: registration.email,
      }
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Failed to verify registration token' });
  }
});

// Complete student registration
router.post('/complete-student-registration/:token', validateRequest(completeRegistrationSchema), async (req, res) => {
  const db = getDatabase();
  const { token } = req.params;
  const { first_name, last_name, email, password } = req.validatedBody;

  try {
    // Verify token again
    const [registrations] = await db.query(
      `SELECT * FROM student_registrations 
       WHERE registration_token = ? AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );

    if (registrations.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired registration token' });
    }

    const registration = registrations[0];

    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ?',
      [email, registration.tenant_id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await db.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'student', 1, NOW())`,
      [userId, registration.tenant_id, email, hashedPassword, first_name, last_name]
    );

    // Create student record
    const studentId = uuidv4();
    await db.query(
      `INSERT INTO students (id, tenant_id, user_id, status, created_at)
       VALUES (?, ?, ?, 'active', NOW())`,
      [studentId, registration.tenant_id, userId]
    );

    // Mark registration as completed
    await db.query(
      `UPDATE student_registrations 
       SET status = 'completed', updated_at = NOW() 
       WHERE id = ?`,
      [registration.id]
    );

    res.json({
      message: 'Student registration completed successfully',
      user: {
        id: userId,
        email: email,
        first_name: first_name,
        last_name: last_name,
        role: 'student'
      }
    });

  } catch (error) {
    console.error('Error completing registration:', error);
    res.status(500).json({ error: 'Failed to complete student registration' });
  }
});

export default router;
