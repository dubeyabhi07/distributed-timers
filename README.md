# [distributed-timers](https://www.npmjs.com/package/distributed-timers)
#### npm package to implement timers in distributed, fault-tolerant, stateless and scalable manner, using various databases for persistence.

[![npm version](https://badge.fury.io/js/distributed-timers.svg)](https://badge.fury.io/js/distributed-timers)
![GitHub](https://img.shields.io/github/license/dubeyabhi07/distributed-timers)
![npm](https://img.shields.io/npm/dw/distributed-timers)

### Why distributed-timers ?
- The setTimeout functionality offered by Node.js is stateful and not fault tolerant, it will loose all the timer info once the server goes down.
- The setTimeout functionality offered by Node.js is not scalable. 
- We may use some persistence layer to store timer-info but without proper logic, it might become inconsistent during horizontal scaling. 
- `distributed-timers` provides the easiest way of handling timers using efficient databases & schemas and makes sure that the server remains stateless, fault tolerant, consistenct and scalable.
##### Note : for now only AWS dynamoDb is supported. Next step is to support other databases like Cassandra.


### How it works ?
- It connects to the database(specified by the user) creates a separated table for storing timers.
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
  region: 'ap-south-1',                 // region of database.
  isLocal: true,                        // whether database is running on local machine or cloud.
  tableName: 'timers',                  // tablename for new table to created for timers.
  readCapacityUnitsForGSI: 5,           // read capacity for Global Secondry Index.
  writeCapacityUnitsForGSI: 5,          // write capacity for Global Secondry Index.
  readCapacityUnits: 5,                 // read capacity for main table.
  writeCapacityUnits: 5,                // wite capacity for main table.
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
             timerId = timerInfo.timerId;       // upon a successful update timerID will be equal to updateTimerParams.timerId
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