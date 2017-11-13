'use strict';

require('dotenv').config();
const AWS = require('aws-sdk');

const REGION = process.env.REGION;
const ALLOWED_MAC_ADDRESSES_TABLE = process.env.ALLOWED_MAC_ADDRESSES_TABLE;

AWS.config.region = REGION;
const ddb = new AWS.DynamoDB();

ddb.createTable({
    "TableName": ALLOWED_MAC_ADDRESSES_TABLE,
    "AttributeDefinitions": [
        {
            "AttributeName": "MacAddress",
            "AttributeType": "S"
        }
    ],
    "KeySchema": [
        {
            "AttributeName": "MacAddress",
            "KeyType": "HASH"
        }
    ],
    "ProvisionedThroughput": {
        "ReadCapacityUnits": 5,
        "WriteCapacityUnits": 5
    }
}).promise().then(function (data) {
    console.log('Table created successfully: ', data);
}, function (error) {
    console.log('Error creating table: ', error);
});
