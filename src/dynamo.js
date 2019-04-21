
const aws = require('aws-sdk');
aws.config.update({ region: 'us-east-1' });

class DynamoDBClient {

  static setUser(user) {
    return new Promise((resolve, reject) => {
      // TODO validação
      
      let docClient = new aws.DynamoDB.DocumentClient();
      let params = {
        TableName: 'UsersTeste',
        Item: {
          'id': user.id,
          'is_bot': user.is_bot,
          'first_name': user.first_name,
          'last_name': user.last_name,
          'username': user.username,
          'language_code': user.language_code,
          'enabled': user.enabled,
          'date': user.date
        }
      };

      docClient.put(params, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  static getUsers() {
    return new Promise((resolve, reject) => {
      let docClient = new aws.DynamoDB.DocumentClient();
      
      docClient.scan({ TableName: 'UsersTeste' }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Items);
        }
      });

    });
    
  }
}

module.exports = DynamoDBClient;