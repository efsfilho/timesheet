process.env["NTBA_FIX_319"] = 1;

const Bot = require('node-telegram-bot-api');
const { keyBoardCalender, } = require('./cmdhandler');
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

  if (/<|>/.exec(action) !== null) {
    updateKeyboard(action, opts);                         // botao avanca/retrocede mes
  }

  if (/\+/.exec(action) !== null) {                       // botao dia
    let a = action.replace(/\+/, '');
    console.log('Selecionado: '+mm(a).format('DD-MM-YYYY'));
    bot.editMessageText('Selecionado: '+mm(a).format('DD-MMMM-YYYY'), opts);
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

