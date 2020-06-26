const config = require('./src/config.js');
const logger = require('./src/logger');
const log = logger.logger;

let core;
let interface;


let initialize = function (params) {
    config.setConfig(params)
        .then(function () {
            let dynamodbConfig = require('./src/database/dynamoDB/dbconfig');
            return dynamodbConfig.createTable();
        })
        .then(()=>{
            core = require('./src/core.js');
            interface = require('./src/interface.js');
            main.create = interface.addTimer;
            main.delete = interface.deleteTimer;
            main.update = interface.updateTimer;
            core.start();
        })
        .catch(err => {log.error(logger.printLog(`Error : ${err}`));})
}


let main = {
    init: initialize
}


module.exports = main;