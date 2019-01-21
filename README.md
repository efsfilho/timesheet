# TimeSheet

TimeSheet é um bot simples para controle de ponto.
A lib utilizada para a construção do bot foi o [Node Telegram Bot API](https://github.com/yagop/node-telegram-bot-api)

## Instalação
Clone o repositório e instale as depências.
```
git clone https://github.com/efsfilho/timesheet.git

npm install
```

## Configuração 
A chave do telegram gerada através do [@botfather](https://telegram.me/BotFather) vai no [bot.js](./bot.js) 
```js
const key = 'chave_telegram';
```
no [/config/index.js](./config/index.js) estão os locais onde serão salvos registros(que são salvos em um json por enquanto) e os logs
```js
let config = {
  logLocal: './log/', 			// local dos logs
  userIndexLocal: './data/', 		// local do arquivo com os usuarios
  userRegsLocal: './data/regs/', 	// local dos registros
  exportLocal: './data/exports/' 	// local dos exports do xlsx
};
```

## Comandos do bot
`/c1` ou `Começo de Jornada`: registro de comeco de jornada

`/c2` ou `Almoço`           : registro de início de almoco

`/c3` ou `Volta do almoço`  : registro de volta de almoco

`/c4` ou `Fim de jornada`   : fim de jornada

`/editar` ou `Editar pontos`: exibe calendário para a alteração de pontos registrados

`/atalho`                   : altera a lista de comandos para botões

`/exp`                      : exporta folha(excel)

## TODO
Salvar registros em um db
