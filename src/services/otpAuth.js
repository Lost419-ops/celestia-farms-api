const crypto = require('crypto');
const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const RESEND_COOLDOWN_MS = 60 * 1000;
const store = new Map();

function generateCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmailUser,
      pass: config.gmailAppPassword,
    },
  });
}

async function sendOtpEmail(to, code) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `${config.senderName} <${config.gmailUser}>`,
    to,
    subject: 'Your Celestia Valley Farms login code',
    text: [
      'Hello,',
      '',
      `Your one-time login code is ${code}.`,
      `It expires in ${config.otpTtlMinutes} minutes.`,
      'If you did not try to log in, you can safely ignore this email.',
      '',
      '— Celestia Valley Farms',
    ].join('\n'),
  });
}

async function sendOTP(email, opts = {}) {
  const normalized = normalizeEmail(email);
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new AppError(400, 'EMAIL_REQUIRED', 'A valid email address is required.');
  }

  const now = Date.now();
  const existing = store.get(normalized);
  if (!opts.force && existing && now - existing.lastSent < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSent)) / 1000);
    throw new AppError(429, 'OTP_COOLDOWN', `Please wait ${wait}s before requesting another code.`);
  }

  const code = generateCode();
  store.set(normalized, {
    code,
    expires: now + config.otpTtlMinutes * 60 * 1000,
    attempts: 0,
    lastSent: now,
  });

  try {
    await sendOtpEmail(normalized, code);
  } catch (err) {
    store.delete(normalized);
    logger.error('Failed to send OTP email', err);
    throw new AppError(500, 'MAIL_SEND_FAILED', 'Could not send the verification email. Please try again.');
  }

  if (config.otpEcho) {
    logger.info(`[DEV_OTP] ${normalized}: ${code}`);
  }

  return { email: normalized };
}

async function verifyOTP(email, code) {
  const normalized = normalizeEmail(email);
  const entry = store.get(normalized);

  if (!entry) {
    throw new AppError(401, 'OTP_INVALID', 'That code is not valid. Request a new one and try again.');
  }
  if (Date.now() > entry.expires) {
    store.delete(normalized);
    throw new AppError(401, 'OTP_EXPIRED', 'That code has expired. Request a new one.');
  }
  if (entry.attempts >= config.otpMaxAttempts) {
    store.delete(normalized);
    throw new AppError(401, 'OTP_EXHAUSTED', 'Too many attempts. Request a new code.');
  }

  entry.attempts += 1;
  if (!entry.code || entry.code !== String(code || '').trim()) {
    throw new AppError(401, 'OTP_INVALID', 'That code is not correct. Check it and try again.');
  }

  store.delete(normalized);
  return { email: normalized };
}

module.exports = { sendOTP, verifyOTP };