const winston = require('winston');
const config = require('../config/index');

/** 
 * Formatacao do log
 * @returns {string} YYYY-MM-DD hh:mm:ss - (ERROR|INFO) : message
 */
const logFormat = info => {
  let level = info.level.toUpperCase();
  level = level == 'INFO' ? level+' ' : level;            //(ERROR|INFO) mantem o level com 5 caracteres
  
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

  return `${info.timestamp} - ${level} : ${info.message}`;
};

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss' }),
    winston.format.printf(info => logFormat(info))
  ),
  transports: [
    new winston.transports.File({
      filename: config.logLocal+'/error.log',
      level: 'error',
      maxsize:  5000000,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: config.logLocal+'/log.log',
      maxsize:  5000000,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV === 'dev') {
  logger.add(new winston.transports.Console());
}

if (process.env.NODE_ENV === 'debug') {
  logger.add(new winston.transports.Console({ level: 'debug' }));
}

module.exports = logger;
