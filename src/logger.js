const winston = require('winston');
const { logDir } = require('../config/index');

/**
 * Formatacao do log
 * @returns {string} YYYY-MM-DD hh:mm:ss - (ERROR|INFO) : message
 */
const logFormat = info => {
  let level = info.level.toUpperCase();
  level = level == 'INFO' ? level+' ' : level; //(ERROR|INFO) mantem o level com 5 caracteres

  /* TODO info.data adicionado para parse de alguns objetos */
  // if (typeof(info.data) === 'undefined') {
  //   return `${info.timestamp} - ${level} : ${info.message}`;
  // }

  // if (info.data instanceof Error || info.data instanceof String) {
  //   console.log(typeof(info.data));
  //   return `${info.timestamp} - ${level} : ${info.message} ${info.data}`;
  // }

  // if (info.data instanceof Object) {
  //   // info.data = JSON.stringify(info.data);
  //   return `${info.timestamp} - ${level} : ${info.message} ${JSON.stringify(info.data)}`
  // }
  let message = '';
  if (Array.isArray(info.message)) {
    info.message.forEach(item => {
      if (typeof item == 'object') {
        message = message+' '+JSON.stringify(item);
      } else {
        message = message+item;
      }
    });
  } else {
    message = ' '+info.message;
  }
  
  return `${info.timestamp} - ${level} : ${message}`;
};

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => logFormat(info))
  ),
  transports: [
    new winston.transports.File({
      filename: logDir+'error.log',
      level: 'error',
      maxsize:  5000000,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: logDir+'log.log',
      maxsize:  5000000,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV === 'debug') {
  logger.add(new winston.transports.Console({ level: 'debug' }));
} else {
  logger.add(new winston.transports.Console());
}

module.exports = logger;
