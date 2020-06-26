'use strict';

const logger = require('../../logger');
const log = logger.logger;
const configParams = require('../../config.js');
const AWS = require('aws-sdk');

var awsConfig = {
  accessKeyId: configParams.getConfig().accessKeyId,
  secretAccessKey: configParams.getConfig().secretAccessKey,
  region: configParams.getConfig().region
};
awsConfig.endpoint = configParams.getConfig().endpoint;
AWS.config.update(awsConfig);

var client = new AWS.DynamoDB();

var documentClient = new AWS.DynamoDB.DocumentClient();

exports.getDynamoDbClient = function () {
  return documentClient;
};

exports.createTable = function () {
  return new Promise(function (resolve, reject) {
    var tableName = configParams.getConfig().tableName;

    var tableNameParams = {
      TableName: tableName,
      KeySchema: [{
        AttributeName: 'id',
        KeyType: 'HASH'
      }
      ],

      AttributeDefinitions: [{
        AttributeName: 'id',
        AttributeType: 'S'
      }, {
        AttributeName: 'expireTime',
        AttributeType: 'N'
      }, {
        AttributeName: 'GSI',
        AttributeType: 'S'
      }],
      GlobalSecondaryIndexes: [
        {
          IndexName: '_expire',
          KeySchema: [
            {
              AttributeName: 'GSI',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'expireTime',
              KeyType: 'RANGE'
            }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: configParams.getConfig().readCapacityUnitsForGSI,
            WriteCapacityUnits: configParams.getConfig().writeCapacityUnitsForGSI
          },
          Projection: {
            ProjectionType: 'ALL'
          }
        }

      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: configParams.getConfig().readCapacityUnits,
        WriteCapacityUnits: configParams.getConfig().writeCapacityUnits
      }
    };

    /**
         * Creates table, if it is not created already.
         * @param tableErr
         * @param tableData
         * @returns
         */
    client.createTable(tableNameParams, function (tableErr, tableData) {
      if (tableErr) {
        if (tableErr.code === 'ResourceInUseException') {
          log.info(logger.printLog(`${tableName} table exists already !`));
        } else {
          log.info(logger.printLog(`table creation Error ${JSON.stringify(tableErr, null, 2)}`));
          reject(tableErr);
        }
        resolve();
      } else {
        log.info(logger.printLog(`${tableName} Created table successfully!`));
        resolve();
      }
    });
  });
};
