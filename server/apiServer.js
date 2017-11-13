'use strict';

require('dotenv').config();
const Hapi = require('hapi');
const Joi = require('joi');
const AWS = require('aws-sdk');

module.exports = (PORT) => {
    const REGION = process.env.REGION;
    const MEASUREMENTS_TABLE = process.env.MEASUREMENTS_TABLE;
    const STATION_IDS_TABLE = process.env.STATION_IDS_TABLE;

    console.log('Starting server');
    console.log('Port is', PORT);
    console.log('Region is', REGION);
    console.log('Measurements table is', MEASUREMENTS_TABLE);
    console.log('Allowed station IDs table is', STATION_IDS_TABLE);

    const server = new Hapi.Server({ debug: { request: ['error'] } });
    server.connection({
        port: PORT
    });

    AWS.config.region = REGION;
    const ddb = new AWS.DynamoDB();

    let allowedStationIds = [];
    ddb.scan({
        'TableName': STATION_IDS_TABLE,
        'ReturnConsumedCapacity': 'TOTAL'
    }).promise().then(function (data) {
        data.Items.forEach(function (element) {
            const stationId = element.StationId.S;
            console.log('Allowing station ID', stationId);

            allowedStationIds.push(stationId);
        });

    }).catch(function (error) {
        console.log('Cannot get allowed station IDs from database, error', error);
    });

    server.route({
        method: 'POST',
        path:'/measurement',
        handler: function (request, reply) {
            console.log('POST /measurement');

            const payloadDecoded = request.payload;
            console.log(payloadDecoded);

            const stationId = payloadDecoded.stationId;

            if (!allowedStationIds.includes(stationId)) {
                return reply({
                    statusCode: 400,
                    message: 'Station ID not allowed.'
                });
            }

            const itemTimestamp = Date.now().toString();
            const item = {
                'timestamp': {'N': itemTimestamp},
                'stationId': {'S': stationId},
                'distance': {'N': payloadDecoded.distance.toString()}
            };

            const response = reply(new Promise(function (resolve, reject) {
                ddb.putItem({
                    'TableName': MEASUREMENTS_TABLE,
                    'Item': item
                }, function(err, data) {
                    if (err) {
                        console.log('Error saving data in database: ' + err);

                        reject({
                            statusCode: 500,
                            message: 'Measurement save failed, error: ' + err
                        });
                    } else {
                        console.log('Data saved in database');

                        response.created(request.path + '/' + itemTimestamp);
                        resolve({
                            statusCode: 201,
                            message: 'Measurement saved successfully.'
                        });
                    }
                });
            }));

            return response;
        },
        config: {
            validate: {
                payload: {
                    stationId: Joi.string().required(),
                    distance: Joi.number().required()
                }
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/station/{id}',
        handler: function (request, reply) {
            console.log('GET /station/{id}');

            return reply({
                statusCode: 200,
                message: 'Station data sent successfully.',
                data: {
                }
            });
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
