
module.exports = {
    simCreate: {
        'VIN': {
            prop: 'vinMsnNumber',
            type: String,
            required: true
        },
        'Registration Number': {
            prop: 'registrationNumber',
            type: Number,
            required: true
        },

        'Subscription Status': {
            prop: 'subscriptionStatus',
            type: String,
            required: true
        },
        'Sim No': {
            prop: 'simNumber',
            type: Number,
            required: true
        },
        'Mobile Number': {
            prop: 'mobileNumber',
            type: String,
            required: true
        },
        'IMEI Number': {
            prop: 'imeiNumber',
            type: String,
            required: true
        },
        'Device Serial Number': {
            prop: 'deviceSerialNumber',
            type: String,
            required: true
        },
        'Device ID': {
            prop: 'deviceId',
            type: String,
            required: true
        },
        'Customer Name': {
            prop: 'fk_oem',
            type: String,
            required: true
        },
        'Service Provider': {
            prop: 'fk_networkProviderId',
            type: String,
            required: true
        },
        'Sim Status': {
            prop: 'fk_status',
            type: String,
            required: true
        },
    }
}