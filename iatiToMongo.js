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
                //datasetList = JSON.parse(body);
                datasetList = ["aai-af","aai-in","aai-mm","aai-tz","aai-vn","aa-organisation","acdi_cida-org","afdb-angola","afdb-botswana","afdb-comoros","afdb-djibouti","afdb-egypt","afdb-gabon","afdb-ghana","afdb-guinea","afdb-guineabissau","afdb-kenya","afdb-liberia","afdb-mali","afdb-multinational","afdb-somalia","afdb-southafrica","afghanaid-activities","apt-ke","apt-org","apt-ug","arfh-org","art19-activities","asdb-af","asdb-bd","asdb-fj","asdb-id","asdb-ki","asdb-kz","asdb-la","asdb-mm","asdb-np","asdb-pk","asdb-tv","asdb-vu","ausaid-ao","ausaid-az","ausaid-bi","ausaid-bj","ausaid-cl","ausaid-cm","ausaid-ec","ausaid-gm","ausaid-hn","ausaid-ht","ausaid-ke","ausaid-ki","ausaid-lb","ausaid-lc","ausaid-lr","ausaid-ls","ausaid-ly","ausaid-ml","ausaid-mu","ausaid-mx","ausaid-np","ausaid-org","ausaid-pa","ausaid-sc","ausaid-sl","ausaid-so","ausaid-sr","ausaid-tt","ausaid-tz","ausaid-uy","ausaid-zm","basicneeds-in","basicneeds-np","bracintl-activities","cafod-bangladesh","cafod-bolivia","cafod-brazil","cafod-burma","cafod-centralamerica","cafod-ethiopia","cafod-generaleastafrica","cafod-guatemala","cafod-middleeastgeneral","cafod-palestineopt","cafod-peru","cafod-rwanda","cafod-southafrica","cafod-southsudan","cafod-sudan","cafod-thailand","cafod-westbankjordan","cafod-zambia","caid-org","caid-org3","canoncollinstrust-activities","cdc-activity","cecily-activities","cecily-org","childhopeuk-org","cord-bi","cord-org","cr-activities","ctc-org","cu-org","danida-all","dapp-mw","dc-et","dc-org","deccadmin-activities","deccadmin-org","dfatd-maecd-act","dfid-298","dfid-589","dfid-af","dfid-ao","dfid-as","dfid-bf","dfid-cl","dfid-cn","dfid-cv","dfid-eb","dfid-fa","dfid-gm","dfid-gt","dfid-ib","dfid-id","dfid-in","dfid-iq","dfid-jm","dfid-ke","dfid-kh","dfid-lc","dfid-lk","dfid-mg","dfid-mn","dfid-mv","dfid-na","dfid-np","dfid-ns","dfid-null","dfid-org","dfid-rw","dfid-sd","dfid-sh","dfid-sn","dfid-sq","dfid-th","dfid-ua","dfid-ug","dfid-vn","dfid-ws","dfid-ye","dfid-zz","dipr-998","dthfxx12-org","ec-elarg-ba","ec-elarg-is","ec-elarg-mk","ec-elarg-xk","ec-fpi-619","ec-fpi-89","ec-fpi-bd","ec-fpi-cd","ec-fpi-eg","ec-fpi-hn","ec-fpi-iq","ec-fpi-mg","ec-fpi-ne","ec-fpi-ph","ec-fpi-sy","ec-fpi-tl","ec-fpi-ye","eu-189","eu-380","eu-389","eu-498","eu-589","eu-998","eu-ar","eu-bb","eu-bf","eu-bi","eu-br","eu-cd","eu-cf","eu-cg","eu-ci","eu-co","eu-do","eu-dz","eu-gn","eu-gw","eu-ht","eu-kh","eu-ki","eu-km","eu-kn","eu-kz","eu-ly","eu-ma","eu-md","eu-ml","eu-mu","eu-mw","eu-ni","eu-np","eu-pg","eu-rw","eu-sb","eu-so","eu-tg","eu-th","eu-tt","eu-ug","eu-vc","eu-vn","eu-wf","eu-zm","eu-zw","evc-tz","ewb_canada-water_sanitation_2011","fa-org","fco-britishcouncil","finland_mfa-298","finland_mfa-389","finland_mfa-589","finland_mfa-798","finland_mfa-88","finland_mfa-89","finland_mfa-af","finland_mfa-ag","finland_mfa-am","finland_mfa-ar","finland_mfa-az","finland_mfa-bb","finland_mfa-bd","finland_mfa-br","finland_mfa-by","finland_mfa-bz","finland_mfa-cg","finland_mfa-cl","finland_mfa-cn","finland_mfa-co","finland_mfa-cv","finland_mfa-ge","finland_mfa-gy","finland_mfa-hn","finland_mfa-ir","finland_mfa-kg","finland_mfa-kh","finland_mfa-kn","finland_mfa-lk","finland_mfa-ls","finland_mfa-ma","finland_mfa-md","finland_mfa-me","finland_mfa-mn","finland_mfa-mu","finland_mfa-na","finland_mfa-om","finland_mfa-ph","finland_mfa-pk","finland_mfa-py","finland_mfa-sb","finland_mfa-sd","finland_mfa-sl","finland_mfa-sn","finland_mfa-tj","finland_mfa-tl","finland_mfa-tn","finland_mfa-tr","finland_mfa-ua","finland_mfa-uz","finland_mfa-ve","finland_mfa-ye","finland_mfa-za","finland_mfa-zw","fm_admin-activities","fm-org","gain-activities","gavi-af","gavi-am","gavi-ba","gavi-bt","gavi-cf","gavi-cu","gavi-kh","gavi-la","gavi-lk","gavi-mn","gavi-mr","gavi-mw","gavi-ne","gavi-ng","gavi-pk","gavi-rw","gavi-st","gavi-tl","gavi-ug","gb-cc-220949-gb","gb-cc-220949-ke","gb-cc-220949-np","gl-activities","globalgiving-activity","globalintegrity-org","helpage_international-org","hfhgb-br","hhc-org","hi-ao","hifed-kh","hi-lk","hp_12-activities","hp_12-org","iadb-ar","iadb-br","iadb-cl","iadb-cr","iadb-gt","iadb-ho","iadb-jm","iadb-ni","iadb-tt","iadb-ve","international-alert-org","ippf-activities","iww_publish-in","iww_publish-mw","jeevika_trust-activities","karuna-in","livingearth12-activities","maec-2010_af","maec-2010_ag","maec-2010_al","maec-2010_ao","maec-2010_asia","maec-2010_az","maec-2010_caricom","maec-2010_cn","maec-2010_ctlasia","maec-2010_dj","maec-2010_dz","maec-2010_europe","maec-2010_festasia","maec-2010_ga","maec-2010_gm","maec-2010_gn","maec-2010_gt","maec-2010_gy","maec-2010_hn","maec-2010_hr","maec-2010_iq","maec-2010_ir","maec-2010_kn","maec-2010_lk","maec-2010_ly","maec-2010_ma","maec-2010_md","maec-2010_me","maec-2010_mm","maec-2010_mu","maec-2010_na","maec-2010_ne","maec-2010_ng","maec-2010_ni","maec-2010_np","maec-2010_om","maec-2010_ph","maec-2010_pk","maec-2010_py","maec-2010_sn","maec-2010_so","maec-2010_sthame","maec-2010_th","maec-2010_tj","maec-2010_tl","maec-2010_tn","maec-2010_unspec","maec-2010_uy","maec-2010_ws","maec-2011_189","maec-2011_498","maec-2011_589","maec-2011_am","maec-2011_ao","maec-2011_az","maec-2011_bd","maec-2011_bf","maec-2011_bo","maec-2011_bt","maec-2011_bz","maec-2011_cf","maec-2011_cg","maec-2011_ci","maec-2011_cr","maec-2011_ga","maec-2011_ge","maec-2011_gm","maec-2011_gt","maec-2011_hn","maec-2011_iq","maec-2011_jm","maec-2011_jo","maec-2011_kg","maec-2011_lk","maec-2011_ly","maec-2011_ml","maec-2011_mr","maec-2011_mu","maec-2011_pa","maec-2011_pk","maec-2011_rs","maec-2011_rw","maec-2011_sn","maec-2011_so","maec-2011_sy","maec-2011_tl","maec-2011_tr","maec-2011_uz","maec-dgpolde-afg","maec-dgpolde-afrsub","maec-dgpolde-ago","maec-dgpolde-alb","maec-dgpolde-amecen","maec-dgpolde-amelat","maec-dgpolde-amesur","maec-dgpolde-arg","maec-dgpolde-asiaor","maec-dgpolde-asiasur","maec-dgpolde-ben","maec-dgpolde-chl","maec-dgpolde-chn","maec-dgpolde-cog","maec-dgpolde-col","maec-dgpolde-cub","maec-dgpolde-dom","maec-dgpolde-eth","maec-dgpolde-europe","maec-dgpolde-gab","maec-dgpolde-geo","maec-dgpolde-gnq","maec-dgpolde-guy","maec-dgpolde-idn","maec-dgpolde-irn","maec-dgpolde-irq","maec-dgpolde-jam","maec-dgpolde-jor","maec-dgpolde-kna","maec-dgpolde-kosovo","maec-dgpolde-lbn","maec-dgpolde-lbr","maec-dgpolde-magreb","maec-dgpolde-mdg","maec-dgpolde-mkd","maec-dgpolde-mmr","maec-dgpolde-mne","maec-dgpolde-mng","maec-dgpolde-moz","maec-dgpolde-mrt","maec-dgpolde-mus","maec-dgpolde-nic","maec-dgpolde-omn","maec-dgpolde-pan","maec-dgpolde-png","maec-dgpolde-pse","maec-dgpolde-syr","maec-dgpolde-tcd","maec-dgpolde-ukr","maec-dgpolde-unspecified","maec-dgpolde-ury","maec-dgpolde-zaf","maec-dgpolde-zwe","mamta_himc-gpaf045","manxtimes-org","mcs-cd","mcs-np","mlf-activities","mrdf-cm","msi-activities","msi-org","msi-pk","msi-vn","nfn-np","ocha_fts-afghanistan_2013","ocha_fts-cotedivoire_2012","ocha_fts-cuba_2012","ocha_fts-djibouti_2012","ocha_fts-djibouti_2013","ocha_fts-drc_2013","ocha_fts-haiti_2012","ocha_fts-liberia_2012","ocha_fts-mali_2013","ocha_fts-mauritania_2012","ocha_fts-southsudan_2012","ocha_fts-sudan_2012","ocha_fts-sudan_2013","ocha_fts-zimbabwe_2013","opportunity-international-uk-mz","oxfamgb-289","oxfamgb-al","oxfamgb-bd","oxfamgb-bf","oxfamgb-co","oxfamgb-ge","oxfamgb-gh","oxfamgb-gt","oxfamgb-hn","oxfamgb-ht","oxfamgb-jo","oxfamgb-mz","oxfamgb-sn","oxfamgb-so","oxfamgb-sy","oxfamgb-th","oxfamgb-vn","oxfamgb-zw","pact-activitya01","plan_uk-activities","pontis-mk","pontis-tn","pragya-activities","pragya-org","rem-cd","rem-lk","restless-sl","restless-zw","rfuk-298","rspb_-activities","sacu-activities","scuk-af","scuk-cd","scuk-ec","scuk-ht","scuk-ke","scuk-mz","scuk-rw","scuk-vn","self-help-africa-act20121001","sida-380","sida-679","sida-998","sida-ar","sida-ba","sida-bg","sida-bi","sida-bo","sida-br","sida-by","sida-cl","sida-cu","sida-dj","sida-dz","sida-eg","sida-er","sida-gd","sida-ge","sida-gy","sida-hr","sida-iq","sida-ir","sida-jm","sida-kz","sida-lb","sida-lk","sida-ma","sida-me","sida-mg","sida-mn","sida-mu","sida-mz","sida-pg","sida-pk","sida-ps","sida-py","sida-sb","sida-sc","sida-sn","sida-th","sida-tj","sida-tl","sida-tm","sida-tz","sida-ua","sida-ug","sida-ye","spark-20120306","spark-20130220","stichting_hivos-data001","surf-activities","taf-mm","taf-np","tbalert-in","theglobalfund-afg","theglobalfund-alb","theglobalfund-aze","theglobalfund-bfa","theglobalfund-bih","theglobalfund-bol","theglobalfund-bwa","theglobalfund-chl","theglobalfund-cod","theglobalfund-cog","theglobalfund-col","theglobalfund-com","theglobalfund-cri","theglobalfund-cub","theglobalfund-dom","theglobalfund-ecu","theglobalfund-est","theglobalfund-gab","theglobalfund-geo","theglobalfund-hnd","theglobalfund-hti","theglobalfund-ind","theglobalfund-lbr","theglobalfund-mar","theglobalfund-mdg","theglobalfund-mne","theglobalfund-mng","theglobalfund-mus","theglobalfund-mwi","theglobalfund-mys","theglobalfund-nic","theglobalfund-prk","theglobalfund-pry","theglobalfund-qma","theglobalfund-qmd","theglobalfund-qmf","theglobalfund-qmh","theglobalfund-qna","theglobalfund-rus","theglobalfund-sdn","theglobalfund-slv","theglobalfund-ssd","theglobalfund-sur","theglobalfund-tcd","theglobalfund-tjk","theglobalfund-tkm","theglobalfund-tun","theglobalfund-ukr","theglobalfund-ury","theglobalfund-uzb","theict-activities","traidcraft-activities","transparency-international-10000287","transparency-international-10000913","troc-org","twin-iati-mw","undp-alb2013","undp-arm2013","undp-atg2013","undp-ben2013","undp-blr2013","undp-bol2013","undp-cmr2013","undp-col2013","undp-cpv2013","undp-cub2013","undp-dji2013","undp-ecu2013","undp-egy2013","undp-fsm2013","undp-gab2013","undp-gha2013","undp-gtm2013","undp-guy2013","undp-ken2013","undp-khm2013","undp-kos2013]","undp-lbn2013","undp-lka2013","undp-mdv2013","undp-mne2013","undp-moz2013","undp-mus2013","undp-ner2013","undp-org","undp-per2013","undp-png2013","undp-sen2013","undp-stp2013","undp-sur2013","undp-tgo2013","undp-tkl2013","undp-ukr2013","undp-wsm2013","unfpa-998","unicef-activity","unicef-organisation"]
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










