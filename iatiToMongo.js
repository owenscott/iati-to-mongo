//IATI to Mongo
//ver 0.0.1
//License: MIT
//Author: Owen Scott
//Contact: owen.m.scott(at)gmail.com


//========CONFIG========//

var dbName = 'iatiToMongoDev';
var logFile = 'logfile.log';

//LIB

var fs = require('fs')
var mongoose = require('mongoose');
var Request = require('request');
var splitXml = require('./splitXml.js');
var parseString = require('xml2js').Parser({
        attrkey:'@',
        charkey:'text',
        mergeAttrs:false,
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


//========SCHEMA========//

var makeSchema = function(mongoose) {
    var activity = new mongoose.Schema({
        activity: Object
    });
    return activity;
}

var schema = makeSchema(mongoose);
var Activity = mongoose.model('Activity',new mongoose.Schema({"iati-activity":Object}))

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
                    function(callback) {
                        //at this point I have the ckan api response
                        var xmlSplitter = new splitXml.parser()
                            .setReadStream(Request(metadata.download_url))
                            .setSplitTag('iati-activity')
                            .onElement(processActivity)
                            .onError(function(err) {
                                return callback({message:'Error processing dataset.', json:{dataset:dataset,error:err}})
                            })
                            .onEnd(callback)
                            .execute();
                        
                    }],
                             
                    //---callback after processing a dataset to increment the counter and call the async.ForEach callback
                    function(err) {
                        datasetCounter++;
                        logger.info('Finished dataset %s of %s', datasetCounter, numDataSets, {dataset:dataset});
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
    

function processActivity(activity) {
    var dataset,metadata,mapping;
    async.series([
        //convert xml to json
        function(callback) {
                parseString(activity, function(err, data) {
                if (err) return callback({message:'Error parsing XML.', json:{dataset:dataset,error:err}});
                activity = data;
                //logger.info('Activity converted to JSON');
                return callback();
            });
        },
        //put json into db
        function(callback) {
            return mapObjectToMongoose({sourceObject:activity, nodeMapping:mapping,mongooseModel:Activity},callback);
        }],
        function(err) {
            if(err) logger.warn({message:'Unknown error.', json:{dataset:dataset,error:err})
        }
    )
            
}


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


        }],
        //call callback for parent stack
        function(err) {
            if(err) return callback(err);
            return callback();
        }
  );
}

        
//takes settings {sourceObject,mongooseModel,mapping [{obj1:[],obj2:[]}],
function mapObjectToMongoose(settings,callback) {
    //var mapping = settings.nodeMapping.slice();
    /*if (!settings.sourceObject || !settings.mongooseModel || !mapping) {
        logger.warn("Can't map object, missing settings.", {error:'MissingSettings'});
        return callback();
    } 
    else {*/
        
        var mongooseObject = new settings.mongooseModel;
        /*
        for (m in mapping) {
            mongooseObject = mapJsonValues({
                sourceObject:settings.sourceObject,
                sourceNodeMapping:mapping[m].sourceNode.slice(),
                destObject:mongooseObject,
                destNodeMapping:mapping[m].destNode.slice(),
                preprocess:settings.preprocess
            });
        }
        mongooseObject.activityRef = settings.activityRef;*/
        mongooseObject['iati-activity'] = settings.sourceObject;
        mongooseObject.save(function(err) {
            if (err) logger.warn('Unable to save model.', {error:err});
            return callback();
        });
    //}
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










