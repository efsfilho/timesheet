const fs     = require('fs');
const moment = require('moment');

class App {

  criaEstrutura(id){
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

  salvaJSON(file, nomeFile) {
    /* TODO passar para um banco*/
    fs.writeFile(nomeFile, JSON.stringify(file), (err) => {
      if (err) {
        throw err;
      }
    });
  }
}

module.exports = App;