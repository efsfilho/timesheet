const fs     = require('fs');

const existsFile = fileName => {
  return fs.existsSync(fileName, (err) => { if (err) throw err; });
}

const saveJSON = (fileName, file) => {
  /* TODO passar para banco*/
  // if (!existsFile(fileName)) {
    fs.writeFile(fileName, JSON.stringify(file), 'utf8', (err) => { if (err) throw err; });
  // }
}

const readJSON = (fileName) => {
  /* TODO passar para banco */
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, data) => {
      err ? reject(err) : resolve(JSON.parse(data));
    });
  });
}

const checkDir = dir => {
  if (!fs.existsSync(dir, err => console.log(err))) {
    fs.mkdir(dir, err => console.log(err));
  }
}


class User {

  constructor(user, config) {
    this.user = user;
    this.userIndexLocal = config.userIndexLocal;  // local do arquivo com os usuarios
    this.userRegsLocal = config.userRegsLocal;    // local dos registros
    this.userIndexFilneName = 'user.json';        // arquivo com os usuarios
    this.checkUser();
  }

  checkUser() {

    // Object.keys(user).length > 0 ?  // TODO verificar objecto
    let fileName = this.userIndexLocal
      +'/'+this.userIndexFilneName;   // arquivo com id dos usuarios

    if (existsFile(fileName)) {

      readJSON(fileName).then( obj => {

        let userExists = obj.filter( usr => usr.id == this.user.id ).length > 0;
        if (!userExists) {
          obj.push(this.user);        // adiciona o usuario aos outros existentes
          saveJSON(fileName, obj);    // sobrescreve arquivo usuarios
          console.log('adicionado');  // TODO fazer um log decente
        }
      }).catch((err) => {
        console.log(err);
      });
    } else {

      checkDir(this.userIndexLocal);    // verifica local do arquivo do usuario
      checkDir(this.userRegsLocal);     // verifica local dos registros do usuario

      saveJSON(fileName, [this.user]);  // cria arquivo com o primeiro usuario
      console.log('start');             // TODO log
    }
  }
}

module.exports = User;