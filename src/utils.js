const fs = require('fs');

class Utils {

  static existsFile(fileName) {
    return fs.existsSync(fileName, (err) => { if (err) throw err; });
  }

  static saveJSON(fileName, file){
    /* TODO passar para banco */
    // if (!existsFile(fileName)) {
      fs.writeFile(fileName, JSON.stringify(file), 'utf8', err => { if (err) throw err; });
    // }
  }

  static readJSON(fileName) {
    /* TODO passar para banco */
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, 'utf8', (err, data) => {
        // err ? reject(err) : resolve(JSON.parse(data));
        if (err) {
          reject(err);
        } else {
          data.length > 0 ? resolve(JSON.parse(data)) : reject(new Error('JSON vazio'));
        }
      });
    });
  }

  static checkDir(dir) {  // cria diretorio se nao existir
    if (!fs.existsSync(dir, err => { if (err) throw err })) {
      fs.mkdir(dir, err => { if (err) throw err });
    }
  }
  
}

module.exports = Utils;