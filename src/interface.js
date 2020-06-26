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
      log.info(logger.printLog(`update-request : ${request}`));
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
    log.info(logger.printLog(`callback response to be sent : ${opts} `));
  }
  return rp(opts)
    .catch((err) => {
      log.info(logger.printLog(`Error : ${err} `));
    });
};
