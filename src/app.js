const mm = require('moment');
const xlsx = require('xlsx');

const User = require('./user');
const logger = require('./logger');

const { existsFile, saveJSON, readJSON, checkDir } = require('./utils');

const modelFileName = './src/file.xlsx'; // excel fonte para exportação 

/** App */
class App {
  
  /**
   * App Constructor
   * @param {object} config - locais dos diretorios
   */
  constructor(config) {
    this.config = config;
    this.user = null;
    this.checkDirectories();
  }

  /** Garante a existencia dos diretorios padrão  */
  checkDirectories() {
    try {
      checkDir(this.config.logLocal);                     // verifica local do log
      checkDir(this.config.userIndexLocal);               // verifica local do arquivo do usuario
      checkDir(this.config.userRegsLocal);                // verifica local dos registros do usuario
      checkDir(this.config.exportLocal);
    } catch (err) {
      logger.error('Diretorios padrão não criados > checkDirectories: '+err);
    }
  }
  
  /**
   * Registra o usuario para outras operacoes
   * @param {object} userObj - usuario
   * @param {number} userObj.id - id do contato
   * @param {string} userObj.username - username do contato
   * @param {number} userObj.name - nomde do contato
   * @param {boolean} userObj.bot
   * @param {number} userObj.date - data do chat
   */
  syncUser(userObj) {
    try {
      this.user = new User(userObj, this.config);         // verifica/add usuario e regs
    } catch (err) {
      this.user = null;
      logger.error('Erro ao sincronizar usuario > '+err);
    }
  }

