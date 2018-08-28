const fs     = require('fs');
const xlsx   = require('xlsx');


const existsFile = fileName => {
  return fs.existsSync(fileName, (err) => { if (err) throw err; });
}

const saveJSON = (fileName, file) => {
  /* TODO passar para um banco*/
  // if (!existsFile(fileName)) {
    fs.writeFile(fileName, JSON.stringify(file), 'utf8', (err) => { if (err) throw err; });
  // }
}

const readJSON = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => {
      err ? reject(err) : resolve(JSON.parse(data));
    });
  });
}

class User {

  constructor(user, config) {
    this.user = user;
    this.userIndexFile = config.userIndexFile;  // local do arquivo com os usuarios
    this.userRegsLocal = config.userRegsLocal;  // local dos registros
    this.checkUser();
  }

  checkUser() {

    // Object.keys(user).length > 0 ?  // TODO verificar objecto

    let fileName = this.userIndexFile+'/users.json'; // arquivo com id dos usuarios
    if (existsFile(fileName)) {

      readJSON(fileName).then(obj => {

        let userExists = obj.filter( usr => usr.id == this.user.id ).length > 0;
        if (!userExists) {
          obj.push(this.user);
          saveJSON(fileName, obj);
          console.log('criado');
        }

      }).catch((err) => {
        console.log(err);
      });
    } else {
      // criar o json
    }
  }

  createUserStructure() {

  }
}

module.exports = User;