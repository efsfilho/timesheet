const FireStore = require('./db/firestore');
const logger = require('./config/logger');
const moment = require('moment');

class User {
  constructor(user) {
    this.id = user.id;
    this.is_bot = user.is_bot;
    this.first_name = user.first_name || null;
    this.last_name = user.last_name || null;
    this.username = user.username || null;
    this.language_code = user.language_code;
    this.date = user.date || moment().format();
    this.is_admin = false;
    this.enabled = true;
  }
}

class TimeSheet {
  constructor() {
    this._db = new FireStore();
    this._users = [];
  }

  addUser(userData) {
    this.isNewUser(userData)
      .then(newUser => {
        if (!newUser) {
          let user = new User(userData);
          this._users.push(user);
          // this._db.setUser(newUser)
          //   .then(res => logger.info(`Usuário adicionado: ${res}`))
          //   .catch(err => logger.error(`Erro ao adicionar usuário ${err}`));
        }
      })
      .catch(err => logger.error(`Erro ao pesquisar usuário ${err}`));
  }

  isNewUser(userData) {
    return new Promise((resolve, reject) => {
      const users = this._users.filter(item => {
        item.id === userData.id;
      });
  
      if (users.length > 0) {
        resolve(false);
      } else {
        // this._db.getUser(userData)
        //   .then(data => resolve(data != null))
        //   .catch(err => reject(err));
      }
    });
  }

}

module.exports = TimeSheet;