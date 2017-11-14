'use strict';

require('dotenv').config();
const AWS = require('aws-sdk');

const REGION = process.env.REGION;
const MEASUREMENTS_TABLE = process.env.MEASUREMENTS_TABLE;
const STATION_IDS_TABLE = process.env.STATION_IDS_TABLE;

AWS.config.region = REGION;
const ddb = new AWS.DynamoDB();

ddb.listTables().promise().then(function(data) {
    const tableList = data.TableNames;

    if (!tableList.includes(MEASUREMENTS_TABLE)) {
        ddb.createTable({
            TableName: MEASUREMENTS_TABLE,
            KeySchema: [
                { AttributeName: "StationId", KeyType: "HASH"},
                { AttributeName: "Timestamp", KeyType: "RANGE" }
            ],
            AttributeDefinitions: [
                { AttributeName: "StationId", AttributeType: "S" },
                { AttributeName: "Timestamp", AttributeType: "N" }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }).promise().then(function (data) {
            console.log(`Table ${data.TableDescription.TableName} created successfully: `, data);
        }).catch(function (error) {
            console.log('Error creating table: ', error);
        });
    } else {
        console.log(`Table ${MEASUREMENTS_TABLE} already exists. Not creating.`);
    }

    if (!tableList.includes(STATION_IDS_TABLE)) {
        ddb.createTable({
            TableName: STATION_IDS_TABLE,
            AttributeDefinitions: [
                {
                    AttributeName: "StationId",
                    AttributeType: "S"
                }
            ],
            KeySchema: [
                {
                    AttributeName: "StationId",
                    KeyType: "HASH"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }).promise().then(function (data) {
            console.log(`Table ${data.TableDescription.TableName} created successfully: `, data);
        }).catch(function (error) {
            console.log('Error creating table: ', error);
        });
    } else {
        console.log(`Table ${STATION_IDS_TABLE} already exists. Not creating.`);
    }

}).catch(function() {
    console.log('Could not obtain table list.');
});
