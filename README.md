
# TimeSheet

TimeSheet é um bot simples para controle de ponto.
Foi utilizado o [Node Telegram Bot API](https://github.com/yagop/node-telegram-bot-api) e o [DynamoDB](https://aws.amazon.com/dynamodb/)

## Instalação
Clone o repositório e instale as depências.
```
git clone https://github.com/efsfilho/timesheet.git

npm install
```

## Configuração 
A chave do telegram gerada através do [@botfather](https://telegram.me/BotFather) vai no [bot.js](./bot.js):
```js
const key = 'chave_telegram';
```
no [/config/index.js](./config/index.js) estão os locais onde os logs serão salvos, arquivos de exportação enviado para os usuários, local do arquivo Excel usado como base
```js
module.exports = {
  logDir: './log/', // local dos logs
  exportDir: './exports/', // local dos arquivos de exportação
  exportModelFileName: './src/file.xlsx', // arquivo excel modelo para exportacao
```
e a região do serviço do DynamoDB([AWS Regions and EndPoints](https://docs.aws.amazon.com/general/latest/gr/rande.html))
``` js
  AWS_REGION: 'us-east-1'
};
```
É necessário configurar as credenciais do [AWS-SDK](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html)(Recomendado) na plataforma onde rodará o bot ou manualmente nos arquivos  [/dynamodb/dynamo.js](./dynamodb/dynamo.js) e  [/src/dynamo.js](./src/dynamo.js)(Não recomendado)
```js
aws.config.update({
  accessKeyId: 'chave_de_acesso_aws',
  secretAccessKey: 'chave_secreta_aws'
});
```
Após configurado o acesso ao DynamoDB, crie as tabelas executando:
```
npm run createdb
```
e execute o bot:
```
npm start
```
## Comandos do bot
`/c1` ou `Começo de Jornada`: registro de comeco de jornada

`/c2` ou `Almoço`           : registro de início de almoco

`/c3` ou `Volta do almoço`  : registro de volta de almoco

`/c4` ou `Fim de jornada`   : fim de jornada

`/editar` ou `Editar pontos`: exibe calendário para a alteração de pontos registrados

`/atalho`                   : altera a lista de comandos para botões

`/list`                     : lista os pontos do dia

`/exp`                      : exporta folha(excel)


