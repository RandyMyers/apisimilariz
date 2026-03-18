const logger = require('./logger');

function validateEnv(config = {}) {
  const { required = [], optional = [], defaults = {} } = config;
  const missing = [];
  const validated = {};

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      validated[varName] = process.env[varName];
    }
  }

  for (const varName of optional) {
    validated[varName] = process.env[varName] ?? defaults[varName];
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  if (validated.JWT_SECRET && validated.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET is less than 32 characters. Consider using a stronger secret.');
  }
  if (validated.MONGO_URL && !validated.MONGO_URL.startsWith('mongodb')) {
    logger.warn('MONGO_URL does not appear to be a valid MongoDB connection string');
  }

  return validated;
}

module.exports = { validateEnv };
