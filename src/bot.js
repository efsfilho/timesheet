process.env["NTBA_FIX_319"] = 1;

const Bot = require('node-telegram-bot-api');

const api_key = '';

const bot = new Bot(api_key, { polling: true });
const mm = require('moment');

bot.on('text', msg => {
  const chatId = msg.chat.id;
  const resp = 'lsdkhfsdlg!!!!!!AAAAAAAAAAAAA';
  // teste().then(obj => bot.sendMessage(chatId, obj)).catch(err => console.log(err));
  console.log('msg11');
});

bot.onText(/teste/, (msg) => {
  const ob = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Edit Text',
            // we shall check for this value when we listen
            // for "callback_query"
            callback_data: 'edit'
          }
        ]
      ]
    }
  };
  bot.sendMessage(msg.chat.id, 'OB: ', ob);
});

bot.onText(/\ba/, msg => {
  const chatId = msg.chat.id;
  let date = mm(msg.chat.time);
  // console.log('1 '+date)
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

  if (/<|>/.exec(action) !== null) {                      // botao avanca/retrocede mes
    updateKeyboard(action).then(key =>{
      bot.editMessageReplyMarkup(key, opts);
    }).catch(err => console.log(err));
  }

  if (/\+/.exec(action) !== null) {                       // botao dia
    getReg(action).then(key => {

      // bot.editMessageText('Selecionado: '+mm(a).format('DD-MMMM-YYYY'), opts);
      bot.editMessageText('Selecionado:  ', opts);
    }).catch(err => console.log(err));
  }
  // bot.editMessageText(text, opts);
});

bot.on('polling_error', (error) => {
  /* TODO log */
  console.log(error);  // => 'EFATAL'
});

bot.on('webhook_error', (error) => {
  /* TODO log */
  console.log(error.code);  // => 'EPARSE'
});



/* command handler*/
const getUser = msg => {                                   // objeto usuario

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
    let a = action.replace(/\+/, '');
    console.log('Selecionado: '+mm(a).format('DD-MM-YYYY'));
    readJSON
  });
}