const mm = require('moment');
const xlsx = require('xlsx');

const Users = require('./users');
const logger = require('./logger');

const { existsFile, saveJSON, readJSON, checkDir, readFile } = require('./utils');
const { setUser } = require('./dynamo');
// const modelFileName = './src/file.xlsx'; // excel fonte para exportaçao 

/** App */
class App {
  
  /**
   * App Constructor
   * @param {object} config - locais dos diretorios
   */
  constructor(config) {
    this._config = config;
    this._userAdmin = ''; // username do admin
    this._statusNewUsers = true; // status dos novos usuarios
    this._users = []; // usuarios sincronizados
  }

  init() {
    try {
      /* local dos logs */
      checkDir(this._config.logLocal);
      /* local do arquivo do usuario */
      checkDir(this._config.userIndexLocal);
      /* local dos registros do usuario */
      checkDir(this._config.userRegsLocal);      
      /* local temporario dos arquivos para exportacao */
      checkDir(this._config.exportLocal);
    } catch (err) {
      logger.error(['App > init -> Diretorios padrão não criados:', err]);
    }
    /* Carrega usuarios que ja registrados */
    // this._users.loadUsers();
  }

  /**
   * Atualiza os dados do usuario pra uso da classe
   * @param {object} msgUser - msg.from
   * @param {number} msgUser.id - usuario
   * @param {boolean} msgUser.is_bot
   * @param {string} msgUser.first_name
   * @param {string} msgUser.last_name
   * @param {string} msgUser.username
   * @param {string} msgUser.language_code
   */
  setUser(msgUser) {
    try {
      let user = msgUser;
      let userExists = this._users.filter(item =>
        item.id === user.id).length > 0;

      if (!userExists) {
        user.enabled = this._statusNewUsers;
        this._users.push(user);
        logger.info(['New user:', user]);
      }
    } catch(err) {
      logger.error(['App > setUser -> Erro ao verificar usuário:', err]);
    }
  }

  /**
   * Identifica usuarios
   * @param {object} msgUser - msg.from
   * @param {number} msgUser.id - usuario
   * @param {boolean} msgUser.is_bot
   * @param {string} msgUser.first_name
   * @param {string} msgUser.last_name
   * @param {string} msgUser.username
   * @param {string} msgUser.language_code
   * @return {boolean}
   */
  filterUser(msgUser) {

    let user = msgUser;
    let userExists = this._users.filter(item =>
      item.id === user.id).length > 0;

    if (!userExists) {
      user.enabled = this._statusNewUsers;
      user.date = mm().format();

      setUser(user).then(res => {
        if (res.ok) {
          this._users.push(user);
          logger.info(['User novo:', user]);
        } else {
          logger.info(['User não salvo:', res.result]);
        }
      }).catch(res => {
        logger.error(['App > filterUser -> Erro ao salvar usuário:', res.result]);
      });
    }

    return user.enabled || user.username === this._userAdmin;
  }

  /**
   * Usuarios
   * @return {Array}
   */
  getUsers() {
    return this._users;
  }

  /**
   * Monta teclado calendario
   * @param {number} date - unix timestamp
   */
  mountKeyboardCalendar(date) {
    return new Promise((resolve, reject) => {

      /* callback query para o mes anterior */
      let prev = mm(date).subtract(1, 'month').format('YYYY-MM');

      /* callback query para o proximo mes */
      let next = mm(date).add(1, 'month').format('YYYY-MM');

      let keyBoard = [
        [  /* primeira linha do teclado */
          {
            text: '<',
            callback_data: '<'+prev
          },{
            text: date.format('MMMM YYYY'),
            callback_data: '-'
          },{
            text: '>',
            callback_data: '>'+next
          }
        ],[ /* segunda linha */
          {
            text: 'Dom',
            callback_data: '-'
          },{
            text: 'Seg',
            callback_data: '-'
          },{
            text: 'Ter',
            callback_data: '-'
          },{
            text: 'Quar',
            callback_data: '-'
          },{
            text: 'Qui',
            callback_data: '-'
          },{
            text: 'Sex',
            callback_data: '-'
          },{
            text: 'Sab',
            callback_data: '-'
          }
        ]
      ];
  
      this._getDayButtons(date.month()).then(res => {
        if (res.ok) {
          try {

            let days = res.result;
            let weekCount = 6;
            let buttons = [];
            
            for (let i = 0; i < days.length; i++) {
              
              let button = {
                text: ''+days[i],
                callback_data: ''
              };

              if (days[i] === '-') {
                button.callback_data = ''+days[i];
              } else {
                /* callback query do dia */
                button.callback_data = '+'+mm({
                  year: date.year(),
                  month: date.month(),
                  day: days[i]
                }).format('YYYY-MM-DD');
              }
      
              buttons.push(button);
      
              if (i >= weekCount) {
                /* limita a 7 colunas */
                keyBoard.push(buttons);

                /* adiciona terceira até a oitava linha */
                weekCount += 7;
                buttons = [];
              }
            }
            resolve({
              ok: true,
              result: keyBoard
            });
          } catch (err) {
            logger.error(['App > mountKeyboardCalendar -> Erro ao montar botoes:', err]);
            reject({ ok: false });
          }
        }
      }).catch(err => {
        logger.error(['App > mountKeyboardCalendar -> Erro ao montar botoes:', err]);
        reject({ ok: false });
      });
    });
  }
  
