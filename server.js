'use strict';

const Hapi = require('hapi');
const Joi = require('joi');
const AWS = require('aws-sdk');

console.log('--- Starting server ---');
console.log('Port is ', process.env.PORT);
console.log('Region is ', process.env.REGION);
console.log('Measurements table is ', process.env.MEASUREMENTS_TABLE);

const server = new Hapi.Server({ debug: { request: ['error'] } });
//const server = new Hapi.Server();
server.connection({
    port: process.env.PORT || 2403
});

AWS.config.region = process.env.REGION;
const ddb = new AWS.DynamoDB();

server.route({
    method: 'POST',
    path:'/measurement',
    handler: function (request, reply) {
        console.log('POST /measurement');

        const payloadDecoded = request.payload;
        console.log(payloadDecoded);

        const item = {
            'timestamp': {'N': Date.now().toString()},
            'distance': {'N': payloadDecoded.distance.toString()},
            'macAddress': {'S': payloadDecoded.macAddress}
        };

        ddb.putItem({
            'TableName': process.env.MEASUREMENTS_TABLE,
            'Item': item
        }, function(err, data) {
            if (err) {
                console.log('DDB error: ' + err);
            } else {
                console.log('DDB ok');
            }
        });

        return reply({
            statusCode: 200,
            message: 'Measurement saved successfully.'
        });
    },
    config: {
        validate: {
            payload: {
                macAddress: Joi.string().required(),
                distance: Joi.number().required()
            }
        }
    }
});

server.route({
    method: 'GET',
    path:'/calibration',
    handler: function (request, reply) {
        console.log('GET /calibration');
        return reply({
            statusCode: 200,
            message: 'Calibration data sent successfully.',
            data: {
                measurementInterval: 3000,
                distanceHysteresis: 25,
                splitDistance: 150
            }
        });
    }
});

server.start((err) => {
    if (err) {
        throw err;
    }

    console.log('Server running at: ', server.info.uri);
});