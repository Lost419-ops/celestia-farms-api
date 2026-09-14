const { User } = require('../models');
const config = require('../config');
const logger = require('../utils/logger');

async function seed() {
  const exists = await User.findOne({ where: { email: config.demoEmail.toLowerCase() } });
  if (exists) {
    return false;
  }

  await User.create({
    fullName: config.demoName,
    email: config.demoEmail.toLowerCase(),
    passwordHash: config.demoPassword,
  });

  logger.info(`Seeded demo user ${config.demoEmail.toLowerCase()}`);
  return true;
}

module.exports = seed;