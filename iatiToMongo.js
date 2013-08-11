//IATI to Mongo
//ver 0.0.1
//License: MIT
//Author: Owen Scott
//Contact: owen.m.scott(at)gmail.com


//========CONFIG========//

var dbName = 'iatiToMongo';
var logFile = 'logfile.log';

//LIB

var fs = require('fs')
var mongoose = require('mongoose');
var Request = require('request');
var parseString = require('xml2js').Parser({
        attrkey:'@',
        charkey:'text',
        mergeAttrs:true,
        explicitCharkey:true
}).parseString; 
var winston = require('winston'); 
var async = require('async'); 
var util = require('util');

//configure logger
var logger = new (winston.Logger)({
    transports:[
        new (winston.transports.Console)({
            colorize:true
        }),
        new (winston.transports.File)({
            filename: logFile
        })
    ]
});

var memLogger = new (winston.Logger)({
    transports:[
        new (winston.transports.File)({
            filename: 'memLog.log'
        })
    ]
});

//========SCHEMA========//

/*
    - create an array with all of the schemas
    - for each one, require it and then create a model
*/

//var schemas = ['activity'];

//for (s in schemas) {
//    require('./schema/' + schemas[s] + '.js');
//}

require('./schema.js');
var schema = makeSchema(mongoose);
var Activity = mongoose.model('Activity',schema.activity)


//========CODE========//


//connect to Mongo
mongoose.connect('mongodb://localhost/'+dbName);
var db = mongoose.connection

//bind error handler
db.on('error',console.error.bind(console,'connectionerror: '));

//open db
db.once('open',function() {
    var datasetList;
    var mapping;
    logger.info('Connected to database.');
    async.series([
        //=====load mapping=====
        function(callback) {
            fs.readFile('mapping.json', function(err,data) {
                if (err) return callback({message:'Error loading field mapping.',json:{error:err}});
                mapping = JSON.parse(data);
                return callback();
            });
        },
        //=====make api request and get dataset list=====
        function(callback) {
            logger.info('Sending initial request to IATI registry server...');
            Request('http://www.iatiregistry.org/api/rest/dataset/', function(err,res,body) {
                if(err) return callback({message:'Request to IATI registry server failed.',json:{error:err}});
                logger.info('Initial response from IATI registry server received.');
                logger.info('Downloading and parsing datasets...');
                datasetList = JSON.parse(body);
                return callback();
            });
        },
        //=====download xml for each activity, parse, put in DB=====
        function(callback) {
            var numDataSets = datasetList.length;
            var datasetCounter = 0;
            
            datasetIterator = function(dataset,callback) {
                var metadata;
                var activityData;
                //======
                async.series([
                    
                    //---download activity metadata from API---
                    function(callback) {
                        Request('http://www.iatiregistry.org/api/rest/dataset/' + dataset, function(err,res,body) {
                            if (err) return callback({message:'Error downloading metadata.', json:{dataset:dataset,error:err}});
                            //parse metadata
                            metadata = JSON.parse(body);
                            //check if has download url for XML
                            if (!metadata.download_url) return callback({message:'Metadata has no download url.', json:{dataset:dataset,error:'No_Download_Url'}});
                            //move to next function in async.series
                            return callback();
                        })
                    },
                    
                    //---download activity XML---
                    function(callback) {
                        Request(metadata.download_url, function(err,res,body) {
                            if (err) return callback({message:'Error downloading XML.', json:{dataset:dataset,error:err}});
                            activityData = body;
                            return callback();
                        })
                    },
                    //---parse activity XML to JSON---
                    function(callback) {
                        parseString(activityData, function(err, data) {
                            if (err) return callback({message:'Error parsing XML.', json:{dataset:dataset,error:err}});
                            activityData = data;
                            return callback()
                        });
                    },
                    //---put activity JSON into DB---
                    function(callback) {
                        //check if empty
                        if(!activityData['iati-activities'] || !activityData['iati-activities']['iati-activity']) {
                            return callback({message:'No activities found.', json:{dataset:dataset,error:'NoActivities'}});
                        }
                        //write json to db
                        writeActivitiesToDb(dataset, metadata, activityData, mapping, callback);
                    }],
                    //---callback after processing a dataset to increment the counter and call the async.ForEach callback
                    function(err) {
                        datasetCounter++;
                        logger.info('Finished dataset %s of %s', datasetCounter, numDataSets, {dataset:dataset});
                        memLogger.info(util.inspect(process.memoryUsage().rss));
                        if (err) logger.warn(err.message,err.json);
                        return callback();   
                    }
                );
            }
            
            
            async.eachLimit(datasetList,5,datasetIterator,              
                //===final callback after processing all datasets===
                function(err) {
                    if (err) return callback({message:'Processing datasets aborted.',json:{error:err}});
                    return callback();
                }
            )
        }],
        //=====final callback after doing everything=====
        function(err) {
            if (err) {
                logger.error(err.message,err.json);//logger.error('Error with main async.series.',{error:err});
                return db.close();
            }
            logger.info('All done.');
            return db.close();
        }
    );
});
    


