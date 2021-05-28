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

const batchTimerRequest = [
  { timerReference : "first-timer-of-batch",
    timerInfo :{
      timeout: 10000,
      callback: {
        url: 'https:localhost:8000/dummy-url',
        message: {
          key: 'batch1'
        }
      }
    }
  },
  { timerReference : "second-timer-of-batch",
    timerInfo :{
      timeout: 10000,
      callback: {
        url: 'https:localhost:8000/dummy-url',
        message: {
          key: 'batch2'
        }
      }
    }
  }
];

const timerLibParams = {
  database: 'dynamoDB',
  region: 'local',
  isLocal: true,
  tableName: 'timers',
  readCapacityUnitsForGSI: 5,
  writeCapacityUnitsForGSI: 5,
  readCapacityUnits: 5,
  writeCapacityUnits: 5,
  scanPeriod: 60000, // 1 minute
  endpoint: 'http://localhost:8000',
  verboseLogging : true
};

let quickTimerId;
let longTimerId;
let batchRequestResp;

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


  it('Batch request should send timerID for every reference',async ()=>{
    batchRequestResp = await timerLib.batchCreate(batchTimerRequest);
    console.log(batchRequestResp)
    assert.equal(batchTimerRequest.length,Object.keys(batchRequestResp).length, 'Batch request should create multiple timers');
  })

  
  it('Batch request should delete multiple timers',async ()=>{
    let deleteReqArr = []
    deleteReqArr.push(batchRequestResp["first-timer-of-batch"])
    deleteReqArr.push(batchRequestResp["second-timer-of-batch"])
    let batchDeleteRequestResp = await timerLib.batchDelete(deleteReqArr);
    assert.equal(batchDeleteRequestResp.unprocessed_request.length,0,'Batch request should delete multiple timers');
  })

  

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
