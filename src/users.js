const mm = require('moment');
const logger = require('./logger');

const { existsFile, saveJSON, readJSON } = require('./utils.js');

/** Usuarios */
class Users {

  /**
   * @param {Object} config - dados dos diretorios
   * @param {string} config.userIndexLocal - arquivo com usuarios
   * @param {string} config.userRegsLocal - arquivo registros
   */
  constructor(config) {
    this._users = [];
    /* Local do arquivo com os usuarios */
    this._usersFile = config.userIndexLocal+'user.json';
    /* local dos registros */
    this._userRegsLocal = config.userRegsLocal;
  }

  /** Carrega usuarios */
  loadUsers() {
    try {
      if (existsFile(this._usersFile)) {
        readJSON(this._usersFile).then(res => {
          if (Array.isArray(res)) {
            if (res.length > 0) {
              this._users = res;
            } else {
              logger.info('Users > loadUsers -> Nenhum usuário registrado.');
            }
          } else {
            logger.info('Users > loadUsers -> Conteúdo do arquivo '+this._usersFile+' não pode ser lido.');
          }
        }).catch(err => logger.error('Users > loadUsers -> Erro ao ler arquivo user.json : '+err));
      } else {
        this._createUsersFile();
      }
    } catch (err) {
      logger.error('Users > loadUsers -> Erro ao carregar usuarios: '+err);
    }
  }

  /** Verifica a existencia do usuario 
   * @param {Object} userObj - usuario
   * @param {number} userObj.id - id do contato
   * @param {string} userObj.username - username do contato
   * @param {number} userObj.name - nomde do contato
   * @param {boolean} userObj.bot - bot
   * @param {number} userObj.date - data do chat
   */
  checkUser(userObj) {

    if (!this._validateUser(userObj)) throw Error('Objeto usuário inválido');
    /* nome do arquivo dos pontos do usuario */
    const regFileName = this._userRegsLocal+userObj.id+'.json';

    if (Array.isArray(this._users)) {
      /* this.users que foi atualizado pelo loadUsers() */
      const userExists = this._users.filter(user => user.id == userObj.id ).length > 0;

      if (!userExists) {
        /* user json */
        if (!existsFile(this._usersFile)) {
          this._createUsersFile();
        }
        /* regs json */
        if(!existsFile(regFileName)) {
          try {
            saveJSON(regFileName, this._getDefaultStructure());
            logger.info('Arquivo '+regFileName+' criado.');
          } catch (err) {
            logger.error('Users > checkUser -> Erro ao criar o arquivo '+regFileName+': '+err);
          }
        }

        /* TODO validar a sincronicidade dos usuarios do arquivo/runtime */
        this._users.push(userObj);

        /* sobrescreve arquivo usuarios */
        saveJSON(this._usersFile, this._users);
        logger.debug('Arquivo '+this._usersFile+' atualizado');
        logger.info('Usuário adicionado: '+JSON.stringify(userObj));
      }
    }
  }

  /** Valida as propriedades do objeto Usuario 
   * @param {Object} userObj - usuario
   * @return {boolean}
   */
  _validateUser(userObj) {
    return ['id', 'username', 'name', 'bot', 'date'].every(el => userObj.hasOwnProperty(el));
  }

  /** Cria registro com usuarios */
  _createUsersFile() {
    try {
      saveJSON(this._usersFile, []);
      logger.info('Arquivo '+this._usersFile+' criado.');
    } catch (err) {
      logger.error('Users > _createUsersFile -> Erro ao criar o arquivo '+this._usersFile+': '+err);
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

module.exports = Users;