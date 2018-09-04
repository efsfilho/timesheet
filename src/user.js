const mm = require('moment');

const existsFile = require('./utils').existsFile;
const saveJSON =  require('./utils').saveJSON;
const readJSON =  require('./utils').readJSON;
const checkDir =  require('./utils').checkDir;

const getDefaultStructure = () => {

  let months = [];
  let days = [];
  let dayMonth = 0;

  for (let i = 0; i < 12; i++) {
    dayMonth = mm({ month: i }).daysInMonth(); // quantidade de dias do mes

    for (let l = 1; l <= dayMonth; l++) {
      days.push({
        d: l,             // dia
        r: {              // registros do dia
          r1: 0,          // primeiro registro
          r2: 0,          // segundo
          r3: 0,
          r4: 0           // ultimo
        }
      });
    }

    months.push({
      m: mm({month: i}).format('MM'), // mês i
      d: days
    });

    days = [];
  }

  let regStructure = [{
    y: mm().format('YYYY'),  // ano atual
    c: mm().format(),        // data/hora atual
    m: months
  }];

  return regStructure;
}

class User {

  constructor(user, config) {
    this.user = user;
    this.userIndexLocal = config.userIndexLocal;  // local do arquivo com os usuarios
    this.userRegsLocal = config.userRegsLocal;    // local dos registros
    this.userIndexFilneName = 'user.json';        // arquivo com os usuarios
    this.log = '';                                // user criado ou adicionado
    this.checkUser();
  }

  checkUser() {

    // Object.keys(user).length > 0 ?       // TODO verificar objecto

    let usersfileName = this.userIndexLocal
      +this.userIndexFilneName;             // arquivo com id dos usuarios

    let regFileName = this.userRegsLocal
      +this.user.id+'.json';                // nome do arquivo recebe o id do usuario

    if (existsFile(usersfileName)) {

      readJSON(usersfileName).then( data => {
        let obj = [data]
        let userExists = obj.filter( usr => usr.id == this.user.id ).length > 0;
        if (!userExists) {
          obj.push(this.user);              // adiciona o usuario aos outros existentes
          saveJSON(usersfileName, obj);     // sobrescreve arquivo usuarios
          console.log('adicionado');        // TODO fazer um log decente
        }
      }).catch(err => console.log(err));

    } else {
      checkDir(this.userIndexLocal);        // verifica local do arquivo do usuario
      checkDir(this.userRegsLocal);         // verifica local dos registros do usuario
      saveJSON(usersfileName, [this.user]); // cria arquivo com o primeiro usuario
      console.log('user criado');           // TODO log
    }

    if(!existsFile(regFileName)) {          // verifica arquivo com registros do usuario
      let reg = getDefaultStructure();
      saveJSON(regFileName, reg);
      console.log('regs criado');
    }
  }
}

module.exports = User;