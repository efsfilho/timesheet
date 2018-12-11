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
const app = new App(config);

const CMD_START = /\/start/;
const CMD_P1 = /^\/c1\b|^Come\ço\sde\sjornada\b/;         // /c1  - comando para registro de comeco de jornada
const CMD_P2 = /^\/c2\b|^Almo\ço\b/;                      // /c2  - ' ' registro de almoco
const CMD_P3 = /^\/c3\b|^Volta\sdo\salmo\ço\b/;           // /c3  - ' ' registro de volta de almoco
const CMD_P4 = /^\/c4\b|^Fim\sde\sjornada\b/;             // /c4  - ' ' registro de fim de jornada
const CMD_SHORTCUT = /\/atalho/;                          // /atalho
const CMD_EDIT = /\/editar\b|^Editar\spontos\b/;
const CMD_EXPT = /^exp\b/;                                // comando para exportar excel
const CMD_LIST = /\/list/;                                // /list - listar pontos do dia

bot.onText(/eco/, msg => {
  logger.debug('eco');
  bot.sendMessage(msg.chat.id, 'eco');
});

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

    bot.onText(CMD_P1, msg => {
      const chatId = msg.chat.id;
      app.addReg(1, msg.date).then(res => {

        if (res.ok) {
          let replyMsg = this._defaultMessageUpdateReg(res.result, 1, msg.date);
          bot.sendMessage(chatId, replyMsg);
        } else {
          this._defaultMessageError(chatId);
        }
      }).catch(err => {
        logger.error('Erro ao registrar ponto > _startListeners: '+err);
        this._defaultMessageError(chatId);
      })
    });

    bot.onText(CMD_P2, msg => {
      const chatId = msg.chat.id;
      app.addReg(2, msg.date).then(res => {
        if (res.ok) {
          let replyMsg = this._defaultMessageUpdateReg(res.result, 2, msg.date);
          bot.sendMessage(chatId, replyMsg);
        } else {
          this._defaultMessageError(chatId);
        }
      }).catch(err => {
        logger.error('Erro ao registrar ponto > _startListeners: '+err);
        this._defaultMessageError(chatId);
      })
    });

    bot.onText(CMD_P3, msg => {
      const chatId = msg.chat.id;
      app.addReg(3, msg.date).then(res => {
        if (res.ok) {
          let replyMsg = this._defaultMessageUpdateReg(res.result, 3, msg.date);
          bot.sendMessage(chatId, replyMsg);
        } else {
          this._defaultMessageError(chatId);
        }
      }).catch(err => {
        logger.error('Erro ao registrar ponto > _startListeners: '+err);
        this._defaultMessageError(chatId);
      })
    });
    
    bot.onText(CMD_P4, msg => {
      const chatId = msg.chat.id;
      app.addReg(4, msg.date).then(res => {
        if (res.ok) {
          let replyMsg = this._defaultMessageUpdateReg(res.result, 4, msg.date);
          bot.sendMessage(chatId, replyMsg);
        } else {
          this._defaultMessageError(chatId);
        }
      }).catch(err => {
        logger.error('Erro ao registrar ponto > _startListeners: '+err);
        this._defaultMessageError(chatId);
      })
    });

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

    bot.onText(CMD_EDIT, msg => {
      const date = mm(msg.chat.time);
      const strDate = date.format('YYYY-MM-DD');
      const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      }

      app.mountKeyboardRegs(strDate).then(res => {
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
          logger.info('Falha ao carregar ponto > _startListeners');
          this._defaultMessageError(opts.chat_id);
        }
      }).catch(err => {
        logger.error('Erro ao carregar ponto > _startListeners: '+err);
        this._defaultMessageError(opts.chat_id);
      });

      // const chatId = msg.chat.id;
      // const date = mm(msg.chat.time);

      // app.mountKeyboardCalendar(date).then(res => {       // monta calendario
      //   if (res.ok) {
      //     bot.sendMessage(chatId, 'Escolha o dia: ', {
      //       reply_markup: {
      //         inline_keyboard: res.result,
      //         resize_keyboard: true
      //       }
      //     });
      //   } else {
      //     logger.error('Erro ao carregar teclado > _startListeners: '+err);
      //     this._defaultMessageError(chatId);
      //   }
      // }).catch(err => {
      //   logger.error('Erro ao montar teclado > _startListeners: '+err);
      //   this._defaultMessageError(chatId);
      // });
    });

    bot.onText(CMD_LIST, msg => {                         // listar pontos do dia
      const chatId = msg.chat.id;
      const date = mm(msg.chat.time);
      /* TODO validacoes */
      app.listDayReg(date.format('YYYY-MM-DD')).then(res => {
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
          logger.error('Erro ao carregar ponto > _startListeners: '+err);
          this._defaultMessageError(chatId);
        }
      }).catch(err => {
        logger.error('Erro ao carregar ponto > _startListeners: '+err);
        this._defaultMessageError(chatId);
      });
    });

    bot.on('callback_query', cbQuery => {                 // callbacks do calendario
      const action = cbQuery.data;
      const msg = cbQuery.message;
      const date = cbQuery.message.date;
      const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id
      };

      if (/\*/.exec(action) !== null) {                   // *YYYY-MM ex: *2018-05
        this._callbackQueryKeyBoardCalendar(action, opts); // call calendario
      }
      
      if (/<|>/.exec(action) !== null) {                  // (<,>)YYYY-MM ex: <2018-05
        this._callbackQueryUpdateKeyBoardCalendar(action, opts); // botao avanca/retrocede mes
      }
      
      if (/\+/.exec(action) !== null) {                   // +YYYY-MM-DD ex: +2018-09-14
        this._callbackQueryKeyBoardRegs(action, date, opts); // pontos do dia
      }

      if (/\./.exec(action)) {                            // .NYYYY-MM-DD ex: .32018-09-25
        this._callbackQueryUpdateReg(action, opts);       // ponto
      }
    });

    bot.onText(CMD_EXPT, msg => {                         // excel export
      const chatId = msg.chat.id;
      app.export().then(res => {
        if (res.ok) {
          const fileName = mm(msg.date*1000).format('DDMMYYYYHHmmss')+'.xlsx';
          bot.sendDocument(chatId, res.result, {}, { 
            filename: fileName,
            contentType: 'application/octet-stream'
            /* https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files */
          });
        } else {
          logger.error('Erro ao exportar arquivo > _startListeners: '+err);
          this._defaultMessageError(chatId);
        }
      }).catch(err => {
        logger.error('Erro ao exportar arquivo > _startListeners: '+err);
        this._defaultMessageError(chatId);
      })
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
    app.mountKeyboardCalendar(mm(srtDate)).then(res => {
      if (res.ok) {
        bot.editMessageReplyMarkup({
          inline_keyboard: res.result
        }, opts);
      } else {
        this._defaultMessageError(opts.chat_id);
      }
    }).catch(err => {
      logger.error('Erro ao atualizar teclado calendario > _callbackQueryUpdateKeyBoardCalendar: '+err);
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
    return app.mountKeyboardRegs(strDate).then(res => {
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
      /* TODO fazer uma validacao decente */
      if (/^\d\d\d\d\b/.exec(msg.text) !== null) {
        strNewTime = msg.text.slice(0,2)+':'+msg.text.slice(2,4);
      }

      if (/[0-1][0-9]\:?[0-5][0-9]|[2][0-3]\:?[0-5][0-9]/.exec(strNewTime) !== null) {
        app.updateReg(date.format('YYYY-MM-DD'), typeReg, strNewTime).then(res => {

          if (res.ok) {
            let r = {
              r1: res.result.r1 > 0 ? mm(res.result.r1).format('HH:mm') : '  -  ',
              r2: res.result.r2 > 0 ? mm(res.result.r2).format('HH:mm') : '  -  ',
              r3: res.result.r3 > 0 ? mm(res.result.r3).format('HH:mm') : '  -  ',
              r4: res.result.r4 > 0 ? mm(res.result.r4).format('HH:mm') : '  -  '
            }

            let replyMsg = ''+
              ' Ponto de '+date.format('LL')+' alterado \n'+
              '  '+r.r1+'  |  '+r.r2+'  |  '+r.r3+'  |  '+r.r4;

            /* TODO callback caso nao ocorra a alteracao*/
            // bot.sendMessage(opts.chat_id, 'Ponto alterado '+typeMsg[typeReg]+'\n'+date.format('LL'));
            bot.sendMessage(opts.chat_id, replyMsg);
          } else {
            this._defaultMessageError(opts.chat_id);
          }
          this._startListeners();                           // reativa os listesteners apos resposta do usuario
        }).catch(err => {
          logger.error('Erro ao atualizar registro de ponto > _callbackQueryUpdateReg: '+err);
          this._startListeners();                           // reativa os listesteners apos resposta do usuario
          this._defaultMessageError(opts.chat_id);
        });
      } else {
        this._startListeners();   
        this._defaultMessageError(opts.chat_id);
      }
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
    app.mountKeyboardCalendar(mm(srtDate)).then(res => {
      if (res.ok) {
        bot.editMessageText('Pontos', opts).then(() => {
          bot.editMessageReplyMarkup({ inline_keyboard: res.result }, opts);
        });
      } else {
        this._defaultMessageError(opts.chat_id);
      }
    }).catch(err => {
      logger.error('Erro ao atualizar teclado calendario >  _callbackQueryKeyBoardCalendar : '+err);
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
      logger.error('Erro ao criar mensagem > _defaultMessageUpdateReg : '+err);
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
      bot.removeTextListener(CMD_P1);
      bot.removeTextListener(CMD_P2);
      bot.removeTextListener(CMD_P3);
      bot.removeTextListener(CMD_P4);
      bot.removeTextListener(CMD_SHORTCUT);
      bot.removeTextListener(CMD_EDIT);
      bot.removeListener('callback_query');
      bot.removeTextListener(CMD_EXPT);
      bot.removeTextListener(CMD_LIST);
    } catch (err) {
      logger.error('Erro ao desativar listeners > _stopListener : '+err);
    }
  }

  /** Error listeners */
  _errorHandlingListeners() {
    bot.on('polling_error', err => logger.error('Polling error - '+err));
    bot.on('webhook_error', err => logger.error('Webhook error - '+err));
    bot.on('error', err => logger.error(' > _errorHandlingListeners - '+err));
  }
}

new Bot();