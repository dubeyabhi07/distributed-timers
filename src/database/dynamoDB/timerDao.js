'use strict';

const config = require('../../config');
const dynamoDbClient = require('./dbConfig.js').getDynamoDbClient();
const logger = require('../../logger');
const log = logger.logger;

exports.deleteTimer = function (timerId) {
  return new Promise((resolve, reject) => {
    var params = {
      TableName: config.getConfig().tableName,
      Key: { id: timerId }
    };
    dynamoDbClient.delete(params, (err, resp) => {
      if (err) { reject(err); } else { resolve(); }
    });
  });
};

exports.conditionalDelete = function (timerId) {
  return new Promise((resolve, reject) => {
    var params = {
      TableName: config.getConfig().tableName,
      Key: { id: timerId },
      ConditionalExpresssion: 'attribute_exists(id)'
    };
    dynamoDbClient.delete(params, (err, resp) => {
      if (err) { reject(err); } else { resolve(); }
    });
  });
};

exports.addTimer = function (timerInfo, timerId) {
  return new Promise((resolve, reject) => {
    const d = new Date();
    var params = {
      TableName: config.getConfig().tableName,
      Item: {
        id: timerId,
        callback: timerInfo.callback,
        GSI: 'gsi',
        expireTime: timerInfo.timeout * 1000 + d.getTime(),
        hasChanged: false
      }
    };
    dynamoDbClient.put(params, (err, resp) => {
      if (err) { reject(err); } else { resolve(resp); }
    });
  });
};

exports.verifyTimer = function (timerId) {
  return new Promise((resolve, reject) => {
    var params = {
      TableName: config.getConfig().tableName,
      KeyConditionExpression: ' id = :timerId ',
      ExpressionAttributeValues: {
        ':timerId': timerId
      }
    };
    dynamoDbClient.query(params, (err, resp) => {
      if (err) { reject(err); } else { resolve(resp); }
    });
  });
};

exports.updateTimer = function (timerInfo) {
  return new Promise((resolve, reject) => {
    const d = new Date();
    var params = {
      TableName: config.getConfig().tableName,
      Item: {
        id: timerInfo.timerId,
        callback: timerInfo.callback,
        GSI: 'gsi',
        expiretime: timerInfo.timeout * 1000 + d.getTime(),
        hasChanged: true
      }
    };
    dynamoDbClient.put(params, (err, resp) => {
      if (err) { reject(err); } else { resolve(resp); }
    });
  });
};

exports.resetChange = function (timerId) {
  return new Promise((resolve, reject) => {
    var params = {
      TableName: config.getConfig().tableName,
      Key: { id: timerId },
      UpdateExpression: 'set hasChanged = :flag',
      ExpressionAttributeValues: {
        ':flag': false
      }
    };
    dynamoDbClient.update(params, (err, resp) => {
      if (err) { reject(err); } else { resolve(resp); }
    });
  });
};

exports.checkUnchanged = function (timerId) {
  return new Promise((resolve, reject) => {
    var params = {
      TableName: config.getConfig().tableName,
      KeyConditionExpression: ' id =  :timerId',
      ExpressionAttributeValues: {
        ':timerId': timerId
      }
    };
    dynamoDbClient.query(params, (err, data) => {
      if (err) { reject(err); } else {
        if (data.Count !== 0 && data.Items[0].hasChanged === true) {
          if (config.getConfig().verboseLogging === true) {
            log.info(logger.printLog('timer was modified after being loaded into cache, callback to be withheld'));
          }
          reject(new Error('CallBackWithheld'));
        } else {
          resolve();
        }
      }
    });
  });
};

exports.fetchTimers = function (period) {
  return new Promise((resolve, reject) => {
    const d = new Date();
    if (config.getConfig().verboseLogging === true) {
      log.info(logger.printLog('fetching from db......'));
    }
    const et = d.getTime() + period;
    var params = {
      TableName: config.getConfig().tableName,
      IndexName: '_expire',
      KeyConditionExpression: 'GSI = :gsi AND expireTime < :et',
      ExpressionAttributeValues: {
        ':et': et,
        ':gsi': 'gsi'
      }
    };
    dynamoDbClient.query(params, (err, resp) => {
      if (err) { reject(err); } else { resolve(resp); }
    });
  });
};
