require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || '1h',
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  demoEmail: process.env.DEMO_EMAIL || 'demo@example.com',
  demoPassword: process.env.DEMO_PASSWORD || 'password',
  demoName: process.env.DEMO_NAME || 'Demo User',
  otpTtlMinutes: parseInt(process.env.OTP_TTL_MINUTES || '5', 10),
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  otpEcho: process.env.OTP_ECHO === 'true',
  senderName: 'Celestia Valley Farms',
};