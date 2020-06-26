
var params = {
};

exports.setConfig = function (_params) {
  return new Promise(function (resolve, reject) {
    if (_params.database === 'dynamoDB') {
      params.isLocal = _params.isLocal;
      if (!params.isLocal) {
        params.accessKeyId = _params.accessKeyId;
        params.secretAccessKey = _params.secretAccessKey;
      }
      params.region = _params.region;
      params.endpoint = _params.endpoint;
      params.tableName = _params.tableName;
      params.readCapacityUnitsForGSI = _params.readCapacityUnitsForGSI;
      params.writeCapacityUnitsForGSI = _params.writeCapacityUnitsForGSI;
      params.readCapacityUnits = _params.readCapacityUnits;
      params.writeCapacityUnits = _params.writeCapacityUnits;
      params.scanPeriod = _params.scanPeriod;
      params.verboseLogging = _params.verboseLogging;
    }
    resolve();
  });
};

exports.getConfig = function () {
  return params;
};
