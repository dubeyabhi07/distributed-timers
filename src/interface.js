const logger = require('./logger');
const log = logger.logger;
const timerDao = require('./database/dynamoDB/timerDao');
const config = require('./config');
const uuidv1 = require('uuid/v1');
const rp = require('request-promise');

/**
 * function to delete timer that is present in DB
 * @param {string} timerId : id of timer to be deleted.
 */
exports.deleteTimer = function (timerId) {
  return new Promise((resolve, reject) => {
    if (config.getConfig().verboseLogging === true) {
      log.info(logger.printLog(`delete-request : ${timerId}`));
    }
    timerDao.verifyTimer(timerId)
      .then((data) => {
        if (data.Count === 0) {
          reject(new Error('invalid method : timer does not exist'));
        } else {
          timerDao.deleteTimer(timerId)
            .then(() => resolve())
            .catch((err) => {
              log.error(logger.printLog(JSON.stringify(err)));
              reject(err);
            });
        }
      });
  });
};

/**
 * function to update timer that is present in DB
 * @param {string} timerId : id of timer to be deleted.
 */
exports.updateTimer = function (request) {
  return new Promise((resolve, reject) => {
    if (config.getConfig().verboseLogging === true) {
      log.info(logger.printLog(`update-request : ${JSON.stringify(request)}`));
    }
    timerDao.verifyTimer(request.timerId)
      .then((data) => {
        if (data.Count === 0) {
          reject(new Error('invalid method : timer does not exist'));
        } else {
          timerDao.updateTimer(request)
            .then(() => resolve({ timerId: request.timerId }))
            .catch((err) => {
              log.error(logger.printLog(JSON.stringify(err)));
              reject(err);
            });
        }
      });
  });
};

/**
 * function to create timer and save it in DB
 */
exports.addTimer = function (request) {
  return new Promise((resolve, reject) => {
    timerId = uuidv1();
    if (config.getConfig().verboseLogging === true) {
      log.info(logger.printLog(`create-request : ${JSON.stringify(request)}`));
      log.info(logger.printLog(`create-request, id assigned = ${timerId} `));
    }
    timerDao.addTimer(request, timerId)
      .then(() => {
        resolve({ timerId: timerId });
      })
      .catch(err => {
        log.error(logger.printLog(JSON.stringify(err)));
        reject(err);
      });
  });
};

exports.sendCallback = function (callbackResponse) {
  const opts = {
    url: callbackResponse.url,
    method: 'POST',
    json: true,
    body: {
      message: callbackResponse.message,
      timerId: callbackResponse.timerId,
      status: callbackResponse.status
    }
  };
  if (config.getConfig().verboseLogging === true) {
    log.info(logger.printLog(`callback response to be sent : ${JSON.stringify(opts)} `));
  }
  return rp(opts)
    .catch((err) => {
      log.info(logger.printLog(`Error : ${JSON.stringify(err)} `));
    });
};


exports.createMultiple = function(req){
  if (config.getConfig().verboseLogging === true) {
    log.info(logger.printLog(`multiple-create-request : ${JSON.stringify(req)}`));
  }
  return new Promise((resolve,reject)=>{
    if(req.length>25){
      log.error(logger.printLog("error : Request length exeeds!"));
      reject(new Error("invalid method : request length is more than 25"));
    }
    else{
      const d = new Date();
      const executionArray =[];
      const responseObj = [];
      const hashIdMap =[];
      req.forEach(timerRequest =>{
        const hashIdNew = uuidv1();
        responseObj[timerRequest.timerReference] = hashIdNew;
        hashIdMap[hashIdNew] = timerRequest.timerReference;
        executionArray.push({
          PutRequest:{
            Item:{
              id: hashIdNew,
              callback: timerRequest.timerInfo.callback,
              GSI: 'gsi',
              expireTime: timerRequest.timerInfo.timeout * 1000 + d.getTime(),
              hasChanged: false
            }
          }
        })
      });

      timerDao.operateOnMultipleTimers(executionArray)
      .then(function(data){
        if(Object.keys(data.UnprocessedItems).length !== 0){
          if (config.getConfig().verboseLogging === true) {
            log.info(logger.printLog(`Some timers could not be added to database`));
          }
          const UnprocessedItems = data.UnprocessedItems[config.getConfig().tableName];
          UnprocessedItems.forEach(item=>{
            const UnprocessedItemsRef = item.PutRequest.Item.id;
            responseObj[hashIdMap[UnprocessedItemsRef]]='';
          })
        }
        else{
          if (config.getConfig().verboseLogging === true) {
            log.info(logger.printLog(`All timers were successfully added to database`));
          }
        }
        resolve(responseObj);
      })
      .catch(err => {
        log.error(logger.printLog(JSON.stringify(err)));
        reject(err);
      });
    }
  })
};


exports.deleteMultiple = function(req){
  if (config.getConfig().verboseLogging === true) {
    log.info(logger.printLog(`multiple-delete-request : ${JSON.stringify(req)}`));
  }
  return new Promise(function(req,resp){
    if(req.length>25){
      log.error(logger.printLog("error : Request length exeeds!"));
      reject(new Error("invalid method : request length is more than 25"));
    }
    else{
      const executionArray =[];
      req.forEach(id=>{
        executionArray.push({
          DeleteRequest:{
            Key:{id:id}
          }
        })
      });

      const responseArray =[];
      
      timerDao.operateOnMultipleTimers(executionArray)
      .then(function(data){
        if(Object.keys(data.UnprocessedItems).length !== 0){
          if (config.getConfig().verboseLogging === true) {
            log.info(logger.printLog(`Some timers could not be deleted from database`));
          }
          const UnprocessedItems = data.UnprocessedItems[config.getConfig().tableName];
          UnprocessedItems.forEach(item=>{
            const UnprocessedItemsRef = item.DeleteRequest.Item.id;
            responseArray.push(UnprocessedItemsRef);
          })
        }
        resolve({unprocessed_request: responseArray});
      })
      .catch(err => {
        log.error(logger.printLog(JSON.stringify(err)));
        reject(err);
      });
    }
  });
};
