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

  export(fileName) {

    this.readFile(fileName, (data) => {

      const baseFileName = '';

      let obj = JSON.parse(data);
      // let year = 0;
      // let month = 0;
      // let day = 0;
      let file = null;

      // if (fs.existsSync('data/'+msg.from.id+'.xlsx'))
      //   file = xlsx.readFile('data/'+msg.from.id+'.xlsx')
      // else
      //   file = xlsx.readFile('data/file.xlsx');   

      if (fs.existsSync('data/'+msg.from.id+'.xlsx')) {
        file = xlsx.readFile(baseFileName);
      } else {
        file = xlsx.readFile('default.xlsx');
      }

      try {

        for (let i = 0; i < obj.length; i++) {
          let regs = obj[i];
          let year = regs.year;
          for(let j = 0; j < regs.months.length; j++){
            let month = regs.months[j];
            month = om.month;
            for (let l = 0; l < om.days.length; l++) {
              let day = l+1;
              try {
                regs.push({
                  date: day+'/'+month+'/'+year,
                  reg: om.days[l].reg
                });
              } catch (err) {
                // bot.sendMessage(msg.chat.id, 'Ocorreu um erro: 118');
              }
            }
          }
        }

        for (var i = 0; i < regs.length; i++) {
          // console.log('A'+regs[i].reg);
          var local = 'A'+(i+1);
          addDate(file.Sheets.Plan1, local, regs[i].date);

          if (regs[i].reg.reg1 != 0) {
            local = 'B'+(i+1);
            addTime(file.Sheets.Plan1, local, regs[i].reg.reg1);
          }
          if (regs[i].reg.reg2 != 0) {
            local = 'C'+(i+1);
            addTime(file.Sheets.Plan1, local, regs[i].reg.reg2);
          }
          if (regs[i].reg.reg3 != 0) {
            local = 'D'+(i+1);
            addTime(file.Sheets.Plan1, local, regs[i].reg.reg3);
          }
          if (regs[i].reg.reg4 != 0) {
            local = 'E'+(i+1);
            addTime(file.Sheets.Plan1, local, regs[i].reg.reg4);
          }
          // addDate(file.Sheets.Plan1, local, regs[i].date);

          // console.log(regs[i].date)
          
          // // console.log(ss.Sheets.Plan1);
          // // console.log(ss.Sheets.Plan1);
        }
      } catch (err) {
        // bot.sendMessage(msg.chat.id, 'Ocorreu um erro: 118');
        throw err;
      }


    });

    
  }

}

module.exports = App;