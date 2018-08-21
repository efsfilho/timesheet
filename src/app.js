const fs     = require('fs');
const moment = require('moment');
const xlsx   = require('xlsx');

class App {

  createStructure(id) {
    /* estrutura json com os registros */
    id = id || 0;

    let months = [];
    let days = [];
    let dayMonth = 0;

    for (let i = 0; i < 12; i++) {
      dayMonth = moment({month: i}).daysInMonth(); // quantidade de dias do mes

      for (let l = 1; l <= dayMonth; l++) {
        days.push({
          d: l,     // dia
          r: {      // registros do dia
            r1: 0,  // primeiro registro
            r2: 0,  // segundo
            r3: 0,
            r4: 0   // ultimo
          }
        });
      }

      months.push({
        m: moment({month: i}).format('MM'), // mês i
        d: days
      });

      days = [];
    }

    let regStructure = [{
      y: moment().format('YYYY'),  // ano atual
      c: moment().format(),      // data/hora atual
      id: id,
      m: months
    }];

    return regStructure;
  }

  saveJSON(file, fileName) {
    /* TODO passar para um banco*/
    if (!this.existsFile(nomeFile)) {
      this.saveFile(file, fileName);
    } else {
      
    }
  }

  existsFile(fileName) {
    return fs.existsSync(fileName, (err) => {
      if (err) throw err;
    });
  }

  saveFile(file, fileName) {
    fs.writeFile(fileName, JSON.stringify(file), (err) => {
      if (err) throw err;
    });
  }

  readFile(fileName, callb) {
    if (this.existsFile(fileName)) {
      fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) throw err;
        callb(data);
      });
    }
  }

  saveReg(fileName, typeReg, newTime) {

    this.readFile(fileName, (data) => {
      
      let obj =   JSON.parse(data);
      let year =  moment(newTime * 1000).format('YYYY');
      let month = moment(newTime * 1000).format('MM');
      let day =   moment(newTime * 1000).format('DD');

      try {
        for (let i = 0; i < obj.length; i++) {
          if(obj[i].y == year){
            if (typeReg == 1) {
              obj[i].m[month-1].d[day-1].r.r1 = newTime;
            }
            if (typeReg == 2) {
              obj[i].m[month-1].d[day-1].r.r2 = newTime;
            }
            if (typeReg == 3) {
              obj[i].m[month-1].d[day-1].r.r3 = newTime;
            }
            if (typeReg == 4) {
              obj[i].m[month-1].d[day-1].r.r4 = newTime;
            }
          }
        }
      } catch (err) {
        throw err;
      }
      this.saveFile(obj, fileName);
    });
  }

  addTime(worksheet, address, time) {
  
    let h = moment(time*1000).hours(); // *1000 correcao do timestamp unix
    let m = moment(time*1000).minutes();
    let f = moment(time*1000).format('HH:mm');
    for (let i = 0; i < h; i++){
      m = m + 60; // por hora
    }
  
    m = m/1440; // min 24 horas
  
    /* cell object */
    let cell = {
      t:'s', // numero
      // v: m,
      v: f// string
    };
  
    // D5: { t: 'n', v: 0.7791666666666667, w: '18:42' },
    /* assign type */
    // if(typeof value == "string") cell.t = 's'; // string
    // else if(typeof value == "number") cell.t = 'n'; // number
    // else if(value === true || value === false) cell.t = 'b'; // boolean
    // else if(value instanceof Date) cell.t = 'd';
    // else throw new Error("cannot store value");
  
    /* add to worksheet, overwriting a cell if it exists */
    worksheet[address] = cell;
  
    /* find the cell range */
    let range = xlsx.utils.decode_range(worksheet['!ref']);
    let addr = xlsx.utils.decode_cell(address);
    // console.log(range);
    // console.log(addr);
  
    /* extend the range to include the new cell */
    if(range.s.c > addr.c) range.s.c = addr.c;
    if(range.s.r > addr.r) range.s.r = addr.r;
    if(range.e.c < addr.c) range.e.c = addr.c;
    if(range.e.r < addr.r) range.e.r = addr.r;
  
    /* update range */
    worksheet['!ref'] = xlsx.utils.encode_range(range);
  }
  
  addDate(worksheet, address, date) {
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

  export(fileName) {

    this.readFile(fileName, (data) => {

      const baseFileName = './file.xlsx';
      const outFileName = './out.xlsx';

      let obj = JSON.parse(data);
      let year = 0;
      let month = 0;
      let day = 0;
      let fileRegs = [];
      let file = null;

      if (fs.existsSync(baseFileName)) {
        file = xlsx.readFile(baseFileName);
      } else {
        file = xlsx.readFile('default.xlsx');
      }

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
        
        for (let i = 0; i < fileRegs.length; i++) {

          this.addDate(file.Sheets.Plan1, 'A'+(i+1), fileRegs[i].date);

          fileRegs[i].reg.r1 != 0 ? this.addTime(file.Sheets.Plan1, 'B'+(i+1), fileRegs[i].reg.r1) : ''          
          fileRegs[i].reg.r2 != 0 ? this.addTime(file.Sheets.Plan1, 'C'+(i+1), fileRegs[i].reg.r2) : ''
          fileRegs[i].reg.r3 != 0 ? this.addTime(file.Sheets.Plan1, 'D'+(i+1), fileRegs[i].reg.r3) : ''
          fileRegs[i].reg.r4 != 0 ? this.addTime(file.Sheets.Plan1, 'E'+(i+1), fileRegs[i].reg.r4) : ''
        }

        xlsx.writeFile(file, outFileName);

      } catch (err) {
        throw err;
      }
    });
  }
}

module.exports = App;