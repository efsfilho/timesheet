const moment = require('moment');
const xlsx = require('xlsx');

const User = require('./user');
const logger = require('./logger');

const { existsFile, saveJSON, readJSON, checkDir } = require('./utils');

const modelFileName = './src/file.xlsx'; // excel fonte para exportação 

class App {

  constructor(config) {
    this.config = config;
    this.user = null;
  }

  checkDirectories() {

  }

  syncUser(userObj) {
    try {
      this.user = new User(userObj, this.config);  // verifica/add usuario e regs
    } catch (err) {
      logger.error(err);
    }
  }

  addReg(user, typeReg, newTime) {

    let userRegsFileName = this.config.userRegsLocal      // endereco com os registro do usuario
      +user.id+'.json';
    
    // TODO validacao do typeReg
    // TODO validacao do newTime
    this.updateReg(userRegsFileName, typeReg, newTime);
  }
  
  updateReg(fileName, typeReg, newTime) {

    readJSON(fileName).then(data => {
      
      try {
        /* dia, mes e ano baseado no newTime(epoch) */
        let year  = moment(newTime * 1000).format('YYYY');
        let month = moment(newTime * 1000).format('MM');
        let day   = moment(newTime * 1000).format('DD');

        for (let i = 0; i < data.length; i++) {           // conjunto de registros por ano
          if(data[i].y == year){                          // registro do ano
            if (typeReg == 1) {                           
              data[i].m[month-1].d[day-1].r.r1 = newTime; // comeco jornada 
            }
            if (typeReg == 2) {
              data[i].m[month-1].d[day-1].r.r2 = newTime; // comeco almoco
            }
            if (typeReg == 3) {
              data[i].m[month-1].d[day-1].r.r3 = newTime; // fim almoco 
            }
            if (typeReg == 4) {
              data[i].m[month-1].d[day-1].r.r4 = newTime; // fim jornada
            }
          }
        }

        saveJSON(fileName, data);

      } catch (err) {
        logger.error('Erro ao registrar ponto.');
        logger.error(err);
      }
    }).catch(err => logger.error(err));
  }

  /* Export */
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

  export() {

    if(this.user == null) {
      logger.info('Usuario não sincronizado');
      return '';
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
                throw err;
              }
            }
          }
        }
        
        return fileRegs;
      } catch (err) {
        logger.error('Erro ao processar exportação > '+err);
      }
    }).then(regs => {

      /* TODO criar excel em runtime */
      // file = xlsx.utils.book_new();

      let file = null;

      if (existsFile(modelFileName)) {
        file = xlsx.readFile(modelFileName);        // excel base
      } else {
        logger.error('xlsx base não encontrado.');
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
        logger.error('Erro ao gerar arquivo de exportação > '+err);
      }
    }).catch(err => logger.error('Erro ao gerar exportação > '+err));
  }
  /* Export */
}

module.exports = App;