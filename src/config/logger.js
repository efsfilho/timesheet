const winston = require('winston');
// const { logDir } = require('../../config/index');

const logFormat = info => {
  let level = info.level.toUpperCase();
  level = level == 'INFO' ? level+' ' : level;

  let message = '';
  if (Array.isArray(info.message)) {
    info.message.forEach(item => {
      if (typeof item == 'object')
        message = message+' '+JSON.stringify(item);
      else
        message = message+item;
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
      filename: './log/error.log',
      level: 'error',
      maxsize:  5000000,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: './log/log.log',
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
