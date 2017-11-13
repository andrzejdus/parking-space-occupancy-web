'use strict';

require('dotenv').config();
const Hapi = require('hapi');
const Joi = require('joi');
const AWS = require('aws-sdk');

module.exports = (PORT) => {
    const REGION = process.env.REGION;
    const MEASUREMENTS_TABLE = process.env.MEASUREMENTS_TABLE;
    const ALLOWED_MAC_ADDRESSES_TABLE = process.env.ALLOWED_MAC_ADDRESSES_TABLE;

    console.log('Starting server');
    console.log('Port is', PORT);
    console.log('Region is', REGION);
    console.log('Measurements table is', MEASUREMENTS_TABLE);
    console.log('Allowed mac address table is', ALLOWED_MAC_ADDRESSES_TABLE);

    const server = new Hapi.Server({ debug: { request: ['error'] } });
    server.connection({
        port: PORT
    });

    AWS.config.region = REGION;
    const ddb = new AWS.DynamoDB();

    let allowedMacAddreses = [];
    ddb.scan({
        'TableName': ALLOWED_MAC_ADDRESSES_TABLE,
        'ReturnConsumedCapacity': 'TOTAL'
    }).promise().then(function (data) {
        data.Items.forEach(function (element) {
            console.log('Found mac address', element.S);
            allowedMacAddreses.push(element.S);
        });

    }, function (error) {
        console.log('Cannot get allowed mac addresses from database, error', error);
    });

    server.route({
        method: 'POST',
        path:'/measurement',
        handler: function (request, reply) {
            console.log('POST /measurement');

            const payloadDecoded = request.payload;
            console.log(payloadDecoded);

            const macAddress = payloadDecoded.macAddress;

            if (!allowedMacAddreses.includes(macAddress)) {
                return reply({
                    statusCode: 400,
                    message: 'MAC address not allowed.'
                });
            }

            const item = {
                'timestamp': {'N': Date.now().toString()},
                'distance': {'N': payloadDecoded.distance.toString()},
                'macAddress': {'S': macAddress}
            };

            ddb.putItem({
                'TableName': MEASUREMENTS_TABLE,
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

    server.register(require('inert'), (err) => {
        if (err) {
            console.log(err);
            return;
        }

        server.route({
            method: 'GET',
            path: '/{param*}',
            handler: function (request, h) {
                console.log('GET /{param*}');

                let file = request.path.split('/').pop();
                let path = 'dist/';

                if (file == 'index.js') {
                    path += file;
                } else {
                    path += 'index.html';
                }

                return h.file(path);
            }
        });
    });

    server.start((err) => {
        if (err) {
            throw err;
        }

        console.log('Server running at: ', server.info.uri);
    });
};
