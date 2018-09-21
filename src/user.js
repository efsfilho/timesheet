const mm = require('moment');
const logger = require('./logger');

const { existsFile, saveJSON, readJSON, checkDir } = require('./utils.js');

const getDefaultStructure = () => {

  let months = [];
  let days = [];
  let dayMonth = 0;

  for (let i = 0; i < 12; i++) {
    dayMonth = mm({ month: i }).daysInMonth();            // quantidade de dias do mes

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
      m: mm({month: i}).month(), // mês i
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

/**  Usuario */
class User {

  /**
   * @param {object} userObj - usuario
   * @param {number} userObj.id - id do contato
   * @param {string} userObj.username - username do contato
   * @param {number} userObj.name - nomde do contato
   * @param {boolean} userObj.bot - bot
   * @param {number} userObj.date - data do chat
   * @param {object} config - dados dos diretorios
   * @param {string} config.userIndexLocal - arquivo com usuarios
   * @param {string} config.userRegsLocal - arquivo registros
   */
  constructor(userData, config) {
    this.user = userData;
    this.userIndexLocal = config.userIndexLocal;          // local do arquivo com os usuarios
    this.userRegsLocal = config.userRegsLocal;            // local dos registros
    this.userIndexFilneName = 'user.json';                // arquivo com os usuarios
    this.checkUser();
    return this.user;
  }

  /** Verifica a existencia do usuario */
  checkUser() {
    const user = this.user;
    // Object.keys(user).length > 0 ?       // TODO verificar objeto

    const usersFileName = this.userIndexLocal
      +this.userIndexFilneName;                           // arquivo com id dos usuarios

    const regFileName = this.userRegsLocal
      +this.user.id+'.json';                              // nome do arquivo recebe o id do usuario

    if (existsFile(usersFileName)) {

      readJSON(usersFileName).then(data => {
        try {
          let obj = data
          let userExists = obj.filter(usr => usr.id == this.user.id ).length > 0;
          if (!userExists) {
            obj.push(this.user);                          // adiciona o usuario aos outros existentes
            saveJSON(usersFileName, obj);                 // sobrescreve arquivo usuarios
            logger.info('User adicionado: userId: '+user.id+' - '+user.username);
          }
        } catch (err) {
          logger.error('Erro ao adicionar o usuario > checkUser: '+err);
        }
      }).catch(err => logger.error('Erro ao carregar usuarios > checkUser: '+err));
      
    } else {
      try {
        saveJSON(usersFileName, [this.user]);             // cria arquivo com o primeiro usuario
        logger.info('Arquivo '+usersFileName+' criado.');
        logger.info('User adicionado: userId: '+user.id+' - '+user.username);
      } catch (err) {
        logger.error('Erro ao criar o arquivo '+usersFileName+' > checkUser: '+err);
      }
    }
    
    if(!existsFile(regFileName)) {                        // verifica arquivo com registros do usuario
      try {
        let reg = getDefaultStructure();
        saveJSON(regFileName, reg);
        logger.info('Arquivo '+regFileName+' criado.');
      } catch (err) {
        logger.error('Erro ao criar o arquivo '+regFileName+' > checkUser: '+err);
      }
    }
  }
}

module.exports = User;