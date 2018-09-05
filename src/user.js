const mm = require('moment');
const logger = require('./logger');

const { existsFile, saveJSON, readJSON, checkDir } = require('./src/utils');

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
          logger.info('user adicionado: userId: '+usr.id+' - '+msg.from.first_name+' '+msg.from.last_name);
        }
      }).catch(err => logger.error(err));
      
    } else {
      checkDir(this.userIndexLocal);        // verifica local do arquivo do usuario
      checkDir(this.userRegsLocal);         // verifica local dos registros do usuario
      saveJSON(usersfileName, [this.user]); // cria arquivo com o primeiro usuario
      logger.info('Arquivo criado: '+usersFileName);
      logger.info('user adicionado: userId: '+usr.id+' - '+msg.from.first_name+' '+msg.from.last_name);
    }
    
    if(!existsFile(regFileName)) {          // verifica arquivo com registros do usuario
      let reg = getDefaultStructure();
      saveJSON(regFileName, reg);
      logger.info('Arquivo criado: '+regFileName);
      logger.info('Arquivo de registros criado. userId: '+usr.id);
    }
  }
}

module.exports = User;