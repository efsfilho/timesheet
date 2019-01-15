process.env['NTBA_FIX_319'] = 1; // Deprecated issue https://github.com/yagop/node-telegram-bot-api/issues/319
process.env['NTBA_FIX_350'] = 1; // Deprecated issue https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files

const Ntba = require('node-telegram-bot-api');
const config = require('./config/index');
const logger = require('./src/logger');
const App = require('./src/app');
const mm = require('moment');
mm.locale('pt-BR');

const key = '';
const bot = new Ntba(key, { polling: true });

const CMD = {
  START: /\/start/,
  P1: /^\/c1\b|^Começo\sde\sjornada\b/,   // /c1  - comando para registro de comeco de jornada
  P2: /^\/c2\b|^Almoço\b/,                // /c2  - ' ' registro de almoco
  P3: /^\/c3\b|^Volta\sdo\salmoço\b/,     // /c3  - ' ' registro de volta de almoco
  P4: /^\/c4\b|^Fim\sde\sjornada\b/,      // /c4  - ' ' registro de fim de jornada
  SHORTCUT: /\/atalho/,                   // /atalho
  EDIT: /\/editar\b|^Editar\spontos\b/,
  EXPT: /\/exp/,                       // comando para exportar excel
  LIST: /\/list/                          // /list - listar pontos do dia
};

bot.onText(/eco/, msg => {
  logger.debug('eco');
  bot.sendMessage(msg.chat.id, 'eco');
});

/** Bot */
class Bot {

  constructor() {
    this._app = new App(config);
    this._app.init();
    /* inicia listener que sincroniza usuario */
    this._mainListener();
    /* inicia listeners de comandos */
    this._startListeners();
    /*  listeners de erro */
    this._errorHandlingListeners();
    /* flag de modo atalho */
    this._shortcutMode = false;
    /* usuarios da sessao */
    this.users = [];
  }

