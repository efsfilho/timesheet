process.env["NTBA_FIX_319"] = 1;

const Bot = require('node-telegram-bot-api');
const config = require('../config/index');
const App = require('./app.js');

const api_key = '';

const bot = new Bot(api_key, { polling: true });
const mm = require('moment');
const app = new App(config);

bot.on('text', msg => {

  let user = getUser(msg);
  if (app.user == null) {
    app.syncUser(user); /* TODO Teste com mais de um usuario*/
  }

});

bot.onText(/r1/, msg => {
  console.log(msg.date)
  app.addReg(1, msg.date);
});

bot.onText(/\ba/, msg => {
  const chatId = msg.chat.id;
  let date = mm(msg.chat.time);
  console.log('1 '+date)
  keyBoardCalender(date).then(key => {
    bot.sendMessage(chatId, 'Registros: ', {
      reply_markup: {
        inline_keyboard: key,
        resize_keyboard: true
      }
    });
  }).catch(err => console.log(err));
});

bot.on('callback_query', callbackQuery => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  };

  if (action === '-') {
  }

  let text;

  if (action === 'edit') {
    text = 'Edited Text';
  }

  // switch (true) {
  //   case /<|>/.test(action):

  //     break;
  //   default:
  //     console.log(action)
  //     break;
  // }

  if (/<|>/.exec(action) !== null) {                      // botao avanca/retrocede mes
    updateKeyboard(action).then(key => {                  // padrao +000-00-00T00:00:00-00:00
      bot.editMessageReplyMarkup(key, opts);
    }).catch(err => console.log(err));
  }

  if (/\+/.exec(action) !== null) {                       // botao dia
    getReg(action).then(key => {
      bot.editMessageReplyMarkup(key, opts);
    }).catch(err => console.log(err));
  }
  if (/\./.test(action)) {                                // botao reg
    bot.editMessageText(action, opts);                    // padrao .42018-09-18
  }

  // bot.editMessageText(text, opts);
});

/* TODO on error*/
bot.on('polling_error', (error) => {
  /* TODO log */
  console.log(error);  // => 'EFATAL'
});
bot.on('webhook_error', (error) => {
  /* TODO log */
  console.log(error.code);  // => 'EPARSE'
});



/* command handler*/

const getUser = msg => {                                  // objeto usuario
  
  let user = {
    id: 0,
    username: '',
    name: '',
    bot: false,
    date: 0
  }

  try {
    if (!msg.from.is_bot) {
      user.id = msg.from.id;
      user.username = msg.from.username;
      user.name = msg.from.first_name+' '+msg.from.last_name;
      user.bot = false;
      user.date = msg.date;
    }
  } catch (err) {
    /* TODO log */
    console.log(err);
  }

  return user;
}

const keyBoardCalender = date => {                        // monta teclado com calendario

  return new Promise(resolve => {
    
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

const getDaysInMonth = month => {                         // retorna estrutura com os dias do mês
  
  return new Promise(resolve => {
    let days = Array(42);
    days.fill('-');
    let dm = mm({ month: month }).daysInMonth();          // quantidade de dias do mes
    let wd = mm({ month: month, day: 01}).weekday();      // primeiro dia da semana

    for (let i = 1; i <= dm; i++) {
      days[wd] = i;
      wd++;

      if (i == dm) {
        resolve(days);
      }
    }
  });
}

const updateKeyboard = action => {                        // atualiza teclado com o calendario

  /* TODO fazer uma validacao decente */
  let stringDate = action.replace(/<|>/g, '');            // filtro do < e >
  return new Promise(resolve => {
    if (mm(stringDate).isValid()) {
      
      keyBoardCalender(mm(stringDate)).then(key => {
        resolve({inline_keyboard: key});
      }).catch(err => console.log(err));
    } else {
      /* TODO log */
      console.log('Data invalida');
    }
  });
}

const getReg = date => {
  return new Promise(resolve => {

    let day = mm(date.replace(/\+/, '')).format('YYYY-MM-DD')
    /* TODO validar as pesquisas */
    app.getReg(day).then(data => {
      // let data = { date: '2018-09-18', r1: 1537291265, r2: 1537291265, r3: 1537291265, r4: 1537291265 }
      // console.log(data)
      var key = [[
        {
          text: data.r1 > 0 ? mm(data.r1 * 1000).format('HH:mm') : '-',
          callback_data: '.1'+data.date
        },{
          text: data.r2 > 0 ? mm(data.r2 * 1000).format('HH:mm') : '-',
          callback_data: '.2'+data.date
        },{
          text: data.r3 > 0 ? mm(data.r3 * 1000).format('HH:mm') : '-',
          callback_data: '.3'+data.date
        },{
          text: data.r4 > 0 ? mm(data.r4 * 1000).format('HH:mm') : '-',
          callback_data: '.4'+data.date
        }
      ]];
      resolve({inline_keyboard: key});
    }).catch(err => console.log(err));    
  });
}