  /**
   * Retorna array com os botoes dos dias (titulos e callbacks)
   * @param {number} month - mes do calendario exibido
   */
  _getDayButtons(month) {
    return new Promise((resolve, reject) => {
      try {      
        let days = Array(42);
        days.fill('-');

        /* quantidade de dias do mes */
        let dm = mm({ month: month }).daysInMonth();

        /* primeiro dia da semana */
        let wd = mm({ month: month, day: 1}).weekday();
    
        for (let i = 1; i <= dm; i++) {
          days[wd] = i;
          wd++;
    
          if (i == dm) {
            resolve({
              ok: true,
              result: days
            });
          }
        }
      } catch (err) {
        reject({ ok: false });
      }
    });
  } 

  /**
   * Monta teclado com registro de pontos
   * @param {string} date - moment date YYYY-MM-DD
   */
  mountKeyboardRegs(date) {
    return new Promise((resolve, reject) => {
      /* TODO validar as pesquisas */
      this._getReg(date).then(res => {
        if (res.ok) {
          let data = res.result;
          let key = [[
            {
              text: data.r1 > 0 ? mm(data.r1).format('HH:mm') : '-',
              callback_data: '.1'+data.date
            },{
              text: data.r2 > 0 ? mm(data.r2).format('HH:mm') : '-',
              callback_data: '.2'+data.date
            },{
              text: data.r3 > 0 ? mm(data.r3).format('HH:mm') : '-',
              callback_data: '.3'+data.date
            },{
              text: data.r4 > 0 ? mm(data.r4).format('HH:mm') : '-',
              callback_data: '.4'+data.date
            }
          ]];
          resolve({
            ok: true,
            result: { inline_keyboard: key }
          });
        } else {
          reject({ ok: false });
        }
      }).catch(err => {
        logger.error(['App > mountKeyboardRegs -> Erro ao gerar teclado com registros:', err]);
        reject({ ok: false });
      });    
    });
  }

  /**
   * Adiciona registro de ponto
   * @param {number} typeReg - tipo de registro (1,2,3 ou 4)
   * @param {number} newTime - unix timestamp
   */
  addReg(typeReg, newTime) {
    return new Promise((resolve, reject) => {
      if (this._user == null) {
        logger.error('App > addReg -> Usuario não sincronizado');
        reject({ok: false});
      } else {
        // TODO validacao do typeReg
        // TODO validacao do newTime
        this._updateReg(typeReg, newTime*1000).then(res => {
          if (res.ok) {
            resolve({
              ok: true,
              result: res.result.regUpdated
            });
          } else {
            reject({ ok: false });
          }
        }).catch(err => {
          logger.error(['App > addReg -> Erro ao atualizar o ponto(_updateReg):', err]);
          reject({ ok: false });
        });
      }
    });
  }

  /**
   * Atualiza registro de ponto
   * @param {string} date - data do ponto (YYYY-MM-DD)
   * @param {number} typeReg - tipo reg (1, 2, 3 ou 4)
   * @param {string} strNewTime - novo ponto (hh:mm)
   */
  updateReg(date, typeReg, strNewTime) {
    return new Promise((resolve, reject) => {
      try {
        if (isNaN(typeReg)) {
          reject({ ok: false });
        }

        /* TODO validacoes */
        const newTime = mm(date+' '+strNewTime);
        if (newTime.isValid()) {
          this._updateReg(typeReg, newTime.unix()*1000 ).then(res => {
            if (res.ok) {
              resolve({
                ok: true,
                result: res.result.regUpdated
              });
            } else {
              reject({ ok: false });
            }
          }).catch(err => {
            logger.debug(['App > updateReg -> Erro ao atualizar o registro:', err]);
            reject({ ok: false });
          });
        } else {
          reject({ ok: false });
        }
      } catch (err) {
        reject({ ok: false, result: err });
      }
    });
  }