  /** Listeners principais */
  _mainListener() {
    bot.onText(/usr/, () => console.log(this._app._users));
    /* Listener que sincroniza o usuario */
    bot.on('message', msg => {
      this._app.setUser(this._getUser(msg));
    });

    /* Listener start commando */
    bot.onText(CMD.START, msg => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'Bem vindo');
    });
  }

  /**
   * Retorna dados do usuario do telegram
   * @param {object} msg - informacoes do chat e do usuario do telegram
   * @returns {object} - objeto usuario para ser sincronizado com this._app.syncUser
   */
  _getUser(msg) {
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
        user.username = msg.from.username || '';
        user.name = msg.from.first_name+' '+(msg.from.last_name || '');
        user.bot = false;
        user.date = msg.date;
      }
    } catch (err) {
      logger.error('Bot > _getUser -> Erro ao carregar estruturado usuario: '+err);
      return null;
    }
    return user;
  }

  /** Listeners dos comandos */
  _startListeners() {

    /* Listener para comeco de jornada */
    bot.onText(CMD.P1, msg => {
      const chatId = msg.chat.id;
      const date = mm(msg.chat.time);
      let textMsg = msg.text.replace(CMD.P1, '');
      textMsg = textMsg.replace(CMD.P1, '');
      textMsg = textMsg.replace(new RegExp(/\s/, 'g'), '');
      
      if (textMsg !== '') {
        let strDate = date.format('YYYY-MM-DD');
        
        /* para tempo digitado ex /C1 1010 */
        this._app.getTimeFromString(textMsg).then(time => {
          if (time.ok) {
            let newTime = mm(strDate+' '+time.result);
            this._commandReg(chatId, 1, newTime.unix());
          } else {
            this._defaultMessageError(chatId);
          }
        }).catch(err => {
          logger.error('Bot > _startListeners -> onText(CMD.P1) Erro ao atualizar registro de ponto: '+err);
          this._defaultMessageError(chatId);
        });
      } else {
        this._commandReg(chatId, 1, msg.date);
      }
    });

    /* Listener saida para almoco */
    bot.onText(CMD.P2, msg => {
      const chatId = msg.chat.id;
      const date = mm(msg.chat.time);
      let textMsg = msg.text.replace(CMD.P2, '');
      textMsg = textMsg.replace(CMD.P2, '');
      textMsg = textMsg.replace(new RegExp(/\s/, 'g'), '');
      
      if (textMsg !== '') {
        let strDate = date.format('YYYY-MM-DD');
        
        /* para tempo digitado ex /C1 1010 */
        this._app.getTimeFromString(textMsg).then(time => {
          if (time.ok) {
            let newTime = mm(strDate+' '+time.result);
            this._commandReg(chatId, 2, newTime.unix());
          } else {
            this._defaultMessageError(chatId);
          }
        }).catch(err => {
          logger.error('Bot > _startListeners -> onText(CMD.P2) Erro ao atualizar registro de ponto: '+err);
          this._defaultMessageError(chatId);
        });
      } else {
        this._commandReg(chatId, 2, msg.date);
      }
    });

    /* Listener para chegada do almoco */
    bot.onText(CMD.P3, msg => {
      const chatId = msg.chat.id;
      const date = mm(msg.chat.time);
      let textMsg = msg.text.replace(CMD.P3, '');
      textMsg = textMsg.replace(CMD.P3, '');
      textMsg = textMsg.replace(new RegExp(/\s/, 'g'), '');
      
      if (textMsg !== '') {
        let strDate = date.format('YYYY-MM-DD');
        
        /* para tempo digitado ex /C1 1010 */
        this._app.getTimeFromString(textMsg).then(time => {
          if (time.ok) {
            let newTime = mm(strDate+' '+time.result);
            this._commandReg(chatId, 3, newTime.unix());
          } else {
            this._defaultMessageError(chatId);
          }
        }).catch(err => {
          logger.error('Bot > _startListeners -> onText(CMD.P3) Erro ao atualizar registro de ponto: '+err);
          this._defaultMessageError(chatId);
        });
      } else {
        this._commandReg(chatId, 3, msg.date);
      }
    });
    
    /* Listener para fim de jornada */
    bot.onText(CMD.P4, msg => {
      const chatId = msg.chat.id;
      const date = mm(msg.chat.time);
      let textMsg = msg.text.replace(CMD.P4, '');
      textMsg = textMsg.replace(CMD.P4, '');
      textMsg = textMsg.replace(new RegExp(/\s/, 'g'), '');
      
      if (textMsg !== '') {
        let strDate = date.format('YYYY-MM-DD');
        
        /* para tempo digitado ex /C1 1010 */
        this._app.getTimeFromString(textMsg).then(time => {
          if (time.ok) {
            let newTime = mm(strDate+' '+time.result);
            this._commandReg(chatId, 4, newTime.unix());
          } else {
            this._defaultMessageError(chatId);
          }
        }).catch(err => {
          logger.error('Bot > _startListeners -> onText(CMD.P4) Erro ao atualizar registro de ponto: '+err);
          this._defaultMessageError(chatId);
        });
      } else {
        this._commandReg(chatId, 4, msg.date);
      }
    });

    /* Listener para mudar teclado (lista de comando/botoes ) */
    bot.onText(CMD.SHORTCUT, msg => {
      const chatId = msg.chat.id;
      if (!this._shortcutMode) {
        this._shortcutMode = true;
        bot.sendMessage(chatId, 'Modo atalho', {
          reply_markup: {
            keyboard: [
              ['Começo de jornada'],
              ['Almoço'],
              ['Volta do almoço'],
              ['Fim de jornada'],
              ['Editar pontos']
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

    /* Listener botoes editar pontos */
    bot.onText(CMD.EDIT, msg => {
      const date = mm(msg.chat.time);
      const strDate = date.format('YYYY-MM-DD');
      const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      }

      this._app.mountKeyboardRegs(strDate).then(res => {
        if (res.ok) {
          let inlineKb = res.result.inline_keyboard[0].slice();
          inlineKb.push({ text: 'Pontos', callback_data: '*'+date.format('YYYY-MM') });

          bot.sendMessage(opts.chat_id, ''+date.format('LL')+'', {
            reply_markup: {
              inline_keyboard: [inlineKb],
              resize_keyboard: true
            }
          });
        } else {
          logger.info('Bot > _startListeners > onText(CMD_EDIT) -> Erro ao carregar botoes do ponto:');
          this._defaultMessageError(opts.chat_id);
        }
      }).catch(err => {
        logger.error('Bot > _startListeners > onText(CMD_EDIT) -> Erro ao carregar ponto: '+err);
        this._defaultMessageError(opts.chat_id);
      });
    });

    /* Listener exibe registros do dia */
    bot.onText(CMD.LIST, msg => {
      const chatId = msg.chat.id;
      const date = mm(msg.chat.time);

      this._app.listDayReg(date.format('YYYY-MM-DD')).then(res => {
        if (res.ok) {
          let r = {
            r1: res.result.r1,
            r2: res.result.r2,
            r3: res.result.r3,
            r4: res.result.r4
          }

          let replyMsg = ''+
            ' Ponto de '+date.format('LL')+'\n'+
            '  '+r.r1+'  |  '+r.r2+'  |  '+r.r3+'  |  '+r.r4;

          bot.sendMessage(chatId, replyMsg);
        } else {
          logger.error('Bot > _startListeners > onText(CMD_LIST) -> Erro ao carregar ponto: '+err);
          this._defaultMessageError(chatId);
        }
      }).catch(err => {
        logger.error('Bot > _startListeners > onText(CMD_LIST) -> Erro ao carregar ponto: '+err);
        this._defaultMessageError(chatId);
      });
    });

    /* Listener que recebe as acoes dos botoes */
    bot.on('callback_query', cbQuery => {
      const action = cbQuery.data;
      const msg = cbQuery.message;
      const date = cbQuery.message.date;
      const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      };

      /* acao dos botao editar(que chama o calendario) */
      if (/\*/.exec(action) !== null) {
        /* formato do action: *YYYY-MM exemplo: *2018-05 */
        this._callbackQueryKeyBoardCalendar(action, opts);
      }

      /* acao dos botoes avanca/retrocede mes (dentro do calendario) */
      if (/<|>/.exec(action) !== null) {
        /* formato do action: (<,>)YYYY-MM exemplo: <2018-05 */
        this._callbackQueryUpdateKeyBoardCalendar(action, opts);
      }
      
      /* acao dos botoes dos dias (dentro do calendario) */
      if (/\+/.exec(action) !== null) {
        /* formato do action: +YYYY-MM-DD exemplo: +2018-09-14 */
        this._callbackQueryKeyBoardRegs(action, date, opts);
      }

      /* acao doa botoes dos 4 registros do ponto(para editar os pontos) */
      if (/\./.exec(action)) {
        /* formato do action: .NYYYY-MM-DD ex: .32018-09-25 */
        this._callbackQueryUpdateReg(action, opts);
      }
    });

    /* Listener com comando para exportar folha */
    bot.onText(CMD.EXPT, msg => {
      const chatId = msg.chat.id;
      this._app.export().then(res => {
        if (res.ok) {
          const fileName = mm(msg.date*1000).format('DDMMYYYYHHmmss')+'.xlsx';
          bot.sendDocument(chatId, res.result, {}, { 
            filename: fileName,
            contentType: 'this._application/octet-stream'
            /* https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files */
          });
        } else {
          logger.error('Bot > _startListeners > onText(CMD_EXPT) -> Erro ao exportar arquivo: '+err);
          this._defaultMessageError(chatId);
        }
      }).catch(err => {
        logger.error('Bot > _startListeners > onText(CMD_EXPT) -> Erro ao exportar arquivo: '+err);
        this._defaultMessageError(chatId);
      })
    });
  }


  _commandReg(chatId, typeReg, newTime) {
    this._app.addReg(typeReg, newTime).then(res => {
      if (res.ok) {
        let replyMsg = this._defaultMessageUpdateReg(res.result, typeReg, newTime);
        bot.sendMessage(chatId, replyMsg);
      } else {
        this._defaultMessageError(chatId);
      }
    }).catch(err => {
      logger.error('Bot > _commandReg -> Erro ao registrar ponto : '+err);
      this._defaultMessageError(chatId);
    });
  }


  /**
   * Callback do botao avanca/retrocede mes(atualiza calendario)
   * @param {string} cbQueryData - padrao (<,>)YYYY-MM exemplo: <2018-05
   * @param {object} opts
   * @param {number} opts.chat_id - id do chat do teclado
   * @param {number} opts.message_id - id da mensagem do teclado
   */
  _callbackQueryUpdateKeyBoardCalendar(cbQueryData, opts) {
    let srtDate = cbQueryData.replace(/<|>/g, '');        // remove char verificador
    this._app.mountKeyboardCalendar(mm(srtDate)).then(res => {
      if (res.ok) {
        bot.editMessageReplyMarkup({
          inline_keyboard: res.result
        }, opts);
      } else {
        this._defaultMessageError(opts.chat_id);
      }
    }).catch(err => {
      logger.error('Bot > _callbackQueryUpdateKeyBoardCalendar -> Erro ao atualizar teclado calendario: '+err);
      this._defaultMessageError(opts.chat_id);
    });
  }

  /**
   * Callback do botao dia
   * @param {string} cbQueryData - padrao +YYYY-MM-DD exemplo: +2018-09-14
   * @param {object} opts
   * @param {number} date - chat unix timestamp
   * @param {number} opts.chat_id - id do chat do teclado
   * @param {number} opts.message_id - id da mensagem do teclado 
   */
  _callbackQueryKeyBoardRegs(cbQueryData, date, opts) {
    let strDate = cbQueryData.replace(/\+/, '');
    /* TODO fazer uma validacao decente */
    return this._app.mountKeyboardRegs(strDate).then(res => {
      if (res.ok) {

        let cbCalendar = '*'+mm(date*1000).format('YYYY-MM')
        let inlineKb = res.result.inline_keyboard[0].slice();
        inlineKb.push({ text: 'Pontos', callback_data: cbCalendar });

        let rm = {
          inline_keyboard: [inlineKb]
        }

        bot.editMessageText(mm(strDate).format('LL'), opts).then(() => {
          bot.editMessageReplyMarkup(rm, opts);
        });

        // bot.editMessageText(mm(strDate).format('LL'), opts);
        // bot.editMessageReplyMarkup(res.result, opts);
      } else {
        logger.info('Bot > _callbackQueryKeyBoardRegs -> Falha no calendario');
        this._defaultMessageError(opts.chat_id);
      }
    }).catch(err => {
      logger.error('Bot > _callbackQueryKeyBoardRegs -> Erro ao carregar calendario: '+err);
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
    const date = mm(cbQueryData.replace(/\.\w/, ''));
    const action = cbQueryData.replace(/^\./, '');
    const typeReg = /^\d/.exec(action)[0];
    const typeMsg = new Array(
      '',                                                 // correcao array a partir do idx 1
      '(Começo de jornada)',
      '(Almoço)',
      '(Volta do Almoço)',
      '(Fim de Jornada)'
    );

    bot.editMessageText('Digite o novo ponto '+typeMsg[typeReg], opts);
    this._stopListeners();                                // desativa os listeners
    bot.once('message', msg => {                          // listener para pegar o novo ponto digitado 
      
      let strNewTime = msg.text;
      let strDate = date.format('YYYY-MM-DD');
            
      this._app.getTimeFromString(strNewTime).then(time => {
        if (time.ok) {
          const newTime = mm(strDate+' '+time.result);
          this._app.addReg(typeReg, newTime.unix()).then(res => {
            if (res.ok) {
              let replyMsg = this._defaultMessageUpdateReg(res.result, typeReg, msg.date);
              bot.sendMessage(opts.chat_id, replyMsg);
            } else {
              this._defaultMessageError(opts.chat_id);
            }
            this._startListeners();
          }).catch(err => {
            logger.error('Bot > _callbackQueryUpdateReg > Erro ao atualizar ponto : '+err);
            this._startListeners();
            this._defaultMessageError(opts.chat_id);
          });
        } else {
          logger.info('Bot > _callbackQueryUpdateReg -> Tempo não convertido.');
          this._startListeners();                           // reativa os listesteners apos resposta do usuario
          this._defaultMessageError(opts.chat_id);
        }
      }).catch(err => {
        logger.error('Bot > _callbackQueryUpdateReg -> Erro ao atualizar registro de ponto: '+err);
        this._startListeners();                           // reativa os listesteners apos resposta do usuario
        this._defaultMessageError(opts.chat_id);
      });
    })
  }
  
  /**
   * Monta calendario
   * @param {string} cbQueryData - padrao *YYYY-MM exemplo: *2018-05
   * @param {object} opts
   * @param {number} opts.chat_id - id do chat do teclado
   * @param {number} opts.message_id - id da mensagem do teclado
   */
  _callbackQueryKeyBoardCalendar(cbQueryData, opts) {
    let srtDate = cbQueryData.replace(/\*/, '');          // remove char verificador
    this._app.mountKeyboardCalendar(mm(srtDate)).then(res => {
      if (res.ok) {
        bot.editMessageText('Pontos', opts).then(() => {
          bot.editMessageReplyMarkup({ inline_keyboard: res.result }, opts);
        });
      } else {
        this._defaultMessageError(opts.chat_id);
      }
    }).catch(err => {
      logger.error('Bot > _callbackQueryKeyBoardCalendar -> Erro ao atualizar teclado calendario : '+err);
      this._defaultMessageError(opts.chat_id);
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
   * Get mensagem de registro/update de ponto
   * @param {object} reg - registros do ponto dia
   * @param {number} typeReg - tipo de registro(1 - 4)
   * @param {date} date - timestamp
   */
  _defaultMessageUpdateReg(reg, typeReg, date){

    let formatReg = r => r > 0 ? mm(r).format('HH:mm') : '  -  ';
    let replyMsg = '';

    try {
      let r = {
        r1: formatReg(reg.r1),
        r2: formatReg(reg.r2),
        r3: formatReg(reg.r3),
        r4: formatReg(reg.r4)
      }

      switch (typeReg) {
        case 1: // comeco jornada
          replyMsg += ' Começo de Jornada '+mm(date*1000).format('L')+' \n';
          break;
        case 2: // comeco almoco
          replyMsg += ' Almoço '+mm(date*1000).format('L')+' \n';
          break;
        case 3: // fim almoco
          replyMsg += ' Volta do almoço '+mm(date*1000).format('L')+' \n';
          break;
        case 4: // fim jornada
          replyMsg += ' Fim de jornada '+mm(date*1000).format('L')+' \n';
          break;

        default:
          replyMsg += '';
          break;
      }

      replyMsg += '  '+r.r1+'  |  '+r.r2+'  |  '+r.r3+'  |  '+r.r4;
    } catch (err) {
      replyMsg = '';
      logger.error('Bot > _defaultMessageUpdateReg -> Erro ao criar mensagem : '+err);
    }
    return replyMsg;
  }

  /** Desativa todos os listeners de comandos(iniciados no _startListeners) */
  _stopListeners() {
    /*
      Serve para receber a nova hora/min digitada pelo usuario.
      Ocorre apos o _callbackQueryUpdateReg, porque onReplyToMessage nao funciona 
      https://github.com/yagop/node-telegram-bot-api/issues/113
    */
    try {
      bot.removeTextListener(CMD.P1);
      bot.removeTextListener(CMD.P2);
      bot.removeTextListener(CMD.P3);
      bot.removeTextListener(CMD.P4);
      bot.removeTextListener(CMD.SHORTCUT);
      bot.removeTextListener(CMD.EDIT);
      bot.removeListener('callback_query');
      bot.removeTextListener(CMD.EXPT);
      bot.removeTextListener(CMD.LIST);
    } catch (err) {
      logger.error('Bot > _stopListener -> Erro ao desativar listeners : '+err);
    }
  }

  /** Error listeners */
  _errorHandlingListeners() {
    bot.on('polling_error', err => logger.error('Polling error - '+err));
    bot.on('webhook_error', err => logger.error('Webhook error - '+err));
    bot.on('error', err => logger.error('Bot -> _errorHandlingListeners: '+err));
  }
}

new Bot();