const fs = require('fs');
const mm = require('moment');
const xlsx = require('xlsx');
const logger = require('./logger');
const { logDir, exportDir, exportModelFileName } = require('../config/index');
const { getUsers, setUser, getRegs, setRegs, updateRegs} = require('./dynamo');

/** App */
class App {
  
  /** App Constructor */
  constructor() {
    this._userNameAdmin = ''; // username do admin
    this._userIdAdmin = 0;
    this._statusNewUsers = true; // status dos novos usuarios
    this._users = []; // usuarios sincronizados
  }

  init() {
    try {
      this._checkDir(logDir); // verifica/cria local dos logs
      this._checkDir(exportDir); // verifica/cria local temporario dos arquivos para exportacao
    } catch (err) {
      logger.error(['App > init -> Erro ao criar dirertórios:', err]);
    }

    getUsers().then(users => {
      this._users = users.Items;
      logger.info(['Usuarios carregados: ', this._users.length])
    }).catch(err => {
      logger.error(['App > init -> Erro ao carregar usuários', err]);
    });
  }

  /** Cria diretorio se nao existir */
  _checkDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdir(dir, err => {
        if (err) {
          throw err
        } else {
          logger.info('Diretorio criado: '+dir);
        }
      });
    }
  }

  /**
   * Identifica admin
   * @param {object} msg - msg.from
   * @param {number} msg.id - usuario
   * @param {string} msg.username
   * @return {boolean}
   */
  filterUserSuper(msg) {
    if (msg.id == this._userIdAdmin) return true;
    if (msg.username == this._userNameAdmin) return true;
    return false;
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
    let users = this._users.filter(item => item.id == user.id);

    user.username = msgUser.username || 'null';
    user.first_name = msgUser.first_name || 'null';
    user.last_name = msgUser.last_name || 'null';
 
    if (users.length > 0) {
      user = users[0];
    } else {
      user.enabled = this._statusNewUsers;
      user.date = mm().format();

      setUser(user).then(() => {

        this._users.push(user);
        let userInfo = {
          id: user.id,
          username: user.username,
          name: `${user.first_name} ${user.last_name}`
        }
        logger.info(['User novo:', userInfo]);
      }).catch(err => {
        logger.error(['App > filterUser -> Erro ao salvar usuário:', err]);
      });
    }

    return user.enabled || user.username == this._userAdmin;
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
          resolve({ result: keyBoard });
        } catch (err) {
          logger.error(['App > mountKeyboardCalendar -> Erro ao montar botoes:', err]);
          reject(err);
        }
      }).catch(err => {
        logger.error(['App > mountKeyboardCalendar -> Erro ao montar botoes(_getDayButtons):', err]);
        reject(err);
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
            resolve({ result: days });
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Monta teclado com registro de pontos
   * @param {number} chatId - id do usuario
   * @param {string} date - moment date YYYY-MM-DD
   */
  mountKeyboardRegs(chatId, date) {
    return new Promise((resolve, reject) => {
      /* TODO validar as pesquisas */

      this._getReg(chatId, date).then(res => {

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

        resolve({ result: { inline_keyboard: key } });
      }).catch(err => {
        logger.error(['App > mountKeyboardRegs -> Erro ao criar teclado com registros:', err]);
        reject(err);
      });    
    });
  }

  /** Cria objeto com regs de um ano */
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
            r4: 0                                         // quarto
          }
        });
      }

      months.push({
        m: mm({month: i}).month(),                        // mês i
        d: days
      });

      days = [];
    }

    let regStructure = {
      y: Number(mm().format('YYYY')),  // ano atual
      c: mm().format(),        // data/hora atual
      m: months
    };

    return regStructure;
  }

  /**
   * Adiciona registro de ponto
   * @param {number} typeReg - tipo de registro (1,2,3 ou 4)
   * @param {number} newTime - unix timestamp
   */
  addReg(chatId, typeReg, newTime) {
    return new Promise((resolve, reject) => {

      getRegs(chatId).then(data => {

        let dayReg = null;  // pontos do dia
        if (data.hasOwnProperty('Item')) {

          let year = Number(mm().format('YYYY'));
          let regs = data.Item.regs; // procura item do ano

          if (regs.filter(item => item.y == year).length > 0) {
            // item do ano
            let i = regs.findIndex(item => item.y == year);

            dayReg = this._updateReg(regs[i], typeReg, newTime*1000);
          } else {
            // sem item no ano
            let newRegs = this._getDefaultStructure();

            dayReg = this._updateReg(newRegs, typeReg, newTime*1000);
            regs.push(newRegs);
          }
          updateRegs(data.Item).then(() => {
            resolve({ result: dayReg });
          }).catch(err => {
            logger.error(['App > addReg -> Erro ao atualizar o ponto(updateRegs):', err]);
            reject(err);
          });
        } else {
          // sem registros
          let newRegs = {
            userId: chatId,
            regs: [this._getDefaultStructure()]
          }
          dayReg = this._updateReg(newRegs.regs[0], typeReg, newTime*1000);

          setRegs(newRegs).then(() => {
            resolve({ result: dayReg });
          }).catch(err => {
            logger.error(['App > addReg -> Erro ao atualizar o ponto(setRegs):', err]);
            reject(err);
          });
        }
      }).catch(err => {
        logger.error(['App > addReg -> Erro ao atualizar o ponto(getRegs):', err]);
        reject(err);
      });
    });
  }

  /**
   * Carrega ponto do dia
   * @param {string} date - moment date YYYY-MM-DD
   */ 
  listDayReg(chatId, date) {
    return new Promise((resolve, reject) => {
      /* TODO validar as pesquisas */
      this._getReg(chatId, date).then(res => {

        let rUpdated = {
          r1: res.result.r1 > 0 ? mm(res.result.r1).format('HH:mm') : '  -  ',
          r2: res.result.r2 > 0 ? mm(res.result.r2).format('HH:mm') : '  -  ',
          r3: res.result.r3 > 0 ? mm(res.result.r3).format('HH:mm') : '  -  ',
          r4: res.result.r4 > 0 ? mm(res.result.r4).format('HH:mm') : '  -  '
        };
        resolve({ result: rUpdated });
      }).catch(err => {
        logger.error(['App > listDayReg -> Erro carregar ponto:', err]);
        reject(err);
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
          resolve({ result: newTime });
        } else {
          reject();
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
  _updateReg(data, typeReg, dateTime) {

    let rUpdated = null;

    try {
      const month = mm(dateTime).month();
      const day   = mm(dateTime).date()-1; // array apartir de 0
   
      if (typeReg == 1) {                           
        data.m[month].d[day].r.r1 = dateTime; // comeco jornada 
      }
      if (typeReg == 2) {
        data.m[month].d[day].r.r2 = dateTime; // comeco almoco
      }
      if (typeReg == 3) {
        data.m[month].d[day].r.r3 = dateTime; // fim almoco 
      }
      if (typeReg == 4) {
        data.m[month].d[day].r.r4 = dateTime; // fim jornada
      }
      rUpdated = data.m[month].d[day].r;

      return rUpdated;
    } catch (err) {
      logger.error(['App > _updateReg1 -> Erro ao registrar ponto:', err]);
    }
  }

  /**
   * Retorna ponto do dia
   * @param {number} chatId - id do usuario
   * @param {string} dateTime - Dia selecionado (format YYYY-MM-DD).
   */
  _getReg(chatId, dateTime) {
    return new Promise((resolve, reject) => {

      getRegs(chatId).then(data => {

        let regs = data.Item.regs;
        let year  = mm(dateTime).year();
        let month = mm(dateTime).month();
        let day   = mm(dateTime).date()-1; // array apartir do 0
        
        try {
          for (let i = 0; i < regs.length; i++) {
            if(regs[i].y == year){ // regs[i].y number
              let reg = {
                date: mm(dateTime).format('YYYY-MM-DD'),
                r1: regs[i].m[month].d[day].r.r1,
                r2: regs[i].m[month].d[day].r.r2,
                r3: regs[i].m[month].d[day].r.r3,
                r4: regs[i].m[month].d[day].r.r4
              };
              resolve({ result: reg });
            }
          }
        } catch(err) {
          logger.error(['App > _getReg -> Erro ao recuperar registros:', err]);
          reject(err);
        }
      }).catch(err => {
        logger.error(['App > _getReg -> Erro ao ler registros:', err]);
        reject(err);
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

  /** Converte dados dos pontos para um Array para exportação
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
                reject(err);
              }
            }
          }
        }
        
        resolve({ result: regsObj });
      } catch (err) {
        logger.error(['App > _processFileToExport -> Erro ao processar exportação:', err]);
        reject(err);
      }
    });
  }

  _readFile(fileName) {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(fileName)){
        fs.readFile(fileName, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve({ result: data });
          }
        });
      } else {
        reject();
      }
    });
  }

  /**  Escreve o xlsx no disco 
   * @param {number} chatId - id do usuario
   */
  export(chatId) {
    return new Promise((resolve, reject) => {

      const outFileName = exportDir+chatId+'.xlsx'; // arquivo a ser exportado

      getRegs(chatId).then(data => {

        // let regs = data.Item.regs;
        this._processFileToExport(data.Item.regs).then(res => { // processa arquivo json
          /* TODO criar excel em runtime */
          // file = xlsx.utils.book_new();


          const regs = res.result;
          let file = null;

          if (fs.existsSync(exportModelFileName)) {
            file = xlsx.readFile(exportModelFileName); // excel base
          } else {
            reject('App > export -> xlsx base não encontrado');
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
              this._readFile(outFileName).then(res => {
                resolve({ result: res.result });
              }).catch(err => {
                logger.error(['App > export -> Erro ao ler arquivo de exportação:', err]);
                reject(err);
              });
            });

          } catch (err) {
            logger.error(['App > export -> Erro ao gerar arquivo de exportação:', err]);
            reject(err);
          }
        }).catch(err => {
          logger.error(['App > export -> Erro ao processar exportação:', err]);
          reject(err);
        });
      }).catch(err => {
        logger.error(['App > export -> Erro ao gerar exportação(getRegs):', err]);
        reject(err);
      });
    });
  }
}

module.exports = App;