  /**
   * Carrega ponto do dia
   * @param {string} date - moment date YYYY-MM-DD
   */ 
  listDayReg(date) {
    return new Promise((resolve, reject) => {
      /* TODO validar as pesquisas */
      this._getReg(date).then(res => {
        if (res.ok) {
          let rUpdated = {
            r1: res.result.r1 > 0 ? mm(res.result.r1).format('HH:mm') : '  -  ',
            r2: res.result.r2 > 0 ? mm(res.result.r2).format('HH:mm') : '  -  ',
            r3: res.result.r3 > 0 ? mm(res.result.r3).format('HH:mm') : '  -  ',
            r4: res.result.r4 > 0 ? mm(res.result.r4).format('HH:mm') : '  -  '
          };
          resolve({
            ok: true,
            result: rUpdated
          });
        } else {
          reject({ ok: false });
        }
      }).catch(err => {
        logger.error(['App > listDayReg -> Erro carregar ponto:', err]);
        reject({ ok: false });
      });
    });
  }  

  /** 
   * Retorna o tempo digitado
   * @param {string} strNewTime - HHmm|Hmm|HH:MM|H:MM
   * @returns {Promise}
   */
  getTimeFromString(strNewTime) {
    return new Promise((resolve, reject) => {

      /* identifica quantidade de digitos separado ou nao por dois pontos */
      let rgxd = /^(\d{3}|\d:\d{2})$|^(\d{4}|\d{2}:\d{2})$/;
      /* tempo 3 digitos */
      let rgx3 = /^[0-9][0-5][0-9]$/;
      /* tempo 4 digitos */
      let rgx4 = /^[0-1][0-9][0-5][0-9]|2[0-3][0-5][0-9]$/;
      
      let digits = null;
      
      if (strNewTime != null && (strNewTime.length >= 3 && strNewTime.length <= 5)) {
        digits = rgxd.exec(strNewTime);
      }

      let newTime = null;

      try {
        if (digits != null && digits.length >= 3) {
          /* 3 digitos */
          if (typeof(digits[1]) !== 'undefined') {
            newTime = digits[1].replace(':', '');
            rgx3.exec(newTime) != null ? newTime = '0'+newTime : newTime = null;
          }
          /* 4 digitos */
          if (typeof(digits[2]) !== 'undefined') {
            newTime = digits[2].replace(':', '');
            rgx4.exec(newTime) != null ? '' : newTime = null;
          }
        }

        if (newTime != null) {
          newTime = newTime.slice(0,2)+':'+newTime.slice(2,4);
          resolve({
            ok: true,
            result: newTime
          });
        } else {
          reject({ ok: false });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Atualiza ponto
   * @param {number} typeReg - tipo reg (1, 2, 3 ou 4)
   * @param {number} dateTime - unix timestamp
   */
  _updateReg(typeReg, dateTime) {

    /* endereco com os registro do usuario */
    let fileName = this._config.userRegsLocal
      +this._user.id+'.json';

    return new Promise((resolve, reject) => {
      readJSON(fileName).then(data => {

        try {
          const year  = mm(dateTime).year();
          const month = mm(dateTime).month();
          const day   = mm(dateTime).date()-1;            // array apartir de 0
          let rUpdated = { r1: 0, r2: 0, r3: 0, r4: 0 };

          let yearIndex = false;

          for (let i = 0; i < data.length; i++) {
            if (data[i].y == year) {
              yearIndex = true;
            }
          }

          if (!yearIndex) {
            let months = [];
            let days = [];
            let dayMonth = 0;

            for (let i = 0; i < 12; i++) {
              dayMonth = mm({ month: i }).daysInMonth();

              for (let l = 1; l <= dayMonth; l++) {
                days.push({ d: l, r: { r1: 0, r2: 0, r3: 0, r4: 0 } });
              }

              months.push({ m: mm({month: i}).month(), d: days });
              days = [];
            }

            data.push({
              y: mm().format('YYYY'),  // ano atual
              c: mm().format(),        // data/hora atual
              m: months
            });            
          }
          
          for (let i = 0; i < data.length; i++) {         // conjunto de registros por ano
            if(data[i].y == year){                        // registro do ano
              if (typeReg == 1) {                           
                data[i].m[month].d[day].r.r1 = dateTime;  // comeco jornada 
              }
              if (typeReg == 2) {
                data[i].m[month].d[day].r.r2 = dateTime;  // comeco almoco
              }
              if (typeReg == 3) {
                data[i].m[month].d[day].r.r3 = dateTime;  // fim almoco 
              }
              if (typeReg == 4) {
                data[i].m[month].d[day].r.r4 = dateTime;  // fim jornada
              }
              rUpdated = data[i].m[month].d[day].r;
            }
          }
  
          saveJSON(fileName, data).then(res => {
            if (res.ok) {
              resolve({
                ok: true,
                result: {
                  newTime: mm(dateTime).format(),         // retorno do ponto atualizado
                  regUpdated: rUpdated
                }
              });
            } else {
              reject({ ok: false });
            }
          }).catch(err => {
            logger.error(['App > updateReg -> Erro ao salvar registro de ponto:', err]);
            reject({ ok: false });
          });

        } catch (err) {
          logger.error(['App > updateReg -> Erro ao registrar ponto:', err]);
          reject({ ok: false });
        }
      }).catch(err => {
        logger.error(['App > updateReg -> Erro ao ler ponto:', err]);
        reject({ ok: false });
      });
    });
  }

  /**
   * Retorna ponto do dia
   * @param {string} dateTime - Dia selecionado (format YYYY-MM-DD).
   */
  _getReg(dateTime) {
    return new Promise((resolve, reject) => {

      if (this._user == null) {
        logger.error('App > getReg -> Ususario não sincronizado');
        reject({ ok: false });
      }

      let userRegsFileName = this._config.userRegsLocal
        +this._user.id+'.json';
      
      readJSON(userRegsFileName).then(data => {

        let year  = mm(dateTime).year();
        let month = mm(dateTime).month();
        let day   = mm(dateTime).date()-1;                // array apartir do 0
        
        try {
          for (let i = 0; i < data.length; i++) {
            if(data[i].y == year){                        // data[i].y string
              let reg = {
                date: mm(dateTime).format('YYYY-MM-DD'),
                r1: data[i].m[month].d[day].r.r1,
                r2: data[i].m[month].d[day].r.r2,
                r3: data[i].m[month].d[day].r.r3,
                r4: data[i].m[month].d[day].r.r4
              };
              resolve({
                ok: true,
                result: reg
              });
            }
          }
        } catch(err) {
          logger.error(['App > getReg -> Erro ao recuperar registros:', err]);
          reject({ ok: false });
        }
      }).catch(err => {
        logger.error(['App > getReg -> Erro ao ler registros:', err]);
        reject({ ok: false });
      });
    });
  }

  /**
   * Cria data no xlsx
   * @param {object} worksheet - worksheet do xlsx
   * @param {string} address - endereco da celula do worksheet
   * @param {string} date - data do ponto
   */
  _addDate(worksheet, address, date) {
    
    /* Adiciona datas na primeira coluna */
    let cell = {
      t:'s',
      v: date
    };
    worksheet[address] = cell;
  
    let range = xlsx.utils.decode_range(worksheet['!ref']);
    let addr = xlsx.utils.decode_cell(address);
    
    if(range.s.c > addr.c) range.s.c = addr.c;
    if(range.s.r > addr.r) range.s.r = addr.r;
    if(range.e.c < addr.c) range.e.c = addr.c;
    if(range.e.r < addr.r) range.e.r = addr.r;
  
    worksheet['!ref'] = xlsx.utils.encode_range(range);
  }

  /**
   * Cria hora no xlsx
   * @param {object} worksheet - worksheet do xlsx
   * @param {string} address - endereco da celula do worksheet
   * @param {string} time - hora do ponto
   */
  _addTime(worksheet, address, time) {
    
    /* Adiciona tempo nas celulas */
    // let h = mm(time).hours();
    // let m = mm(time).minutes();
    let f = mm(time).format('HH:mm');
  
    let cell = {
      t:'s',    // s = number format
      // v: m,
      v: f
    };
    
    /* adiciona na celula */
    worksheet[address] = cell;
  
    let range = xlsx.utils.decode_range(worksheet['!ref']);
    let addr = xlsx.utils.decode_cell(address);
  
    if(range.s.c > addr.c) range.s.c = addr.c;
    if(range.s.r > addr.r) range.s.r = addr.r;
    if(range.e.c < addr.c) range.e.c = addr.c;
    if(range.e.r < addr.r) range.e.r = addr.r;
  
    worksheet['!ref'] = xlsx.utils.encode_range(range);
  }

  /** Converte dados dos pontos para um objeto 
   * @param {Array} data - dados lidos do arquivo de pontos
  */
  _processFileToExport(data) {
    return new Promise((resolve, reject) => {

      let obj = data;
      let year = 0;
      let month = 0;
      let day = 0;
      let regsObj = [];

      try {
        for (let i = 0; i < obj.length; i++) {
          let objYear = obj[i];
          year = objYear.y;
          for(let j = 0; j < objYear.m.length; j++){
            let objMonth = objYear.m[j];
            month = objMonth.m+1;
            for (let l = 0; l < objMonth.d.length; l++) {
              day = l+1;
              try {
                regsObj.push({
                  date: day+'/'+month+'/'+year,
                  reg: objMonth.d[l].r
                });
              } catch (err) {
                logger.error(['App > _processFileToExport -> Erro ao ler registros:', err]);
                reject({ ok: false });
              }
            }
          }
        }
        
        resolve({
          ok: true,
          result: regsObj
        });
      } catch (err) {
        logger.error(['App > _processFileToExport -> Erro ao processar exportação:', err]);
        reject({ ok: false });
      }
    });
  }

  /**  Escreve o xlsx no disco */
  export() {
    return new Promise((resolve, reject) => {

      if(this._user == null) {                             // verifica usuario
        logger.info('App > export -> Usuario não sincronizado');
        reject({ ok: false });
      }

      const baseFileName = this._config.userRegsLocal
          +this._user.id+'.json';                          // registros do usuario

      const outFileName = this._config.exportLocal
          +this._user.id+'.xlsx';                          // arquivo a ser exportado

      readJSON(baseFileName).then(data => {
        this._processFileToExport(data).then(res => {     // processa arquivo json
          /* TODO criar excel em runtime */
          // file = xlsx.utils.book_new();
          if (res.ok) {

            const regs = res.result;
            let file = null;
            
            if (existsFile(this._config.exportModelFileName)) {
              file = xlsx.readFile(this._config.exportModelFileName);        // excel base
            } else {
              logger.error('App > export -> xlsx base não encontrado');
              reject({ ok: false });
            }

            try {
              for (let i = 0; i < regs.length; i++) {
                this._addDate(file.Sheets.Plan1, 'A'+(i+1), regs[i].date);
                regs[i].reg.r1 != 0 ? this._addTime(file.Sheets.Plan1, 'B'+(i+1), regs[i].reg.r1) : '';
                regs[i].reg.r2 != 0 ? this._addTime(file.Sheets.Plan1, 'C'+(i+1), regs[i].reg.r2) : '';
                regs[i].reg.r3 != 0 ? this._addTime(file.Sheets.Plan1, 'D'+(i+1), regs[i].reg.r3) : '';
                regs[i].reg.r4 != 0 ? this._addTime(file.Sheets.Plan1, 'E'+(i+1), regs[i].reg.r4) : '';
              }

              // xlsx.writeFile(file, outFileName);
              xlsx.writeFileAsync(outFileName, file, () => {
                readFile(outFileName).then(res => {
                  if (res.ok) {
                    resolve({
                      ok: true,
                      result: res.result
                    });
                  } else {
                    logger.error('App > export -> Erro ao ler arquivo de exportação.');
                    reject({ ok: false });
                  }
                }).catch(err => {
                  logger.error(['App > export -> Erro ao ler arquivo de exportação:', err]);
                  reject({ ok: false });
                });
              });

            } catch (err) {
              logger.error(['App > export -> Erro ao gerar arquivo de exportação:', err]);
              reject({ ok: false });
            }
          } else {
            logger.error('App > export -> ok false.');
            reject({ ok: false });
          }
        }).catch(err => {
          logger.error(['App > export -> Erro ao processar exportação:', err]);
          reject({ ok: false });
        });
      }).catch(err => {
        logger.error(['App > export -> Erro ao gerar exportação:', err]);
        reject({ ok: false });
      });
    });
  }
}

module.exports = App;