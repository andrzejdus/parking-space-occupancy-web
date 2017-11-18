'use strict';

require('dotenv').config();
const Hapi = require('hapi');
const Joi = require('joi');
const AWS = require('aws-sdk');
const fs = require('fs');

module.exports = (PORT) => {
    const REGION = process.env.REGION;
    const MEASUREMENTS_TABLE = process.env.MEASUREMENTS_TABLE;
    const STATION_IDS_TABLE = process.env.STATION_IDS_TABLE;

    // TODO What future will bring us? Noboady knows, but those values may be fetched from db someday (they say so)
    const measurementInterval = 3000;
    const distanceHysteresis = 25;
    const splitDistance = 150;

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
    }).promise().then((data) => {
        data.Items.forEach(function (element) {
            const stationId = element.StationId.S;
            console.log('Allowing station ID', stationId);

            allowedStationIds.push(stationId);
        });
    }).catch((error) => {
        console.log('Cannot get allowed station IDs from database, error', error);
    });

    server.route({
        method: 'POST',
        path:'/measurement',
        handler: (request, reply) => {
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
                'Timestamp': {'N': itemTimestamp},
                'StationId': {'S': stationId},
                'Distance': {'N': payloadDecoded.distance.toString()}
            };

            const response = reply(new Promise((resolve, reject) => {
                ddb.putItem({
                    'TableName': MEASUREMENTS_TABLE,
                    'Item': item
                }, (err, data) => {
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
        handler: (request, reply) => {
            console.log('GET /station/{id}');

            const stationId = request.params.id;
            const params = {
                TableName : MEASUREMENTS_TABLE,
                ScanIndexForward: false,
                Limit: 1,
                KeyConditionExpression: 'StationId = :requestedStationId',
                ExpressionAttributeValues: {
                    ':requestedStationId': { 'S': stationId }
                }
            };

            return reply(new Promise((resolve, reject) => {
                ddb.query(params).promise().then((data) => {
                    if (data.Count > 0) {
                        const item = data.Items.shift();
                        const recentDistance = parseFloat(item.Distance.N);

                        const stationStatus = recentDistance > splitDistance ? 'unoccupied' : 'occupied';

                        resolve({
                            statusCode: 200,
                            message: 'Station data sent successfully.',
                            data: {
                                lastMeasureTimestamp: item.Timestamp.N,
                                stationStatus: stationStatus
                            }
                        });
                    } else {
                        resolve({
                            statusCode: 404,
                            message: `Station with id ${stationId} not found.`
                        });
                    }
                }).catch((error) => {
                    console.log(error);

                    reject();
                });
            }));
        },
        config: {
            validate: {
                params: {
                    id: Joi.string().required()
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
                    measurementInterval: 100,
                    distanceHysteresis: 20,
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
            handler: (request, h) => {
                console.log('GET /{param*}');

                let file = request.path.split('/').pop();
                let path = 'dist/';

                path += fs.lstatSync(path + file).isFile() ? file : 'index.html';

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
