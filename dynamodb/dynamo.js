
const aws = require('aws-sdk');
const { AWS_REGION } = require('../config/index');

aws.config.update({ region: AWS_REGION });

// aws.config.update({
//   accessKeyId: AWS_ACCESS_KEY_ID,
//   secretAccessKey: AWS_SECRET_ACCESS_KEY
// });

const dynamodb = new aws.DynamoDB();

let params = [
  {
    TableName: 'Users',
    AttributeDefinitions: [{
      AttributeName:'id',
      AttributeType:'N'
    }],
    KeySchema: [{
      AttributeName:'id',
      KeyType:'HASH'
    }], //Partition key
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10
    }
  },{
    TableName: 'Registers',
    AttributeDefinitions: [{
      AttributeName:'userId',
      AttributeType:'N'
    }],
    KeySchema: [{
      AttributeName:'userId',
      KeyType:'HASH'
    }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10
    }
  }
];

params.forEach(item => {
  dynamodb.createTable(item, (err, data) => {
    if (err) {
      console.error('\n*** Erro ao criar a tabela ***\n', JSON.stringify(err, null, 2));
    } else {
      console.log('\n*** Tabela criada ***\n', JSON.stringify(data, null, 2));
    }
  });
});



