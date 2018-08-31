const fs     = require('fs');

class Utils {

  existsFile(fileName) {
    return fs.existsSync(fileName, (err) => { if (err) throw err; });
  }

  saveJSON(fileName, file){
    /* TODO passar para banco*/
    // if (!existsFile(fileName)) {
      fs.writeFile(fileName, JSON.stringify(file), 'utf8', (err) => { if (err) throw err; });
    // }
  }

  readJSON(fileName) {
    /* TODO passar para banco */
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, 'utf8', (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
  }

  checkDir(dir) {
    if (!fs.existsSync(dir, err => console.log(err))) {
      fs.mkdir(dir, err => console.log(err));
    }
  }
  
}

module.exports = new Utils();