'use strict';

// var dynamoDbLocal = require('dynamo-db-local');

var chai = require('chai');

var expect = chai.expect;
var assert = chai.assert;

var timerLib = require('../../index');

const quickTimer = {
  timeout: 30,
  callback: {
    url: 'https:localhost:8000/dummy-url',
    message: {
      key: 'value'
    }
  }
};
const longTimer = {
  timeout: 10000,
  callback: {
    url: 'https:localhost:8000/dummy-url',
    message: {
      key: 'value'
    }
  }
};

const updateTimer = {
  timerId: '',
  timeout: 1000,
  callback: {
    url: 'https:localhost:8000/dummy-url',
    message: {
      key: 'value'
    }
  }
};

const timerLibParams = {
  database: 'dynamoDB',
  region: 'ap-south-1',
  isLocal: true,
  tableName: 'timers',
  readCapacityUnitsForGSI: 5,
  writeCapacityUnitsForGSI: 5,
  readCapacityUnits: 5,
  writeCapacityUnits: 5,
  scanPeriod: 60000, // 1 minute
  endpoint: 'http://localhost:8000',
  'verbose-logging': true
};

let quickTimerId;
let longTimerId;

describe('Distributed-Timer-Test', function () {
  this.timeout(20000);

  before(function (done) {
    timerLib.init(timerLibParams);
    // wait for tables getting created
    setTimeout(async () => {
      try {
        quickTimerId = await timerLib.create(quickTimer);
        quickTimerId = quickTimerId.timerId;
        longTimerId = await timerLib.create(longTimer);
        longTimerId = longTimerId.timerId;
        done();
      } catch (err) {
        console.log(err);
        done(err);
      }
    }, 5000);
  });

  it('Periodic scan should fetch quickTimer from DB', () => {
    const core = require('../../src/core.js');
    return core.fetchAndStart()
      .then(res => {
        const fetchedTimerIds = [];
        res.forEach(element => {
          fetchedTimerIds.push(element.id);
        });
        assert.include(fetchedTimerIds, quickTimerId, 'QuickTimer is to be fetched from DB');
      });
  });

  it('Periodic Scan should not fetch longTimer from DB', () => {
    const core = require('../../src/core.js');
    return core.fetchAndStart()
      .then(res => {
        const fetchedTimerIds = [];
        res.forEach(element => {
          fetchedTimerIds.push(element.id);
        });

        assert.notInclude(fetchedTimerIds, longTimerId, 'LongTimer should not be fetched from DB');
      });
  });

  it('Request to modify longTimer should resolve with same timerId', () => {
    updateTimer.timerId = longTimerId;
    return timerLib.update(updateTimer)
      .then(resp => {
        assert.equal(resp.timerId, longTimerId);
      });
  });

  it('Request to delete nonExistingTimer should reject', () => {
    return timerLib.delete('DNE')
      .catch(returnedErr => {
        assert.equal(returnedErr.message, 'invalid method : timer does not exist');
      });
  });

  after(function (done) {
    setTimeout(async () => {
      try {
        await timerLib.delete(longTimerId);
        await timerLib.delete(quickTimerId);
      } catch (err) {
        console.log(err);
        done(err);
      }
      done();
    }, 2000);
  });
});
