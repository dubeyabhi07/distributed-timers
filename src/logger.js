'use strict';

const winston = require('winston');

var consoleTransport = new (winston.transports.Console)({
	 level: 'info',
  timestamp: () => {
    return new Date().toISOString();
  },
	 formatter: options => `[${options.timestamp()}] [${options.level}] ${options.message}`

});

var logger = new (winston.Logger)({
  transports: [
  	consoleTransport
  ]
});

exports.logger = logger;
exports.printLog = function (msg) {
  return '[' + new Error().stack.split('\n')[2].substring(4) + '] - ' + msg;
};
