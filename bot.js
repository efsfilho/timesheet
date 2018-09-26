process.env["NTBA_FIX_319"] = 1;

const Ntba = require('node-telegram-bot-api');
const config = require('./config/index');
const logger = require('./src/logger');
const App = require('./src/app');
const mm = require('moment');

const key = '';
const bot = new Ntba(key, { polling: true });
const app = new App(config);

const CMD_START = /\/start/;
const CMD_P1 = /^\/c1\b|^Come\ço\sde\sjornada\b/;         // /c1 comando para registro de comeco de jornada
const CMD_P2 = /^\/c2\b|^Almo\ço\b/;                      // /c2 ' ' registro de almoco
const CMD_P3 = /^\/c3\b|^Volta\sdo\salmo\ço\b/;           // /c3 ' ' registro de volta de almoco
const CMD_P4 = /^\/c4\b|^Fim\sde\sjornada\b/;             // /c4 ' ' registro de fim de jornada
const CMD_SHORTCUT = /\/atalho/;                          // /atalho
const CMD_EDIT = /\ba\b/;


/** Bot */
class Bot {

  constructor() {
    this._mainListener();                                 // inicia listener principal 
    this._startListeners();                               // inicia listeners de comandos
    this._errorHandlingListeners();                       // inicia listeners de erros
    this._shortcutMode = false;                           // flag de modo atalho
  }

