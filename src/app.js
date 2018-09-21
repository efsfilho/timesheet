const moment = require('moment');
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
   * Adiciona registro de ponto
   * @param {number} typeReg - tipo de registro (1,2,3 ou 4)
   * @param {number} newTime - epoch
   */
  addReg(typeReg, newTime) {
    if (this.user == null) {                              // verifica usuario
      logger.error('addReg Usuario não sincronizado > addReg');
    } else {
      let userRegsFileName = this.config.userRegsLocal    // endereco com os registro do usuario
        +this.user.id+'.json';
    
      // TODO validacao do typeReg
      // TODO validacao do newTime
      // TODO registrar log
      this.updateReg(userRegsFileName, typeReg, newTime* 1000);
    }
  }

  /**
   * Atualiza ponto
   * @param {string} fileName - nome do arquivo dos registros
   * @param {number} typeReg - tipo reg (1, 2, 3 ou 4)
   * @param {number} dateTime 
   */
  updateReg(fileName, typeReg, dateTime) {

    readJSON(fileName).then(data => {
      
      try {
        let year  = moment(dateTime).year();
        let month = moment(dateTime).month();
        let day   = moment(dateTime).date()-1;            // array apartir de 0

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

        saveJSON(fileName, data); //.then(a => console.log(a));
        /* TODO retorno de sucesso */
      } catch (err) {
        logger.error('Erro ao registrar ponto > updateReg: '+err);
      }
    }).catch(err => logger.error('Erro ao ler ponto > updateReg: '+err));
  }

  /**
   * Retorna ponto do dia
   * @param {string} dateTime - Dia selecionado (format YYYY-MM-DD).
   */
  getReg(dateTime) {
    return new Promise((resolve, reject) => {

      if (this.user == null) {                            // verifica usuario
        logger.error('getReg Ususario não sincronizado > getReg');
        reject({
          ok: false,
          message: 'Usuário não sincronizado'
        });
      }

      let userRegsFileName = this.config.userRegsLocal
        +this.user.id+'.json';
      
      readJSON(userRegsFileName).then(data => {

        let year  = moment(dateTime).year();
        let month = moment(dateTime).month();
        let day   = moment(dateTime).date()-1;            // array apartir do 0
        
        try {
          for (let i = 0; i < data.length; i++) {
            if(data[i].y == year){                        // data[i].y string
              let reg = {
                date: moment(dateTime).format('YYYY-MM-DD'),
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
        }
      }).catch(err => logger.error('Erro ao ler registros > getReg: '+err))
    });
  }

  /**
   * Cria data no xlsx
   * @param {object} worksheet - worksheet do xlsx
   * @param {string} address - endereco da celula do worksheet
   * @param {string} date - data do ponto
   */
  addDate(worksheet, address, date) {
    
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
  addTime(worksheet, address, time) {
    
    /* Adiciona tempo nas celulas */
  
    let h = moment(time*1000).hours();          // *1000 correcao do epoch
    let m = moment(time*1000).minutes();
    let f = moment(time*1000).format('HH:mm');
    // for (let i = 0; i < h; i++){
    //   m = m + 60; // por hora
    // }
    // m = m/1440; // min 24 horas
  
    let cell = {
      t:'s',    // format numero
      // v: m,
      v: f      // format string
    };
    
    worksheet[address] = cell;  // adiciona na celula
  
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
        file = xlsx.readFile(modelFileName);        // excel base
      } else {
        logger.error('xlsx base não encontrado > export');
        return;
      }

      try {
        for (let i = 0; i < regs.length; i++) {
          this.addDate(file.Sheets.Plan1, 'A'+(i+1), regs[i].date);
          regs[i].reg.r1 != 0 ? this.addTime(file.Sheets.Plan1, 'B'+(i+1), regs[i].reg.r1) : ''
          regs[i].reg.r2 != 0 ? this.addTime(file.Sheets.Plan1, 'C'+(i+1), regs[i].reg.r2) : ''
          regs[i].reg.r3 != 0 ? this.addTime(file.Sheets.Plan1, 'D'+(i+1), regs[i].reg.r3) : ''
          regs[i].reg.r4 != 0 ? this.addTime(file.Sheets.Plan1, 'E'+(i+1), regs[i].reg.r4) : ''
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