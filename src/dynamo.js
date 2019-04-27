
const aws = require('aws-sdk');
const { AWS_REGION } = require('../config/index');

aws.config.update({ region: AWS_REGION });

// aws.config.update({
//   accessKeyId: AWS_ACCESS_KEY_ID,
//   secretAccessKey: AWS_SECRET_ACCESS_KEY
// });

class DynamoDBClient {

  static setUser(user) {
    return new Promise((resolve, reject) => {
      let docClient = new aws.DynamoDB.DocumentClient();

      docClient.put({ TableName: 'Users', Item: user }, err => {
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

      docClient.scan({ TableName: 'Users' }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  static getRegs(id) {
    let params = { TableName: 'Registers', Key: { 'userId': id } };
    
    return new Promise((resolve, reject) => {
      let docClient = new aws.DynamoDB.DocumentClient();

      docClient.get(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  static updateRegs(item) {
    return new Promise((resolve, reject) => {
      let docClient = new aws.DynamoDB.DocumentClient();
      let params = {
        TableName: 'Registers',
        Key: {
          userId: item.userId
        },
        UpdateExpression: 'set regs = :regsAtt',
        ExpressionAttributeValues:{
          ':regsAtt':item.regs
        },
        ReturnValues:'UPDATED_NEW'
      };

      docClient.update(params, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  static setRegs(item) {
    return new Promise((resolve, reject) => {
      let docClient = new aws.DynamoDB.DocumentClient();
      let params = {
        TableName: 'Registers',
        Item: {
          'userId': item.userId,
          'regs': item.regs
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
}

module.exports = DynamoDBClient;