'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const configPath = path.join(__dirname, '..', 'config', 'config.json');
const fileConfig = fs.existsSync(configPath) ? require(configPath)[env] : null;

// Build config from environment variables (preferred) with file config as fallback
const config = {
  username: process.env.DB_USER || process.env.DB_USERNAME || fileConfig?.username || 'postgres',
  password: process.env.DB_PASSWORD || fileConfig?.password || '',
  database: process.env.DB_NAME || fileConfig?.database || 'pathordinator',
  host: process.env.DB_HOST || fileConfig?.host || '127.0.0.1',
  port: Number(process.env.DB_PORT || fileConfig?.port || 5432),
  dialect: process.env.DB_DIALECT || fileConfig?.dialect || 'postgres',
  logging: false,
  ...(fileConfig?.dialectOptions && { dialectOptions: fileConfig.dialectOptions }),
  ...(fileConfig?.use_env_variable && { use_env_variable: fileConfig.use_env_variable })
};

const db = {};
const modelDirectories = [
  __dirname,
  path.join(__dirname, '..', 'src', 'models')
].filter(directory => fs.existsSync(directory));

let sequelize;
if (config.use_env_variable && process.env[config.use_env_variable]) {
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
