import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

export function decodeToken(token) {
  return jwt.decode(token);
}
