const mm = require('moment');
const logger = require('./logger');

const { existsFile, saveJSON, readJSON } = require('./utils.js');

/**  Usuario */
class User {

  /**
   * @param {Object} userData - usuario
   * @param {number} userData.id - id do contato
   * @param {string} userData.username - username do contato
   * @param {number} userData.name - nomde do contato
   * @param {boolean} userData.bot - bot
   * @param {number} userData.date - data do chat
   * @param {Object} config - dados dos diretorios
   * @param {string} config.userIndexLocal - arquivo com usuarios
   * @param {string} config.userRegsLocal - arquivo registros
   */
  constructor(userData, config) {
    if (!this._validateUser(userData)) throw Error('Objeto usuário inválido');
    this.user = userData;
    this.userIndexLocal = config.userIndexLocal;          // local do arquivo com os usuarios
    this.userRegsLocal = config.userRegsLocal;            // local dos registros
    this.userIndexFilneName = 'user.json';                // arquivo com os usuarios

    /* cria arquivos de registro de usuarios novos */
    this._checkUser();
    
    return this.user;
  }

  /** Valida as propriedades do objeto Usuario 
   * @param {Object} usrObj - usuario
   * @return {boolean}
   */
  _validateUser(usrObj) {
    /* TODO validar os tipos */
    return ['id', 'username', 'name', 'bot', 'date'].every(el => usrObj.hasOwnProperty(el));
  }

  /** Verifica a existencia do usuario */
  _checkUser() {
    const user = this.user;

    /* arquivo com id dos usuarios */
    const usersFileName = this.userIndexLocal
      +this.userIndexFilneName;

    /* nome do arquivo dos pontos do usuario */
    const regFileName = this.userRegsLocal
      +user.id+'.json';

    if (existsFile(usersFileName)) {

      readJSON(usersFileName).then(data => {
        try {
          let obj = data
          let userExists = obj.filter(usr => usr.id == user.id ).length > 0;

          if (!userExists) {
            /* adiciona o usuario aos outros existentes */
            obj.push(user);
            /* sobrescreve arquivo usuarios */
            saveJSON(usersFileName, obj);
            // logger.debug(JSON.stringify(user));
            logger.info('Usuário adicionado: '+JSON.stringify(user));
          }
        } catch (err) {
          logger.error('User > checkUser -> Erro ao adicionar o usuario: '+err);
        }
      }).catch(err => logger.error('User > checkUser -> Erro ao carregar usuarios: '+err));
      
    } else {
      try {
        /* cria arquivo com o primeiro usuario */
        saveJSON(usersFileName, [user]);
        logger.info('Arquivo '+usersFileName+' criado.');
        logger.info('Usuario adicionado: '+JSON.stringify(user));
      } catch (err) {
        logger.error('User > checkUser -> Erro ao criar o arquivo '+usersFileName+': '+err);
      }
    }
    
    /* verifica arquivo com registros do usuario */
    if(!existsFile(regFileName)) {
      try {
        let reg = this._getDefaultStructure();
        saveJSON(regFileName, reg);
        logger.info('Arquivo '+regFileName+' criado.');
      } catch (err) {
        logger.error('User > checkUser -> Erro ao criar o arquivo '+regFileName+': '+err);
      }
    }
  }

  /**
   * Retorna estrutura do arquivo de pontos
   * @returns {Array.<{y: string, c: string, m: Array}>} - regStructure
   */
  _getDefaultStructure() {

    let months = [];
    let days = [];
    let dayMonth = 0;
  
    for (let i = 0; i < 12; i++) {
      dayMonth = mm({ month: i }).daysInMonth();          // quantidade de dias do mes
  
      for (let l = 1; l <= dayMonth; l++) {
        days.push({
          d: l,                                           // dia
          r: {                                            // registros do dia
            r1: 0,                                        // primeiro registro
            r2: 0,                                        // segundo
            r3: 0,
            r4: 0                                         // ultimo
          }
        });
      }
  
      months.push({
        m: mm({month: i}).month(),                        // mês i
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
}

module.exports = User;