  /** Listeners principais */
  _mainListener() {                                       // _mainListener nao e parado pelo _stopListeners
    bot.on('message', msg => {
      if (app.user == null) {
        let user = this._getUser(msg);
        app.syncUser(user); /* TODO Teste com mais de um usuario*/
      }
    });

    bot.onText(CMD_START, msg => {                        // /start
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'Bem vindo');
    });
  }

  /**
   * Retorna dados do usuario do telegram
   * @param {object} msg - informacoes do chat e do usuario do telegram
   * @returns {object} - objeto usuario para ser sincronizado com app.syncUser
   */
  _getUser(msg) {                                         // objeto usuario
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
      logger.error('Erro ao carregar estruturado usuario > _getUser: '+err);
    }
    return user;
  }

  /** Carrega listeners */
  _startListeners() {
    /* TODO callbacks */
    bot.onText(CMD_P1, msg => app.addReg(1, msg.date));
    bot.onText(CMD_P2, msg => app.addReg(2, msg.date));
    bot.onText(CMD_P3, msg => app.addReg(3, msg.date));
    bot.onText(CMD_P4, msg => app.addReg(4, msg.date));

    bot.onText(CMD_SHORTCUT, msg => {                     // modo atalho/comando
      const chatId = msg.chat.id;
      if (!this._shortcutMode) {
        this._shortcutMode = true;
        bot.sendMessage(chatId, 'Modo atalho', {
          reply_markup: {
            keyboard: [
              ['Começo de jornada'],
              ['Almoço'],
              ['Volta do almoço'],
              ['Fim de jornada']
            ],
            resize_keyboard: true,
          }
        });
      } else {
        this._shortcutMode = false;
        bot.sendMessage(chatId, 'Modo comando',{
          reply_markup: {
            remove_keyboard: true,        
          }
        });
      }
    });

    bot.onText(CMD_EDIT, msg => {                         // teclado calendario
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
          logger.error('Erro ao carregar teclado > _startListeners: '+err);
          this._defaultMessageError(chatId);
        }
      }).catch(err => {
        logger.error('Erro ao montar teclado > _startListeners: '+err);
        this._defaultMessageError(chatId);
      });
    });

    bot.on('callback_query', cbQuery => {                 // callbacks do calendario
      const action = cbQuery.data;
      const msg = cbQuery.message;
      const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      };
      
      if (/<|>/.exec(action) !== null) {
        this._callbackQueryKeyBoardCalendar(action, opts); // botao avanca/retrocede mes
      }
      
      if (/\+/.exec(action) !== null) {
        this._callbackQueryKeyBoardRegs(action, opts);    // botao dia
      }

      if (/\./.exec(action)) {
        this._callbackQueryUpdateReg(action, opts);       // botao registro do ponto
      }
    });
  }

  /** 
   * Mensagem de erro padrao
   * @param {number} chatId - id do chat para o envio do erro
   */
  _defaultMessageError(chatId) {
    bot.sendMessage(chatId, 'Não foi possível executar operação');
  }
  
  /**
   * Callback do botao avanca/retrocede mes
   * @param {string} cbQueryData - padrao (<|>)YYYY-MM exemplo: <2018-05
   * @param {object} opts
   * @param {number} opts.chat_id - id do chat do teclado
   * @param {number} opts.message_id - id da mensagem do teclado
   */
  _callbackQueryKeyBoardCalendar(cbQueryData, opts) {
    let srtDate = cbQueryData.replace(/<|>/g, '');        // remove char verificador
    app.mountKeyboardCalendar(mm(srtDate)).then(res => {
      if (res.ok) {
        bot.editMessageReplyMarkup({
          inline_keyboard: res.result
        }, opts);
      } else {
        this._defaultMessageError(opts.chat_id);
      }
    }).catch(err => {
      logger.error('Erro ao atualizar teclado calendario > _callbackQueryKeyBoardCalendar: '+err);
      this._defaultMessageError(opts.chat_id);
    });
  }

  /**
   * Callback do botao dia
   * @param {string} cbQueryData - padrao +YYYY-MM-DD exemplo: +2018-09-14
   * @param {object} opts
   * @param {number} opts.chat_id - id do chat do teclado
   * @param {number} opts.message_id - id da mensagem do teclado 
   */
  _callbackQueryKeyBoardRegs(cbQueryData, opts) {
    // let strDate = mm(cbQueryData.replace(/\+/, '')).format('YYYY-MM-DD');
    let strDate = cbQueryData.replace(/\+/, '')
    /* TODO fazer uma validacao decente */
    return app.mountKeyboardRegs(strDate).then(res => {
      if (res.ok) {
        bot.editMessageReplyMarkup(res.result, opts);
      } else {
        logger.info('Falha no calendario > _callbackQueryKeyBoardRegs');
        this._defaultMessageError(opts.chat_id);
      }
    }).catch(err => {
      logger.error('Erro ao carregar calendario > _callbackQueryKeyBoardRegs: '+err);
      this._defaultMessageError(opts.chat_id);
    });
  }

  /**
   * Callback do botao ponto
   * @param {string} cbQueryData - padrao .NYYYY-MM-DD (N = tipo de ponto) exemplo: .32018-09-25 (opcao 3)
   * @param {object} opts
   * @param {number} opts.chat_id - id do chat do teclado
   * @param {number} opts.message_id - id da mensagem do teclado 
   */
  _callbackQueryUpdateReg(cbQueryData, opts) {
    bot.editMessageText('Digite o novo ponto', opts);
    this._stopListeners();                                // desativa os listeners
    bot.once('message', msg => {                          // listener para pegar o novo ponto digitado 
      const date = mm(cbQueryData.replace(/\.\w/, '')).format('YYYY-MM-DD');
      const action = cbQueryData.replace(/^\./, '');
      const typeReg = /^\d/.exec(action)[0];

      /* TODO fazer uma validacao decente */
      app.updateReg(date, typeReg, msg.text).then(res => {
        if (res.ok) {
          /* TODO callback */
          bot.sendMessage(opts.chat_id, 'Ponto alterado');
        } else {
          this._defaultMessageError(opts.chat_id);
        }
        this._startListeners();                           // reativa os listesteners apos resposta do usuario
      }).catch(err => {
        logger.error('Erro ao atualizar registro de ponto > _callbackQueryUpdateReg: '+err);
        this._startListeners();                           // reativa os listesteners apos resposta do usuario
        this._defaultMessageError(opts.chat_id);
      });
    })
  }

  /** Desativa todos os listeners de comandos(iniciados no _startListeners) */
  _stopListeners() {
    /*
      Serve para escutar a resposta de uma mensagem do _callbackQueryUpdateReg, 
      porque onReplyToMessage nao funciona 
      https://github.com/yagop/node-telegram-bot-api/issues/113
    */
    bot.removeTextListener(CMD_P1);
    bot.removeTextListener(CMD_P2);
    bot.removeTextListener(CMD_P3);
    bot.removeTextListener(CMD_P4);
    bot.removeTextListener(CMD_SHORTCUT);
    bot.removeTextListener(CMD_EDIT);
    bot.removeListener('callback_query');
  }

  /** Error listeners */
  _errorHandlingListeners() {
    bot.on('polling_error', err => logger.error('Polling error - '+err));
    // bot.on('polling_error', err => logger.error(err));
    bot.on('webhook_error', err => logger.error('Webhook error - '+err));
    bot.on('error', err => logger.error(' > _errorHandlingListeners - '+err));
  }
}

new Bot();