const fs = require('fs');

class Utils {

  static existsFile(fileName) {
    return fs.existsSync(fileName, err => { if (err) throw err; });
  }

  static saveJSON(fileName, file) {
    /* TODO passar para banco */
    return new Promise((resolve, reject) => {
      fs.writeFile(fileName, JSON.stringify(file), 'utf8', err => {
        if (err) {
          reject({
            ok: false,
            result: err
          });
        } else {
          resolve({ok: true});
        }
      });
    });
  }

  static readJSON(fileName) {
    /* TODO passar para banco */
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          /* TODO resolve/reject fora do padrao */
          data.length > 0 ? resolve(JSON.parse(data)) : reject(new Error('Arquivo '+fileName+' inválido.'));
        }
      });
    });
  }

  static checkDir(dir) {                                  // cria diretorio se nao existir
    if (!fs.existsSync(dir, err => { if (err) throw err })) {
      fs.mkdir(dir, err => { if (err) throw err });
    }
  }
  
  static readFile(fileName) {
    return new Promise((resolve, reject) => {
      if (Utils.existsFile(fileName)){
        fs.readFile(fileName, (err, data) => {
          if (err) {
            reject({ ok: false });
          } else {
            resolve({
              ok: true,
              result: data
            })
          }
        });
      } else {
        reject({ ok: false });
      }
    });
  }

}

module.exports = Utils;