//FUNCTION: writeActivitiesToDb
//DESCRIPTION: runs in the async.sequence stack for each activity 
//accepts data for one activity plus an async module callback,
//writes activity to db, executes callback on completion or error

function writeActivitiesToDb(dataset, metadata, activityData, mapping, callback) {

    async.parallel([
        //write metadata to db
        function(callback) {
            //write metadata to db here, with _id = dataset
            return callback();
        },
        //write activity data to db
        function(callback) {
            //parse each activity to db asynchronously
            var activityIterator = function(activity,callback) {
                return mapObjectToMongoose({sourceObject:activity, nodeMapping:mapping.activity,mongooseModel:Activity},callback);
            }
            async.eachSeries(activityData['iati-activities']['iati-activity'],activityIterator,
                function(err) {
                    if (err) return callback({message:'Error writing activity to db.',json:{err:err,dataset:dataset}});
                    return callback();
                }
            );
                             //async.forEach(activityData['iati-activities']['iati-activity'],function(activity, callback) {
            //    return mapObjectToMongoose({sourceObject:activity, nodeMapping:mapping.activity,mongooseModel:Activity},callback);
            //},
            //call back at the end of parsing all activities

        }],
        //call callback for parent stack
        function(err) {
            if(err) return callback(err);
            return callback();
        }
  );
}
/*
eachLimit(arr, limit, iterator, callback)

The same as each only no more than "limit" iterators will be simultaneously running at any time.

Note that the items are not processed in batches, so there is no guarantee that the first "limit" iterator functions will complete before any others are started.

Arguments

arr - An array to iterate over.
limit - The maximum number of iterators to run at any time.
iterator(item, callback) - A function to apply to each item in the array. The iterator is passed a callback(err) which must be called once it has completed. If no error has occured, the callback should be run without arguments or with an explicit null argument.
callback(err) - A callback which is called after all the iterator functions have finished, or an error has occurred.


*/
        
//takes settings {sourceObject,mongooseModel,mapping [{obj1:[],obj2:[]}],
function mapObjectToMongoose(settings,callback) {
    var mapping = settings.nodeMapping.slice();
    if (!settings.sourceObject || !settings.mongooseModel || !mapping) {
        logger.warn("Can't map object, missing settings.", {error:'MissingSettings'});
        return callback();
    } 
    else {
        
        var mongooseObject = new settings.mongooseModel;
        
        for (m in mapping) {
            mongooseObject = mapJsonValues({
                sourceObject:settings.sourceObject,
                sourceNodeMapping:mapping[m].sourceNode.slice(),
                destObject:mongooseObject,
                destNodeMapping:mapping[m].destNode.slice(),
                preprocess:settings.preprocess
            });
        }
        mongooseObject.activityRef = settings.activityRef;
        mongooseObject.save(function(err) {
            if (err) logger.warn('Unable to save model.', {error:err});
            return callback();
        });
    }
}

//takes a dataset name and error and returns both plus memory usage
function logJson(dataset,err) {
    var json = {};
    if(dataset) json.dataset = dataset;
    if(err) json.err = err;
    json.memStatus = util.inspect(process.memoryUsage());
    return json;
}

//settings obj1,obj2,mapping
function mapJsonValues(settings) {
    var sourceObject = settings.sourceObject;
    var sourceMapping = settings.sourceNodeMapping.slice();
    var destObject = settings.destObject;
    var destMapping = settings.destNodeMapping.slice();
    var value = getNodeValue({nodeMapping:sourceMapping.slice(),obj:sourceObject});
    if (settings.preprocess) {
        value = settings.preprocess(sourceMapping.slice(),value)
    };
    return valueToObjectNode({obj:destObject,nodeMapping:destMapping,value:value});
}

function valueToObjectNode(settings) {
    if (settings.nodeMapping.length > 1) {
        var newNodeMapping = settings.nodeMapping.splice(1,settings.nodeMapping.length-1);
        settings.obj = settings.obj || {};
        settings.obj[settings.nodeMapping[0]] = valueToObjectNode({obj: settings.obj[settings.nodeMapping[0]] || {}, nodeMapping:newNodeMapping, value:settings.value});
        return settings.obj;
    }
    else {
        settings.obj[settings.nodeMapping[0]] = settings.value; //note changed this
        return settings.obj;
    }
}

function getNodeValue(settings) {
    //THIS FUNCTION IS WHERE I ADD ARRAY SUPPORT
    var mapping = settings.nodeMapping;
    var obj = settings.obj;
    if (obj[mapping[0]]) {
        if (mapping.length > 1) {
            //somewhere here i need to add support for arrays
            var newMapping = mapping.splice(1,mapping.length-1);
            return getNodeValue({nodeMapping:newMapping,obj:obj[mapping[0]]});
        }
        else {
            return obj[mapping[0]];
        }
    }
    else {
        return null;
    }
}










