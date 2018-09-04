const winston = require('winston');
const config = require('../config/index');

const logFormat = info => {
  let level = info.level.toUpperCase();
  level = level == 'INFO' ? level+' ' : level;  // mantem o level com 5 caracteres
  return `${info.timestamp} - ${level} : ${info.message}` // estrutura do log
}

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }),
    winston.format.printf(info => logFormat(info))
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: config.logLocal+'/error.log', level: 'error' }),
    new winston.transports.File({ filename: config.logLocal+'/log.log' }),
  ]
});

module.exports = logger;