  /**
   * Monta teclado calendario
   * @param {number} date - unix timestamp
   */
  mountKeyboardCalendar(date) {
    return new Promise((resolve, reject) => {

      let prev = mm(date).subtract(1, 'month').format('YYYY-MM');  // callback query para o mes anterior
      let next = mm(date).add(1, 'month').format('YYYY-MM');       // callback query para o proximo mes

      let keyBoard = [
        [                                                 // primeira linha do teclado
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
        ],[                                               // segunda linha
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
      
              // let cbDate = mm({                               // callback query do dia
              //   year: date.year(),
              //   month: date.month(),
              //   day: days[i]
              // });
              
              let button = {
                text: ''+days[i],
                callback_data: ''
                // callback_data: days[i] === '-' ? ''+days[i] : '+'+cbDate.format()
              };

              if (days[i] === '-') {
                button.callback_data = ''+days[i];
              } else {
                button.callback_data = '+'+mm({           // callback query do dia
                  year: date.year(),
                  month: date.month(),
                  day: days[i]
                }).format('YYYY-MM-DD');                  // padrao callbackQuery +YYYY-MM-DD
              }
      
              buttons.push(button);
      
              if (i >= weekCount) {                       // limita a 7 colunas
                keyBoard.push(buttons);                   // adiciona terceira até a oitava linha
                weekCount += 7;
                buttons = [];
              }
            }
            resolve({
              ok: true,
              result: keyBoard
            });
          } catch (err) {
            logger.error('Erro ao montar botoes > mountKeyboardCalendar: '+err);
            reject({ ok: false });
          }
        }
      }).catch(err => {
        logger.error('Erro ao montar botoes > mountKeyboardCalendar: '+err);
        reject({ ok: false });
      });
  
    });
  }
  
  /**
   * Retorna array com os botoes dos dias (titulos e callbacks)
   * @param {number} month - mes do calendario exibido
   */
  _getDayButtons(month) {                                 // retorna estrutura com os dias do mês
    return new Promise((resolve, reject) => {
      try {      
        let days = Array(42);
        days.fill('-');
        let dm = mm({ month: month }).daysInMonth();          // quantidade de dias do mes
        let wd = mm({ month: month, day: 1}).weekday();      // primeiro dia da semana
    
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
        logger.error('Erro ao gerar teclado com registros > mountKeyboardRegs: '+JSON.stringify(err));
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
      if (this.user == null) {                              // verifica usuario
        logger.error('addReg Usuario não sincronizado > addReg');
        reject({ok: false});
      } else {
        // TODO validacao do typeReg
        // TODO validacao do newTime
        this._updateReg(typeReg, newTime* 1000).then(res => {
          if (res.ok) {
            resolve({
              ok: true,
              result: res.result
            });
          } else {
            reject({ ok: false });
          }
        }).catch(err => {
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

        const newTime = mm(date+' '+strNewTime);
        if (newTime.isValid()) {
          this._updateReg(typeReg, newTime.unix()*1000 ).then(res => {
            if (res.ok) {
              resolve({ ok: true });
            } else {
              reject({ ok: false });
            }
          }).catch(err => {
            // TODO log?
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
   * Atualiza ponto
   * @param {number} typeReg - tipo reg (1, 2, 3 ou 4)
   * @param {number} dateTime - unix timestamp
   */
  _updateReg(typeReg, dateTime) {

    let fileName = this.config.userRegsLocal              // endereco com os registro do usuario
      +this.user.id+'.json';

    return new Promise((resolve, reject) => {
      readJSON(fileName).then(data => {

        try {
          let year  = mm(dateTime).year();
          let month = mm(dateTime).month();
          let day   = mm(dateTime).date()-1;                // array apartir de 0
  
          for (let i = 0; i < data.length; i++) {           // conjunto de registros por ano
            if(data[i].y == year){                          // registro do ano
              if (typeReg == 1) {                           
                data[i].m[month].d[day].r.r1 = dateTime;    // comeco jornada 
              }
              if (typeReg == 2) {
                data[i].m[month].d[day].r.r2 = dateTime;    // comeco almoco
              }
              if (typeReg == 3) {
                data[i].m[month].d[day].r.r3 = dateTime;    // fim almoco 
              }
              if (typeReg == 4) {
                data[i].m[month].d[day].r.r4 = dateTime;    // fim jornada
              }
            }
          }
  
          saveJSON(fileName, data).then(res => {
            if (res.ok) {
              resolve({
                ok: true,
                result: mm(dateTime).format()             // retorno do ponto atualizado
              });
            } else {
              reject({ ok: false });
            }
          }).catch(err => {
            logger.error('Erro ao salvar registro de ponto > updateReg: '+err);
            reject({ ok: false });
          });

        } catch (err) {
          logger.error('Erro ao registrar ponto > updateReg: '+err);
          reject({ ok: false });
        }
      }).catch(err => {
        logger.error('Erro ao ler ponto > updateReg: '+err);
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

      if (this.user == null) {                            // verifica usuario
        logger.error('getReg Ususario não sincronizado > getReg');
        reject({ ok: false });
      }

      let userRegsFileName = this.config.userRegsLocal
        +this.user.id+'.json';
      
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
              }
              resolve({
                ok: true,
                result: reg
              });
            }
          }
        } catch(err) {
          logger.error('Erro ao recuperar registros > getReg: '+err);
          reject({ ok: false });
        }
      }).catch(err => {
        logger.error('Erro ao ler registros > getReg: '+err);
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
  
    let h = mm(time*1000).hours();                        // *1000 correcao do epoch
    let m = mm(time*1000).minutes();
    let f = mm(time*1000).format('HH:mm');
    // for (let i = 0; i < h; i++){
    //   m = m + 60; // por hora
    // }
    // m = m/1440; // min 24 horas
  
    let cell = {
      t:'s',                                              // s = number format
      // v: m,
      v: f
    };
    
    worksheet[address] = cell;                            // adiciona na celula
  
    let range = xlsx.utils.decode_range(worksheet['!ref']);
    let addr = xlsx.utils.decode_cell(address);
  
    if(range.s.c > addr.c) range.s.c = addr.c;
    if(range.s.r > addr.r) range.s.r = addr.r;
    if(range.e.c < addr.c) range.e.c = addr.c;
    if(range.e.r < addr.r) range.e.r = addr.r;
  
    worksheet['!ref'] = xlsx.utils.encode_range(range);
  }

  /**  Escreve o xlsx no disco */
  export() {

    if(this.user == null) {                               // verifica usuario
      logger.info('Usuario não sincronizado > export');
      return;
    }

    const baseFileName = this.config.userRegsLocal
        +this.user.id+'.json';                            // registros do usuario

    const outFileName = this.config.exportLocal
        +this.user.id+'.xlsx';                            // arquivo a ser exportado

    readJSON(baseFileName).then(data => {

      let obj = data;
      let year = 0;
      let month = 0;
      let day = 0;
      let fileRegs = [];

      try {
        for (let i = 0; i < obj.length; i++) {
          let objYear = obj[i];
          year = objYear.y;
          for(let j = 0; j < objYear.m.length; j++){
            let objMonth = objYear.m[j];
            month = objMonth.m;
            for (let l = 0; l < objMonth.d.length; l++) {
              day = l+1;
              try {
                fileRegs.push({
                  date: day+'/'+month+'/'+year,
                  reg: objMonth.d[l].r
                });
              } catch (err) {
                logger.error('Erro ao ler registros > export: '+err);
              }
            }
          }
        }
        
        return fileRegs;
      } catch (err) {
        logger.error('Erro ao processar exportação > export: '+err);
      }
    }).then(regs => {

      /* TODO criar excel em runtime */
      // file = xlsx.utils.book_new();

      let file = null;

      if (existsFile(modelFileName)) {
        file = xlsx.readFile(modelFileName);              // excel base
      } else {
        logger.error('xlsx base não encontrado > export');
        return;
      }

      try {
        for (let i = 0; i < regs.length; i++) {
          this._addDate(file.Sheets.Plan1, 'A'+(i+1), regs[i].date);
          regs[i].reg.r1 != 0 ? this._addTime(file.Sheets.Plan1, 'B'+(i+1), regs[i].reg.r1) : ''
          regs[i].reg.r2 != 0 ? this._addTime(file.Sheets.Plan1, 'C'+(i+1), regs[i].reg.r2) : ''
          regs[i].reg.r3 != 0 ? this._addTime(file.Sheets.Plan1, 'D'+(i+1), regs[i].reg.r3) : ''
          regs[i].reg.r4 != 0 ? this._addTime(file.Sheets.Plan1, 'E'+(i+1), regs[i].reg.r4) : ''
        }
        
        xlsx.writeFile(file, outFileName);
        logger.info('Arquivo exportado por id: '+this.user.id+' - '+this.user.username);

      } catch (err) {
        logger.error('Erro ao gerar arquivo de exportação > export: '+err);
      }
    }).catch(err => logger.error('Erro ao gerar exportação > export: '+err));
  }
}

module.exports = App;