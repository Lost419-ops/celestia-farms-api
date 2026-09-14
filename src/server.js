require('./config');
const config = require('./config');
const { sequelize } = require('./config/database');
const seed = require('./services/seed');
const app = require('./app');
const logger = require('./utils/logger');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await seed();
    app.listen(config.port, () => {
      logger.info(`Listening on http://localhost:${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
})();