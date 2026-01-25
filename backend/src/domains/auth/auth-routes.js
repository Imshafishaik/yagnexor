import express from 'express';
import { Router } from 'express';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../config/database.js';
import { findUserByEmail, createUser, verifyPassword, getTenantByDomain } from '../../core/auth/auth-service.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../core/auth/token-manager.js';
import { validateRequest } from '../../core/middleware/guards.js';
import { authMiddleware, tenantScopeMiddleware } from '../../core/middleware/api-guard.js';

const router = Router();

// Schemas
const registerSchema = Joi.object({
  tenant_name: Joi.string().min(2).required(),
  tenant_domain: Joi.string().min(2).lowercase().required(),
  admin_email: Joi.string().email().required(),
  admin_password: Joi.string().min(8).required(),
  admin_first_name: Joi.string().required(),
  admin_last_name: Joi.string().required(),
});

const loginSchema = Joi.object({
  tenant_domain: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

const facultyRegisterSchema = Joi.object({
  tenant_domain: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  department: Joi.string().optional(),
  specialization: Joi.string().optional(),
  phone: Joi.string().optional(),
});

const studentRegisterSchema = Joi.object({
  tenant_domain: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  roll_number: Joi.string().optional().allow(''),
  class_id: Joi.string().optional().allow(''),
  phone: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  date_of_birth: Joi.string().optional().allow(''),
});

// Register - Create new tenant and admin user
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  const db = getDatabase();
  const { tenant_name, tenant_domain, admin_email, admin_password, admin_first_name, admin_last_name } = req.validatedBody;

  try {
    // Check if domain exists
    const existingTenant = await getTenantByDomain(tenant_domain);
    if (existingTenant) {
      return res.status(400).json({ error: 'Tenant domain already exists' });
    }

    // Create tenant
    const tenantId = uuidv4();
    await db.query('INSERT INTO tenants (id, name, domain) VALUES (?, ?, ?)', [tenantId, tenant_name, tenant_domain]);

    // Create admin user
    const admin = await createUser({
      tenant_id: tenantId,
      email: admin_email,
      password: admin_password,
      first_name: admin_first_name,
      last_name: admin_last_name,
      role: 'super_admin',
    });

    // Generate tokens
    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    res.status(201).json({
      message: 'Tenant and admin user created successfully',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: admin.id,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        role: admin.role,
        tenant_id: admin.tenant_id,
        is_active: admin.is_active,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  const { tenant_domain, email, password } = req.validatedBody;

  try {
    const tenant = await getTenantByDomain(tenant_domain);
    if (!tenant) {
      return res.status(401).json({ error: 'Invalid tenant domain' });
    }

    const user = await findUserByEmail(email, tenant.id);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh Token
router.post('/refresh', validateRequest(refreshSchema), async (req, res) => {
  const { refresh_token } = req.validatedBody;

  try {
    const decoded = verifyRefreshToken(refresh_token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await findUserByEmail(decoded.email, decoded.tenant_id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const newAccessToken = generateAccessToken(user);

    res.json({
      access_token: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, tenantScopeMiddleware, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Faculty Registration - Register faculty for existing tenant
router.post('/faculty-register', validateRequest(facultyRegisterSchema), async (req, res) => {
  const db = getDatabase();
  const { tenant_domain, email, password, first_name, last_name, department, specialization, phone } = req.validatedBody;

  try {
    // Check if tenant exists
    const tenant = await getTenantByDomain(tenant_domain);
    if (!tenant) {
      return res.status(400).json({ error: 'Institution not found' });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email, tenant.id);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create faculty user
    const facultyUser = await createUser({
      tenant_id: tenant.id,
      email,
      password,
      first_name,
      last_name,
      role: 'faculty',
    });

    // Create faculty record
    const facultyId = uuidv4();
    await db.query(
      `INSERT INTO faculty (id, tenant_id, user_id, department_id, specialization, phone, employment_status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [facultyId, tenant.id, facultyUser.id, department || null, specialization || null, phone || null]
    );

    // Generate tokens
    const accessToken = generateAccessToken(facultyUser);
    const refreshToken = generateRefreshToken(facultyUser);

    res.status(201).json({
      message: 'Faculty registration successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: facultyUser.id,
        email: facultyUser.email,
        first_name: facultyUser.first_name,
        last_name: facultyUser.last_name,
        role: facultyUser.role,
        tenant_id: facultyUser.tenant_id,
        is_active: facultyUser.is_active,
      },
    });
  } catch (error) {
    console.error('Faculty registration error:', error);
    res.status(500).json({ error: 'Faculty registration failed' });
  }
});

// Student Registration - Register student for existing tenant
router.post('/student-register', validateRequest(studentRegisterSchema), async (req, res) => {
  const db = getDatabase();
  const { tenant_domain, email, password, first_name, last_name, roll_number, class_id, phone, address, date_of_birth } = req.validatedBody;

  try {
    // Check if tenant exists
    const tenant = await getTenantByDomain(tenant_domain);
    if (!tenant) {
      return res.status(400).json({ error: 'Institution not found' });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email, tenant.id);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create student user
    const studentUser = await createUser({
      tenant_id: tenant.id,
      email,
      password,
      first_name,
      last_name,
      role: 'student',
    });

    // Create student record
    const studentId = uuidv4();
    await db.query(
      `INSERT INTO students (id, tenant_id, user_id, class_id, roll_number, enrollment_number, date_of_birth, phone, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        studentId, 
        tenant.id, 
        studentUser.id, 
        class_id || null, 
        roll_number || null, 
        roll_number || null, 
        date_of_birth || null, 
        phone || null, 
        address || null
      ]
    );

    // Generate tokens
    const accessToken = generateAccessToken(studentUser);
    const refreshToken = generateRefreshToken(studentUser);

    res.status(201).json({
      message: 'Student registration successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: studentUser.id,
        email: studentUser.email,
        first_name: studentUser.first_name,
        last_name: studentUser.last_name,
        role: studentUser.role,
        tenant_id: studentUser.tenant_id,
        is_active: studentUser.is_active,
      },
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ error: 'Student registration failed' });
  }
});

export default router;
