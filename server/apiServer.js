'use strict';

require('dotenv').config();

const Raven = require('raven');
Raven.config(process.env.SENTRY_DSN).install();

const Hapi = require('hapi');
const Joi = require('joi');
const AWS = require('aws-sdk');
const fs = require('fs');
const socketIo = require('socket.io');


module.exports = (PORT) => {
    const REGION = process.env.REGION;
    const MEASUREMENTS_TABLE = process.env.MEASUREMENTS_TABLE;
    const STATION_IDS_TABLE = process.env.STATION_IDS_TABLE;

    // TODO What future will bring us? Nobody knows, but those values may be fetched from db someday (they say so)
    const measurementInterval = 100;
    const distanceHysteresis = 20;
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
    const io = socketIo(server.listener);

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
        Raven.captureException(error);
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
                    message: 'Station ID not allowed.'
                }).code(400);
            }

            const itemTimestamp = Date.now().toString();
            const item = {
                'Timestamp': { 'N': itemTimestamp },
                'StationId': { 'S': stationId },
                'Distance': { 'N': payloadDecoded.distance.toString() }
            };

            const response = reply(new Promise((resolve, reject) => {
                ddb.putItem({
                    'TableName': MEASUREMENTS_TABLE,
                    'Item': item
                }, (error, data) => {
                    if (error) {
                        console.log('Error saving data in database: ' + error);

                        Raven.captureException(error);

                        reject({
                            message: 'Measurement save failed, error: ' + error
                        });
                    } else {
                        console.log('Data saved in database');

                        response.created(request.path + '/' + itemTimestamp);
                        resolve({
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
        path:'/calibration',
        handler: function (request, reply) {
            console.log('GET /calibration');

            return reply({
                message: 'Calibration data sent successfully.',
                data: {
                    measurementInterval: measurementInterval,
                    distanceHysteresis: distanceHysteresis,
                    splitDistance: splitDistance
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
            handler: (request, reply) => {
                console.log('GET /{param*}');

                const requestFile = request.path.split('/').pop();
                const isDirectory = requestFile.length == 0 || !requestFile.includes('.');
                const fullFilesystemPath = 'dist/' + (isDirectory ? 'index.html' : requestFile );

                console.log(`Sending file ${fullFilesystemPath}`);
                return reply.file(fullFilesystemPath);
            }
        });
    });

    io.on('connection', function (socket) {
        const emitStation = () => {
            fetchStation('18fe34d3f4c9').then((station) => {
                socket.emit('station', station);
                setTimeout(emitStation, 500);
            });
        };

        setTimeout(emitStation, 0);
    });

    server.start((err) => {
        if (err) {
            throw err;
        }

        console.log('Server running at: ', server.info.uri);
    });

    function fetchStation(stationId) {
        const params = {
            TableName : MEASUREMENTS_TABLE,
            ScanIndexForward: false,
            Limit: 1,
            KeyConditionExpression: 'StationId = :requestedStationId',
            ExpressionAttributeValues: {
                ':requestedStationId': { 'S': stationId }
            }
        };

        return new Promise((resolve, reject) => {
            ddb.query(params).promise().then((data) => {
                if (data.Count > 0) {
                    const item = data.Items.shift();
                    const recentDistance = parseFloat(item.Distance.N);

                    const stationStatus = recentDistance > splitDistance ? 'unoccupied' : 'occupied';

                    resolve({
                        message: 'Station data sent successfully.',
                        data: {
                            lastMeasureTimestamp: item.Timestamp.N,
                            stationStatus: stationStatus
                        }
                    });
                } else {
                    resolve({
                        message: `Station with id ${stationId} not found.`
                    });
                }
            }).catch((error) => {
                console.log(error);

                reject(error);
            });
        });
    }
};
