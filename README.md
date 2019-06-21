# TimeSheet
TimeSheet é um bot simples para controle de ponto.
Foi utilizado o [Node Telegram Bot API](https://github.com/yagop/node-telegram-bot-api) e o [DynamoDB](https://aws.amazon.com/dynamodb/)

## Instalação
Clone o repositório e instale as depências.
```bash
git clone https://github.com/efsfilho/timesheet.git

npm install
```

## Configuração 
No arquivo [/config/index.js](./config/index.js) estão os locais onde os logs serão salvos, arquivos de exportação enviado para os usuários, local do arquivo Excel usado como base
```js
module.exports = {
  logDir: './log/', // local dos logs
  exportDir: './exports/', // local dos arquivos de exportação
  exportModelFileName: './src/file.xlsx', // arquivo excel modelo para exportacao
```
e a região do serviço do DynamoDB([AWS Regions and EndPoints](https://docs.aws.amazon.com/general/latest/gr/rande.html))
```js
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
```bash
npm run createdb
```

## Executando o bot
Para executar o bot você precisará criar um contato bot do Telegram. Para criar o contato envie o comando `/newbot` para o [Botfather](https://telegram.me/BotFather)

![newbot](https://raw.githubusercontent.com/efsfilho/timesheet/4016c51e9d27a774591ac41b8721aa6d0a3e2dbc/newbot.png)

Digite o nome que será o contato/usuário do bot e em seguida você receberá o token de identificação do seu bot

![token](https://raw.githubusercontent.com/efsfilho/timesheet/4016c51e9d27a774591ac41b8721aa6d0a3e2dbc/newbot2.png)


Depois que gerar o token, configure o token na variável de ambiente TELEGRAM_TOKEN, execute o bot:
```bash
TELEGRAM_TOKEN=123456789:ABCDEF1234567890abcdef1234567890 node bot.js
```

## Uso do bot
Pesquise o contato do seu bot

exemplo: [cartaobot](https://telegram.me/cartaobot)

![pesquisa](https://raw.githubusercontent.com/efsfilho/timesheet/4016c51e9d27a774591ac41b8721aa6d0a3e2dbc/pesquisabot.png)

![start](https://raw.githubusercontent.com/efsfilho/timesheet/4016c51e9d27a774591ac41b8721aa6d0a3e2dbc/startbot.png)

`/c1` ou `Começo de Jornada`: registro de comeco de jornada

`/c2` ou `Almoço`           : registro de início de almoço

`/c3` ou `Volta do almoço`  : registro de volta de almoço

`/c4` ou `Fim de jornada`   : fim de jornada

`/editar` ou `Editar pontos`: exibe calendário para a alteração de pontos registrados

`/atalho`                   : altera a lista de comandos para botões

`/list`                     : lista os pontos do dia

`/exp`                      : exporta folha(excel)

## TODO
+ Controle de usuários