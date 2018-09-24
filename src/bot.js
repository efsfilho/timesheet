process.env["NTBA_FIX_319"] = 1;

const Ntba = require('node-telegram-bot-api');
const config = require('../config/index');
const logger = require('./logger');
const App = require('./app');
const mm = require('moment');

const key = '';
const bot = new Ntba(key, { polling: true });
const app = new App(config);

bot.on('message', msg => {
  if (app.user == null) {
    let user = getUser(msg);
    app.syncUser(user); /* TODO Teste com mais de um usuario*/
  }
});

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

bot.onText(/p/, msg => {
  console.log(this)
  // this._stopEvents();
});

bot.onText(/e/, msg => {
  console.log(bot.eventNames())
  // bot.once('message', msg => {
    //   this.test();
    // });
});

const p1 = /p1/;
const p2 = /p2/;
const p3 = /p3/;
const p4 = /p4/;
const a = /\ba/;

class Bot {

  constructor() {
    this._startEvents();
    this._errorHandlingEvents();
  }

  _stopEvents() {
    bot.removeTextListener(p1);
    bot.removeTextListener(p2);
    bot.removeTextListener(p3);
    bot.removeTextListener(p4);
    bot.removeTextListener(a);
    bot.removeListener('callback_query');                 // porque _defaltEvents o adicionara novamente
  }

  _startEvents() {
    bot.onText(p1, msg => app.addReg(1, msg.date));
    bot.onText(p2, msg => app.addReg(2, msg.date));
    bot.onText(p3, msg => app.addReg(3, msg.date));
    bot.onText(p4, msg => app.addReg(4, msg.date));

    bot.onText(a, msg => {                                // teclado calendario
      const chatId = msg.chat.id;
      const date = mm(msg.chat.time);

      app.mountKeyboardCalendar(date).then(res => {
        if (res.ok) {
          bot.sendMessage(chatId, 'Escolha o dia: ', {
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

    bot.on('callback_query', callbackQuery => {           // callbacks do calendario
      const action = callbackQuery.data;
      const msg = callbackQuery.message;
      const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      };
      
      if (/<|>/.exec(action) !== null) {                  // botao avanca/retrocede mes
        let srtDate = action.replace(/<|>/g, '');         // remove char verificador
        app.mountKeyboardCalendar(mm(srtDate)).then(res => {
          if (res.ok) {
            bot.editMessageReplyMarkup({
              inline_keyboard: res.result
            }, opts);
          } else {
            // TODO else
          }
        });
      }

      if (/\+/.exec(action) !== null) {                   // botao dia
        let date = mm(action.replace(/\+/, '')).format('YYYY-MM-DD');
        app.mountKeyboardRegs(date).then(res => {
          if (res.ok) {
            bot.editMessageReplyMarkup(res.result, opts);
          } else {
            /* TODO else */
          }
        }).catch(err => console.log(err));
      }

      if (/\./.test(action)) {                            // botao reg
        // bot.editMessageText(action, opts);
        bot.editMessageText('Novo ponto:', opts);
        this._stopEvents();
        bot.once('message', msg => {
          /* TODO validar data para app._updateReg*/
          /* TODO merge addReg com _updateReg */
          console.log('TEST TEXT: '+msg.text)
          this._startEvents();
        });
      }
    });
  }

  _errorHandlingEvents() {
    bot.on('polling_error', (error) => {
      /* TODO log */
      console.log(error);  // => 'EFATAL'
    });
    bot.on('webhook_error', (error) => {
      /* TODO log */
      console.log(error.code);  // => 'EPARSE'
    });
    bot.on('error', err => {
      console.log(err);
    })
  }
}

module.exports = new Bot();