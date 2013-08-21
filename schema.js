


makeSchema = function(mongoose) {

    
    
    
    //geoname
    var geoname = new mongoose.Schema({
        locationType: {
            code: String,
            text: String
        },
        name: {
            text: String
        },
        description: {
            type: String,
            text: String
        },
        administrative: {
            country: String,
            adm1: String,
            adm2: String,
            text: String
        },
        coordinates: {
            latitude: Number,
            longitude: Number,
            precision: String,
            text: String
        },
        gazetteerEntry: {
            gazetteerRef: String,
            text: String
        }
    });
    
    //activity
    
    
    var otherIdentifier
    
    var description
    
    var participatingOrg
    
    var recipientCountry
    
    var recipientRegion
    
    var location = new mongoose.Schema({
        percentage: Number,
        precision: String,
        geoname: geoname
    })

    
    var sector
    
    var policyMarker
    
    var collaborationType
    
    var budget = = new mongoose.Schema({
        activityRef: String,
        type: String,
        periodStart: {
            isoDate: Date,
            text: String
        },
        periodEnd: {
            isoDate: Date,
            text: String
        },
        value: {
            currency: String,
            valueDate: Date,
            text: Number
        }
    });
    
    var plannedDisbursement
    
    var transaction
    
    var documentLink
    
    var relatedActivity
    
    var conditions
    
    var result
    
    var legacyData
    
    var geoname
    
    
    var activity = new mongoose.Schema({
        //activity
        version: String,
        lastUpdatedDateTime: Date,
        defaultCurrency: String,
        hierarchy: Number,
        linkedDataUri: String,
        //reporting organization
        reportingOrg: {
            ref: String,
            type: String,
            text: String
        },
        //IATI Idenfitier
        iatiIdentifier: String,
        //Other Identifier
        otherIdentifier: [otherIdentifier],
        activityWebsite: String,
        title: String,
        description: [description],
        activityStatus: {
            code: String,
            text: String
        },
        activityDate: {
            type: String,
            isoDate: Date,
            text: String
        },
        contactInfo: {
            organization: String,
            personName: String,
            telephone: String,
            email: String,
            mailingAddress: String
        },
        participatingOrg: [participatingOrg],
        recipientCountry: [recipientCountry],
        recipientRegion: [recipientRegion],
        location: [location],
        sector: [sector],
        policyMarker: [policyMarker],
        collaborationType: [collaborationType],
        defaultFinanceType: {
            code: String,
            text: String
        },
        defaultFlowType: {
            code: String,
            text: String
        },
        defaultAidType: {
            code: String,
            text: String
        },
        defaultTiedStatus: {
            code: String,
            text: String
        },
        budget: [budget],
        plannedDisbursement: [plannedDisbursement],
        transaction: [transaction],
        documentLink: [documentLink],
        relatedActivity: [relatedActivity],
        conditions: [conditions],
        result: [result],
        legacyData: [legacyData]
    });
        
            
    
    
    
    return {
        //transaction
        activity: new mongoose.Schema({
            iatiIdentifier: String,
            transaction: Array,
						plannedDisbursement: Array,
						participatingOrg: Array,
						result: Array,
						budget: Array,
						location: Array
        })
    };
};


/*






var transactionSchema = new mongoose.Schema({
    activityRef: String,
    ref: String,
    aidType: {
        code: String,
        text: String
    },
    description: {
        text: String
    },
    disbursementChannel: {
        code: String,
        text:String
    },
    financeType: {
        code: String,
        text: String
    },
    flowType: {
        code: String,
        text: String
    },
    providerOrg: {
        ref: String,
        providerActivityId: String,
        text: String
    },
    receiverOrg: {
        ref: String,
        receiverActivityId: String,
        text: String
    },
    tiedStatus: {
        code: String,
        text: String
    },
    transactionDate: {
        isoDate: Date,
        text: String
    },
    transactionType: {
        code: String,
        text: String
    },
    value: {
        currency: String,
        valueDate: Date,
        text: Number
    }
});

var conditionSchema = new mongoose.Schema({
    attached: String,
    text: String
})

var conditionSchema = new mongoose.Schema({
    attached: String,
    text: String
})

console.log('schema');
*/
    
    