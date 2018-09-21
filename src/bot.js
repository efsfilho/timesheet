process.env["NTBA_FIX_319"] = 1;

const Bot = require('node-telegram-bot-api');
const config = require('../config/index');
const App = require('./app.js');
const mm = require('moment');

const key = '';
const bot = new Bot(key, { polling: true });
const app = new App(config);

bot.on('message', msg => {
  let user = getUser(msg);
  if (app.user == null) {
    app.syncUser(user); /* TODO Teste com mais de um usuario*/
  }
});

bot.onText(/\bb/, msg => {
  bot.sendMessage(msg.chat.id, 'AAAA');
  // let a = bot.onReplyToMessage(msg.chat.id, cb => {
  //   console.log('dddd');
  //   bot.sendMessage(cb.chat.id, 'dd');
  // })
  // bot.removeReplyListener(a);
});

bot.onText(/p1/, msg => app.addReg(1, msg.date));
bot.onText(/p2/, msg => app.addReg(2, msg.date));
bot.onText(/p3/, msg => app.addReg(3, msg.date));
bot.onText(/p4/, msg => app.addReg(4, msg.date));

bot.onText(/\ba/, msg => {

  const chatId = msg.chat.id;
  let date = mm(msg.chat.time);
  // console.log('1 '+date)
  app.mountKeyboardCalendar(date).then(res => {
    if (res.ok) {
      bot.sendMessage(chatId, 'Registros: ', {
        reply_markup: {
          inline_keyboard: res.result,
          resize_keyboard: true
        }
      });
    } else {
      /* TODO else */
    }
  }).catch(err => console.log(err));
});

bot.on('callback_query', callbackQuery => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id
  };
  
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
    let stringDate = action.replace(/<|>/g, '');  
    app.mountKeyboardCalendar(mm(stringDate)).then(key => {
      bot.editMessageReplyMarkup({
        inline_keyboard: key
      }, opts);
    });

    // updateKeyboard(action).then(key => {                  // padrao +000-00-00T00:00:00-00:00
    //   bot.editMessageReplyMarkup(key, opts);
    // }).catch(err => console.log(err));
  }

  if (/\+/.exec(action) !== null) {                       // botao dia
    let date = mm(action.replace(/\+/, '')).format('YYYY-MM-DD')

    app.mountKeyboardRegs(date).then(res => {
      if (res.ok) {
        bot.editMessageReplyMarkup(res.result, opts);
      } else {
        /* TODO else */
      }
    }).catch(err => console.log(err));
  }

  if (/\./.test(action)) {                                // botao reg
    bot.editMessageText(action, opts);                    // padrao .42018-09-18
  }

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
