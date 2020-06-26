
const config = require('./config.js');
const logger = require('./logger');
const log = logger.logger;
const timerDao = require('./database/dynamoDB/timerDao');
const interface = require('./interface');

exports.start = function () {
    const rand = Math.ceil(Math.random(1000) * config.getConfig().scanPeriod);
    setTimeout(periodicScan, rand);
}


function periodicScan() {
    setTimeout(function () {
        fetchAndStart()
            .then(() => periodicScan())
            .catch((err) => {
                log.error(logger.printLog(JSON.stringify(err)));
                periodicScan()
            })
    }, config.getConfig().scanPeriod)
}

exports.fetchAndStart = fetchAndStart;
function fetchAndStart() {
    return new Promise(function (resolve, reject) {
        timerDao.fetchTimers(config.getConfig().scanPeriod)
            .then((data) => {
                if(config.getConfig().verboseLogging === true){
                    log.info(logger.printLog(`fetched-timers : ${JSON.stringify(data)}`));
                }
                data.Items.forEach(element => {
                    let d = new Date();
                    if (element.expireTime > d.getTime()) {
                        if (element.hasChanged === true) {
                            timerDao.resetChange(element.id)
                                .catch(err => {
                                    log.error(logger.printLog(`${JSON.stringify(err)}`));
                                })
                        }
                        let timeout = (element.expireTime - d.getTime()) / 1000;
                        element.timeout = timeout;
                        cacheTimer(element);
                    }
                    else if (element.expireTime < d.getTime()) {
                        if(config.getConfig().verboseLogging === true){
                            log.info(logger.printLog(`timer already expired : ${JSON.stringify(element)}`));
                        }
                        processExpiredTimer(element);
                    }
                });
                resolve(data.Items);
            })
            .catch(err => {
                log.error(logger.printLog(JSON.stringify(err)));
                reject(err);
            })
    })
}


function processExpiredTimer(timerInfo) {
    let msg = '';
    if (timerInfo.callback.message) {
        msg = timerInfo.callback.message;
    }
    const response = {
        message: msg,
        timerId: timerInfo.id,
        url:timerInfo.callback.url,
        status: 'delayed',
    }
    timerDao.conditionalDelete(timerInfo.id)
        .then(function () {
            return interface.sendCallback(response);
        })
        .catch(err => {
            if (err.code !== 'ConditionalCheckFailedException') {
                log.error(logger.printLog(`Error sending callback : timerID = ${timerInfo.id}, error = ${err}`));
            }
        })
}

exports.cacheTimer = cacheTimer;
function cacheTimer(timerInfo) {
    const timeout = timerInfo.timeout * 1000;
    setTimeout(function () {
        let msg = '';
        if (timerInfo.callback.message) {
            msg = timerInfo.callback.message;
        }

        const response = {
            message: msg,
            url:timerInfo.callback.url,
            timerId: timerInfo.id,
            status: 'on-time'
        }

        timerDao.checkUnchanged(timerInfo.id)
            .then(() => { return timerDao.conditionalDelete(timerInfo.id) })
            .then(() => { return interface.sendCallback(response) })
            .catch(err => {
                if (err.code !== 'ConditionalCheckFailedException') {
                    log.error(logger.printLog(`Error sending callback : timerID = ${timerInfo.id}, error = ${err}`));
                }
            })
    }, timeout, timerInfo)
}