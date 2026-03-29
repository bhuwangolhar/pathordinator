'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const configPath = path.join(__dirname, '..', 'config', 'config.json');
const fileConfig = fs.existsSync(configPath) ? require(configPath)[env] : null;
const defaultConfig = {
  username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pathordinator',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: false
};
const config = fileConfig || (
  process.env.DATABASE_URL
    ? { ...defaultConfig, use_env_variable: 'DATABASE_URL' }
    : defaultConfig
);
const db = {};
const modelDirectories = [
  __dirname,
  path.join(__dirname, '..', 'src', 'models')
].filter(directory => fs.existsSync(directory));

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

modelDirectories
  .flatMap(directory => (
    fs.readdirSync(directory)
      .filter(file => {
        return (
          file.indexOf('.') !== 0 &&
          !(directory === __dirname && file === basename) &&
          file.slice(-3) === '.js' &&
          file.indexOf('.test.js') === -1
        );
      })
      .map(file => path.join(directory, file))
  ))
  .forEach(modelPath => {
    const model = require(modelPath)(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
