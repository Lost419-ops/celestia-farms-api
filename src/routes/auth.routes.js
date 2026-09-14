const express = require('express');
const { User } = require('../models');
const { sendOTP, verifyOTP } = require('../services/otpAuth');
const { generateAccessToken, requireAuth } = require('../middleware/auth');
const { AppError } = require('../utils/errors');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !EMAIL_RE.test(email) || !password) {
      throw new AppError(400, 'LOGIN_REQUIRED', 'Enter both the email address and password.');
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email address or password.');
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email address or password.');
    }

    await sendOTP(user.email, { force: true });
    return res.json({ status: 'otp_sent', email: user.email });
  } catch (err) {
    return next(err);
  }
});

router.post('/verify-otp', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '');

    if (!email || !code) {
      throw new AppError(400, 'OTP_REQUIRED', 'Enter the verification code sent to your email.');
    }

    await verifyOTP(email, code);

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email address or password.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateAccessToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
});

router.post('/resend-otp', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !EMAIL_RE.test(email)) {
      throw new AppError(400, 'EMAIL_REQUIRED', 'A valid email address is required.');
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email address or password.');
    }

    await sendOTP(user.email);
    return res.json({ status: 'otp_sent', email: user.email });
  } catch (err) {
    return next(err);
  }
});

router.post('/signup', async (req, res, next) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const phone = String(req.body.phone || '').trim() || null;

    if (!fullName || !email || !password) {
      throw new AppError(400, 'SIGNUP_REQUIRED', 'Please fill in every required field.');
    }
    if (!EMAIL_RE.test(email)) {
      throw new AppError(400, 'EMAIL_INVALID', 'Please enter a valid email address.');
    }
    if (password.length < 6) {
      throw new AppError(400, 'PASSWORD_WEAK', 'Password must be at least 6 characters.');
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new AppError(409, 'EMAIL_TAKEN', 'That email address is already registered.');
    }

    const user = await User.create({ fullName, email, passwordHash: password, phone });
    await sendOTP(user.email, { force: true });
    return res.status(201).json({ status: 'otp_sent', email: user.email });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email address or password.');
    }
    return res.json({ user: user.toSafeJSON() });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;