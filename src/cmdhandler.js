
class CommandHandler {
  
  static keyBoardCalender = date => {                        // monta teclado com calendario

    return new Promise((resolve, reject) => {
      
      let prev = mm(date).subtract(1, 'month').format();    // callback query para o mes anterior
      let next = mm(date).add(1, 'month').format();         // // callback query para o proxmi mes

      // console.log('prev:'+prev+' next:'+next);
      let keyBoard = [
        [                                                   // primeira linha do teclado
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
        ],[                                                 // segunda linha
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

      getDaysInMonth(date.month()).then(days => {
        let weekCount = 6;
        let buttons = [];
        
        for (let i = 0; i < days.length; i++) {

          let cbDate = mm({                                 // callback query do dia
            year: date.year(),
            month: date.month(),
            day: days[i]
          });

          let button = {
            text: ''+days[i],
            // callback_data: ''+mm(date).day(i).format('DD/MM/YYYY')
            callback_data: days[i] === '-' ? ''+days[i] : '+'+cbDate.format()
          };

          buttons.push(button);

          if (i >= weekCount) {                             // limita a 7 colunas
            keyBoard.push(buttons);                         // adiciona terceira até a oitava linha
            weekCount += 7;
            buttons = [];
          }
        }
        return keyBoard;
      }).then(keyBoard => {
        // console.log(keyBoard)
        resolve(keyBoard);
      });

    });
  }

  static getDaysInMonth = m => {                             // retorna estrutura com os dias do mês
    return new Promise((resolve, rej) => {
      let month = Array(42);
      month.fill('-');
      let dm = mm({ month: m }).daysInMonth();              // quantidade de dias do mes
      let wd = mm({ month: m, day: 01}).weekday();          // primeiro dia da semana

      for (let i = 1; i <= dm; i++) {
        month[wd] = i;
        wd++;

        if (i == dm) {
          resolve(month);
        }
      }
    });
  }

  static updateKeyboard = (action, opts) => {                // atualiza teclado com o calendario

    /* TODO fazer uma validacao decente */
    let stringDate = action.replace(/<|>/g, '');            // filtro do < e >
    if (mm(stringDate).isValid()) {
      
      keyBoardCalender(mm(stringDate)).then(key => {
    
        bot.editMessageReplyMarkup({inline_keyboard: key}, opts);
        
      }).catch(err => console.log(err));
    } else {
      /* TODO log */
      console.log('Data invalida');
    }
  }
}

module.exports = CommandHandler;