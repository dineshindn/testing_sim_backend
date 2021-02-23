var winston = require('winston');
require('winston-daily-rotate-file');

var transport = new (winston.transports.DailyRotateFile)({
  filename: 'logs/sim-manager-api-%DATE%.log',
  datePattern: 'YYYYMMDD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '90d'
});

var logger = new winston.createLogger({
  transports: [
    new winston.transports.Console(),
    transport
  ]
});

module.exports = logger;