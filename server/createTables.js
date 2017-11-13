'use strict';

require('dotenv').config();
const AWS = require('aws-sdk');

const REGION = process.env.REGION;
const STATION_IDS_TABLE = process.env.STATION_IDS_TABLE;

AWS.config.region = REGION;
const ddb = new AWS.DynamoDB();

ddb.createTable({
    "TableName": STATION_IDS_TABLE,
    "AttributeDefinitions": [
        {
            "AttributeName": "StationId",
            "AttributeType": "S"
        }
    ],
    "KeySchema": [
        {
            "AttributeName": "StationId",
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
