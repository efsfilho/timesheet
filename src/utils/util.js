const fs = require('fs');
const logger = require('../config/logger');

const checkDir = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdir(dir, err => {
      if (err)
        throw err
      else
        logger.info(`Diretório criado: ${dir}`);
    });
  }
}

module.exports = {
  checkDir
}