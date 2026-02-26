import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.TINA_JWT_SECRET || 'secret';
const ADMIN_PASSWORD_HASH = process.env.TINA_ADMIN_PASSWORD_HASH;

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.TINA_JWT_EXPIRY || '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
};

export const login = async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  if (!ADMIN_PASSWORD_HASH) {
    console.error('TINA_ADMIN_PASSWORD_HASH is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  const token = generateToken({ role: 'admin' });
  res.json({ token });
};
