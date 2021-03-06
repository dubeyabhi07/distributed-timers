# [distributed-timers](https://www.npmjs.com/package/distributed-timers)
#### npm package to implement timers in distributed, fault-tolerant, stateless and scalable manner, using various databases for persistence.

[![npm version](https://badge.fury.io/js/distributed-timers.svg)](https://badge.fury.io/js/distributed-timers)
![GitHub](https://img.shields.io/github/license/dubeyabhi07/distributed-timers)

### Why distributed-timers ?
- The setTimeout functionality offered by Node.js is stateful and not fault tolerant, it will loose all the timers' info once the server goes down.
- The setTimeout functionality offered by Node.js is not scalable. 
- We may use some persistence layer to store timer-info but without proper logic, it might become inconsistent during horizontal scaling. 
- `distributed-timers` provides the easiest way of handling timers using efficient databases & schemas and makes sure that the server remains stateless, fault tolerant, consistenct and scalable.
##### Note : for now only AWS dynamoDb is supported. Next step is to support other databases like Cassandra.


### How it works ?
- It connects to the database(specified by the user) creates a separate table for storing timers.
- It scans the table periodically and picks the timers which are about to expire, loads them into memory.
- As the timers expire, it sends the callback to the specified application.
- **Scalabilty** : It uses a single database to store timers' info , Many server-instances can read from it.
- **Fault-tolerance** : It is as fault tolerant as the underlying database. Timers are not stored in memory.
- **Statelessness** : Since it does not store timer info in memory, it is stateless. Just before the expire-time it loads timer info into memory, even if a failure happens at that time, another instance can safely give callback. 
- **Consistency** : Coding logic is written to ensure all sort of consistency.


### How to use ?

- If running on localhost, download and run [dynamodb-local](https://medium.com/@vschroeder/install-a-local-dynamodb-development-database-on-your-machine-82dc38d59503)
- Install the package :  ``` npm install distributed-timers --save```
- ***Initializing***  : 
```
var timerLib = require('distributed-timers');

const databaseParams = {
  database: 'dynamoDB',                 // type of database (only AWS dynamodb is supported for now). 
  region: 'local',                 // region of database.
  isLocal: true,                        // whether database is running on local machine or cloud.
  tableName: 'timers',                  // tablename for new table that is to be created for timers.
  readCapacityUnitsForGSI: 5,           // read capacity for Global Secondry Index.  (dynamoDb specific)
  writeCapacityUnitsForGSI: 5,          // write capacity for Global Secondry Index. (dynamoDb specific)
  readCapacityUnits: 5,                 // read capacity for main table.             (dynamoDb specific)
  writeCapacityUnits: 5,                // wite capacity for main table.             (dynamoDb specific)
  scanPeriod: 60000,                    // periodic scan period in miliseconds        
  endpoint: 'http://localhost:8000',    // endpoint 
  verboseLogging: true                  // option to select whether to enable detailed logs.
};

timerLib.init(databaseParams);

```
- ***Creating new timer :*** 
```
var timerParams = {
  timeout: 1000,                             //timeout in seconds
  callback: {
    url: 'https:localhost:8000/dummy-url',   // url to which the callback has to be sent
    message: {                               // JSON object to be received when the timer expires.
      key: 'value'                           
    }
  }
let timerId;                                // id to keep track of timer stored in db.
timerLib.create(timerParams)
        .then(function(timerInfo){
            timerId = timerIdInfo.timerId;
        })
        .catch((err)=>{
            console.log(err)
        })
  
```
- ***Updating an existing timer :***
```
var updateTimerParams = {
  timerId: <timerId>,                       //timerId of timer to be updated
  timeout: 1000,
  callback: {
    url: 'https:localhost:8000/dummy-url',
    message: {
      key: 'value'
    }
  }
};

timerLib.update(updateTimerParams)
         .then(function(timerInfo){
             timerId = timerInfo.timerId;       // upon a successful update timerId will be equal to updateTimerParams.timerId
         })
         .catch((err)=>{
             console.log(err)
         })

```
- ***Deleting an existing timer :***
```
var timerIdTobeDeleted = <timerId>            // timerId of timer to be deleted
timerLib.delete(timerIdTobeDeleted)
       .catch((err)=>{
           console.log(err)
       })

```


- ***Adding timers in batch :***
```
const batchTimerRequest = [
  { timerReference : "first-timer-of-batch",         // new-field , when timerIDs are returned it helps keep track of timer to which it points to.
    timerInfo :{
      timeout: 10000,                                //timeout in seconds
      callback: {
        url: 'https:localhost:8000/dummy-url',       // url to which the callback has to be sent
        message: {                                   // JSON object to be received when the timer expires.
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


timerLib.batchCreate(batchTimerRequest)
        .then(function(response){
            batchResponse = response;                // it will be of the form [{timerReference1 : timerId1 },{....}] 
        })
        .catch((err)=>{
            console.log(err)
        })
```


- ***Deleting timers in batch :***
```
var timerIdsTobeDeleted = [<timerId1>,<...>]            // list of timerIds of timers to be deleted
timerLib.batchDelete(timerIdsTobeDeleted)
       .catch((err)=>{
           console.log(err)
       })

```
