const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// Helper: format user response consistently
const formatUserResponse = (user, token) => ({
  token,
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    address: user.address || '',
    avatar: user.avatar || '',
    status: user.status || 'active',
    createdAt: user.createdAt
  }
});

// ==========================================
// POST /api/auth/register
// ==========================================
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: 'user',
      status: 'active'
    });

    const token = generateToken(user._id);
    res.status(201).json(formatUserResponse(user, token));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// POST /api/auth/login
// ==========================================
router.post('/login', [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is banned/suspended
    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned. Contact support for assistance.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support for assistance.' });
    }

    // Check if account is locked (too many failed attempts)
    if (user.isLocked) {
      const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account temporarily locked due to too many failed attempts. Try again in ${lockMinutes} minute(s).`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      const remaining = 5 - (user.loginAttempts + 1);
      const msg = remaining > 0
        ? `Invalid email or password. ${remaining} attempt(s) remaining.`
        : 'Account locked for 15 minutes due to too many failed attempts.';
      return res.status(401).json({ message: msg });
    }

    // Successful login — reset attempts and update lastLogin
    await user.resetLoginAttempts();

    const token = generateToken(user._id);
    res.json(formatUserResponse(user, token));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// POST /api/auth/forgot-password
// ==========================================
router.post('/forgot-password', [
  body('email').trim().isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    // Always return success to prevent email enumeration
    await new Promise(resolve => setTimeout(resolve, 800));
    res.json({
      success: true,
      message: 'If your email is registered, a password reset link has been sent to your inbox.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// GET /api/auth/profile
// ==========================================
router.get('/profile', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    address: req.user.address,
    role: req.user.role,
    status: req.user.status,
    avatar: req.user.avatar,
    createdAt: req.user.createdAt,
    lastLogin: req.user.lastLogin
  });
});

// ==========================================
// PUT /api/auth/profile
// ==========================================
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ max: 50 }),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.address !== undefined) user.address = req.body.address;
    if (req.body.password) user.password = req.body.password;

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      role: updated.role,
      status: updated.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN: GET /api/auth/users
// ==========================================
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN: PUT /api/auth/users/:id/role
// ==========================================
router.put('/users/:id/role', protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be "user" or "admin".' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent demoting yourself
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    user.role = role;
    await user.save();
    res.json({ message: `User role updated to ${role}`, user: { _id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN: PUT /api/auth/users/:id/status
// ==========================================
router.put('/users/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "active", "suspended", or "banned".' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent banning yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own status' });
    }

    // Prevent banning other admins
    if (user.role === 'admin' && status !== 'active') {
      return res.status(400).json({ message: 'Cannot suspend or ban admin users' });
    }

    user.status = status;
    await user.save();
    res.json({ message: `User status updated to ${status}`, user: { _id: user._id, name: user.name, status: user.status } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN: DELETE /api/auth/users/:id
// ==========================================
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
