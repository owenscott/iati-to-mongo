//makeSchema = schema || {};

//makeSchema.activity = function(mongoose) {
makeSchema = function(mongoose) {
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

var budgetSchema = new mongoose.Schema({
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

var locationSchema = new mongoose.Schema({
    activityRef: String,
    percentage: Number,
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
    
    