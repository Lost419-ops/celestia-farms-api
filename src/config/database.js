const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(dataDir, 'celestia.db'),
  logging: false,
});

module.exports = { sequelize };